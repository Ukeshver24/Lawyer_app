import { jsPDF } from 'jspdf';
import html2pdf from 'html2pdf.js';
import QRCode from 'qrcode';
import { API_BASE_URL } from '../config/api.js';

export const getOriginalPdfUrl = (caseItem) => {
  const pdfPath = caseItem?.pdf_file_path || caseItem?.pdf_file;

  if (!pdfPath) return '';
  const timestamp = Date.now();
  if (/^https?:\/\//i.test(pdfPath)) {
    const sep = pdfPath.includes('?') ? '&' : '?';
    return `${pdfPath}${sep}t=${timestamp}`;
  }

  // Derive target origin from API_BASE_URL (points to port 5000 on localhost, or live server on prod)
  const defaultOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000';
  const backendBase = (import.meta.env.VITE_API_BASE_URL || API_BASE_URL || defaultOrigin)
    .replace(/\/api\/?$/, '')
    .replace(/\/$/, '');
  const normalizedPath = String(pdfPath).replace(/^\/+/, '');

  return `${backendBase}/${normalizedPath}?t=${timestamp}`;
};

/**
 * Strips duplicate court headers, titles, and parties preamble from judgment body
 * so the body starts cleanly from the judicial opinion or first numbered paragraph.
 */
export const stripPreambleFromJudgmentText = (content) => {
  if (!content) return '';
  let str = String(content).trim();

  // Pattern A: Match explicit JUDGMENT / ORDER title in preamble
  const judgmentHeadingRegex = /(?:<p[^>]*>|<div[^>]*>|\n\s*\n|^)\s*(?:<b>|<strong>)?\s*(?:J\s*U\s*D\s*G\s*M\s*E\s*N\s*T|O\s*R\s*D\s*E\s*R)\s*(?:<\/b>|<\/strong>)?\s*(?:<\/p>|<\/div>|\n|$)/i;
  const matchJ = str.match(judgmentHeadingRegex);
  if (matchJ && matchJ.index < 4000) {
    let after = str.substring(matchJ.index + matchJ[0].length).trim();
    // Also strip judge signature line immediately after JUDGMENT if present
    const judgeRegex = /^(?:<p[^>]*>|<div[^>]*>|\n\s*\n)?\s*(?:<b>|<strong>|<u>)?\s*[A-Z\.\s]{3,50},\s*J\.?\s*(?:<\/u>|<\/b>|<\/strong>)?\s*(?:<\/p>|<\/div>|\n|$)/i;
    const matchJudge = after.match(judgeRegex);
    if (matchJudge) {
      after = after.substring(matchJudge[0].length).trim();
    }
    return after;
  }

  // Pattern B: Match up to first numbered paragraph (1., [1], etc.) if court preamble is present
  const firstParaRegex = /(?:<p[^>]*>|\n\s*\n|^)\s*(?:<b>|<strong>)?\s*(?:1[\.\)]|\[1\]|\(1\))\s*/i;
  const matchP = str.match(firstParaRegex);
  if (matchP && matchP.index > 30 && matchP.index < 4000) {
    const preamble = str.substring(0, matchP.index);
    if (/IN\s+THE\s+SUPREME\s+COURT|IN\s+THE\s+HIGH\s+COURT|VERSUS|APPELLATE|APPELLANT|RESPONDENT/i.test(preamble)) {
      return str.substring(matchP.index).trim();
    }
  }

  return str;
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
  const maxY = pageHeight - 1.05; // max Y before footer (ensures safe breathing space above footer)

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
    if (typeof c === 'string') {
      return c.replace(/#/g, ' • ').trim();
    }
    const yr = c.year || caseItem.year || '2026';
    const mo = c.month ? `(${String(c.month).padStart(2, '0')}) ` : '';
    const crt = c.court ? `(${c.court}) ` : '(SC) ';
    let num = (c.number || '').trim();
    if (num) {
      if (/^\d+$/.test(num)) {
        num = `#${num}`;
      } else {
        num = `• ${num.replace(/^#+/, '').trim()}`;
      }
    }
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

  // Dynamic Typography: Professional Times New Roman vs. Original Uploaded PDF font
  const useProfessionalFont = Boolean(caseItem.use_professional_font);
  const rawFontFamily = String(caseItem.font_family || caseItem.fontFamily || '').toLowerCase().trim();
  let primaryFont = 'helvetica';
  if (useProfessionalFont) {
    primaryFont = 'times';
  } else if (rawFontFamily.includes('courier') || rawFontFamily.includes('mono')) {
    primaryFont = 'courier';
  } else if (rawFontFamily.includes('times') || rawFontFamily.includes('serif')) {
    primaryFont = 'times';
  } else {
    primaryFont = 'helvetica';
  }

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
      const watermarkText = "DIGITAL LAW REPORTER";
      const fontSize = 36;
      doc.setFont("times", "bold");
      doc.setFontSize(fontSize);

      const textWidth = doc.getTextWidth(watermarkText);
      const angle = 45;
      const rad = (angle * Math.PI) / 180;
      const halfLen = textWidth / 2;
      // Cap-height optical baseline adjustment so visual center is exactly at page center
      const halfCap = (fontSize / 72) * 0.35;

      const startX = (pageWidth / 2) - (halfLen * Math.cos(rad)) + (halfCap * Math.sin(rad));
      const startY = (pageHeight / 2) + (halfLen * Math.sin(rad)) + (halfCap * Math.cos(rad));

      doc.text(watermarkText, startX, startY, {
        angle: 45
      });
      doc.restoreGraphicsState();
    } catch (e) {
      console.warn("Watermark render error:", e);
    }
  };

  const drawHeaderOnSubsequentPage = () => {
    // Top citation removed on subsequent pages per user requirement!
    // Leaves clean top margin for full judgment reading with no repetition
    yPos = 0.75;
  };

  const checkNewPage = (requiredSpace = 0.24) => {
    if (yPos + requiredSpace > maxY) {
      doc.addPage();
      drawWatermark();
      yPos = 0.75;
      drawHeaderOnSubsequentPage();
    }
  };

  // Single-line text justification helper ensuring native PDF word spacing (Tw) is applied
  const renderJustifiedLine = (text, x, y, targetWidth, isLastLine = false) => {
    const clean = String(text || '').trim();
    if (!clean) return;

    // In legal typography, the final line of a paragraph is left-aligned.
    // Also, if the line has no space or is significantly shorter than the line width (<50%),
    // left-align to prevent unnaturally stretched words.
    const naturalWidth = doc.getTextWidth(clean);
    const canJustify = !isLastLine && clean.indexOf(' ') > 0 && naturalWidth >= (targetWidth * 0.50);

    if (canJustify) {
      // Passing [clean, ''] causes jsPDF to apply native word-spacing (Tw) to the line
      doc.text([clean, ''], x, y, { align: 'justify', maxWidth: targetWidth });
    } else {
      doc.text(clean, x, y);
    }
  };

  // Sanitizer Helper
  const sanitizeText = (str) => {
    if (!str) return '';
    let text = String(str);

    // 1. Remove running scraped headers & footers that break paragraph flow (e.g. Indian Kanoon, Page X of Y)
    text = text
      .replace(/<div[^>]*class="[^"]*dlr-page-running-footer[^"]*"[^>]*>[\s\S]*?<\/div>/gi, ' ')
      .replace(/<div[^>]*class="[^"]*page-footer[^"]*"[^>]*>[\s\S]*?<\/div>/gi, ' ')
      .replace(/Indian\s*Kanoon\s*(?:-\s*http[^\s<]*)?/gi, ' ')
      .replace(/(?:Indian\s*Kanoon)?\s*Page\s*\d+\s*(?:of\s*\d+)?/gi, ' ')
      .replace(/HCJ\s*&\s*RRR,\s*J/gi, ' ');

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
      .replace(/[\uFFFD\u200B-\u200D\uFEFF]/g, '')
      .replace(/(?:^|\s)[\?？]\s*(?=[A-Z\.\s]{3,40},\s*J\.?|\.{3,}|…|Date|New Delhi|[A-Z][a-z]+)/gi, ' ')
      .replace(/(?:^|\s)[\?？]\s*(?:$|\s)/g, ' ')
      .replace(/\s*[\?？]\s*([A-Z\.\s]{3,40},\s*J\.?)/gi, ' $1')
      .replace(/\s*[\?差异]\s*$/g, '')
      .replace(/^\s*[\?差异]\s*/g, '')
      .replace(/\s+[\?差异]\s+/g, ' ')
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
      .replace(/&ndash;/gi, '-')
      .replace(/&mdash;/gi, '-');

    // CRITICAL: Normalize ALL Unicode dashes, curly quotes, bullets, and spaces to standard ASCII
    text = text
      .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-')
      .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
      .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
      .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '-')
      .replace(/[\u2026]/g, '...')
      .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ');

    return text.trim();
  };

  // ==========================================
  // PAGE 1: PRECEDENT TITLE & HEADNOTE SHEET
  // Standard Order:
  // 1. Citation (in sleek bordered box)
  // 2. HEADNOTE (bordered box with generous breathing room below)
  // 3. Court Name, Parties (VERSUS), Case Number, Act Name & Section, Appearances
  // ==========================================

  // 0. Paint Background Watermark First!
  drawWatermark();

  // ------------------------------------------
  // STEP 1: CITATION (SLEEK BORDERED BOX)
  // ------------------------------------------
  yPos = 0.52;

  const allCitsStr = allCitations.map(c => formatCitationStr(c)).filter(Boolean).join(' ;  ');
  const displayCitationText = allCitsStr || primaryCitation;

  doc.setFont(primaryFont, "normal");
  doc.setFontSize(10);
  const citBoxPadding = 0.14;
  const citTextWidth = contentWidth - (citBoxPadding * 2);

  const citLabel = "Citation: ";
  doc.setFont(primaryFont, "bold");
  const citLabelW = doc.getTextWidth(citLabel);

  const citFullText = `${citLabel}${displayCitationText}`;
  const citLines = doc.splitTextToSize(citFullText, citTextWidth);
  const citLineHeight = 0.20;
  const citBoxHeight = (citBoxPadding * 2) + (citLines.length * citLineHeight);

  // Draw Citation Box matching Headnote
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.008);
  doc.rect(margin, yPos, contentWidth, citBoxHeight, 'S');

  // Text inside Citation Box
  let citTextY = yPos + citBoxPadding + 0.14;
  for (let i = 0; i < citLines.length; i++) {
    if (i === 0) {
      doc.setFont(primaryFont, "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(citLabel, margin + citBoxPadding, citTextY);
      doc.setFont(primaryFont, "normal");
      const rem = citLines[0].substring(citLabel.length);
      doc.text(rem, margin + citBoxPadding + citLabelW, citTextY);
    } else {
      doc.setFont(primaryFont, "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(citLines[i], margin + citBoxPadding, citTextY);
    }
    citTextY += citLineHeight;
  }
  yPos += citBoxHeight + 0.22;

  // ------------------------------------------
  // STEP 2: HEADNOTE (NEXT POSITION IN PDF)
  // ------------------------------------------
  if (headNote && headNote.trim()) {
    const cleanHeadnote = sanitizeText(headNote);
    const boxInnerPadding = 0.18;
    const textWidth = contentWidth - (boxInnerPadding * 2);
    doc.setFont(primaryFont, "normal");
    doc.setFontSize(10);

    const hParagraphs = cleanHeadnote.split(/\n\s*\n/).map(p => p.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean);
    const allHnLines = [];
    const hnLineIsLast = [];
    for (const hPara of hParagraphs) {
      const pLines = doc.splitTextToSize(hPara, textWidth);
      for (let i = 0; i < pLines.length; i++) {
        allHnLines.push(pLines[i]);
        hnLineIsLast.push(i === pLines.length - 1);
      }
    }

    const titleAreaHeight = 0.42;
    const lineSpacing = 0.22;
    const bottomPadding = 0.16;

    let lineCursor = 0;
    let isFirstChunk = true;

    while (lineCursor < allHnLines.length) {
      const spaceForText = maxY - yPos - titleAreaHeight - bottomPadding;
      const linesFit = Math.max(1, Math.floor(spaceForText / lineSpacing));
      const chunk = allHnLines.slice(lineCursor, lineCursor + linesFit);

      const boxHeight = titleAreaHeight + (chunk.length * lineSpacing) + bottomPadding;

      // Draw the bordered box
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.008);
      doc.rect(margin, yPos, contentWidth, boxHeight, 'S');

      // Title: Only HEADNOTE
      const hnTitle = isFirstChunk ? "— HEADNOTE —" : "— HEADNOTE (CONTD.) —";
      doc.setFont(primaryFont, "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      const titleY = yPos + 0.22;
      doc.text(hnTitle, pageWidth / 2, titleY, { align: 'center' });

      // Headnote text (Justified)
      doc.setFont(primaryFont, "normal");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      const textStartY = yPos + titleAreaHeight;
      for (let k = 0; k < chunk.length; k++) {
        const hLine = chunk[k].trim();
        const globalIdx = lineCursor + k;
        const isLast = hnLineIsLast[globalIdx] || (globalIdx === allHnLines.length - 1);
        renderJustifiedLine(hLine, margin + boxInnerPadding, textStartY + (k * lineSpacing), textWidth, isLast);
      }

      lineCursor += chunk.length;
      yPos += boxHeight + 0.48; // Generous 0.48 in breathing room below headnote box so nothing touches!
      isFirstChunk = false;

      if (lineCursor < allHnLines.length) {
        doc.addPage();
        drawWatermark();
        yPos = 0.75;
        drawHeaderOnSubsequentPage();
      }
    }
  }

  // ------------------------------------------
  // STEP 3: COURT NAME, PARTIES (VERSUS), CASE NO, ACT & BENCH
  // (ALWAYS RENDERED ON ALL CASES)
  // ------------------------------------------
  checkNewPage(0.85);

  // Helper to render metadata item
  const renderMetadataItem = (label, value) => {
    if (!value || !String(value).trim()) return;
    const cleanVal = String(value).trim();
    const cleanLabel = label.replace(/:\s*$/, '').trim() + ':';

    doc.setFont(primaryFont, "bold");
    doc.setFontSize(10);
    const labelWithSpace = `${cleanLabel} `;
    const labelWidth = doc.getTextWidth(labelWithSpace);

    const fullText = `${cleanLabel} ${cleanVal}`;
    doc.setFont(primaryFont, "normal");
    doc.setFontSize(10);

    const lines = doc.splitTextToSize(fullText, contentWidth);
    if (!lines || lines.length === 0) return;

    doc.setFont(primaryFont, "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(cleanLabel, margin, yPos);

    doc.setFont(primaryFont, "normal");
    let remainder = lines[0].startsWith(cleanLabel) ? lines[0].substring(cleanLabel.length).trim() : lines[0].trim();
    if (remainder) {
      doc.text(remainder, margin + labelWidth, yPos);
    }
    yPos += 0.20;

    for (let i = 1; i < lines.length; i++) {
      doc.text(lines[i].trim(), margin, yPos);
      yPos += 0.20;
    }
    yPos += 0.08;
  };

  // 1. Centered Court & Jurisdiction Header
  doc.setFont(primaryFont, "bold");
  doc.setFontSize(12.5);
  doc.setTextColor(15, 23, 42);

  const courtHeading = `IN THE ${court.toUpperCase()}`;
  const courtLines = doc.splitTextToSize(courtHeading, 5.8);
  doc.text(courtLines, pageWidth / 2, yPos, { align: 'center' });
  yPos += (courtLines.length * 0.22) + 0.08;

  if (jurisdiction) {
    doc.setFont(primaryFont, "bold");
    doc.setFontSize(10);
    doc.text(jurisdiction.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
    yPos += 0.22;
  }

  // 2. Parties Section with VERSUS
  const maxPartyWidth = 3.6;
  doc.setFont(primaryFont, "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);

  const petLabel = "......... Appellant(s) / Petitioner(s)";
  doc.setFont(primaryFont, "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text(petLabel, pageWidth - margin, yPos, { align: 'right' });

  doc.setFont(primaryFont, "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  const petLines = doc.splitTextToSize((petitioner || rawTitle || 'PETITIONER').toUpperCase(), maxPartyWidth);
  doc.text(petLines, margin, yPos);
  yPos += Math.max(petLines.length * 0.22, 0.22) + 0.20;

  // VERSUS
  doc.setFont(primaryFont, "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text("VERSUS", pageWidth / 2, yPos, { align: 'center' });
  yPos += 0.24;

  // Respondent
  const respLabel = "......... Respondent(s)";
  doc.setFont(primaryFont, "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text(respLabel, pageWidth - margin, yPos, { align: 'right' });

  doc.setFont(primaryFont, "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  const respLines = doc.splitTextToSize((respondent || 'RESPONDENT').toUpperCase(), maxPartyWidth);
  doc.text(respLines, margin, yPos);
  yPos += Math.max(respLines.length * 0.22, 0.22) + 0.28;

  // 3. Structured Metadata: Case Number, Act(s) & Section, Date, Bench
  if (caseNumber) renderMetadataItem("Case Number", caseNumber);
  const actStr = `${act || ''}${act && section ? ' — ' : ''}${section || ''}`;
  if (actStr) renderMetadataItem("Act(s)", actStr);
  if (formattedDate) renderMetadataItem("Date of Judgment", formattedDate);
  if (bench) renderMetadataItem("Bench / Coram", bench);

  // 4. Authentic Judgment Body: Preserves 100% of text, connected appeals, co-appellants & co-respondents
  const cleanBody = fullContent || '';

  yPos += 0.15;

  // Divider Line before Judgment Body
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.007);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 0.25;

  // Check if cleanBody already has its own authentic heading (e.g. "The Court made the following order:", "JUDGMENT", or "VERSUS" cause title)
  const headingPattern = /(?:<(?:div|p|h[1-6]|center)[^>]*>\s*(?:<[^>]+>\s*)*(?:J\s*U\s*D\s*G\s*M\s*E\s*N\s*T|JUDGMENT|O\s*R\s*D\s*E\s*R|ORDER|The\s+Court\s+made\s+the\s+following\s+order:?)\s*(?:<\/[^>]+>\s*)*<\/(?:div|p|h[1-6]|center)>)|(?:(?:^|\n)\s*(?:J\s*U\s*D\s*G\s*M\s*E\s*N\s*T|JUDGMENT|O\s*R\s*D\s*E\s*R|ORDER|The\s+Court\s+made\s+the\s+following\s+order:?)\s*(?:\n|$))|(?:\bVERSUS\b)/i;
  const hasExplicitHeading = headingPattern.test(cleanBody);

  if (!hasExplicitHeading) {
    doc.setFont(primaryFont, "bold");
    doc.setFontSize(12.5);
    doc.setTextColor(15, 23, 42);
    doc.text("J U D G M E N T", pageWidth / 2, yPos, { align: 'center' });
    yPos += 0.28;

    if (authorJudge) {
      doc.setFont(primaryFont, "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      const cleanAuthor = authorJudge.replace(/,?\s*J\.?$/i, '').trim();
      if (cleanAuthor) {
        doc.text(`${cleanAuthor.toUpperCase()}, J.`, margin, yPos);
        yPos += 0.26;
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

        let cellText = sanitizeText(innerContent);

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
    const cellLineH = 0.20;

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

        doc.setFont(primaryFont, (isHeaderRow || cell.isHeader) ? "bold" : "normal");
        doc.setFontSize((isHeaderRow || cell.isHeader) ? 9.5 : 9);
        doc.setTextColor(15, 23, 42);

        let textY = yPos + cellPadding + 0.12;
        for (let l = 0; l < cell.lines.length; l++) {
          const lText = cell.lines[l];
          const isLast = l === cell.lines.length - 1;
          renderJustifiedLine(lText, cellX + cellPadding, textY, cellTextWidth, isLast || isHeaderRow);
          textY += cellLineH;
        }
      }
      yPos += rowHeight;
    };

    for (const row of rows) {
      doc.setFont(primaryFont, row.isHeader ? "bold" : "normal");
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

    const rawParagraphs = cleanText.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    const lineSpacing = 0.235;

    for (const rawPara of rawParagraphs) {
      // Normalize internal single newlines to single space so sentences flow continuously into full justified lines
      const para = rawPara.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
      if (!para) continue;

      // Check if paragraph is an internal heading (e.g. short, all caps, or Roman numeral)
      const isShortHeading = para.length <= 60 && (/^(?:[I|V|X]+\.|\bORDER\b|\bCONCLUSION\b|\bDIRECTIONS\b|\bANALYSIS\b|\bISSUE\b)/i.test(para) || (para === para.toUpperCase() && !para.includes('.')));
      if (isShortHeading) {
        checkNewPage(0.35);
        doc.setFont(primaryFont, "bold");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(para, pageWidth / 2, yPos, { align: 'center' });
        yPos += lineSpacing + 0.08;
        continue;
      }

      const numMatch = para.match(/^(\d+[\.\)]|\[\d+\]|\([a-z0-9]+\)|[a-z]\))\s*/i);

      doc.setFont(primaryFont, "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);

      const lines = doc.splitTextToSize(para, contentWidth);
      if (!lines || lines.length === 0) continue;

      for (let i = 0; i < lines.length; i++) {
        if (yPos + lineSpacing > maxY) {
          doc.addPage();
          drawWatermark();
          yPos = 0.85;
          drawHeaderOnSubsequentPage();
        }

        const lineText = lines[i].trim();
        const isLastLineOfPara = (i === lines.length - 1);

        doc.setFont(primaryFont, "normal");
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42);

        // If line is first line and had number prefix (e.g. "1."), bold the number prefix!
        if (i === 0 && numMatch) {
          const numPrefix = numMatch[1];
          const fullPrefix = numMatch[0];
          doc.setFont(primaryFont, "bold");
          doc.text(numPrefix, margin, yPos);
          doc.setFont(primaryFont, "normal");

          const prefixWidth = doc.getTextWidth(fullPrefix);
          const restOfLine = lineText.substring(fullPrefix.length).trim();
          if (restOfLine) {
            const availWidth = contentWidth - prefixWidth;
            renderJustifiedLine(restOfLine, margin + prefixWidth, yPos, availWidth, isLastLineOfPara);
          }
        } else {
          renderJustifiedLine(lineText, margin, yPos, contentWidth, isLastLineOfPara);
        }

        yPos += lineSpacing;
      }

      yPos += 0.15; // paragraph spacing
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
    doc.setFont(primaryFont, "bold");
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

  // Generate Scannable QR Code for Document Footer
  const caseId = caseItem.id || caseItem._id || '1';
  const defaultOrigin = typeof window !== 'undefined' && window.location.origin 
    ? window.location.origin 
    : 'https://law.gradixtech.com';
  const canonicalUrl = `${defaultOrigin}/judgment/${caseId}?open_pdf=1`;

  let qrDataUrl = null;
  try {
    qrDataUrl = await QRCode.toDataURL(canonicalUrl, {
      margin: 0,
      width: 140,
      color: { dark: '#0F172A', light: '#FFFFFF' }
    });
  } catch (err) {
    console.error('Failed to generate QR code for PDF:', err);
  }

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // 1. Draw Authentic Legal Page Border on Every Single Page
    const bMarginX = 0.38;
    const bMarginY = 0.35;
    const bWidth = pageWidth - (bMarginX * 2);
    const bHeight = pageHeight - (bMarginY * 2);

    doc.saveGraphicsState();
    doc.setDrawColor(30, 41, 59); // Crisp deep slate/black
    doc.setLineWidth(0.008);      // Clean 0.58pt rule line
    doc.rect(bMarginX, bMarginY, bWidth, bHeight, 'S');
    doc.restoreGraphicsState();

    // 2. Clean Standard Footer on Every Page with Scannable QR (Safely Inside Border)
    const footerLineY = pageHeight - 0.85;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.006);
    doc.line(margin, footerLineY, pageWidth - margin, footerLineY);

    // Left: Generated by & Date
    doc.setFont(primaryFont, "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("Generated by Digital Law Reporter", margin, pageHeight - 0.66);
    doc.text(`Date: ${formattedDate || new Date().toLocaleDateString('en-GB')}`, margin, pageHeight - 0.52);

    // Center: Page X of Y (bold)
    doc.setFont(primaryFont, "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 0.58, { align: 'center' });

    // Right: Compact Scannable QR Code
    if (qrDataUrl) {
      doc.addImage(qrDataUrl, 'PNG', pageWidth - margin - 0.36, pageHeight - 0.80, 0.36, 0.36);
    }
  }

  return doc;
};

/**
 * Download Action: Generates PDF model and triggers direct .pdf download file save
 * Strictly enforces Universal DLR Legal Format for ALL cases across the platform.
 */
export const downloadCaseAsPDF = async (caseItem, elementId = 'printable-judgment-document', showToast = () => { }) => {
  if (!caseItem) return;

  const caseId = caseItem.id || caseItem._id || 'record';
  const downloadFileName = `Digital_Law_Reporter_Case_${caseId}_${Date.now()}.pdf`;
  showToast(`Preparing authentic DLR PDF judgment file...`);

  // Universal Vector PDF Model Builder (Constructs 100% identical authentic A4 legal PDF for EVERY case)
  try {
    const doc = await buildVectorLegalPDF(caseItem);
    doc.save(downloadFileName);
    showToast(`Official DLR PDF judgment downloaded successfully!`);
    return;
  } catch (nativeErr) {
    console.error("Vector PDF Exporter error, attempting fallback:", nativeErr);
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
 * Print Action: Cleanly triggers native print dialog on the authentic legal document
 * Never leaves a blank page or unrendered tab.
 */
export const printCaseAsPDF = async (caseItem, elementId = 'printable-judgment-document', showToast = () => { }) => {
  if (!caseItem) return;

  showToast("Opening print dialog...");

  try {
    const doc = await buildVectorLegalPDF(caseItem);
    const pdfBlob = doc.output('blob');
    const blobUrl = window.URL.createObjectURL(pdfBlob);
    const printIframe = document.createElement('iframe');
    printIframe.style.position = 'fixed';
    printIframe.style.right = '0';
    printIframe.style.bottom = '0';
    printIframe.style.width = '0';
    printIframe.style.height = '0';
    printIframe.style.border = '0';
    printIframe.src = blobUrl;
    document.body.appendChild(printIframe);
    printIframe.onload = () => {
      setTimeout(() => {
        try {
          printIframe.contentWindow.focus();
          printIframe.contentWindow.print();
        } catch (e) {
          window.print();
        }
      }, 300);
    };
    return;
  } catch (e) {
    console.warn("Vector PDF print fallback:", e);
    window.print();
  }
};
