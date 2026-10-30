import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

/**
 * Strips duplicate court headers, titles, and parties preamble from judgment body
 * so the body starts cleanly from the judicial opinion or first numbered paragraph.
 */
export const stripPreambleFromJudgmentText = (content) => {
  if (!content) return '';
  let str = String(content).trim();

  // Strip watermarks and footers first
  str = str.replace(/<div[^>]*class="[^"]*dlr-page-running-footer[^"]*"[^>]*>[\s\S]*?<\/div>/gi, ' ')
           .replace(/<[^>]*class="[^"]*page-footer[^"]*"[^>]*>[\s\S]*?<\/div>/gi, ' ')
           .replace(/\bDIGITAL\s+LAW\s+REPORTER\b/gi, ' ')
           .replace(/Generated\s+by\s+Digital\s+Law\s+Reporter[^\n<]*/gi, ' ')
           .replace(/Generated\s+by[^\n<]*/gi, ' ')
           .replace(/Date:\s*\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}[^\n<]*/gi, ' ')
           .replace(/Page\s*\d+\s*(?:of|\/)\s*\d+/gi, ' ')
           .replace(/\b\d+\s+Hereinafter\s+['"][^'"]*['"]\.?/gi, ' ');

  // Pattern A: Match standalone J U D G M E N T or ORDER
  const standaloneHeading = /(?:^|>|\n)\s*(?:<[^>]*>)?\s*(?<!Date\s+of\s+)(?:J\s*U\s*D\s*G\s*M\s*E\s*N\s*T|O\s*R\s*D\s*E\s*R)\s*(?:<\/[^>]*>)?\s*(?:<|\n|$)/i;
  const matchJ = str.match(standaloneHeading);
  if (matchJ && matchJ.index !== undefined) {
    let after = str.substring(matchJ.index + matchJ[0].length).trim();
    // Strip judge signature line e.g. "SANJAY KAROL, J."
    after = after.replace(/^(?:<[^>]*>|\n|\s|\/div>)*?[A-Z\.\s]{3,50},\s*(?:C\.?J\.?|J\.?)(?:<\/[^>]*>)?(?:\s*<\/[^>]*>|\n|\s)*/i, '').trim();
    return after;
  }

  // Pattern B: Match up to first numbered paragraph (1., [1], etc.) if court preamble is present
  const firstParaRegex = /(?:<p[^>]*>|\n\s*\n|^)\s*(?:<b>|<strong>)?\s*(?:1[\.\)]|\[1\]|\(1\))\s+[A-Z]/i;
  const matchP = str.match(firstParaRegex);
  if (matchP && matchP.index > 30) {
    const preamble = str.substring(0, matchP.index);
    if (/COURT|VERSUS|APPELLANT|RESPONDENT|JURISDICTION|CITATION|HEADNOTE/i.test(preamble)) {
      return str.substring(matchP.index).trim();
    }
  }

  return str;
};

/**
 * Server-Side Standardized Legal PDF Generation Engine
 * Produces pixel-accurate vector legal documents strictly matching the master reference template.
 *
 * @param {Object} caseItem - Full legal case metadata and content
 * @param {Object} options - Custom options (e.g. appBaseUrl, qrUrlOverride)
 * @returns {Promise<Buffer>} - Standardized PDF Buffer
 */
export async function generateStandardizedLegalPdf(caseItem = {}, options = {}) {
  // Initialize jsPDF (A4 Portrait, inches)
  const doc = new jsPDF({
    unit: 'in',
    format: 'a4',
    orientation: 'portrait'
  });

  const pageWidth = 8.27;   // 210 mm (A4)
  const pageHeight = 11.69; // 297 mm
  const margin = 0.70;      // 0.70 in side margins (balanced aesthetic matching reference)
  const contentWidth = pageWidth - (margin * 2); // 6.87 in
  const maxY = pageHeight - 1.05; // max Y before footer

  // Extract All Citations
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
    const yr = c.year || caseItem.year || new Date().getFullYear();
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
    : (caseItem.citation || `${caseItem.year || new Date().getFullYear()} DLR (${caseItem.court || 'SC'}) #1`);

  const court = (caseItem.court_name || caseItem.court || 'SUPREME COURT OF INDIA').toUpperCase();
  const rawTitle = caseItem.title || 'Untitled Case';

  let petitioner = (caseItem.petitioner_name || caseItem.petitioner || '')
    .replace(/[\/\s\.\-]+$/, '')
    .replace(/(?:\.{2,}|\u2026+|\u22EF+|\s*[-–—]\s*)\s*APPELLANT.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  let respondent = (caseItem.respondent_name || caseItem.respondent || '')
    .replace(/[\/\s\.\-]+$/, '')
    .replace(/(?:\.{2,}|\u2026+|\u22EF+|\s*[-–—]\s*)\s*RESPONDENT.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!petitioner && !respondent && rawTitle) {
    const splitMatch = rawTitle.split(/\s*(?:v\.?|vs\.?|VERSUS|V\/S)\s*/i);
    if (splitMatch.length === 2) {
      petitioner = splitMatch[0].replace(/[\/\s\.\-]+$/, '').trim();
      respondent = splitMatch[1].replace(/[\/\s\.\-]+$/, '').trim();
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

  // Master typography is Times New Roman / Serif as in reference template
  const primaryFont = 'times';

  let yPos = 0.80;

  // Background Watermark: Strictly drawn FIRST on every page
  const drawWatermark = () => {
    try {
      doc.saveGraphicsState();
      let hasOpacity = false;
      if (typeof doc.GState === 'function') {
        try {
          const gState = new doc.GState({ opacity: 0.045 });
          doc.setGState(gState);
          doc.setTextColor(0, 0, 0);
          hasOpacity = true;
        } catch (err) { }
      }
      if (!hasOpacity) {
        doc.setTextColor(242, 242, 242);
      }
      const watermarkText = "DIGITAL LAW REPORTER";
      const fontSize = 36;
      doc.setFont(primaryFont, "bold");
      doc.setFontSize(fontSize);

      const textWidth = doc.getTextWidth(watermarkText);
      const angle = 45;
      const rad = (angle * Math.PI) / 180;
      const halfLen = textWidth / 2;
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

  // Pixel-perfect uniform word-spacing justification helper
  const renderJustifiedLine = (text, x, y, targetWidth, isLastLine = false) => {
    const clean = String(text || '').trim();
    if (!clean) return;

    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length === 0) return;

    if (isLastLine || words.length === 1) {
      doc.text(clean, x, y);
      return;
    }

    const naturalWidth = doc.getTextWidth(clean);
    // Left align if line has few words or is shorter than 65% of target width
    if (naturalWidth < (targetWidth * 0.65)) {
      doc.text(clean, x, y);
      return;
    }

    const wordsWidth = words.reduce((acc, w) => acc + doc.getTextWidth(w), 0);
    const totalSpaceNeeded = targetWidth - wordsWidth;
    const spacePerWord = totalSpaceNeeded / (words.length - 1);

    let curX = x;
    for (let i = 0; i < words.length; i++) {
      doc.text(words[i], curX, y);
      curX += doc.getTextWidth(words[i]) + spacePerWord;
    }
  };

  // Sanitizer Helper
  const sanitizeText = (str) => {
    if (!str) return '';
    let text = String(str);

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

    // Normalize Unicode to standard typography
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
  // ==========================================
  drawWatermark();

  // STEP 1: CITATION (SLEEK BORDERED BOX)
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

  // Draw Citation Box
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

  // STEP 2: HEADNOTE (BORDERED BOX)
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

      // Title: Only HEADNOTE with crisp physical horizontal lines on left and right
      const hnText = isFirstChunk ? "HEADNOTE" : "HEADNOTE (CONTD.)";
      doc.setFont(primaryFont, "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      const titleY = yPos + 0.22;
      const centerX = pageWidth / 2;
      doc.text(hnText, centerX, titleY, { align: 'center' });

      // Physical horizontal line left and right of HEADNOTE
      const titleWidth = doc.getTextWidth(hnText);
      const lineLen = 0.45;
      const gap = 0.10;
      doc.setLineWidth(0.010);
      doc.setDrawColor(15, 23, 42);
      doc.line(centerX - (titleWidth / 2) - gap - lineLen, titleY - 0.035, centerX - (titleWidth / 2) - gap, titleY - 0.035);
      doc.line(centerX + (titleWidth / 2) + gap, titleY - 0.035, centerX + (titleWidth / 2) + gap + lineLen, titleY - 0.035);

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
      yPos += boxHeight + 0.48;
      isFirstChunk = false;

      if (lineCursor < allHnLines.length) {
        doc.addPage();
        drawWatermark();
        yPos = 0.75;
        drawHeaderOnSubsequentPage();
      }
    }
  }

  // STEP 3: COURT NAME, PARTIES (VERSUS), CASE NO, ACT & BENCH
  checkNewPage(0.85);

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

  // Centered Court Header
  doc.setFont(primaryFont, "bold");
  doc.setFontSize(12.5);
  doc.setTextColor(15, 23, 42);
  doc.text(court, pageWidth / 2, yPos, { align: 'center' });
  yPos += 0.24;

  if (jurisdiction) {
    doc.setFont(primaryFont, "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(jurisdiction.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
    yPos += 0.28;
  }

  // Parties Layout: Petitioner ... Appellant(s) / Petitioner(s)
  if (petitioner || respondent) {
    const renderPartyBlock = (partyText, roleSuffix) => {
      doc.setFont(primaryFont, "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      const roleWidth = doc.getTextWidth(roleSuffix);

      doc.setFont(primaryFont, "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);

      const availableForName = contentWidth - roleWidth - 0.15;
      const nameLines = doc.splitTextToSize(partyText || '—', availableForName);

      for (let i = 0; i < nameLines.length; i++) {
        checkNewPage(0.24);
        doc.setFont(primaryFont, "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42);
        doc.text(nameLines[i].trim(), margin, yPos);

        if (i === 0) {
          doc.setFont(primaryFont, "normal");
          doc.setFontSize(9.5);
          doc.setTextColor(71, 85, 105);
          doc.text(roleSuffix, pageWidth - margin, yPos, { align: 'right' });
        }
        yPos += 0.22;
      }
    };

    renderPartyBlock(petitioner, "......... Appellant(s) / Petitioner(s)");

    checkNewPage(0.35);
    yPos += 0.08;
    doc.setFont(primaryFont, "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text("VERSUS", pageWidth / 2, yPos, { align: 'center' });
    yPos += 0.28;

    renderPartyBlock(respondent, "......... Respondent(s)");
    yPos += 0.14;
  }

  // Metadata block
  checkNewPage(0.70);
  renderMetadataItem("Case Number", caseNumber);
  if (act || section) {
    const actSec = `${act}${act && section ? ' — ' : ''}${section}`;
    renderMetadataItem("Act(s)", actSec);
  }
  if (formattedDate) {
    renderMetadataItem("Date of Judgment", formattedDate);
  }
  if (bench) {
    renderMetadataItem("Bench / Coram", bench);
  }

  yPos += 0.28;

  // ==========================================
  // JUDGMENT BODY & NUMBERED PARAGRAPHS
  // ==========================================
  const rawBody = stripPreambleFromJudgmentText(fullContent);
  const cleanBody = sanitizeText(rawBody || fullContent);

  // Check if original preambles exist to include authentic Reportable heading
  const topCitsMatch = fullContent.match(/(\d{4}\s+INSC\s+\d+)/i);
  const inscNumber = topCitsMatch ? topCitsMatch[1] : '';

  if (inscNumber) {
    checkNewPage(0.50);
    doc.setFont(primaryFont, "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`${inscNumber} REPORTABLE`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 0.26;
  }

  // Centered Judgment Heading
  checkNewPage(0.40);
  doc.setFont(primaryFont, "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("J U D G M E N T", pageWidth / 2, yPos, { align: 'center' });
  yPos += 0.26;

  if (authorJudge) {
    checkNewPage(0.30);
    doc.setFont(primaryFont, "bold");
    doc.setFontSize(10.5);
    doc.text(`${authorJudge.toUpperCase()}, J.`, margin, yPos);
    yPos += 0.24;
  }

  // Parse paragraphs and tables
  // Un-break mid-sentence newlines to form continuous, uninterrupted paragraphs
  const rawLines = cleanBody.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const paragraphs = [];
  let curPara = '';

  for (const line of rawLines) {
    // Drop stray standalone headings or footers
    if (/^(?:>|J\s*U\s*D\s*G\s*M\s*E\s*N\s*T|O\s*R\s*D\s*E\s*R|[A-Z\.\s]{3,50},\s*J\.?$)/i.test(line)) continue;
    if (/Generated\s+by/i.test(line)) continue;
    if (/^Date:\s*\d{1,2}/i.test(line)) continue;
    if (/^Page\s*\d+\s*(?:of|\/)/i.test(line)) continue;
    if (/^\d+\s+Hereinafter/i.test(line)) continue;

    const isNumbered = /^(\d+[\.\)]|\[\d+\]|\(\d+\))\s+/.test(line);
    if (isNumbered) {
      if (curPara) paragraphs.push(curPara.trim());
      curPara = line;
    } else {
      if (curPara) {
        if (curPara.endsWith('-')) {
          curPara = curPara.slice(0, -1) + line;
        } else {
          curPara += ' ' + line;
        }
      } else {
        curPara = line;
      }
    }
  }
  if (curPara) paragraphs.push(curPara.trim());

  const paraLineHeight = 0.22;
  const paraBottomGap = 0.18;

  doc.setFont(primaryFont, "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);

  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const para = paragraphs[pIdx];

    // Check if paragraph is a table representation (e.g. Section 167 vs Section 187)
    if (para.includes('\t') || (para.includes('|') && para.split('\n').length > 1)) {
      const rows = para.split('\n').map(r => r.split(/[|\t]/).map(c => c.trim()).filter(Boolean)).filter(r => r.length > 1);
      if (rows.length > 0) {
        checkNewPage(0.60);
        const colCount = rows[0].length;
        const colWidth = contentWidth / colCount;

        for (let rIdx = 0; rIdx < rows.length; rIdx++) {
          const row = rows[rIdx];
          const isHeader = rIdx === 0;
          doc.setFont(primaryFont, isHeader ? "bold" : "normal");
          doc.setFontSize(9.5);

          let maxCellLines = 1;
          const cellLinesArr = [];
          for (let cIdx = 0; cIdx < colCount; cIdx++) {
            const cellText = row[cIdx] || '';
            const cLines = doc.splitTextToSize(cellText, colWidth - 0.12);
            cellLinesArr.push(cLines);
            if (cLines.length > maxCellLines) maxCellLines = cLines.length;
          }

          const rowHeight = (maxCellLines * 0.18) + 0.10;
          checkNewPage(rowHeight);

          // Draw table row border
          doc.setDrawColor(203, 213, 225);
          doc.setLineWidth(0.006);
          doc.rect(margin, yPos, contentWidth, rowHeight, 'S');

          for (let cIdx = 0; cIdx < colCount; cIdx++) {
            const cellX = margin + (cIdx * colWidth) + 0.06;
            const cLines = cellLinesArr[cIdx];
            for (let l = 0; l < cLines.length; l++) {
              doc.text(cLines[l], cellX, yPos + 0.14 + (l * 0.18));
            }
          }
          yPos += rowHeight;
        }
        yPos += 0.16;
        continue;
      }
    }

    // Numbered Paragraph Detection: "1.", "2.", "3.", "[1]", "(1)"
    const numMatch = para.match(/^(\d+[\.\)]|\[\d+\]|\(\d+\))\s*(.*)/s);
    let paraNum = '';
    let paraText = para;

    if (numMatch) {
      paraNum = numMatch[1];
      paraText = numMatch[2] || '';
    }

    if (paraNum) {
      // Split paragraph text to size
      const pLines = doc.splitTextToSize(paraText, contentWidth - 0.35);

      checkNewPage(paraLineHeight * 2);

      // Render paragraph number (Bold)
      doc.setFont(primaryFont, "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text(paraNum, margin, yPos);

      // Render paragraph lines (Normal Justified)
      doc.setFont(primaryFont, "normal");
      doc.setFontSize(10.5);

      for (let lIdx = 0; lIdx < pLines.length; lIdx++) {
        checkNewPage(paraLineHeight);
        const line = pLines[lIdx].trim();
        const isLastLine = (lIdx === pLines.length - 1);
        const lineX = margin + 0.35;
        const lineW = contentWidth - 0.35;

        renderJustifiedLine(line, lineX, yPos, lineW, isLastLine);
        yPos += paraLineHeight;
      }
      yPos += paraBottomGap;

    } else {
      // Standard unnumbered paragraph
      const pLines = doc.splitTextToSize(paraText, contentWidth);
      checkNewPage(paraLineHeight * 2);

      for (let lIdx = 0; lIdx < pLines.length; lIdx++) {
        checkNewPage(paraLineHeight);
        const line = pLines[lIdx].trim();
        const isLastLine = (lIdx === pLines.length - 1);
        renderJustifiedLine(line, margin, yPos, contentWidth, isLastLine);
        yPos += paraLineHeight;
      }
      yPos += paraBottomGap;
    }
  }

  // ==========================================
  // FOOTER & QR CODE ON EVERY PAGE
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  const caseId = caseItem.id || caseItem.case_id || 'verification';
  const qrBaseUrl = options.qrUrlOverride || (options.appBaseUrl ? `${options.appBaseUrl}/judgment?id=${caseId}` : `https://law.gradixtech.com/judgment?id=${caseId}`);

  // Generate QR Code data URL
  let qrDataUrl = null;
  try {
    qrDataUrl = await QRCode.toDataURL(qrBaseUrl, {
      margin: 1,
      width: 140,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
  } catch (qrErr) {
    console.warn("QR code generation warning:", qrErr.message);
  }

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer divider line
    const footerLineY = pageHeight - 0.85;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.006);
    doc.line(margin, footerLineY, pageWidth - margin, footerLineY);

    // Footer metadata (Left side)
    doc.setFont(primaryFont, "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text("Generated by Digital Law Reporter", margin, pageHeight - 0.65);
    doc.text(`Date: ${formattedDate || new Date().toLocaleDateString('en-GB')}`, margin, pageHeight - 0.50);

    // Center Page X of Y
    doc.setFont(primaryFont, "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 0.55, { align: 'center' });

    // Right side QR code
    if (qrDataUrl) {
      try {
        const qrSize = 0.55; // 0.55 in square
        const qrX = pageWidth - margin - qrSize;
        const qrY = pageHeight - 0.82;
        doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
      } catch (e) {
        console.warn("Embed QR error on page", i, e);
      }
    }
  }

  // Return standard Node Buffer
  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
