import { jsPDF } from 'jspdf';
import html2pdf from 'html2pdf.js';
import QRCode from 'qrcode';

const getOriginalPdfUrl = (caseItem) => {
  const pdfPath = caseItem?.pdf_file_path || caseItem?.pdf_file;

  if (!pdfPath) return '';
  const timestamp = Date.now();
  if (/^https?:\/\//i.test(pdfPath)) {
    const sep = pdfPath.includes('?') ? '&' : '?';
    return `${pdfPath}${sep}t=${timestamp}`;
  }

  const defaultOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000';
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || defaultOrigin).replace(/\/api\/?$/, '').replace(/\/$/, '');
  const normalizedPath = String(pdfPath).replace(/^\/+/, '');

  return `${baseUrl}/${normalizedPath}?t=${timestamp}`;
};

/**
 * Universal Single-Source-of-Truth Legal PDF Model Builder
 * Constructs 100% identical A4 vector document for both Download & Print
 * Matching the authentic Indian Court format with clean typography and precise alignment.
 */
export const buildVectorLegalPDF = async (caseItem) => {
  // Initialize jsPDF (A4 Portrait, inches)
  const doc = new jsPDF({
    unit: 'in',
    format: 'a4',
    orientation: 'portrait'
  });

  const pageWidth = 8.27;   // 210 mm (A4)
  const pageHeight = 11.69; // 297 mm
  const margin = 0.70;      // 0.70 in side margins (balanced aesthetic)
  const contentWidth = pageWidth - (margin * 2); // 6.87 in
  const maxY = pageHeight - 0.95; // max Y before footer

  // Extract All Citations first so available everywhere
  let allCitations = [];
  if (Array.isArray(caseItem.citations)) {
    allCitations = caseItem.citations;
  } else if (typeof caseItem.citations === 'string') {
    try {
      const parsed = JSON.parse(caseItem.citations);
      if (Array.isArray(parsed)) allCitations = parsed;
      else if (parsed) allCitations = [parsed];
    } catch (e) {
      allCitations = caseItem.citations.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  if (allCitations.length === 0 && (caseItem.citation || caseItem.citations_string)) {
    allCitations = [caseItem.citation || caseItem.citations_string];
  }

  const formatCitationStr = (c) => {
    if (!c) return '';
    if (typeof c === 'string') return c;
    const yr = c.year || caseItem.year || '2026';
    const mo = c.month ? `(${String(c.month).padStart(2, '0')}) ` : '';
    const crt = c.court ? `(${c.court}) ` : '(SC) ';
    const num = c.number ? `#${String(c.number).replace(/^#+/, '')}` : '';
    let s = `${yr} ${mo}DLR ${crt}${num}`.replace(/\s+/g, ' ').trim();
    if (c.equivalentText) {
      s += ` : ${c.equivalentText}`;
    }
    return s;
  };

  const primaryCitation = allCitations.length > 0
    ? formatCitationStr(allCitations[0])
    : (caseItem.citation || `${caseItem.year || '2026'} DLR (${caseItem.court || 'SC'}) #1`);

  const court = caseItem.court_name || caseItem.court || 'SUPREME COURT OF INDIA';
  const rawTitle = caseItem.title || 'Untitled Case';

  let petitioner = caseItem.petitioner_name || caseItem.petitioner || '';
  let respondent = caseItem.respondent_name || caseItem.respondent || '';

  if (!petitioner && !respondent && rawTitle) {
    const splitMatch = rawTitle.split(/\s*(?:v\.?|vs\.?|VERSUS|V\/S)\s*/i);
    if (splitMatch.length === 2) {
      petitioner = splitMatch[0].trim();
      respondent = splitMatch[1].trim();
    }
  }

  const caseNumber = caseItem.case_number || caseItem.caseNumber || '';
  let formattedDate = '';
  if (caseItem.judgment_date || caseItem.judgmentDate) {
    try {
      const d = new Date(caseItem.judgment_date || caseItem.judgmentDate);
      if (!isNaN(d.getTime())) {
        const dDay = String(d.getDate()).padStart(2, '0');
        const dMo = String(d.getMonth() + 1).padStart(2, '0');
        const dYr = d.getFullYear();
        formattedDate = `${dDay}/${dMo}/${dYr}`;
      } else {
        formattedDate = String(caseItem.judgment_date || '').trim();
      }
    } catch (e) {
      formattedDate = String(caseItem.judgment_date || '').trim();
    }
  }

  const bench = caseItem.bench || caseItem.coram || caseItem.author || '';
  const headNote = caseItem.head_note || caseItem.headnote || caseItem.summary || '';
  const fullContent = caseItem.content || caseItem.judgment_text || caseItem.judgmentText || '';
  const authorJudge = caseItem.author || caseItem.judge || (bench ? bench.split(',')[0] : '');
  const act = caseItem.act || '';
  const section = caseItem.section || '';
  const jurisdiction = caseItem.jurisdiction_type || caseItem.jurisdictionType || 'CIVIL APPELLATE JURISDICTION';

  let yPos = 0.80;

  // Background Watermark: Strictly drawn FIRST so all text, lines, and boxes are ON TOP
  const drawWatermark = () => {
    try {
      doc.saveGraphicsState();
      let hasOpacity = false;
      if (typeof doc.GState === 'function') {
        try {
          const gState = new doc.GState({ opacity: 0.045 });
          doc.setGState(gState);
          doc.setTextColor(0, 0, 0); // Faint true black with subtle 0.045 opacity
          hasOpacity = true;
        } catch (err) { }
      }
      if (!hasOpacity) {
        doc.setTextColor(242, 242, 242); // Fallback ultra-subtle light gray
      }
      doc.setFont("times", "bold");
      doc.setFontSize(32);
      doc.text("DIGITAL LAW REPORTER", pageWidth / 2, pageHeight / 2, {
        align: 'center',
        angle: 45
      });
      doc.restoreGraphicsState();
    } catch (e) {
      console.warn("Watermark render error:", e);
    }
  };

  const drawHeaderOnSubsequentPage = () => {
    doc.setFont("times", "bold");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(primaryCitation, margin, 0.45);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("DIGI LAW REPORTER (DLR)", pageWidth - margin, 0.45, { align: 'right' });

    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.006);
    doc.line(margin, 0.48, pageWidth - margin, 0.48);

    yPos = 0.85;
  };

  const checkNewPage = (requiredSpace = 0.24) => {
    if (yPos + requiredSpace > maxY) {
      doc.addPage();
      drawWatermark();
      yPos = 0.85;
      drawHeaderOnSubsequentPage();
    }
  };

  // ==========================================
  // PAGE 1: PRECEDENT TITLE & HEADNOTE SHEET
  // ==========================================

  // 0. Paint Background Watermark First!
  drawWatermark();

  const hasEmbeddedCourtHeaders = /IN\s+THE\s+SUPREME\s+COURT|IN\s+THE\s+HIGH\s+COURT|CRIMINAL\s+APPELLATE|CIVIL\s+APPELLATE|—\s*VERSUS\s*—|J\s*U\s*D\s*G\s*M\s*E\s*N\s*T/i.test(fullContent);

  if (!hasEmbeddedCourtHeaders) {
    // 1. Top Centered Court & Coram Header
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);

    let courtHeading = `IN THE ${court.toUpperCase()}`;
    if (jurisdiction) {
      courtHeading += ` ${jurisdiction.toUpperCase()}`;
    }
    if (bench) {
      courtHeading += ` ${bench.toUpperCase()}`;
      if (!bench.toUpperCase().includes('JJ') && !bench.toUpperCase().includes('J.')) {
        courtHeading += ', JJ.';
      }
    }

    const headerLines = doc.splitTextToSize(courtHeading, 5.4);
    doc.text(headerLines, pageWidth / 2, yPos, { align: 'center' });
    yPos += (headerLines.length * 0.23) + 0.35;

    // 2. Metadata Block (Left-Aligned, Structured with Breathing Room)
    const renderMetadataItem = (label, value) => {
      if (!value || !String(value).trim()) return;
      const cleanVal = String(value).trim();
      const cleanLabel = label.replace(/:\s*$/, '').trim() + ':';

      doc.setFont("times", "bold");
      doc.setFontSize(10.5);
      const labelWithSpace = `${cleanLabel} `;
      const labelWidth = doc.getTextWidth(labelWithSpace);

      const fullText = `${cleanLabel} ${cleanVal}`;
      doc.setFont("times", "normal");
      doc.setFontSize(10.5);

      const lines = doc.splitTextToSize(fullText, contentWidth);
      if (!lines || lines.length === 0) return;

      // Line 1: Bold label
      doc.setFont("times", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text(cleanLabel, margin, yPos);

      // Line 1: Normal value
      doc.setFont("times", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);

      let remainder = "";
      if (lines[0].startsWith(cleanLabel)) {
        remainder = lines[0].substring(cleanLabel.length).trim();
      } else {
        remainder = lines[0].trim();
      }

      if (remainder) {
        doc.text(remainder, margin + labelWidth, yPos);
      }
      yPos += 0.22;

      // Subsequent lines wrapped cleanly to margin
      for (let i = 1; i < lines.length; i++) {
        doc.text(lines[i].trim(), margin, yPos);
        yPos += 0.22;
      }

      // Generous breathing room between metadata rows
      yPos += 0.14;
    };

    // Citation line
    const allCitsStr = allCitations.map(c => formatCitationStr(c)).filter(Boolean).join('; ');
    renderMetadataItem("Citation", allCitsStr || primaryCitation);

    // Case Number line
    renderMetadataItem("Case Number", caseNumber || '—');

    // Act(s) line
    const actStr = `${act || ''}${act && section ? '; ' : ''}${section || ''}`;
    if (actStr) {
      renderMetadataItem("Act(s)", actStr);
    }

    // Date of Judgment line
    renderMetadataItem("Date of Judgment", formattedDate || dateStr);

    yPos += 0.35;

    // 3. Parties Section (Wide Alignment with Dots)
    const petLabel = "......... Petitioner(s)";
    doc.setFont("times", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text(petLabel, pageWidth - margin, yPos, { align: 'right' });

    const maxPartyWidth = 3.6;
    doc.setFont("times", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    const petLines = doc.splitTextToSize((petitioner || rawTitle || 'PETITIONER').toUpperCase(), maxPartyWidth);
    doc.text(petLines, margin, yPos);
    yPos += Math.max(petLines.length * 0.22, 0.22) + 0.35;

    // VERSUS
    doc.setFont("times", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text("VERSUS", pageWidth / 2, yPos, { align: 'center' });
    yPos += 0.35;

    // Respondent
    const respLabel = "......... Respondent(s)";
    doc.setFont("times", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text(respLabel, pageWidth - margin, yPos, { align: 'right' });

    doc.setFont("times", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    const respLines = doc.splitTextToSize((respondent || 'RESPONDENT').toUpperCase(), maxPartyWidth);
    doc.text(respLines, margin, yPos);
    yPos += Math.max(respLines.length * 0.22, 0.22) + 0.40;
  }

  // Sanitizer Helper
  const sanitizeText = (str) => {
    if (!str) return '';
    let text = String(str);

    text = text.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, listContent) => {
      let itemIndex = 1;
      return listContent.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (m, itemText) => {
        const cleanItem = itemText.replace(/<[^>]*>/g, '').trim();
        if (!cleanItem) return '';
        const hasNumber = /^\d+[\.\)]\s*/.test(cleanItem);
        const prefix = hasNumber ? '' : `${itemIndex}.  `;
        itemIndex++;
        return `\n\n${prefix}${cleanItem}`;
      });
    });

    text = text.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, listContent) => {
      return listContent.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (m, itemText) => {
        const cleanItem = itemText.replace(/<[^>]*>/g, '').trim();
        if (!cleanItem) return '';
        const hasBullet = /^[•\-\*]\s*/.test(cleanItem);
        const prefix = hasBullet ? '' : `•  `;
        return `\n\n${prefix}${cleanItem}`;
      });
    });

    text = text
      .replace(/Digitally\s+signed\s+by[^\n<]*/gi, '')
      .replace(/Signature\s+Not\s+Verified[^\n<]*/gi, '')
      .replace(/Signature\s+Valid[^\n<]*/gi, '')
      .replace(/Date:\s*\d{4}\.\d{2}\.\d{2}[^\n<]*/gi, '')
      .replace(/Reason:[^\n<]*/gi, '')
      .replace(/Location:[^\n<]*/gi, '')
      .replace(/https?:\/\/[^\s]*\/qr\/[^\s<]*/gi, '')
      .replace(/[\uFFFD\u200B\uFEFF]/g, '')
      .replace(/(?:^|\s)[\?？]\s*(?=[A-Z\.\s]{3,40},\s*J\.?|\.{3,}|…|Date|New Delhi|[A-Z][a-z]+)/gi, ' ')
      .replace(/(?:^|\s)[\?？]\s*(?:$|\s)/g, ' ')
      .replace(/\s*[\?？]\s*([A-Z\.\s]{3,40},\s*J\.?)/gi, ' $1')
      .replace(/\s*[\?？]\s*$/g, '')
      .replace(/^\s*[\?？]\s*/g, '')
      .replace(/\s+[\?？]\s+/g, ' ')
      .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|blockquote|tr)>/gi, '\n\n')
      .replace(/<\/(td|th)>/gi, '  \n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<hr\s*\/?>/gi, '\n\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&#x27;/gi, "'")
      .replace(/&ndash;/gi, '–')
      .replace(/&mdash;/gi, '—');

    return text.trim();
  };

  // 4. HEAD NOTE Box (Only if present and not already embedded in body)
  if (headNote && headNote.trim() && !fullContent.includes(headNote.trim().substring(0, 50))) {
    const cleanHeadnote = sanitizeText(headNote);
    const boxInnerPadding = 0.18;
    const textWidth = contentWidth - (boxInnerPadding * 2);
    doc.setFont("times", "normal");
    doc.setFontSize(10.5);
    const allHnLines = doc.splitTextToSize(cleanHeadnote, textWidth);

    const titleAreaHeight = 0.52; // space for "HEAD NOTE" title + underline
    const lineSpacing = 0.22;
    const bottomPadding = 0.22;

    let hnRemaining = [...allHnLines];
    let isFirstChunk = true;

    while (hnRemaining.length > 0) {
      const spaceForText = maxY - yPos - titleAreaHeight - bottomPadding;
      const linesFit = Math.max(1, Math.floor(spaceForText / lineSpacing));
      const chunk = hnRemaining.slice(0, linesFit);
      hnRemaining = hnRemaining.slice(linesFit);

      const boxHeight = titleAreaHeight + (chunk.length * lineSpacing) + bottomPadding;

      // Draw the bordered box
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.008);
      doc.rect(margin, yPos, contentWidth, boxHeight, 'S');

      // Title with underline
      const hnTitle = isFirstChunk ? "HEAD NOTE" : "HEAD NOTE (CONTD.)";
      doc.setFont("times", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      const titleY = yPos + 0.22;
      doc.text(hnTitle, pageWidth / 2, titleY, { align: 'center' });
      const hnTitleWidth = doc.getTextWidth(hnTitle);
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.007);
      doc.line(pageWidth / 2 - (hnTitleWidth / 2), titleY + 0.025, pageWidth / 2 + (hnTitleWidth / 2), titleY + 0.025);

      // Headnote text
      doc.setFont("times", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      const textStartY = yPos + titleAreaHeight;
      doc.text(chunk, margin + boxInnerPadding, textStartY, { align: 'justify', maxWidth: textWidth });

      yPos += boxHeight + 0.35;
      isFirstChunk = false;

      if (hnRemaining.length > 0) {
        doc.addPage();
        drawWatermark();
        yPos = 0.85;
        drawHeaderOnSubsequentPage();
      }
    }
  }

  // ==========================================
  // JUDGMENT BODY CONTINUATION (Authentic Flow)
  // ==========================================
  checkNewPage(0.50);

  const cleanBody = fullContent;
  const hasEmbeddedJudgmentTitle = /J\s*U\s*D\s*G\s*M\s*E\s*N\s*T|O\s*R\s*D\s*E\s*R/i.test(cleanBody);

  // Centered JUDGMENT Heading (Rendered once if not embedded)
  if (!hasEmbeddedJudgmentTitle) {
    doc.setFont("times", "bold");
    doc.setFontSize(12.5);
    doc.setTextColor(15, 23, 42);
    doc.text("JUDGMENT", pageWidth / 2, yPos, { align: 'center' });
    yPos += 0.35;

    if (authorJudge) {
      doc.setFont("times", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      const cleanAuthor = authorJudge.replace(/,?\s*J\.?$/i, '').trim();
      if (cleanAuthor) {
        doc.text(`${cleanAuthor.toUpperCase()}, J.`, margin, yPos);
        yPos += 0.30;
      }
    }
  }

  // Helper: Parse HTML tables into structured rows and cells
  const parseHtmlTable = (tableHtml) => {
    const rowMatches = tableHtml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
    const rows = [];

    for (const rowHtml of rowMatches) {
      const cellMatches = rowHtml.match(/<(th|td)[^>]*>([\s\S]*?)<\/(th|td)>/gi) || [];
      const cells = [];
      let isHeader = false;

      for (const cellHtml of cellMatches) {
        const isTh = /^<th/i.test(cellHtml.trim());
        if (isTh) isHeader = true;

        const innerMatch = cellHtml.match(/^<(?:th|td)[^>]*>([\s\S]*?)<\/(?:th|td)>$/i);
        const innerContent = innerMatch ? innerMatch[1] : cellHtml;

        let cellText = innerContent
          .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, '\n\n')
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/gi, ' ')
          .replace(/&amp;/gi, '&')
          .replace(/&lt;/gi, '<')
          .replace(/&gt;/gi, '>')
          .replace(/&quot;/gi, '"')
          .replace(/&#39;/gi, "'")
          .replace(/&#x27;/gi, "'")
          .replace(/&ndash;/gi, '–')
          .replace(/&mdash;/gi, '—');

        cellText = cellText
          .split('\n')
          .map(l => l.replace(/[ \t]+/g, ' ').trim())
          .filter(Boolean)
          .join('\n');

        cells.push({
          text: cellText.trim(),
          isHeader: isTh
        });
      }

      if (cells.length > 0) {
        rows.push({
          isHeader,
          cells
        });
      }
    }

    return rows;
  };

  // Helper: Render Table with vector borders, styled headers, and multi-page row slicing
  const renderVectorTable = (tableHtml) => {
    const rows = parseHtmlTable(tableHtml);
    if (!rows || rows.length === 0) return;

    checkNewPage(0.5);

    const maxCols = Math.max(...rows.map(r => r.cells.length));
    if (maxCols === 0) return;

    const colWidth = contentWidth / maxCols;
    const cellPadding = 0.08;
    const cellTextWidth = colWidth - (cellPadding * 2);
    const cellLineH = 0.17;

    // Identify header row(s) so we can re-stamp them on continuation pages
    let headerRows = [];

    const drawTableRow = (rowCellData, isHeaderRow, rowHeight) => {
      for (let cIdx = 0; cIdx < maxCols; cIdx++) {
        const cell = rowCellData[cIdx] || { text: '', lines: [], isHeader: false };
        const cellX = margin + (cIdx * colWidth);

        if (isHeaderRow || cell.isHeader) {
          doc.setFillColor(241, 245, 249);
          doc.rect(cellX, yPos, colWidth, rowHeight, 'FD');
        } else {
          doc.setFillColor(255, 255, 255);
          doc.rect(cellX, yPos, colWidth, rowHeight, 'S');
        }

        doc.setDrawColor(148, 163, 184);
        doc.setLineWidth(0.008);
        doc.rect(cellX, yPos, colWidth, rowHeight, 'S');

        doc.setFont("times", (isHeaderRow || cell.isHeader) ? "bold" : "normal");
        doc.setFontSize((isHeaderRow || cell.isHeader) ? 9.5 : 9);
        doc.setTextColor(15, 23, 42);

        let textY = yPos + cellPadding + 0.12;
        for (let l = 0; l < cell.lines.length; l++) {
          const lText = cell.lines[l];
          const isLast = l === cell.lines.length - 1;
          if (!isLast && lText.indexOf(' ') > 0 && !isHeaderRow) {
            doc.text(lText.trim(), cellX + cellPadding, textY, { align: 'justify', maxWidth: cellTextWidth });
          } else {
            doc.text(lText.trim(), cellX + cellPadding, textY);
          }
          textY += cellLineH;
        }
      }
      yPos += rowHeight;
    };

    for (const row of rows) {
      doc.setFont("times", row.isHeader ? "bold" : "normal");
      doc.setFontSize(row.isHeader ? 9.5 : 9);

      let maxCellLines = 1;
      const rowCellData = row.cells.map(cell => {
        const lines = doc.splitTextToSize(cell.text, cellTextWidth);
        if (lines.length > maxCellLines) maxCellLines = lines.length;
        return { text: cell.text, lines, isHeader: cell.isHeader };
      });

      if (row.isHeader) {
        headerRows = rowCellData; // Remember for re-stamp on new pages
      }

      const rowHeight = (maxCellLines * cellLineH) + (cellPadding * 2);
      const pageContentHeight = maxY - 0.85; // usable height per page

      // If the entire row fits on this page, draw it directly
      if (yPos + rowHeight <= maxY) {
        drawTableRow(rowCellData, row.isHeader, rowHeight);
      } else if (rowHeight > pageContentHeight) {
        // Row is taller than a full page: slice cell lines across pages
        const linesPerPage = Math.max(1, Math.floor((maxY - yPos - (cellPadding * 2)) / cellLineH));
        let lineOffset = 0;
        while (lineOffset < maxCellLines) {
          const pageLines = Math.min(linesPerPage, maxCellLines - lineOffset);
          const slicedRowData = rowCellData.map(cell => ({
            ...cell,
            lines: cell.lines.slice(lineOffset, lineOffset + pageLines)
          }));
          const sliceHeight = (pageLines * cellLineH) + (cellPadding * 2);
          drawTableRow(slicedRowData, row.isHeader, sliceHeight);
          lineOffset += pageLines;
          if (lineOffset < maxCellLines) {
            doc.addPage();
            drawWatermark();
            yPos = 0.85;
            drawHeaderOnSubsequentPage();
            // Re-stamp table header so the reader always knows the column names
            if (headerRows.length > 0 && !row.isHeader) {
              const hdrLineCount = Math.max(...headerRows.map(c => c.lines.length), 1);
              const hdrH = (hdrLineCount * cellLineH) + (cellPadding * 2);
              drawTableRow(headerRows, true, hdrH);
            }
          }
        }
      } else {
        // Row doesn't fit on this page: move to next page then draw
        doc.addPage();
        drawWatermark();
        yPos = 0.85;
        drawHeaderOnSubsequentPage();
        // Re-stamp header on continuation page
        if (headerRows.length > 0 && !row.isHeader) {
          const hdrLineCount = Math.max(...headerRows.map(c => c.lines.length), 1);
          const hdrH = (hdrLineCount * cellLineH) + (cellPadding * 2);
          drawTableRow(headerRows, true, hdrH);
        }
        drawTableRow(rowCellData, row.isHeader, rowHeight);
      }
    }

    yPos += 0.25;
  };

  // Helper: Render paragraphs with Times New Roman and 100% mathematical text justification
  const renderTextParagraphs = (rawHtmlChunk) => {
    if (!rawHtmlChunk || !rawHtmlChunk.trim()) return;

    const cleanText = sanitizeText(rawHtmlChunk);
    if (!cleanText || !cleanText.trim()) return;

    const paragraphs = cleanText.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    const lineSpacing = 0.22;

    for (const para of paragraphs) {
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);

      const lines = doc.splitTextToSize(para, contentWidth);
      if (!lines || lines.length === 0) continue;

      for (let i = 0; i < lines.length; i++) {
        if (yPos + lineSpacing > maxY) {
          doc.addPage();
          drawWatermark();
          drawHeaderOnSubsequentPage();
        }

        const lineText = lines[i].trim();
        const isLastLineOfPara = (i === lines.length - 1);

        doc.setFont("times", "normal");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);

        if (!isLastLineOfPara && lineText.indexOf(' ') > 0) {
          doc.text(lineText, margin, yPos, { align: 'justify', maxWidth: contentWidth });
        } else {
          doc.text(lineText, margin, yPos);
        }

        yPos += lineSpacing;
      }

      yPos += 0.14; // paragraph spacing
    }
  };

  // Render Judgment Body (Paragraphs + Vector Comparison Tables)
  const tableRegex = /<table[\s\S]*?<\/table>/gi;
  let lastIdx = 0;
  let match;

  while ((match = tableRegex.exec(cleanBody)) !== null) {
    const textChunk = cleanBody.substring(lastIdx, match.index);
    if (textChunk && textChunk.trim()) {
      renderTextParagraphs(textChunk);
    }
    renderVectorTable(match[0]);
    lastIdx = match.index + match[0].length;
  }

  const remainingChunk = cleanBody.substring(lastIdx);
  if (remainingChunk && remainingChunk.trim()) {
    renderTextParagraphs(remainingChunk);
  }

  // Final Order / Disposition section (if stored separately from judgment body)
  const orderText = caseItem.order || caseItem.disposition || caseItem.final_order || '';
  if (orderText && orderText.trim()) {
    checkNewPage(0.5);
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("ORDER", pageWidth / 2, yPos, { align: 'center' });
    yPos += 0.35;
    renderTextParagraphs(orderText);
  }

  // ==========================================
  // RUNNING HEADERS & FOOTERS (ALL PAGES)
  // ==========================================
  const totalPages = doc.internal.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // 2. Running Top Header on Page 2+
    if (i > 1) {
      doc.setFont("times", "bold");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text(primaryCitation, margin, 0.45);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("DIGI LAW REPORTER (DLR)", pageWidth - margin, 0.45, { align: 'right' });

      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.006);
      doc.line(margin, 0.48, pageWidth - margin, 0.48);
    }

    // 3. Clean Standard Page Number Footer on Every Page (No QR code, no extra timestamps / year)
    const footerY = pageHeight - 0.55;

    doc.setFont("times", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, footerY, { align: 'center' });
  }

  return doc;
};

/**
 * Download Action: Generates PDF model and triggers direct .pdf download file save
 */
export const downloadCaseAsPDF = async (caseItem, elementId = 'printable-judgment-document', showToast = () => { }) => {
  if (!caseItem) return;

  const caseId = caseItem.id || caseItem._id || 'record';
  const downloadFileName = `Digital_Law_Reporter_Case_${caseId}_${Date.now()}.pdf`;
  showToast(`Preparing authentic PDF judgment file...`);

  // 1. Prefer the sanitized uploaded judgment PDF (100% exact alignment, zero QR, zero question mark)
  const originalPdfUrl = getOriginalPdfUrl(caseItem);
  if (originalPdfUrl) {
    try {
      const resp = await fetch(originalPdfUrl);
      if (resp.ok) {
        const blob = await resp.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = downloadFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        showToast(`Official PDF judgment file downloaded successfully!`);
        return;
      }
    } catch (e) {
      console.warn('Direct blob fetch failed, falling back to anchor link:', e);
      const link = document.createElement('a');
      link.href = originalPdfUrl;
      link.target = '_blank';
      link.download = downloadFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Downloading official PDF judgment file...`);
      return;
    }
  }

  // 2. Vector PDF Model fallback
  try {
    const doc = await buildVectorLegalPDF(caseItem);
    doc.save(downloadFileName);
    showToast(`Official PDF downloaded successfully!`);
  } catch (nativeErr) {
    console.error("Native PDF Exporter error:", nativeErr);
    showToast("Generating PDF report...");

    try {
      const element = document.getElementById(elementId);
      if (!element) {
        window.print();
        return;
      }
      const opt = {
        margin: [0.5, 0.5, 0.85, 0.5],
        filename: downloadFileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };
      await html2pdf().set(opt).from(element).save();
      showToast(`PDF downloaded successfully!`);
    } catch (fallbackErr) {
      console.error("PDF fallback failed:", fallbackErr);
      window.print();
    }
  }
};

/**
 * Print Action: Uses the clean PDF model with 100% exact alignment and autoPrint
 */
export const printCaseAsPDF = async (caseItem, elementId = 'printable-judgment-document', showToast = () => { }) => {
  if (!caseItem) return;

  showToast("Opening document for printing...");

  // 1. Prefer the sanitized uploaded judgment PDF (100% exact alignment, zero QR, zero question mark)
  const originalPdfUrl = getOriginalPdfUrl(caseItem);
  if (originalPdfUrl) {
    window.open(originalPdfUrl, '_blank');
    showToast("Opening official judgment PDF for printing...");
    return;
  }

  // 2. Vector PDF fallback
  try {
    const doc = await buildVectorLegalPDF(caseItem);
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  } catch (nativeErr) {
    console.error("Native print error, falling back to window.print():", nativeErr);
    window.print();
  }
};
