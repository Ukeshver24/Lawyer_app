import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../config/api_config.dart';
import '../models/case_model.dart';

class PdfGeneratorService {
  /// Cleans raw text/HTML by stripping unwanted markup and normalizing whitespace
  static String cleanText(String raw) {
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
        .replaceAll('&ndash;', '-')
        .replaceAll('&mdash;', '-')
        .replaceAll('“', '"')
        .replaceAll('”', '"')
        .replaceAll('‘', "'")
        .replaceAll('’', "'")
        .replaceAll('`', "'")
        .replaceAll('´', "'")
        .replaceAll('–', '-')
        .replaceAll('—', '-')
        .replaceAll('…', '...')
        .replaceAll('•', '*')
        .replaceAll('₹', 'Rs.')
        .replaceAll('§', 'Sec.')
        .replaceAll('¶', 'Para ')
        .replaceAll(RegExp(r'[^\x00-\x7F]'), '')
        .replaceAll(RegExp(r'[ \t]+'), ' ')
        .trim();
  }

  /// Attempts to fetch the authentic court judgment PDF from backend storage.
  /// Returns the PDF bytes if verified (>5KB with %PDF magic header), matching the website.
  static Future<Uint8List?> fetchAuthenticPdfBytes(CaseModel caseItem) async {
    final candidateUrls = <String>[];

    // 1. Direct backend case stream endpoint (stamps QR code & serves standardized master template)
    if (caseItem.id.isNotEmpty) {
      candidateUrls.add('${ApiConfig.baseUrl}/cases/${caseItem.id}/pdf');
      candidateUrls.add('${ApiConfig.baseUrl}/public/judgment/${caseItem.id}/pdf');
    }

    // 2. Direct PDF URL if resolved on model
    final originalUrl = caseItem.originalPdfUrl;
    if (originalUrl.isNotEmpty) {
      candidateUrls.add(originalUrl);
    }

    // 3. Fallback uploads path if pdfFile is stored as relative filename
    if (caseItem.pdfFile.isNotEmpty) {
      final clean = caseItem.pdfFile.replaceAll(RegExp(r'^[/\\]+'), '');
      candidateUrls.add('${ApiConfig.baseUrl}/$clean');
      candidateUrls.add('${ApiConfig.webBaseUrl}/$clean');
    }
    if (caseItem.pdfFilePath.isNotEmpty) {
      final clean = caseItem.pdfFilePath.replaceAll(RegExp(r'^[/\\]+'), '');
      candidateUrls.add('${ApiConfig.baseUrl}/$clean');
      candidateUrls.add('${ApiConfig.webBaseUrl}/$clean');
    }

    for (final url in candidateUrls.toSet()) {
      try {
        final uri = Uri.parse(url);
        final response = await http.get(uri).timeout(const Duration(seconds: 12));
        if (response.statusCode == 200 && response.bodyBytes.length > 5000) {
          final bytes = response.bodyBytes;
          // Verify %PDF header
          if (bytes.length >= 4 &&
              bytes[0] == 0x25 && // %
              bytes[1] == 0x50 && // P
              bytes[2] == 0x44 && // D
              bytes[3] == 0x46) { // F
            return bytes;
          }
        }
      } catch (e) {
        debugPrint('Could not fetch authentic PDF from $url: $e');
      }
    }
    return null;
  }

  /// Builds the full multi-page PDF document matching the Law Reporter format
  static Future<Uint8List> generateCasePdf(
    CaseModel caseItem, {
    PdfPageFormat format = PdfPageFormat.a4,
  }) async {
    final pdf = pw.Document(
      title: cleanText(caseItem.title),
      author: 'Digital Law Reporter',
    );

    final timesRoman = pw.Font.times();
    final timesBold = pw.Font.timesBold();

    final now = DateTime.now();
    final dateStr = DateFormat('dd/MM/yyyy, hh:mm a').format(now).toLowerCase();
    final canonicalUrl = ApiConfig.getJudgmentWebUrl(caseItem.id);

    final petitioner = cleanText(caseItem.displayPetitioner.toUpperCase());
    final respondent = cleanText(caseItem.displayRespondent.toUpperCase());

    // Top title: Court name from DB (e.g. IN THE SUPREME COURT OF INDIA)
    String cleanCourt = caseItem.court.trim();
    if (cleanCourt.isEmpty) cleanCourt = 'Supreme Court of India';
    if (cleanCourt.toUpperCase().startsWith('IN THE ')) {
      cleanCourt = cleanCourt.substring(7).trim();
    }
    final courtTitle = cleanText('IN THE ${cleanCourt.toUpperCase()}');

    final cleanCitation = cleanText(caseItem.citation);
    final cleanCaseNumber = cleanText(caseItem.caseNumber);
    final cleanAct = cleanText(caseItem.act);
    final cleanJudge = cleanText(caseItem.judge);
    final cleanDate = cleanText(caseItem.formattedDate);

    // Clean headnote and judgment body text
    final headnoteClean = cleanText(caseItem.headnote);
    final contentClean = cleanText(caseItem.content);

    // Clean content and strip preamble
    String strippedContent = contentClean
        .replaceAll(RegExp(r'\bDIGITAL\s+LAW\s+REPORTER\b', caseSensitive: false), ' ')
        .replaceAll(RegExp(r'Generated\s+by\s+Digital\s+Law\s+Reporter[^\n]*', caseSensitive: false), ' ')
        .replaceAll(RegExp(r'Generated\s+by[^\n]*', caseSensitive: false), ' ')
        .replaceAll(RegExp(r'Date:\s*\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}[^\n]*', caseSensitive: false), ' ')
        .replaceAll(RegExp(r'Page\s*\d+\s*(?:of|\/)\s*\d+', caseSensitive: false), ' ')
        .replaceAll(RegExp(r'\b\d+\s+Hereinafter\s+[\x27"][^\x27"]*[\x27"]\.?', caseSensitive: false), ' ');

    final jMatch = RegExp(r'(?:^|\n)\s*(?<!Date\s+of\s+)(?:J\s*U\s*D\s*G\s*M\s*E\s*N\s*T|O\s*R\s*D\s*E\s*R)\s*(?:\n|$)', caseSensitive: false).firstMatch(strippedContent);
    if (jMatch != null && jMatch.start < 5000) {
      String after = strippedContent.substring(jMatch.start + jMatch.group(0)!.length).trim();
      after = after.replaceFirst(RegExp(r'^[A-Z\.\s]{3,50},\s*(?:C\.?J\.?|J\.?)\s*', caseSensitive: false), '').trim();
      strippedContent = after;
    } else {
      final p1Match = RegExp(r'(?:^|\n)\s*(?:1[\.\)]|\[1\]|\(1\))\s+[A-Z]').firstMatch(strippedContent);
      if (p1Match != null && p1Match.start > 50 && p1Match.start < 5000) {
        final preamble = strippedContent.substring(0, p1Match.start);
        if (RegExp(r'COURT|VERSUS|APPELLANT|RESPONDENT|JURISDICTION|CITATION|HEADNOTE', caseSensitive: false).hasMatch(preamble)) {
          strippedContent = strippedContent.substring(p1Match.start).trim();
        }
      }
    }

    // Assemble continuous paragraphs by un-breaking mid-sentence lines
    final lines = strippedContent.split(RegExp(r'\r?\n')).map((l) => l.trim()).where((l) => l.isNotEmpty).toList();
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

    pdf.addPage(
      pw.MultiPage(
        pageTheme: pw.PageTheme(
          pageFormat: format,
          margin: const pw.EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
          buildBackground: (pw.Context context) {
            return pw.FullPage(
              ignoreMargins: true,
              child: pw.Stack(
                children: [
                  // Watermark on each page: bottom-left to top-right upward diagonal
                  pw.Center(
                    child: pw.Transform.rotate(
                      angle: -0.58, // upward diagonal: bottom-left to top-right
                      child: pw.Opacity(
                        opacity: 0.045,
                        child: pw.Text(
                          'DIGITAL LAW REPORTER',
                          style: pw.TextStyle(
                            font: timesBold,
                            fontSize: 28,
                            letterSpacing: 3,
                            color: PdfColors.grey900,
                          ),
                        ),
                      ),
                    ),
                  ),
                  // 1px Elegant Page Border inset cleanly inside the A4 sheet (12px inset matching viewer)
                  pw.Container(
                    margin: const pw.EdgeInsets.all(12.0),
                    decoration: pw.BoxDecoration(
                      border: pw.Border.all(color: PdfColors.black, width: 0.9),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
        header: (pw.Context context) {
          if (context.pageNumber <= 1) return pw.SizedBox.shrink();
          return pw.Container(
            margin: const pw.EdgeInsets.only(bottom: 12),
            child: pw.Column(
              mainAxisSize: pw.MainAxisSize.min,
              children: [
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: pw.CrossAxisAlignment.center,
                  children: [
                    pw.Text(
                      cleanCitation,
                      style: pw.TextStyle(
                        font: timesBold,
                        fontSize: 8.5,
                        color: PdfColors.blueGrey800,
                      ),
                    ),
                    pw.Text(
                      'DIGI LAW REPORTER (DLR)',
                      style: pw.TextStyle(
                        font: timesBold,
                        fontSize: 8,
                        color: PdfColors.blueGrey600,
                      ),
                    ),
                  ],
                ),
                pw.SizedBox(height: 4),
                pw.Container(
                  height: 0.6,
                  color: PdfColors.grey400,
                ),
              ],
            ),
          );
        },
        footer: (pw.Context context) {
          return pw.Column(
            mainAxisSize: pw.MainAxisSize.min,
            children: [
              pw.Container(
                height: 0.6,
                color: PdfColors.grey400,
                margin: const pw.EdgeInsets.only(bottom: 6),
              ),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                crossAxisAlignment: pw.CrossAxisAlignment.center,
                children: [
                  // 1. Left: Generated by & Date
                  pw.Expanded(
                    flex: 4,
                    child: pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      mainAxisSize: pw.MainAxisSize.min,
                      children: [
                        pw.Text(
                          'Generated by Digital Law Reporter',
                          style: pw.TextStyle(
                            font: timesRoman,
                            fontSize: 7.5,
                            color: PdfColors.grey700,
                          ),
                        ),
                        pw.SizedBox(height: 1.5),
                        pw.Text(
                          'Date: $dateStr',
                          style: pw.TextStyle(
                            font: timesRoman,
                            fontSize: 7.5,
                            color: PdfColors.grey700,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // 2. Center: Page X of Y (bold, centered)
                  pw.Expanded(
                    flex: 3,
                    child: pw.Center(
                      child: pw.Text(
                        'Page ${context.pageNumber} of ${context.pagesCount}',
                        textAlign: pw.TextAlign.center,
                        style: pw.TextStyle(
                          font: timesBold,
                          fontSize: 8.5,
                          color: PdfColors.black,
                        ),
                      ),
                    ),
                  ),
                  // 3. Right: Compact QR Code
                  pw.Expanded(
                    flex: 4,
                    child: pw.Align(
                      alignment: pw.Alignment.centerRight,
                      child: pw.BarcodeWidget(
                        barcode: pw.Barcode.qrCode(),
                        data: canonicalUrl,
                        width: 28,
                        height: 28,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          );
        },
        build: (pw.Context context) {
          final List<pw.Widget> widgets = [];

          // ----------------------------------------------------
          // 1. TOP SECTION: CITATION (SLEEK BORDERED BOX)
          // ----------------------------------------------------
          final displayCit = cleanCitation.isNotEmpty ? cleanCitation.replaceAll('#', ' • ').trim() : 'DLR Legal Precedent';
          widgets.add(
            pw.Container(
              width: double.infinity,
              padding: const pw.EdgeInsets.symmetric(horizontal: 10, vertical: 7),
              decoration: pw.BoxDecoration(
                border: pw.Border.all(color: PdfColors.black, width: 0.8),
              ),
              child: pw.RichText(
                text: pw.TextSpan(
                  children: [
                    pw.TextSpan(
                      text: 'Citation: ',
                      style: pw.TextStyle(font: timesBold, fontSize: 10),
                    ),
                    pw.TextSpan(
                      text: displayCit,
                      style: pw.TextStyle(font: timesRoman, fontSize: 10),
                    ),
                  ],
                ),
              ),
            ),
          );
          widgets.add(pw.SizedBox(height: 10));

          // ----------------------------------------------------
          // 2. SECOND SECTION: HEADNOTE (SLEEK BORDERED BOX)
          // ----------------------------------------------------
          if (headnoteClean.isNotEmpty) {
            widgets.add(
              pw.Container(
                width: double.infinity,
                padding: const pw.EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: PdfColors.black, width: 0.8),
                ),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.center,
                  children: [
                    pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.center,
                      crossAxisAlignment: pw.CrossAxisAlignment.center,
                      children: [
                        pw.Container(width: 34, height: 0.9, color: PdfColors.black),
                        pw.SizedBox(width: 8),
                        pw.Text(
                          'HEADNOTE',
                          style: pw.TextStyle(
                            font: timesBold,
                            fontSize: 10.5,
                            letterSpacing: 0.8,
                          ),
                        ),
                        pw.SizedBox(width: 8),
                        pw.Container(width: 34, height: 0.9, color: PdfColors.black),
                      ],
                    ),
                    pw.SizedBox(height: 6),
                    pw.Text(
                      headnoteClean,
                      textAlign: pw.TextAlign.justify,
                      style: pw.TextStyle(
                        font: timesRoman,
                        fontSize: 10,
                        lineSpacing: 3.0,
                      ),
                    ),
                  ],
                ),
              ),
            );
            widgets.add(pw.SizedBox(height: 12));
          }

          // ----------------------------------------------------
          // 3. THIRD SECTION: COURT NAME & JURISDICTION
          // ----------------------------------------------------
          widgets.add(
            pw.Center(
              child: pw.Text(
                courtTitle,
                textAlign: pw.TextAlign.center,
                style: pw.TextStyle(
                  font: timesBold,
                  fontSize: 12.5,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          );
          widgets.add(pw.SizedBox(height: 3));
          widgets.add(
            pw.Center(
              child: pw.Text(
                'CIVIL APPELLATE JURISDICTION',
                textAlign: pw.TextAlign.center,
                style: pw.TextStyle(
                  font: timesBold,
                  fontSize: 9.5,
                  letterSpacing: 0.3,
                ),
              ),
            ),
          );
          widgets.add(pw.SizedBox(height: 12));

          // ----------------------------------------------------
          // 4. FOURTH SECTION: PARTIES (PETITIONER VS RESPONDENT)
          // ----------------------------------------------------
          if (petitioner.isNotEmpty || respondent.isNotEmpty) {
            widgets.add(
              pw.Column(
                children: [
                  pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: pw.CrossAxisAlignment.end,
                    children: [
                      pw.Expanded(
                        child: pw.Text(
                          petitioner,
                          style: pw.TextStyle(font: timesBold, fontSize: 10.5),
                        ),
                      ),
                      pw.Text(
                        '......... Appellant(s) / Petitioner(s)',
                        style: pw.TextStyle(font: timesRoman, fontSize: 9.5, color: PdfColors.grey800),
                      ),
                    ],
                  ),
                  pw.SizedBox(height: 6),
                  pw.Center(
                    child: pw.Text(
                      'VERSUS',
                      style: pw.TextStyle(font: timesBold, fontSize: 10.5, letterSpacing: 0.8),
                    ),
                  ),
                  pw.SizedBox(height: 6),
                  pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: pw.CrossAxisAlignment.end,
                    children: [
                      pw.Expanded(
                        child: pw.Text(
                          respondent,
                          style: pw.TextStyle(font: timesBold, fontSize: 10.5),
                        ),
                      ),
                      pw.Text(
                        '......... Respondent(s)',
                        style: pw.TextStyle(font: timesRoman, fontSize: 9.5, color: PdfColors.grey800),
                      ),
                    ],
                  ),
                ],
              ),
            );
            widgets.add(pw.SizedBox(height: 12));
          }

          // ----------------------------------------------------
          // 5. FIFTH SECTION: METADATA BLOCK
          // ----------------------------------------------------
          widgets.add(
            pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                if (cleanCaseNumber.isNotEmpty) ...[
                  pw.RichText(
                    text: pw.TextSpan(
                      children: [
                        pw.TextSpan(
                          text: 'Case Number: ',
                          style: pw.TextStyle(font: timesBold, fontSize: 10),
                        ),
                        pw.TextSpan(
                          text: cleanCaseNumber,
                          style: pw.TextStyle(font: timesRoman, fontSize: 10),
                        ),
                      ],
                    ),
                  ),
                  pw.SizedBox(height: 3),
                ],
                if (cleanAct.isNotEmpty) ...[
                  pw.RichText(
                    text: pw.TextSpan(
                      children: [
                        pw.TextSpan(
                          text: 'Act(s): ',
                          style: pw.TextStyle(font: timesBold, fontSize: 10),
                        ),
                        pw.TextSpan(
                          text: cleanAct,
                          style: pw.TextStyle(font: timesRoman, fontSize: 10),
                        ),
                      ],
                    ),
                  ),
                  pw.SizedBox(height: 3),
                ],
                if (cleanDate.isNotEmpty) ...[
                  pw.RichText(
                    text: pw.TextSpan(
                      children: [
                        pw.TextSpan(
                          text: 'Date of Judgment: ',
                          style: pw.TextStyle(font: timesBold, fontSize: 10),
                        ),
                        pw.TextSpan(
                          text: cleanDate,
                          style: pw.TextStyle(font: timesRoman, fontSize: 10),
                        ),
                      ],
                    ),
                  ),
                  pw.SizedBox(height: 3),
                ],
                if (cleanJudge.isNotEmpty) ...[
                  pw.RichText(
                    text: pw.TextSpan(
                      children: [
                        pw.TextSpan(
                          text: 'Bench / Coram: ',
                          style: pw.TextStyle(font: timesBold, fontSize: 10),
                        ),
                        pw.TextSpan(
                          text: cleanJudge,
                          style: pw.TextStyle(font: timesRoman, fontSize: 10),
                        ),
                      ],
                    ),
                  ),
                  pw.SizedBox(height: 3),
                ],
              ],
            ),
          );
          widgets.add(pw.SizedBox(height: 12));

          // ----------------------------------------------------
          // 6. SIXTH SECTION: CONTINUOUS JUDGMENT PREAMBLE & BODY
          // ----------------------------------------------------
          final inscMatch = RegExp(r'(\d{4}\s+INSC\s+\d+)', caseSensitive: false).firstMatch(contentClean);
          if (inscMatch != null) {
            widgets.add(
              pw.Center(
                child: pw.Text(
                  '${inscMatch.group(1)} REPORTABLE',
                  style: pw.TextStyle(font: timesBold, fontSize: 10.5, letterSpacing: 0.5),
                ),
              ),
            );
            widgets.add(pw.SizedBox(height: 6));
          }

          widgets.add(
            pw.Center(
              child: pw.Text(
                'J U D G M E N T',
                style: pw.TextStyle(
                  font: timesBold,
                  fontSize: 11.5,
                  letterSpacing: 2.0,
                ),
              ),
            ),
          );
          widgets.add(pw.SizedBox(height: 8));

          if (cleanJudge.isNotEmpty) {
            final firstJudge = cleanJudge.split(',')[0].trim().toUpperCase();
            final judgeLabel = firstJudge.endsWith(', J.') || firstJudge.endsWith(' J.') ? firstJudge : '$firstJudge, J.';
            widgets.add(
              pw.Text(
                judgeLabel,
                style: pw.TextStyle(font: timesBold, fontSize: 10.5),
              ),
            );
            widgets.add(pw.SizedBox(height: 8));
          }

          // Judgment Body Paragraphs (Continuous flow from Page 1 across pages)
          for (final para in paragraphs) {
            final match = RegExp(r'^(\d+[\.\)]|\[\d+\]|\(\d+\))\s*(.*)$', dotAll: true).firstMatch(para);
            if (match != null) {
              final pNum = match.group(1)!;
              final pText = match.group(2) ?? '';
              widgets.add(
                pw.Padding(
                  padding: const pw.EdgeInsets.only(bottom: 10.0),
                  child: pw.RichText(
                    textAlign: pw.TextAlign.justify,
                    text: pw.TextSpan(
                      children: [
                        pw.TextSpan(
                          text: '$pNum  ',
                          style: pw.TextStyle(font: timesBold, fontSize: 10.5),
                        ),
                        pw.TextSpan(
                          text: pText,
                          style: pw.TextStyle(
                            font: timesRoman,
                            fontSize: 10.5,
                            lineSpacing: 3.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            } else {
              widgets.add(
                pw.Padding(
                  padding: const pw.EdgeInsets.only(bottom: 10.0),
                  child: pw.Text(
                    para,
                    textAlign: pw.TextAlign.justify,
                    style: pw.TextStyle(
                      font: timesRoman,
                      fontSize: 10.5,
                      lineSpacing: 3.5,
                    ),
                  ),
                ),
              );
            }
          }

          return widgets;
        },
      ),
    );

    return pdf.save();
  }

  /// Opens standard Android/iOS layout dialog allowing user to "Save as PDF" or Print.
  /// Renders the standardized Master Legal PDF directly matching the on-screen viewer.
  static Future<void> downloadOrPrintPdf(
    BuildContext context,
    CaseModel caseItem,
  ) async {
    final sanitizedTitle = caseItem.title.replaceAll(RegExp(r'[^a-zA-Z0-9_\-]'), '_');
    final filename = 'DLR_${sanitizedTitle.substring(0, sanitizedTitle.length.clamp(0, 30))}.pdf';

    // Renders the exact standardized legal vector PDF matching what is viewed on screen
    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => generateCasePdf(caseItem, format: format),
      name: filename,
    );
  }

  /// Opens native share sheet allowing user to save file directly to Downloads or share to WhatsApp, Drive, etc.
  /// Shares the standardized Master Legal PDF directly matching the on-screen viewer.
  static Future<void> sharePdf(
    BuildContext context,
    CaseModel caseItem,
  ) async {
    final sanitizedTitle = caseItem.title.replaceAll(RegExp(r'[^a-zA-Z0-9_\-]'), '_');
    final filename = 'DLR_${sanitizedTitle.substring(0, sanitizedTitle.length.clamp(0, 30))}.pdf';

    // Generates the exact standardized legal vector PDF matching what is viewed on screen
    final bytes = await generateCasePdf(caseItem);
    await Printing.sharePdf(bytes: bytes, filename: filename);
  }
}
