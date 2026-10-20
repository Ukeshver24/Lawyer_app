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

    // 1. Direct PDF URL if resolved on model
    final originalUrl = caseItem.originalPdfUrl;
    if (originalUrl.isNotEmpty) {
      candidateUrls.add(originalUrl);
    }

    // 2. Direct backend case stream endpoint (stamps QR code automatically)
    if (caseItem.id.isNotEmpty) {
      candidateUrls.add('${ApiConfig.baseUrl}/cases/${caseItem.id}/pdf');
      candidateUrls.add('${ApiConfig.baseUrl}/public/judgment/${caseItem.id}/pdf');
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

    // Split content into paragraphs and strip any duplicate standalone JUDGMENT / ORDER title lines
    final paragraphs = contentClean
        .split(RegExp(r'\n\s*\n'))
        .map((p) => p.trim())
        .where((p) => p.isNotEmpty)
        .where((p) {
          final alphaOnly = p.replaceAll(RegExp(r'[^a-zA-Z]'), '').toUpperCase();
          return alphaOnly != 'JUDGMENT' &&
                 alphaOnly != 'JUDGEMENT' &&
                 alphaOnly != 'ORDER' &&
                 alphaOnly != 'COURTORDER' &&
                 alphaOnly != 'FINALORDER';
        })
        .toList();

    pdf.addPage(
      pw.MultiPage(
        pageTheme: pw.PageTheme(
          pageFormat: format,
          margin: const pw.EdgeInsets.symmetric(horizontal: 40, vertical: 36),
          buildBackground: (pw.Context context) {
            return pw.FullPage(
              ignoreMargins: true,
              child: pw.Stack(
                children: [
                  // 1px Elegant Page Border inset cleanly inside the A4 sheet
                  pw.Container(
                    margin: const pw.EdgeInsets.all(20.0),
                    decoration: pw.BoxDecoration(
                      border: pw.Border.all(color: PdfColors.black, width: 0.8),
                    ),
                  ),
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
          // PAGE 1: COURT TITLE, METADATA, PARTIES, & HEAD NOTE
          // ----------------------------------------------------

          // 1. Top Title: Court Name from DB
          widgets.add(
            pw.Center(
              child: pw.Text(
                courtTitle,
                textAlign: pw.TextAlign.center,
                style: pw.TextStyle(
                  font: timesBold,
                  fontSize: 13.5,
                  letterSpacing: 0.5,
                  color: PdfColors.black,
                ),
              ),
            ),
          );
          widgets.add(pw.SizedBox(height: 14));

          // 2. Metadata Block (Citation, Case Number, Act(s), Date of Judgment)
          widgets.add(
            pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                if (cleanCitation.isNotEmpty) ...[
                  pw.RichText(
                    text: pw.TextSpan(
                      children: [
                        pw.TextSpan(
                          text: 'Citation: ',
                          style: pw.TextStyle(font: timesBold, fontSize: 10.5),
                        ),
                        pw.TextSpan(
                          text: cleanCitation,
                          style: pw.TextStyle(font: timesRoman, fontSize: 10.5),
                        ),
                      ],
                    ),
                  ),
                  pw.SizedBox(height: 4),
                ],
                if (cleanCaseNumber.isNotEmpty) ...[
                  pw.RichText(
                    text: pw.TextSpan(
                      children: [
                        pw.TextSpan(
                          text: 'Case Number: ',
                          style: pw.TextStyle(font: timesBold, fontSize: 10.5),
                        ),
                        pw.TextSpan(
                          text: cleanCaseNumber,
                          style: pw.TextStyle(font: timesRoman, fontSize: 10.5),
                        ),
                      ],
                    ),
                  ),
                  pw.SizedBox(height: 4),
                ],
                if (cleanAct.isNotEmpty) ...[
                  pw.RichText(
                    text: pw.TextSpan(
                      children: [
                        pw.TextSpan(
                          text: 'Act(s): ',
                          style: pw.TextStyle(font: timesBold, fontSize: 10.5),
                        ),
                        pw.TextSpan(
                          text: cleanAct,
                          style: pw.TextStyle(font: timesRoman, fontSize: 10.5),
                        ),
                      ],
                    ),
                  ),
                  pw.SizedBox(height: 4),
                ],
                if (cleanDate.isNotEmpty) ...[
                  pw.RichText(
                    text: pw.TextSpan(
                      children: [
                        pw.TextSpan(
                          text: 'Date of Judgment: ',
                          style: pw.TextStyle(font: timesBold, fontSize: 10.5),
                        ),
                        pw.TextSpan(
                          text: cleanDate,
                          style: pw.TextStyle(font: timesRoman, fontSize: 10.5),
                        ),
                      ],
                    ),
                  ),
                  pw.SizedBox(height: 4),
                ],
              ],
            ),
          );
          widgets.add(pw.SizedBox(height: 14));

          // 3. Parties Block (Petitioner vs Respondent)
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
                          style: pw.TextStyle(font: timesBold, fontSize: 11.5),
                        ),
                      ),
                      pw.Text(
                        '......... Petitioner(s)',
                        style: pw.TextStyle(font: timesBold, fontSize: 10.5),
                      ),
                    ],
                  ),
                  pw.SizedBox(height: 8),
                  pw.Center(
                    child: pw.Text(
                      'VERSUS',
                      style: pw.TextStyle(font: timesBold, fontSize: 11.0),
                    ),
                  ),
                  pw.SizedBox(height: 8),
                  pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: pw.CrossAxisAlignment.end,
                    children: [
                      pw.Expanded(
                        child: pw.Text(
                          respondent,
                          style: pw.TextStyle(font: timesBold, fontSize: 11.5),
                        ),
                      ),
                      pw.Text(
                        '......... Respondent(s)',
                        style: pw.TextStyle(font: timesBold, fontSize: 10.5),
                      ),
                    ],
                  ),
                ],
              ),
            );
            widgets.add(pw.SizedBox(height: 16));
          }

          // 4. Boxed HEAD NOTE
          if (headnoteClean.isNotEmpty) {
            widgets.add(
              pw.Container(
                width: double.infinity,
                padding: const pw.EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: PdfColors.black, width: 0.9),
                ),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.center,
                  children: [
                    pw.Text(
                      'HEAD NOTE',
                      style: pw.TextStyle(
                        font: timesBold,
                        fontSize: 11.5,
                        decoration: pw.TextDecoration.underline,
                      ),
                    ),
                    pw.SizedBox(height: 8),
                    pw.Text(
                      headnoteClean,
                      textAlign: pw.TextAlign.justify,
                      style: pw.TextStyle(
                        font: timesRoman,
                        fontSize: 10.5,
                        lineSpacing: 3.5,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }

          // ----------------------------------------------------
          // PAGE BREAK: EXPLICITLY MOVE JUDGMENT TO PAGE 2
          // ----------------------------------------------------
          widgets.add(pw.NewPage());

          // ----------------------------------------------------
          // PAGE 2+: FULL JUDGMENT & ORDER
          // ----------------------------------------------------
          widgets.add(
            pw.Center(
              child: pw.Text(
                'J U D G M E N T',
                style: pw.TextStyle(
                  font: timesBold,
                  fontSize: 13.5,
                  decoration: pw.TextDecoration.underline,
                  letterSpacing: 2.0,
                ),
              ),
            ),
          );
          widgets.add(pw.SizedBox(height: 12));

          if (cleanJudge.isNotEmpty) {
            widgets.add(
              pw.Text(
                cleanJudge.toUpperCase(),
                style: pw.TextStyle(font: timesBold, fontSize: 11.0),
              ),
            );
            widgets.add(pw.SizedBox(height: 12));
          }

          // Judgment Body Paragraphs (Justified, professional 10.5pt font, 3.5pt line spacing)
          for (final para in paragraphs) {
            widgets.add(
              pw.Paragraph(
                text: para,
                textAlign: pw.TextAlign.justify,
                style: pw.TextStyle(
                  font: timesRoman,
                  fontSize: 10.5,
                  lineSpacing: 3.5,
                ),
                margin: const pw.EdgeInsets.only(bottom: 10.0),
              ),
            );
          }

          return widgets;
        },
      ),
    );

    return pdf.save();
  }

  /// Opens standard Android/iOS layout dialog allowing user to "Save as PDF" or Print.
  /// First checks for authentic court judgment PDF directly from backend storage.
  static Future<void> downloadOrPrintPdf(
    BuildContext context,
    CaseModel caseItem,
  ) async {
    final sanitizedTitle = caseItem.title.replaceAll(RegExp(r'[^a-zA-Z0-9_\-]'), '_');
    final filename = 'DLR_${sanitizedTitle.substring(0, sanitizedTitle.length.clamp(0, 30))}.pdf';

    try {
      final authenticBytes = await fetchAuthenticPdfBytes(caseItem);
      if (authenticBytes != null && authenticBytes.isNotEmpty) {
        await Printing.layoutPdf(
          onLayout: (PdfPageFormat format) async => authenticBytes,
          name: filename,
        );
        return;
      }
    } catch (e) {
      debugPrint('Direct authentic PDF downloadOrPrintPdf fetch error: $e');
    }

    // Fallback to high-definition vector legal PDF generator
    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => generateCasePdf(caseItem, format: format),
      name: filename,
    );
  }

  /// Opens native share sheet allowing user to save file directly to Downloads or share to WhatsApp, Drive, etc.
  static Future<void> sharePdf(
    BuildContext context,
    CaseModel caseItem,
  ) async {
    final sanitizedTitle = caseItem.title.replaceAll(RegExp(r'[^a-zA-Z0-9_\-]'), '_');
    final filename = 'DLR_${sanitizedTitle.substring(0, sanitizedTitle.length.clamp(0, 30))}.pdf';

    try {
      final authenticBytes = await fetchAuthenticPdfBytes(caseItem);
      if (authenticBytes != null && authenticBytes.isNotEmpty) {
        await Printing.sharePdf(bytes: authenticBytes, filename: filename);
        return;
      }
    } catch (e) {
      debugPrint('Direct authentic PDF sharePdf fetch error: $e');
    }

    final bytes = await generateCasePdf(caseItem);
    await Printing.sharePdf(bytes: bytes, filename: filename);
  }
}
