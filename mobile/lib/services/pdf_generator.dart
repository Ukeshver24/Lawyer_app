import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
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
    final canonicalUrl = 'https://www.digilawreporter.in/judgment/${caseItem.id}';

    final petitioner = cleanText(caseItem.displayPetitioner.toUpperCase());
    final respondent = cleanText(caseItem.displayRespondent.toUpperCase());

    // Top title: Court name from DB (e.g. IN THE HIGH COURT OF MADRAS)
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

    // Split content into paragraphs
    final paragraphs = contentClean
        .split(RegExp(r'\n\s*\n'))
        .map((p) => p.trim())
        .where((p) => p.isNotEmpty)
        .where((p) => !RegExp(r'^(?:J\s*U\s*D\s*G\s*M\s*E\s*N\s*T|JUDGMENT|ORDER)$',
                caseSensitive: false)
            .hasMatch(p))
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
                    margin: const pw.EdgeInsets.all(22.0),
                    decoration: pw.BoxDecoration(
                      border: pw.Border.all(color: PdfColors.black, width: 0.9),
                    ),
                  ),
                  // Watermark on each and every page (bottom-left to top-right diagonal)
                  pw.Center(
                    child: pw.Transform.rotate(
                      angle: 0.58, // bottom-left to top-right diagonal
                      child: pw.Opacity(
                        opacity: 0.055,
                        child: pw.Text(
                          'DIGITAL LAW REPORTER',
                          style: pw.TextStyle(
                            font: timesBold,
                            fontSize: 30,
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
        header: (pw.Context context) => pw.SizedBox.shrink(),
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
                  // 2. Center: Page X of Y (bold, centered!)
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
                  fontSize: 14.5,
                  letterSpacing: 0.5,
                  color: PdfColors.black,
                ),
              ),
            ),
          );
          widgets.add(pw.SizedBox(height: 18));

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
                          style: pw.TextStyle(font: timesBold, fontSize: 11.5),
                        ),
                        pw.TextSpan(
                          text: cleanCitation,
                          style: pw.TextStyle(font: timesRoman, fontSize: 11.5),
                        ),
                      ],
                    ),
                  ),
                  pw.SizedBox(height: 5),
                ],
                if (cleanCaseNumber.isNotEmpty) ...[
                  pw.RichText(
                    text: pw.TextSpan(
                      children: [
                        pw.TextSpan(
                          text: 'Case Number: ',
                          style: pw.TextStyle(font: timesBold, fontSize: 11.5),
                        ),
                        pw.TextSpan(
                          text: cleanCaseNumber,
                          style: pw.TextStyle(font: timesRoman, fontSize: 11.5),
                        ),
                      ],
                    ),
                  ),
                  pw.SizedBox(height: 5),
                ],
                if (cleanAct.isNotEmpty) ...[
                  pw.RichText(
                    text: pw.TextSpan(
                      children: [
                        pw.TextSpan(
                          text: 'Act(s): ',
                          style: pw.TextStyle(font: timesBold, fontSize: 11.5),
                        ),
                        pw.TextSpan(
                          text: cleanAct,
                          style: pw.TextStyle(font: timesRoman, fontSize: 11.5),
                        ),
                      ],
                    ),
                  ),
                  pw.SizedBox(height: 5),
                ],
                if (cleanDate.isNotEmpty) ...[
                  pw.RichText(
                    text: pw.TextSpan(
                      children: [
                        pw.TextSpan(
                          text: 'Date of Judgment: ',
                          style: pw.TextStyle(font: timesBold, fontSize: 11.5),
                        ),
                        pw.TextSpan(
                          text: cleanDate,
                          style: pw.TextStyle(font: timesRoman, fontSize: 11.5),
                        ),
                      ],
                    ),
                  ),
                  pw.SizedBox(height: 5),
                ],
              ],
            ),
          );
          widgets.add(pw.SizedBox(height: 18));

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
                          style: pw.TextStyle(font: timesBold, fontSize: 12.5),
                        ),
                      ),
                      pw.Text(
                        '......... Petitioner(s)',
                        style: pw.TextStyle(font: timesBold, fontSize: 11.0),
                      ),
                    ],
                  ),
                  pw.SizedBox(height: 12),
                  pw.Center(
                    child: pw.Text(
                      'VERSUS',
                      style: pw.TextStyle(font: timesBold, fontSize: 12.0),
                    ),
                  ),
                  pw.SizedBox(height: 12),
                  pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: pw.CrossAxisAlignment.end,
                    children: [
                      pw.Expanded(
                        child: pw.Text(
                          respondent,
                          style: pw.TextStyle(font: timesBold, fontSize: 12.5),
                        ),
                      ),
                      pw.Text(
                        '......... Respondent(s)',
                        style: pw.TextStyle(font: timesBold, fontSize: 11.0),
                      ),
                    ],
                  ),
                ],
              ),
            );
            widgets.add(pw.SizedBox(height: 20));
          }

          // 4. Boxed HEAD NOTE
          if (headnoteClean.isNotEmpty) {
            widgets.add(
              pw.Container(
                width: double.infinity,
                padding: const pw.EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: PdfColors.black, width: 1.0),
                ),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.center,
                  children: [
                    pw.Text(
                      'HEAD NOTE',
                      style: pw.TextStyle(
                        font: timesBold,
                        fontSize: 12.5,
                        decoration: pw.TextDecoration.underline,
                      ),
                    ),
                    pw.SizedBox(height: 8),
                    pw.Text(
                      headnoteClean,
                      textAlign: pw.TextAlign.justify,
                      style: pw.TextStyle(
                        font: timesRoman,
                        fontSize: 11.5,
                        lineSpacing: 5.5,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }

          // ----------------------------------------------------
          // PAGE BREAK: EXPLICITLY MOVE JUDGMENT TO PAGE 2!
          // ----------------------------------------------------
          widgets.add(pw.NewPage());

          // ----------------------------------------------------
          // PAGE 2+: FULL JUDGMENT & ORDER
          // ----------------------------------------------------
          widgets.add(
            pw.Center(
              child: pw.Text(
                'JUDGMENT',
                style: pw.TextStyle(
                  font: timesBold,
                  fontSize: 14.0,
                  decoration: pw.TextDecoration.underline,
                ),
              ),
            ),
          );
          widgets.add(pw.SizedBox(height: 12));

          widgets.add(
            pw.Text(
              'J U D G M E N T',
              style: pw.TextStyle(
                font: timesBold,
                fontSize: 13.0,
                decoration: pw.TextDecoration.underline,
              ),
            ),
          );
          widgets.add(pw.SizedBox(height: 10));

          if (cleanJudge.isNotEmpty) {
            widgets.add(
              pw.Text(
                cleanJudge.toUpperCase(),
                style: pw.TextStyle(font: timesBold, fontSize: 12.0),
              ),
            );
            widgets.add(pw.SizedBox(height: 14));
          }

          // Judgment Body Paragraphs (Always Justified and spanning across pages with generous line spacing)
          for (final para in paragraphs) {
            widgets.add(
              pw.Paragraph(
                text: para,
                textAlign: pw.TextAlign.justify,
                style: pw.TextStyle(
                  font: timesRoman,
                  fontSize: 12.5,
                  lineSpacing: 6.5,
                ),
                margin: const pw.EdgeInsets.only(bottom: 14.0),
              ),
            );
          }

          return widgets;
        },
      ),
    );

    return pdf.save();
  }

  /// Opens standard Android/iOS layout dialog allowing user to "Save as PDF" or Print
  static Future<void> downloadOrPrintPdf(
    BuildContext context,
    CaseModel caseItem,
  ) async {
    final sanitizedTitle = caseItem.title.replaceAll(RegExp(r'[^a-zA-Z0-9_\-]'), '_');
    final filename = 'DLR_${sanitizedTitle.substring(0, sanitizedTitle.length.clamp(0, 30))}.pdf';

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

    final bytes = await generateCasePdf(caseItem);
    await Printing.sharePdf(bytes: bytes, filename: filename);
  }
}
