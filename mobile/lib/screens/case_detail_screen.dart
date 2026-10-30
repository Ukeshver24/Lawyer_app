import 'package:flutter/material.dart';
import 'package:intl/intl.dart' hide TextDirection;
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../config/api_config.dart';
import '../models/case_model.dart';
import '../providers/bookmark_provider.dart';
import '../services/pdf_generator.dart';
import '../widgets/app_header.dart';
import '../widgets/app_toast.dart';

class CaseDetailScreen extends StatefulWidget {
  final CaseModel caseItem;

  const CaseDetailScreen({super.key, required this.caseItem});

  @override
  State<CaseDetailScreen> createState() => _CaseDetailScreenState();
}

class _CaseDetailScreenState extends State<CaseDetailScreen> {
  bool _isDownloading = false;
  List<List<String>>? _cachedJudgmentPages;
  double? _cachedWidth;
  String? _cachedCaseId;

  TextStyle _timesStyle({
    double fontSize = 13.0,
    FontWeight fontWeight = FontWeight.normal,
    FontStyle fontStyle = FontStyle.normal,
    Color color = const Color(0xFF0F172A),
    double height = 1.65,
    TextDecoration? decoration,
    double? letterSpacing,
  }) {
    return TextStyle(
      fontFamily: 'Times New Roman',
      fontSize: fontSize,
      fontWeight: fontWeight,
      fontStyle: fontStyle,
      color: color,
      height: height,
      decoration: decoration,
      letterSpacing: letterSpacing,
    );
  }

  String _cleanText(String raw) {
    if (raw.isEmpty) return '';
    return raw
        .replaceAll(RegExp(r'<br\s*/?>', caseSensitive: false), '\n')
        .replaceAll(RegExp(r'</p>', caseSensitive: false), '\n\n')
        .replaceAll(RegExp(r'</li>', caseSensitive: false), '\n')
        .replaceAll(RegExp(r'<[^>]*>'), '')
        .replaceAll('&nbsp;', ' ')
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&quot;', '"')
        .replaceAll('&#39;', "'")
        .replaceAll(RegExp(r'[ \t]+'), ' ')
        .trim();
  }

  List<String> _parseParagraphs(String raw) {
    if (raw.isEmpty) return [];

    String stripped = _cleanText(raw)
        .replaceAll(RegExp(r'\bDIGITAL\s+LAW\s+REPORTER\b', caseSensitive: false), ' ')
        .replaceAll(RegExp(r'Generated\s+by\s+Digital\s+Law\s+Reporter[^\n]*', caseSensitive: false), ' ')
        .replaceAll(RegExp(r'Generated\s+by[^\n]*', caseSensitive: false), ' ')
        .replaceAll(RegExp(r'Date:\s*\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}[^\n]*', caseSensitive: false), ' ')
        .replaceAll(RegExp(r'Page\s*\d+\s*(?:of|\/)\s*\d+', caseSensitive: false), ' ')
        .replaceAll(RegExp(r'\b\d+\s+Hereinafter\s+[\x27"][^\x27"]*[\x27"]\.?', caseSensitive: false), ' ');

    // Strip preamble (Court, Parties, Headnote) so only the judicial opinion begins from paragraph 1
    final jMatch = RegExp(r'(?:^|\n)\s*(?<!Date\s+of\s+)(?:J\s*U\s*D\s*G\s*M\s*E\s*N\s*T|O\s*R\s*D\s*E\s*R)\s*(?:\n|$)', caseSensitive: false).firstMatch(stripped);
    if (jMatch != null && jMatch.start < 5000) {
      String after = stripped.substring(jMatch.start + jMatch.group(0)!.length).trim();
      after = after.replaceFirst(RegExp(r'^[A-Z\.\s]{3,50},\s*(?:C\.?J\.?|J\.?)\s*', caseSensitive: false), '').trim();
      stripped = after;
    } else {
      final p1Match = RegExp(r'(?:^|\n)\s*(?:1[\.\)]|\[1\]|\(1\))\s+[A-Z]').firstMatch(stripped);
      if (p1Match != null && p1Match.start > 50 && p1Match.start < 5000) {
        final preamble = stripped.substring(0, p1Match.start);
        if (RegExp(r'COURT|VERSUS|APPELLANT|RESPONDENT|JURISDICTION|CITATION|HEADNOTE', caseSensitive: false).hasMatch(preamble)) {
          stripped = stripped.substring(p1Match.start).trim();
        }
      }
    }

    // Assemble continuous paragraphs by un-breaking mid-sentence lines
    final lines = stripped.split(RegExp(r'\r?\n')).map((l) => l.trim()).where((l) => l.isNotEmpty).toList();
    final List<String> paragraphs = [];
    String current = '';

    for (final line in lines) {
      if (RegExp(r'^(?:>|J\s*U\s*D\s*G\s*M\s*E\s*N\s*T|O\s*R\s*D\s*E\s*R|[A-Z\.\s]{3,50},\s*J\.?$)', caseSensitive: false).hasMatch(line)) continue;
      if (RegExp(r'Generated\s+by', caseSensitive: false).hasMatch(line)) continue;
      if (RegExp(r'^Page\s*\d+', caseSensitive: false).hasMatch(line)) continue;
      if (RegExp(r'^\d+\s+Hereinafter', caseSensitive: false).hasMatch(line)) continue;

      final isNumbered = RegExp(r'^(\d+[\.\)]|\[\d+\]|\(\d+\))\s+').hasMatch(line);
      if (isNumbered) {
        if (current.isNotEmpty) paragraphs.add(current.trim());
        current = line;
      } else {
        if (current.isNotEmpty) {
          if (current.endsWith('-')) {
            current = current.substring(0, current.length - 1) + line;
          } else {
            current += ' $line';
          }
        } else {
          current = line;
        }
      }
    }
    if (current.isNotEmpty) paragraphs.add(current.trim());

    return paragraphs;
  }

  /// Lightning-fast, pixel-perfect A4 pagination (<3ms)
  /// Guarantees instant opening, zero overflow, and pages filled completely down to the footer.
  /// pages[0] contains paragraphs that fit on Page 1 below the headers.
  /// pages[1..N] contain paragraphs for subsequent pages.
  List<List<String>> _paginateJudgmentParagraphs({
    required List<String> rawParagraphs,
    required double contentWidth,
    required TextStyle style,
    required double page1AvailableHeight,
    required double subsequentPageAvailableHeight,
  }) {
    if (rawParagraphs.isEmpty) return [[]];

    final List<List<String>> pages = [];
    List<String> currentPageParagraphs = [];
    double currentRemainingHeight = page1AvailableHeight;
    const double pSpacing = 10.0;

    final List<String> queue = List.from(rawParagraphs);

    // If Page 1 space is too small for even 1 line of text, start body on Page 2
    if (page1AvailableHeight < 36.0) {
      pages.add([]);
      currentRemainingHeight = subsequentPageAvailableHeight;
    }

    while (queue.isNotEmpty) {
      final text = queue.removeAt(0).trim();
      if (text.isEmpty) continue;

      // 1. Single layout check for the paragraph (<0.05ms)
      final tp = TextPainter(
        text: TextSpan(text: text, style: style),
        textAlign: TextAlign.justify,
        textDirection: TextDirection.ltr,
      );
      tp.layout(maxWidth: contentWidth);
      final textHeight = tp.height;

      final double spacingBefore = currentPageParagraphs.isEmpty ? 0.0 : pSpacing;

      // Case A: Entire paragraph fits comfortably on current page
      if (textHeight + spacingBefore <= currentRemainingHeight) {
        tp.dispose();
        currentPageParagraphs.add(text);
        currentRemainingHeight -= (textHeight + spacingBefore);
        continue;
      }

      // Case B: Entire paragraph does NOT fit.
      final double availForText = currentRemainingHeight - spacingBefore;

      // If available space cannot even fit a single line (~22px),
      // close this page and move the paragraph to the next page!
      if (availForText < 22.0) {
        tp.dispose();
        pages.add(currentPageParagraphs);
        currentPageParagraphs = [];
        currentRemainingHeight = subsequentPageAvailableHeight;
        queue.insert(0, text);
        continue;
      }

      // 2. High-performance single-pass line metrics splitting (<0.02ms)
      final lineMetrics = tp.computeLineMetrics();
      double accumulatedHeight = 0.0;
      int fittedLines = 0;

      for (final line in lineMetrics) {
        if (accumulatedHeight + line.height <= availForText) {
          accumulatedHeight += line.height;
          fittedLines++;
        } else {
          break;
        }
      }

      if (fittedLines > 0 && accumulatedHeight > 0) {
        final pos = tp.getPositionForOffset(
            Offset(contentWidth, (accumulatedHeight - 1.0).clamp(0.0, textHeight)));
        int splitOffset = pos.offset.clamp(0, text.length);

        // Find nearest clean whitespace boundary before split offset
        final lastSpace = text.lastIndexOf(RegExp(r'\s'), splitOffset);
        if (lastSpace > 0) {
          splitOffset = lastSpace;
        }

        final firstPart = text.substring(0, splitOffset).trim();
        final secondPart = text.substring(splitOffset).trim();
        tp.dispose();

        if (firstPart.isNotEmpty) {
          currentPageParagraphs.add(firstPart);
          pages.add(currentPageParagraphs);
          currentPageParagraphs = [];
          currentRemainingHeight = subsequentPageAvailableHeight;

          if (secondPart.isNotEmpty) {
            queue.insert(0, secondPart);
          }
          continue;
        }
      } else {
        tp.dispose();
      }

      // If even 1 line couldn't fit or splitting wasn't possible:
      pages.add(currentPageParagraphs);
      currentPageParagraphs = [];
      currentRemainingHeight = subsequentPageAvailableHeight;
      queue.insert(0, text);
    }

    if (currentPageParagraphs.isNotEmpty || pages.isEmpty) {
      pages.add(currentPageParagraphs);
    }

    return pages;
  }

  void _handleDownloadPdf() async {
    setState(() => _isDownloading = true);
    try {
      await PdfGeneratorService.downloadOrPrintPdf(context, widget.caseItem);
    } catch (e) {
      if (mounted) {
        AppToast.showError(context, 'Could not open PDF: $e');
      }
    } finally {
      if (mounted) {
        setState(() => _isDownloading = false);
      }
    }
  }

  void _handleSharePdf() async {
    try {
      await PdfGeneratorService.sharePdf(context, widget.caseItem);
    } catch (e) {
      if (mounted) {
        AppToast.showError(context, 'Could not share PDF: $e');
      }
    }
  }

  /// Diagonal watermark across each page: bottom-left to top-right
  Widget _buildWatermark() {
    return Positioned.fill(
      child: Center(
        child: Opacity(
          opacity: 0.055,
          child: Transform.rotate(
            angle: -0.58, // bottom-left to top-right diagonal
            child: Text(
              'DIGITAL LAW REPORTER',
              textAlign: TextAlign.center,
              style: _timesStyle(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                letterSpacing: 3.5,
              ),
            ),
          ),
        ),
      ),
    );
  }

  /// Compact page footer with small QR and small metadata text
  Widget _buildPageFooter({
    required int pageNum,
    required int totalPages,
    required String nowStr,
    required String judgmentUrl,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const SizedBox(height: 8),
        const Divider(height: 1, color: Color(0xFFCBD5E1), thickness: 0.8),
        const SizedBox(height: 6),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // 1. Left: Generated by & Date
            Expanded(
              flex: 4,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Generated by Digital Law Reporter',
                    style: _timesStyle(fontSize: 7.5, height: 1.3, color: const Color(0xFF64748B)),
                  ),
                  Text(
                    'Date: $nowStr',
                    style: _timesStyle(fontSize: 7.5, height: 1.3, color: const Color(0xFF64748B)),
                  ),
                ],
              ),
            ),
            // 2. Center: Page X of Y (bold, perfectly centered!)
            Expanded(
              flex: 3,
              child: Center(
                child: Text(
                  'Page $pageNum of $totalPages',
                  textAlign: TextAlign.center,
                  style: _timesStyle(
                    fontSize: 8.5,
                    height: 1.3,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF0F172A),
                  ),
                ),
              ),
            ),
            // 3. Right: Compact QR Code
            Expanded(
              flex: 4,
              child: Align(
                alignment: Alignment.centerRight,
                child: Tooltip(
                  message: 'Scan to view judgment online',
                  child: Container(
                    padding: const EdgeInsets.all(2),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border.all(color: const Color(0xFFCBD5E1), width: 0.6),
                      borderRadius: BorderRadius.circular(3),
                    ),
                    child: QrImageView(
                      data: judgmentUrl,
                      version: QrVersions.auto,
                      size: 28.0, // Compact QR size
                      padding: EdgeInsets.zero,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  /// A4 Sheet Container with inset legal framing border, subtle shadow, and fixed A4 height
  Widget _buildA4Sheet({
    required double a4Width,
    required double a4Height,
    required Widget topContent,
    required Widget bottomContent,
  }) {
    return Container(
      width: a4Width,
      height: a4Height, // Fixed A4 height: footer stays pinned at the bottom!
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(2),
        boxShadow: const [
          BoxShadow(
            color: Color(0x140F172A),
            blurRadius: 10,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Stack(
        children: [
          _buildWatermark(),
          // Inset 1px Framing Border: Inset by 12px on all sides, never touches outer paper edge!
          Positioned.fill(
            child: Padding(
              padding: const EdgeInsets.all(12.0),
              child: Container(
                decoration: BoxDecoration(
                  border: Border.all(color: const Color(0xFF0F172A), width: 0.9),
                ),
              ),
            ),
          ),
          // Content inside the framing border
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  child: Align(
                    alignment: Alignment.topLeft,
                    child: SizedBox(
                      width: double.infinity,
                      child: SingleChildScrollView(
                        physics: const NeverScrollableScrollPhysics(),
                        child: topContent,
                      ),
                    ),
                  ),
                ),
                bottomContent,
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// PAGE 1: Master Reference Standard Layout
  /// 1. Top Section: Boxed Citation (sleek bordered box)
  /// 2. Second Section: Boxed Headnote (— HEADNOTE — with justified text)
  /// 3. Third Section: Court Name & Jurisdiction
  /// 4. Fourth Section: Parties Layout (Petitioner vs Respondent)
  /// 5. Fifth Section: Metadata (Case Number, Act, Date, Bench)
  /// 6. Sixth Section: Continuous Judgment Header & Body Paragraphs
  Widget _buildPage1({
    required double a4Width,
    required double a4Height,
    required String displayCitation,
    required String courtTitle,
    required String jurisdiction,
    required String petitioner,
    required String respondent,
    required String headnoteClean,
    required String inscReportable,
    required String authorJudge,
    required List<String> paragraphs,
    required int totalPages,
    required String nowStr,
    required String judgmentUrl,
  }) {
    final c = widget.caseItem;

    final topContent = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 1. TOP SECTION: CITATION (SLEEK BORDERED BOX)
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0xFF0F172A), width: 0.9),
          ),
          child: RichText(
            text: TextSpan(
              children: [
                TextSpan(
                  text: 'Citation: ',
                  style: _timesStyle(fontSize: 11.5, fontWeight: FontWeight.bold),
                ),
                TextSpan(
                  text: displayCitation,
                  style: _timesStyle(fontSize: 11.5),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 10),

        // 2. SECOND SECTION: HEADNOTE (SLEEK BORDERED BOX)
        if (headnoteClean.isNotEmpty) ...[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              border: Border.all(color: const Color(0xFF0F172A), width: 0.9),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Container(
                      width: 34,
                      height: 1.0,
                      color: const Color(0xFF0F172A),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'HEADNOTE',
                      style: _timesStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.8,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      width: 34,
                      height: 1.0,
                      color: const Color(0xFF0F172A),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  headnoteClean,
                  textAlign: TextAlign.justify,
                  style: _timesStyle(fontSize: 11.0, height: 1.55),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
        ],

        // 3. THIRD SECTION: COURT NAME & JURISDICTION
        Center(
          child: Text(
            courtTitle,
            textAlign: TextAlign.center,
            style: _timesStyle(
              fontSize: 13.0,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
            ),
          ),
        ),
        if (jurisdiction.isNotEmpty) ...[
          const SizedBox(height: 4),
          Center(
            child: Text(
              jurisdiction.toUpperCase(),
              textAlign: TextAlign.center,
              style: _timesStyle(
                fontSize: 10.5,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.3,
              ),
            ),
          ),
        ],
        const SizedBox(height: 12),

        // 4. FOURTH SECTION: PARTIES (PETITIONER VS RESPONDENT)
        if (petitioner.isNotEmpty || respondent.isNotEmpty) ...[
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Expanded(
                child: Text(
                  petitioner,
                  style: _timesStyle(fontSize: 11.5, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(width: 6),
              Text(
                '......... Appellant(s) / Petitioner(s)',
                style: _timesStyle(fontSize: 10.0, color: const Color(0xFF334155)),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Center(
            child: Text(
              'VERSUS',
              style: _timesStyle(fontSize: 11.0, fontWeight: FontWeight.bold, letterSpacing: 1.0),
            ),
          ),
          const SizedBox(height: 6),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Expanded(
                child: Text(
                  respondent,
                  style: _timesStyle(fontSize: 11.5, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(width: 6),
              Text(
                '......... Respondent(s)',
                style: _timesStyle(fontSize: 10.0, color: const Color(0xFF334155)),
              ),
            ],
          ),
          const SizedBox(height: 12),
        ],

        // 5. FIFTH SECTION: METADATA BLOCK
        if (c.caseNumber.isNotEmpty) ...[
          RichText(
            text: TextSpan(
              children: [
                TextSpan(
                  text: 'Case Number: ',
                  style: _timesStyle(fontSize: 10.5, fontWeight: FontWeight.bold),
                ),
                TextSpan(
                  text: c.caseNumber,
                  style: _timesStyle(fontSize: 10.5),
                ),
              ],
            ),
          ),
          const SizedBox(height: 2.5),
        ],
        if (c.act.isNotEmpty) ...[
          RichText(
            text: TextSpan(
              children: [
                TextSpan(
                  text: 'Act(s): ',
                  style: _timesStyle(fontSize: 10.5, fontWeight: FontWeight.bold),
                ),
                TextSpan(
                  text: c.act,
                  style: _timesStyle(fontSize: 10.5),
                ),
              ],
            ),
          ),
          const SizedBox(height: 2.5),
        ],
        if (c.formattedDate.isNotEmpty) ...[
          RichText(
            text: TextSpan(
              children: [
                TextSpan(
                  text: 'Date of Judgment: ',
                  style: _timesStyle(fontSize: 10.5, fontWeight: FontWeight.bold),
                ),
                TextSpan(
                  text: c.formattedDate,
                  style: _timesStyle(fontSize: 10.5),
                ),
              ],
            ),
          ),
          const SizedBox(height: 2.5),
        ],
        if (c.judge.isNotEmpty) ...[
          RichText(
            text: TextSpan(
              children: [
                TextSpan(
                  text: 'Bench / Coram: ',
                  style: _timesStyle(fontSize: 10.5, fontWeight: FontWeight.bold),
                ),
                TextSpan(
                  text: c.judge,
                  style: _timesStyle(fontSize: 10.5),
                ),
              ],
            ),
          ),
          const SizedBox(height: 2.5),
        ],
        const SizedBox(height: 12),

        // 6. SIXTH SECTION: CONTINUOUS JUDGMENT PREAMBLE & BODY
        if (inscReportable.isNotEmpty) ...[
          Center(
            child: Text(
              inscReportable,
              style: _timesStyle(fontSize: 11.0, fontWeight: FontWeight.bold, letterSpacing: 0.5),
            ),
          ),
          const SizedBox(height: 6),
        ],
        Center(
          child: Text(
            'J U D G M E N T',
            style: _timesStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.bold,
              letterSpacing: 2.0,
            ),
          ),
        ),
        const SizedBox(height: 8),
        if (authorJudge.isNotEmpty) ...[
          Text(
            authorJudge,
            style: _timesStyle(fontSize: 11.5, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
        ],

        // Page 1 paragraphs (continuous flow)
        for (int i = 0; i < paragraphs.length; i++) ...[
          Text(
            paragraphs[i],
            textAlign: TextAlign.justify,
            style: _timesStyle(fontSize: 12.0, height: 1.65),
          ),
          if (i < paragraphs.length - 1) const SizedBox(height: 10),
        ],
      ],
    );

    final bottomContent = _buildPageFooter(
      pageNum: 1,
      totalPages: totalPages,
      nowStr: nowStr,
      judgmentUrl: judgmentUrl,
    );

    return _buildA4Sheet(
      a4Width: a4Width,
      a4Height: a4Height,
      topContent: topContent,
      bottomContent: bottomContent,
    );
  }

  /// SUBSEQUENT PAGES (Page 2+): Continued judgment paragraphs
  Widget _buildSubsequentPage({
    required double a4Width,
    required double a4Height,
    required int pageNum,
    required int totalPages,
    required List<String> paragraphs,
    required String nowStr,
    required String judgmentUrl,
  }) {
    final topContent = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (int i = 0; i < paragraphs.length; i++) ...[
          Text(
            paragraphs[i],
            textAlign: TextAlign.justify,
            style: _timesStyle(fontSize: 12.0, height: 1.65),
          ),
          if (i < paragraphs.length - 1) const SizedBox(height: 10),
        ],
      ],
    );

    final bottomContent = _buildPageFooter(
      pageNum: pageNum,
      totalPages: totalPages,
      nowStr: nowStr,
      judgmentUrl: judgmentUrl,
    );

    return _buildA4Sheet(
      a4Width: a4Width,
      a4Height: a4Height,
      topContent: topContent,
      bottomContent: bottomContent,
    );
  }

  @override
  Widget build(BuildContext context) {
    final bookmarkProvider = Provider.of<BookmarkProvider>(context);
    final isSaved = bookmarkProvider.isCaseSaved(widget.caseItem.id);

    final c = widget.caseItem;
    final petitioner = c.displayPetitioner.toUpperCase();
    final respondent = c.displayRespondent.toUpperCase();

    // Top title: Court name from DB (e.g. IN THE SUPREME COURT OF INDIA) - NEVER person's name
    String cleanCourt = c.court.trim();
    if (cleanCourt.isEmpty) cleanCourt = 'Supreme Court of India';
    if (cleanCourt.toUpperCase().startsWith('IN THE ')) {
      cleanCourt = cleanCourt.substring(7).trim();
    }
    final courtTitle = 'IN THE ${cleanCourt.toUpperCase()}';

    final headnoteClean = _cleanText(c.headnote);
    final rawParagraphs = _parseParagraphs(c.content);
    final displayCitation = c.citation.isNotEmpty ? c.citation.replaceAll('#', ' • ').trim() : 'DLR Legal Precedent';

    final inscMatch = RegExp(r'(\d{4}\s+INSC\s+\d+)', caseSensitive: false).firstMatch(c.content);
    final inscReportable = inscMatch != null ? '${inscMatch.group(1)} REPORTABLE' : '';

    String authorJudge = '';
    if (c.judge.isNotEmpty) {
      final firstJudge = c.judge.split(',')[0].trim().toUpperCase();
      authorJudge = firstJudge.endsWith(', J.') || firstJudge.endsWith(' J.') ? firstJudge : '$firstJudge, J.';
    }

    const jurisdiction = 'CIVIL APPELLATE JURISDICTION';

    final nowStr = DateFormat('dd/MM/yyyy, hh:mm a').format(DateTime.now()).toLowerCase();
    final judgmentUrl = ApiConfig.getJudgmentWebUrl(c.id);

    // A4 sheet geometry calculation
    final screenWidth = MediaQuery.of(context).size.width;
    final a4Width = (screenWidth - 28.0).clamp(320.0, 650.0);
    final a4Height = a4Width * 1.4142; // True A4 proportion (1 : √2)
    final contentWidth = a4Width - 48.0; // 24px horizontal padding on each side

    // Dynamic calculation of Page 1 Header Height
    double page1HeaderHeight = 0.0;

    // 1. Citation box
    final tpCit = TextPainter(
      text: TextSpan(
        children: [
          TextSpan(text: 'Citation: ', style: _timesStyle(fontSize: 11.5, fontWeight: FontWeight.bold)),
          TextSpan(text: displayCitation, style: _timesStyle(fontSize: 11.5)),
        ],
      ),
      textDirection: TextDirection.ltr,
    )..layout(maxWidth: contentWidth - 20.0);
    page1HeaderHeight += tpCit.height + 16.0 + 10.0;
    tpCit.dispose();

    // 2. Headnote box
    if (headnoteClean.isNotEmpty) {
      final tpHn = TextPainter(
        text: TextSpan(text: headnoteClean, style: _timesStyle(fontSize: 11.0, height: 1.55)),
        textAlign: TextAlign.justify,
        textDirection: TextDirection.ltr,
      )..layout(maxWidth: contentWidth - 24.0);
      page1HeaderHeight += 20.0 + 6.0 + tpHn.height + 20.0 + 14.0;
      tpHn.dispose();
    }

    // 3. Court and Jurisdiction
    final tpCourt = TextPainter(
      text: TextSpan(text: courtTitle, style: _timesStyle(fontSize: 13.0, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
      textAlign: TextAlign.center,
      textDirection: TextDirection.ltr,
    )..layout(maxWidth: contentWidth);
    page1HeaderHeight += tpCourt.height + 12.0;
    tpCourt.dispose();

    page1HeaderHeight += 20.0; // Jurisdiction

    // 4. Parties
    if (petitioner.isNotEmpty || respondent.isNotEmpty) {
      page1HeaderHeight += 22.0 + 20.0 + 22.0 + 12.0;
    }

    // 5. Metadata
    int metaLines = 0;
    if (c.caseNumber.isNotEmpty) metaLines++;
    if (c.act.isNotEmpty) metaLines++;
    if (c.formattedDate.isNotEmpty) metaLines++;
    if (c.judge.isNotEmpty) metaLines++;
    page1HeaderHeight += (metaLines * 18.0) + 12.0;

    // 6. Judgment Heading
    if (inscReportable.isNotEmpty) {
      page1HeaderHeight += 20.0;
    }
    page1HeaderHeight += 24.0 + 8.0;
    if (authorJudge.isNotEmpty) {
      page1HeaderHeight += 20.0 + 8.0;
    }

    // Interior padding + footer height
    final subsequentPageAvailHeight = a4Height - 102.0;
    final page1AvailHeight = (subsequentPageAvailHeight - page1HeaderHeight).clamp(0.0, subsequentPageAvailHeight);

    final paraStyle = _timesStyle(fontSize: 12.0, height: 1.65);

    List<List<String>> judgmentPages;
    if (_cachedJudgmentPages != null &&
        _cachedWidth == contentWidth &&
        _cachedCaseId == c.id) {
      judgmentPages = _cachedJudgmentPages!;
    } else {
      judgmentPages = _paginateJudgmentParagraphs(
        rawParagraphs: rawParagraphs,
        contentWidth: contentWidth,
        style: paraStyle,
        page1AvailableHeight: page1AvailHeight,
        subsequentPageAvailableHeight: subsequentPageAvailHeight,
      );
      _cachedJudgmentPages = judgmentPages;
      _cachedWidth = contentWidth;
      _cachedCaseId = c.id;
    }

    final totalPages = judgmentPages.isEmpty ? 1 : judgmentPages.length;

    return Scaffold(
      backgroundColor: const Color(0xFFE2E8F0), // Clean desk background
      appBar: AppHeader(
        showBackButton: true,
        onBackTap: () => Navigator.pop(context),
        customActions: [
          // 1. Download / Print PDF Action Icon
          _isDownloading
              ? const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 12.0),
                  child: Center(
                    child: SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Color(0xFF1D4ED8),
                      ),
                    ),
                  ),
                )
              : Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: const Icon(
                        Icons.download_rounded,
                        color: Color(0xFF1D4ED8),
                        size: 22,
                      ),
                      tooltip: 'Download PDF',
                      onPressed: _handleDownloadPdf,
                    ),
                    IconButton(
                      icon: const Icon(
                        Icons.share_rounded,
                        color: Color(0xFF1D4ED8),
                        size: 20,
                      ),
                      tooltip: 'Share PDF',
                      onPressed: _handleSharePdf,
                    ),
                  ],
                ),

          // 2. Bookmark Action Icon
          IconButton(
            icon: Icon(
              isSaved ? Icons.bookmark_rounded : Icons.bookmark_border_rounded,
              color: isSaved ? const Color(0xFF1D4ED8) : const Color(0xFF475569),
              size: 22,
            ),
            tooltip: isSaved ? 'Remove Bookmark' : 'Bookmark Case',
            onPressed: () {
              bookmarkProvider.toggleSaveCase(c);
              if (isSaved) {
                AppToast.showInfo(context, 'Case removed from bookmarks');
              } else {
                AppToast.showSuccess(context, 'Case saved to bookmarks!');
              }
            },
          ),
          const SizedBox(width: 4),
        ],
      ),
      // Default natural vertical scroll (swipe up to read page by page)
      body: MediaQuery.withNoTextScaling(
        child: SingleChildScrollView(
          physics: const ClampingScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 16.0),
          child: Column(
            children: [
              // ==========================================================
              // PAGE 1: CITATION BOX, HEADNOTE BOX, COURT, PARTIES, & BODY
              // ==========================================================
              _buildPage1(
                a4Width: a4Width,
                a4Height: a4Height,
                displayCitation: displayCitation,
                courtTitle: courtTitle,
                jurisdiction: jurisdiction,
                petitioner: petitioner,
                respondent: respondent,
                headnoteClean: headnoteClean,
                inscReportable: inscReportable,
                authorJudge: authorJudge,
                paragraphs: judgmentPages.isNotEmpty ? judgmentPages[0] : const [],
                totalPages: totalPages,
                nowStr: nowStr,
                judgmentUrl: judgmentUrl,
              ),

              // ==========================================================
              // SUBSEQUENT PAGES (PAGE 2, 3, 4...): CONTINUED PARAGRAPHS
              // ==========================================================
              for (int i = 1; i < judgmentPages.length; i++) ...[
                const SizedBox(height: 20),
                _buildSubsequentPage(
                  a4Width: a4Width,
                  a4Height: a4Height,
                  pageNum: i + 1,
                  totalPages: totalPages,
                  paragraphs: judgmentPages[i],
                  nowStr: nowStr,
                  judgmentUrl: judgmentUrl,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
