import { jsPDF } from 'jspdf';
import html2pdf from 'html2pdf.js';
import QRCode from 'qrcode';

/**
 * Universal Single-Source-of-Truth Legal PDF Model Builder
 * Constructs 100% identical A4 vector document for both Download & Print
 * Matching the authentic Digital Law Reporter format with Cover Precedent Sheet,
 * diagonal watermarks, QR codes, Times New Roman typography, and vector tables.
 */
export const buildVectorLegalPDF = async (caseItem) => {
  const caseId = caseItem.id || caseItem._id || '1';
  const canonicalUrl = `https://www.digilawreporter.in/case/${caseId}`;

  // 1. Generate Case QR Code Data URL
  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(canonicalUrl, { 
      margin: 1, 
      width: 160,
      color: { dark: '#0F172A', light: '#FFFFFF' }
    });
  } catch (err) {
    console.error("QR Code generation error:", err);
  }

  // 2. Dynamic Generation Timestamp (DD/MM/YYYY, hh:mm am/pm)
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const dateStr = `${day}/${month}/${year}`;

  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const timeStr = `${hours}:${minutes} ${ampm}`;
  const timestampText = `Date: ${dateStr}, ${timeStr}`;

  // 3. Initialize jsPDF (A4 Portrait, inches)
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
        } catch (err) {}
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

  // Citation line (Shows all citations joined cleanly)
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

  const maxPartyWidth = 3.6; // Allows natural 2-line wrap like authentic precedent
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

  // 4. HEAD NOTE Box on Page 1 (Bordered Rectangle, transparent background so watermark shows through)
  if (headNote && headNote.trim()) {
    const cleanHeadnote = sanitizeText(headNote);
    const boxInnerPadding = 0.18;
    const textWidth = contentWidth - (boxInnerPadding * 2);
    doc.setFont("times", "normal");
    doc.setFontSize(10.5);
    const hnLines = doc.splitTextToSize(cleanHeadnote, textWidth);

    const titleAreaHeight = 0.52; // Generous space so title underline never touches the text!
    const lineSpacing = 0.22;
    const bottomPadding = 0.22;
    const boxHeight = titleAreaHeight + (hnLines.length * lineSpacing) + bottomPadding;

    // Stroke only (no fill so watermark is visible behind)
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.008);
    doc.rect(margin, yPos, contentWidth, boxHeight, 'S');

    // Centered Title inside box with underline
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    const hnTitle = "HEAD NOTE";
    const titleY = yPos + 0.22;
    doc.text(hnTitle, pageWidth / 2, titleY, { align: 'center' });
    const hnTitleWidth = doc.getTextWidth(hnTitle);
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.007);
    doc.line(pageWidth / 2 - (hnTitleWidth / 2), titleY + 0.025, pageWidth / 2 + (hnTitleWidth / 2), titleY + 0.025);

    // Text inside box: 100% Mathematically Justified via array passing
    doc.setFont("times", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    const textStartY = yPos + titleAreaHeight; // yPos + 0.52 gives clean breathing room below underline
    doc.text(hnLines, margin + boxInnerPadding, textStartY, { align: 'justify', maxWidth: textWidth });

    yPos += boxHeight + 0.35;
  }

  // ==========================================
  // PAGE 2+: FULL VERBATIM JUDGMENT BODY
  // ==========================================
  doc.addPage();
  drawWatermark();
  yPos = 0.85;
  drawHeaderOnSubsequentPage();

  // Centered JUDGMENT Heading (Rendered once)
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

  // Strip redundant cause title, citations, act names, parties, and headnote already shown on Page 1
  let cleanBody = fullContent;

  // 1. Detect standalone JUDGMENT / ORDER / J U D G M E N T heading
  const headingPattern = /(?:<p[^>]*>|<div[^>]*>|<h[1-6][^>]*>|<center>|\r?\n|^)\s*(?:<b>|<strong>)?\s*(?:J\s*U\s*D\s*G\s*M\s*E\s*N\s*T|JUDGMENT|O\s*R\s*D\s*E\s*R|ORDER|ORAL\s+JUDGMENT|COMMON\s+ORDER)\s*(?:<\/b>|<\/strong>)?\s*(?:<\/p>|<\/div>|<\/h[1-6]>|<\/center>|\r?\n|$)/i;
  const headingMatch = cleanBody.match(headingPattern);

  if (headingMatch) {
    let after = cleanBody.substring(headingMatch.index + headingMatch[0].length);
    // Also skip author line immediately following JUDGMENT if present (e.g. "B.R. GAVAI, J.")
    const authorLinePattern = /^\s*(?:<p[^>]*>|<div[^>]*>|\r?\n|\s)*(?:The\s+Judgment\s+of\s+the\s+Court\s+was\s+delivered\s+by\s+)?(?:<b>|<strong>)?([A-Z\.\s]{3,40},?\s*J\.?)(?:<\/b>|<\/strong>)?(?:<\/p>|<\/div>|\r?\n|\s)*/i;
    const authorMatch = after.match(authorLinePattern);
    if (authorMatch) {
      after = after.substring(authorMatch[0].length);
    }
    cleanBody = after.trim();
  } else {
    // 2. Fallback: If no standalone JUDGMENT heading, check if preamble ends with Respondent line
    const respPattern = /(?:[\.\s]Respondent(?:\(s\)|s)?\.?[\s\S]*?)(?:<\/p>|<\/div>|\r?\n)\s*(?=(?:<p[^>]*>|<div[^>]*>|\r?\n)?\s*(?:\d+[\.\)]\s+|Leave\s+granted|[A-Z][a-z]+))/i;
    const respMatch = cleanBody.match(respPattern);
    if (respMatch) {
      cleanBody = cleanBody.substring(respMatch.index + respMatch[0].length).trim();
    } else {
      // 3. Fallback: Check if HEAD NOTE was embedded in body without a JUDGMENT tag
      const headnoteInBody = cleanBody.match(/(?:<p[^>]*>|<div[^>]*>|\r?\n|^)\s*(?:<b>|<strong>)?\s*(?:HEAD\s*NOTE|EDITORIAL\s+HEADNOTE)\s*(?:<\/b>|<\/strong>)?/i);
      if (headnoteInBody) {
        const afterHn = cleanBody.substring(headnoteInBody.index);
        const paraAfterHn = afterHn.match(/(?:<\/p>|<\/div>|\r?\n)\s*(?=(?:<p[^>]*>|<div[^>]*>|\r?\n)?\s*(?:\d+[\.\)]\s+|Leave\s+granted))/i);
        if (paraAfterHn) {
          cleanBody = afterHn.substring(paraAfterHn.index + paraAfterHn[0].length).trim();
        }
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

  // Helper: Render Table with vector borders, styled headers, and clean page breaking
  const renderVectorTable = (tableHtml) => {
    const rows = parseHtmlTable(tableHtml);
    if (!rows || rows.length === 0) return;

    checkNewPage(0.5);

    const maxCols = Math.max(...rows.map(r => r.cells.length));
    if (maxCols === 0) return;

    const colWidth = contentWidth / maxCols;
    const cellPadding = 0.08;
    const cellTextWidth = colWidth - (cellPadding * 2);

    for (const row of rows) {
      doc.setFont("times", row.isHeader ? "bold" : "normal");
      doc.setFontSize(row.isHeader ? 9.5 : 9);

      let maxCellLines = 1;
      const rowCellData = row.cells.map(cell => {
        const lines = doc.splitTextToSize(cell.text, cellTextWidth);
        if (lines.length > maxCellLines) maxCellLines = lines.length;
        return { text: cell.text, lines, isHeader: cell.isHeader };
      });

      const rowHeight = (maxCellLines * 0.17) + (cellPadding * 2);
      checkNewPage(rowHeight + 0.05);

      for (let cIdx = 0; cIdx < maxCols; cIdx++) {
        const cell = rowCellData[cIdx] || { text: '', lines: [], isHeader: false };
        const cellX = margin + (cIdx * colWidth);

        if (row.isHeader || cell.isHeader) {
          doc.setFillColor(241, 245, 249);
          doc.rect(cellX, yPos, colWidth, rowHeight, 'FD');
        } else {
          doc.setFillColor(255, 255, 255);
          doc.rect(cellX, yPos, colWidth, rowHeight, 'S');
        }

        doc.setDrawColor(148, 163, 184);
        doc.setLineWidth(0.008);
        doc.rect(cellX, yPos, colWidth, rowHeight, 'S');

        doc.setFont("times", (row.isHeader || cell.isHeader) ? "bold" : "normal");
        doc.setFontSize((row.isHeader || cell.isHeader) ? 9.5 : 9);
        doc.setTextColor(15, 23, 42);

        let textY = yPos + cellPadding + 0.12;
        for (let l = 0; l < cell.lines.length; l++) {
          const lText = cell.lines[l];
          const isLast = l === cell.lines.length - 1;
          if (!isLast && lText.indexOf(' ') > 0 && !row.isHeader) {
            doc.text(lText.trim(), cellX + cellPadding, textY, { align: 'justify', maxWidth: cellTextWidth });
          } else {
            doc.text(lText.trim(), cellX + cellPadding, textY);
          }
          textY += 0.17;
        }
      }

      yPos += rowHeight;
    }

    yPos += 0.25;
  };

  // Helper: Render paragraphs with Times New Roman and 100% mathematical text justification
  const renderTextParagraphs = (rawHtmlChunk) => {
    if (!rawHtmlChunk || !rawHtmlChunk.trim()) return;

    const cleanText = sanitizeText(rawHtmlChunk);
    if (!cleanText || !cleanText.trim()) return;

    const paragraphs = cleanText.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    const lineSpacing = 0.24;

    for (const para of paragraphs) {
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);

      const lines = doc.splitTextToSize(para, contentWidth);
      if (!lines || lines.length === 0) continue;

      let lineIdx = 0;
      while (lineIdx < lines.length) {
        // How many lines can fit on current page?
        const availableLines = Math.floor((maxY - yPos) / lineSpacing);
        if (availableLines <= 0) {
          checkNewPage(lineSpacing + 0.05);
          continue;
        }

        const linesRemaining = lines.length - lineIdx;
        const countToTake = Math.min(availableLines, linesRemaining);
        const chunk = lines.slice(lineIdx, lineIdx + countToTake);
        const isEndOfParagraph = (lineIdx + countToTake === lines.length);

        doc.setFont("times", "normal");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);

        if (isEndOfParagraph) {
          // Normal paragraph end: jsPDF justifies all lines except the last one
          doc.text(chunk, margin, yPos, { align: 'justify', maxWidth: contentWidth });
        } else {
          // Mid-paragraph page break: passing dummy '' at end ensures all lines in chunk are justified
          doc.text([...chunk, ''], margin, yPos, { align: 'justify', maxWidth: contentWidth });
        }

        yPos += countToTake * lineSpacing;
        lineIdx += countToTake;

        if (lineIdx < lines.length) {
          checkNewPage(lineSpacing + 0.05);
        }
      }

      yPos += 0.16; // paragraph spacing
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

    // 3. Footer on Every Page
    const footerY = pageHeight - 0.72;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);

    let leftY = footerY + 0.14;
    doc.text("Generated by Digital Law Reporter", margin, leftY);

    leftY += 0.12;
    doc.text(timestampText, margin, leftY);

    leftY += 0.12;
    doc.setFont("helvetica", "bold");
    doc.text(`Page ${i} of ${totalPages}`, margin, leftY);

    if (qrDataUrl) {
      const qrSize = 0.48;
      const qrX = pageWidth - margin - qrSize;
      const qrY = footerY + 0.04;
      doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    }
  }

  return doc;
};

/**
 * Download Action: Generates PDF model and triggers direct .pdf download file save
 */
export const downloadCaseAsPDF = async (caseItem, elementId = 'printable-judgment-document', showToast = () => {}) => {
  if (!caseItem) return;

  const caseId = caseItem.id || caseItem._id || 'record';
  const downloadFileName = `Digital_Law_Reporter_Case_${caseId}_${Date.now()}.pdf`;
  showToast(`Generating DLR Official Legal PDF...`);

  // Direct PDF file path check
  if (caseItem.pdf_file_path) {
    const pdfUrl = `${import.meta.env.VITE_BASE_URL || ''}${caseItem.pdf_file_path}`;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.target = '_blank';
    link.download = downloadFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloading official PDF judgment file...`);
    return;
  }

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
        margin:       [0.5, 0.5, 0.85, 0.5],
        filename:     downloadFileName,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false, scrollY: 0 },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
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
 * Print Action: Uses the EXACT SAME PDF Document Model, sets autoPrint, and opens print preview blob
 */
export const printCaseAsPDF = async (caseItem, elementId = 'printable-judgment-document', showToast = () => {}) => {
  if (!caseItem) return;

  showToast("Preparing document for printing...");

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
