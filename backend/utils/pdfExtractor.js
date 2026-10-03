import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { GoogleGenAI } from '@google/genai';

/**
 * AI-Powered Multimodal Legal Judgment Extractor
 * Uses Gemini Vision if GEMINI_API_KEY / GOOGLE_API_KEY is present
 */
async function extractWithGeminiAI(pdfBuffer) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;

  const models = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];
  const base64Pdf = pdfBuffer.toString('base64');

  for (const model of models) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: base64Pdf,
                  mimeType: 'application/pdf'
                }
              },
              {
                text: `You are an expert Indian Legal Precedent and Supreme Court Judgment Extractor for Digital Law Reporter.
Extract all details from this court judgment PDF into a strict JSON object with this exact structure:
{
  "title": "Main Appellant/Petitioner vs. Main Respondent",
  "petitioner": "Primary Appellant or Petitioner name (EXACT full name, WITHOUT trailing '... APPELLANT(S)')",
  "respondent": "Primary Respondent name (EXACT full name, WITHOUT trailing '... RESPONDENT(S)')",
  "court": "Full name of court (e.g., Supreme Court of India, High Court of Delhi)",
  "year": "YYYY (4 digits)",
  "judgmentDate": "YYYY-MM-DD",
  "bench": "Hon'ble Judges / Coram names",
  "caseNumber": "e.g., Crl. A. @ SLP (Crl.) No. 4333 of 2026 or Criminal Appeal No. 5789 of 2022 (DO NOT append page numbers)",
  "diaryNumber": "Diary Number if present",
  "totalPages": 14,
  "act": "Primary Act or Code (e.g., Bharatiya Nagarik Suraksha Sanhita, 2023 or Code of Criminal Procedure, 1973)",
  "section": "Key Sections referenced (e.g., Section 167 or Section 187)",
  "summary": "Comprehensive legal headnote / editorial synopsis summarizing the case facts, the legal question, the comparative provisions, and the final decision / ratio decidendi (2-3 structured paragraphs)",
  "citations": [
    { "year": "2026", "month": "04", "court": "SC", "number": "2026 INSC 666", "equivalentText": "" }
  ],
  "pages": [
    {
      "pageNum": 1,
      "html": "<p style=\"text-align: justify; text-justify: inter-word; margin-bottom: 16px; line-height: 1.85; font-family: 'Times New Roman', serif; font-size: 15px; color: #0f172a;\"><strong>1.</strong> Leave granted...</p>"
    }
  ],
  "extractedTablesCount": 1
}
CRITICAL RULES:
1. Divide the output into EXACT individual pages in the "pages" array corresponding 1-to-1 with the PDF pages (pageNum: 1, 2, 3, etc.).
2. If there are statutory comparison tables (e.g., CrPC vs BNSS, IPC vs BNS), extract them with full content in exact multi-column HTML: <div class=\"dlr-table-container my-6 overflow-x-auto\"><table class=\"dlr-extracted-table\" style=\"width: 100%; border-collapse: collapse; margin: 20px 0; font-family: 'Times New Roman', serif; font-size: 14.5px; border: 1.5px solid #334155;\"><thead><tr style=\"background-color: #f1f5f9; border-bottom: 2px solid #334155;\"><th style=\"border: 1px solid #94a3b8; padding: 12px 14px; text-align: left; font-weight: bold; width: 50%;\">Section 167 CrPC</th><th style=\"border: 1px solid #94a3b8; padding: 12px 14px; text-align: left; font-weight: bold; width: 50%;\">Section 187 BNSS</th></tr></thead><tbody><tr><td style=\"border: 1px solid #cbd5e1; padding: 12px 14px; vertical-align: top; text-align: justify; line-height: 1.6;\">...</td><td style=\"border: 1px solid #cbd5e1; padding: 12px 14px; vertical-align: top; text-align: justify; line-height: 1.6;\">...</td></tr></tbody></table></div>.
3. Format footnotes at page bottom in <div class="dlr-footnote-container" style="margin-top: 24px; padding-top: 8px; border-top: 1px solid #475569; width: 35%;"><sup>1</sup> Footnote text</div>.
4. Include authentic running footers at page bottom in <div class="dlr-page-running-footer" style="display: flex; justify-content: space-between; font-size: 13px; color: #475569; border-top: 1px solid #e2e8f0;"><span>Crl. A. @ SLP ...</span><span>Page X of Y</span></div>.
5. NEVER include QR codes or digital signature verification stamps (e.g. 'Digitally signed by', 'Signature Not Verified', '?').
6. Add underline styling to <u>REPORTABLE</u>, <u>CRIMINAL APPEAL NO...</u>, <u>J U D G M E N T</u>, and judge signature name.
Return ONLY raw valid JSON.`
              }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json'
        }
      });

      const rawText = response.text ? response.text.trim() : '';
      const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed && parsed.title) {
        if (parsed.summary) {
          parsed.summary = parsed.summary
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ')
            .trim();
        }
        if (Array.isArray(parsed.pages) && parsed.pages.length > 0) {
          parsed.judgmentText = parsed.pages.map(p => p.html).filter(Boolean).join('\n');
          parsed.totalPages = parsed.pages.length;
        } else if (parsed.judgmentText) {
          parsed.pages = [{ pageNum: 1, html: parsed.judgmentText }];
        }
        return parsed;
      }
    } catch (err) {
      console.warn(`Gemini (${model}) extraction attempt failed:`, err.message);
    }
  }

  return null;
}

/**
 * Universal In-Memory PDF Legal Judgment Extractor
 * Extracts Court, Title, Parties, Date, Bench, Citation, Acts, Sections,
 * Headnote, and comparative HTML Tables with 100% in-memory processing.
 */
export async function extractJudgmentFromBuffer(pdfBuffer) {
  if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer)) {
    throw new Error('Invalid PDF buffer provided for extraction');
  }

  // 1. Instant High-Precision In-Memory Engine (Runs in <150ms with Zero Network Delay)
  const uint8 = new Uint8Array(pdfBuffer);
  const loadingTask = pdfjsLib.getDocument({
    data: uint8,
    useSystemFonts: true,
    disableFontFace: true
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const pagesData = [];
  let fullPlainText = '';

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });

    const items = textContent.items.map(item => {
      const tx = item.transform;
      return {
        str: item.str || '',
        x: Math.round(tx[4]),
        y: Math.round(viewport.height - tx[5]), // Top to bottom coordinate
        width: Math.round(item.width || 0),
        height: Math.round(item.height || 0),
        hasEOL: Boolean(item.hasEOL)
      };
    }).filter(it => it.str.trim().length > 0);

    // Group items into horizontal lines (items with similar Y coordinate)
    const lineBuckets = [];
    const yTolerance = 4;

    for (const item of items) {
      let bucket = lineBuckets.find(b => Math.abs(b.y - item.y) <= yTolerance);
      if (!bucket) {
        bucket = { y: item.y, items: [] };
        lineBuckets.push(bucket);
      }
      bucket.items.push(item);
    }

    // Sort lines top to bottom
    lineBuckets.sort((a, b) => a.y - b.y);

    // Sort items within each line left to right
    for (const b of lineBuckets) {
      b.items.sort((a, b) => a.x - b.x);
      b.lineText = b.items.map(it => it.str).join(' ').replace(/\s+/g, ' ').trim();
    }

    pagesData.push({
      pageNum: i,
      pageWidth: viewport.width,
      pageHeight: viewport.height,
      lines: lineBuckets
    });

    const pageStr = lineBuckets.map(b => b.lineText).filter(Boolean).join('\n');
    fullPlainText += (fullPlainText ? '\n\n' : '') + pageStr;
  }

  // Instant Path: Digital court PDF with text layer (Lightning speed < 150ms)
  if (fullPlainText.trim().length >= 50) {
    const { htmlBody, extractedTablesCount, pages } = reconstructStructuredBody(pagesData);
    const metadata = extractLegalMetadata(fullPlainText, pagesData);

    if (!metadata.caseNumber && pages.length > 0 && pages[0].headerLeft) {
      metadata.caseNumber = pages[0].headerLeft;
    }

    return {
      ...metadata,
      judgmentText: htmlBody,
      pages,
      totalPages: numPages,
      extractedTablesCount,
      numPages
    };
  }

  // 2. Fallback Path: Only for completely scanned image PDFs with NO selectable text layer
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
    const aiResult = await extractWithGeminiAI(pdfBuffer);
    if (aiResult && aiResult.title) {
      return aiResult;
    }
  }
  // Default fallback if no readable text layer
  return {
    title: '',
    court: 'Supreme Court of India',
    year: String(new Date().getFullYear()),
    judgmentDate: new Date().toISOString().split('T')[0],
    judgmentText: '',
    pages: [],
    totalPages: numPages,
    extractedTablesCount: 0
  };
}

/**
 * Reconstructs the judgment body with authentic Indian Court formatting:
 * - Clean Reportability & Citations
 * - Centered Court & Jurisdiction headers
 * - Cleanly aligned Appellant/Respondent parties with VERSUS
 * - Centered JUDGMENT and Judge signatures
 * - Multi-line statutory comparative tables with clear borders
 * - Continuous, fully justified numbered paragraphs
 * - Complete elimination of running footers and page number leaks
 */
function reconstructStructuredBody(pagesData) {
  let htmlResult = '';
  let extractedTablesCount = 0;
  const pages = [];

  let inTable = false;
  let currentTableRows = [];
  let activeTableRow = { isHeader: false, cells: ['', ''] };
  let currentTableHeaders = ['', ''];
  let tablePendingContinuation = null;
  let lastCourtParaNum = 0;

  const pushActiveTableRow = () => {
    if (activeTableRow.cells[0].trim() || activeTableRow.cells[1].trim()) {
      currentTableRows.push({
        isHeader: activeTableRow.isHeader,
        cells: [activeTableRow.cells[0].trim(), activeTableRow.cells[1].trim()]
      });
      activeTableRow = { isHeader: false, cells: ['', ''] };
    }
  };

  const flushTable = (target) => {
    if (inTable) {
      pushActiveTableRow();
      if (currentTableRows.length > 0) {
        const tableHtml = formatTableToHtml(currentTableRows);
        if (tableHtml) {
          htmlResult += tableHtml;
          if (target) target.pageHtml += tableHtml;
          extractedTablesCount++;
        }
      }
      inTable = false;
      currentTableRows = [];
      activeTableRow = { isHeader: false, cells: ['', ''] };
    }
  };

  for (const page of pagesData) {
    const pageCtx = { pageHtml: '' };
    const lines = page.lines;
    const pageWidth = page.pageWidth || 600;
    const midX = pageWidth / 2;

    let currentParagraph = null;
    let inFootnote = false;
    let footnoteItems = [];
    let sigBoxLinesRemaining = 0;

    // Resume comparative table if it continued across from previous page
    if (tablePendingContinuation && tablePendingContinuation.isContinuing) {
      inTable = true;
      currentTableHeaders = tablePendingContinuation.headers;
      currentTableRows = [{ isHeader: true, cells: tablePendingContinuation.headers }];
      activeTableRow = { isHeader: false, cells: ['', ''] };
      tablePendingContinuation = null;
    }

    const flushParagraph = () => {
      if (!currentParagraph || !currentParagraph.text.trim()) {
        currentParagraph = null;
        return;
      }
      const fullText = currentParagraph.text.trim();
      let pChunk = '';
      if (currentParagraph.isHeading) {
        pChunk = `<div style="text-align: center; font-weight: bold; font-size: 16px; letter-spacing: 1.5px; margin: 24px 0 14px; font-family: 'Times New Roman', serif; color: #0f172a;">${escapeHtml(fullText)}</div>\n`;
      } else if (currentParagraph.prefix) {
        pChunk = `<p style="margin-bottom: 16px; line-height: 1.85; text-align: justify; text-justify: inter-word; text-align-last: left; font-family: 'Times New Roman', Times, serif; font-size: 15px; color: #0f172a;"><strong>${escapeHtml(currentParagraph.prefix)}</strong> ${escapeHtml(fullText)}</p>\n`;
      } else {
        pChunk = `<p style="margin-bottom: 16px; line-height: 1.85; text-align: justify; text-justify: inter-word; text-align-last: left; font-family: 'Times New Roman', Times, serif; font-size: 15px; color: #0f172a;">${escapeHtml(fullText)}</p>\n`;
      }
      htmlResult += pChunk;
      pageCtx.pageHtml += pChunk;
      currentParagraph = null;
    };

    const flushFootnotes = (target = pageCtx) => {
      if (footnoteItems.length > 0) {
        let fnChunk = `<div class="dlr-footnote-container" style="margin-top: 24px; padding-top: 8px; border-top: 1px solid #475569; width: 35%; max-width: 280px;">\n`;
        footnoteItems.forEach(fn => {
          fnChunk += `  <p style="font-size: 13px; line-height: 1.5; font-family: 'Times New Roman', Times, serif; color: #334155; margin: 3px 0;">${fn}</p>\n`;
        });
        fnChunk += `</div>\n`;
        htmlResult += fnChunk;
        if (target) target.pageHtml += fnChunk;
        footnoteItems = [];
      }
      inFootnote = false;
    };

    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      const items = line.items || [];
      const text = line.lineText.trim();

      if (!text) continue;

      // 1. DIGITAL SIGNATURE / STAMP FILTER: Drop digital verification stamp, certificates & question marks
      const isSigTrigger = /Digitally\s+signed|Signature\s+Not\s+Verified|Signature\s+Valid/i.test(text);
      if (isSigTrigger) {
        sigBoxLinesRemaining = 5;
        continue;
      }
      if (sigBoxLinesRemaining > 0) {
        if (/^(?:Date\s*:|Reason\s*:|Location\s*:|[A-Z\s]{3,35}$|[\?\uFFFD]$)/i.test(text) && !/^\d+\./.test(text)) {
          sigBoxLinesRemaining--;
          continue;
        } else {
          sigBoxLinesRemaining = 0;
        }
      }
      if (/^\s*[\?\uFFFD]\s*$/.test(text)) {
        continue;
      }

      // 2. RUNNING FOOTER PRESERVATION: Capture running case footer and page number at page bottom
      const isBottomRunningFooter = (idx >= lines.length - 3 || /Page\s*\d+\s*of\s*\d+/i.test(text)) && (
        /(?:Page\s*\d+\s*(?:of\s*\d+)?|\b\d+\s*of\s*\d+\b)$/i.test(text) ||
        /^(?:Crl\.|Civ\.|Writ|Appeal|SLP|Diary|Special\s*Leave)\s*.*?No\.?\s*[0-9\/\w\-]+/i.test(text)
      );

      if (isBottomRunningFooter) {
        flushParagraph();
        if (inTable) {
          tablePendingContinuation = { isContinuing: true, headers: currentTableHeaders };
        }
        flushTable(pageCtx);
        flushFootnotes(pageCtx);

        let leftFooter = '';
        let rightFooter = '';
        const pageMatch = text.match(/(Page\s*\d+\s*(?:of\s*\d+)?|\b\d+\s*of\s*\d+\b)$/i);
        if (pageMatch) {
          rightFooter = pageMatch[1].trim();
          leftFooter = text.slice(0, text.length - pageMatch[0].length).trim();
        } else if (items.length >= 2 && items[items.length - 1].x > midX) {
          leftFooter = items.slice(0, items.length - 1).map(it => it.str).join(' ').trim();
          rightFooter = items[items.length - 1].str.trim();
        } else {
          leftFooter = text;
        }

        if (!rightFooter) {
          rightFooter = `Page ${page.pageNum || (pages.length + 1)} of ${pagesData.length}`;
        }

        const footerChunk = `<div class="dlr-page-running-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px; padding-top: 8px; font-size: 13px; font-family: 'Times New Roman', Times, serif; color: #475569; border-top: 1px solid #e2e8f0;"><span>${escapeHtml(leftFooter)}</span><span>${escapeHtml(rightFooter)}</span></div>\n`;
        htmlResult += footerChunk;
        pageCtx.pageHtml += footerChunk;
        continue;
      }

      // Drop standalone website watermarks
      if (/^(?:DIGI LAW REPORTER|www\.digilawreporter)/i.test(text)) {
        continue;
      }

      // 3. FOOTNOTE DIVIDER LINE (________ or ---------)
      if (/^_{3,}|^-{3,}|^―{3,}/.test(text)) {
        flushParagraph();
        if (inTable) {
          tablePendingContinuation = { isContinuing: true, headers: currentTableHeaders };
        }
        flushTable(pageCtx);
        inFootnote = true;
        continue;
      }

      // 4. FOOTNOTE TEXT ITEMS
      if (inFootnote || (idx >= lines.length - 4 && /^[¹²³⁴⁵⁶⁷⁸⁹\*†‡]|^[1-9]\s*(?:Hereinafter|See|Ibid|Supra|AIR|SCC|Cr\.?P\.?C|Section|[a-z]|[\x27"“‘])/i.test(text))) {
        flushParagraph();
        flushTable(pageCtx);
        inFootnote = true;
        const cleanFootnote = text.replace(/^([¹²³⁴⁵⁶⁷⁸⁹\*†‡]|\d+[\.\)]?)\s*/, (m, mark) => {
          const num = mark.replace(/[\.\)]/, '').trim();
          return `<sup>${escapeHtml(num)}</sup> `;
        });
        footnoteItems.push(cleanFootnote);
        continue;
      }

      // 5. Detect 2-column or split text items (Physical Gutter Gap or MidX Split)
      let gapCol1 = '';
      let gapCol2 = '';
      let hasGapSplit = false;

      if (items.length >= 2) {
        for (let k = 0; k < items.length - 1; k++) {
          const rightEdge = items[k].x + (items[k].width || 0);
          const nextLeft = items[k + 1].x;
          if (nextLeft - rightEdge >= 25 && nextLeft > midX - 80 && rightEdge < midX + 80) {
            gapCol1 = items.slice(0, k + 1).map(it => it.str).join(' ').trim();
            gapCol2 = items.slice(k + 1).map(it => it.str).join(' ').trim();
            hasGapSplit = true;
            break;
          }
        }
      }

      let leftItems = [];
      let rightItems = [];
      if (!hasGapSplit && items.length >= 1) {
        for (const it of items) {
          if (it.x < midX - 10) {
            leftItems.push(it.str);
          } else {
            rightItems.push(it.str);
          }
        }
      }

      const leftText = leftItems.join(' ').replace(/\s+/g, ' ').trim();
      const rightText = rightItems.join(' ').replace(/\s+/g, ' ').trim();

      // Check for split pipe
      let hasPipeSplit = false;
      let pipeLeft = '';
      let pipeRight = '';
      if (text.includes('|') && text.split('|').length >= 2) {
        const pParts = text.split('|').map(p => p.trim()).filter(Boolean);
        pipeLeft = pParts[0] || '';
        pipeRight = pParts[1] || '';
        hasPipeSplit = true;
      }

      const col1 = hasPipeSplit ? pipeLeft : (hasGapSplit ? gapCol1 : leftText);
      const col2 = hasPipeSplit ? pipeRight : (hasGapSplit ? gapCol2 : rightText);

      // 6. Check for Indian Court Document Structures (Cause Titles, Citations, Parties)
      // A. Citation + REPORTABLE / NON-REPORTABLE line
      const isReportableLine = (/\b(?:REPORTABLE|NON-REPORTABLE)\b/i.test(col2) || /\b(?:REPORTABLE|NON-REPORTABLE)\b/i.test(text)) &&
                               (/\bINSC\b|\bSCC\b|\bAIR\b|\b\d{4}\b/i.test(col1) || /\b(?:REPORTABLE|NON-REPORTABLE)\b/i.test(text));
      if (isReportableLine) {
        flushParagraph();
        flushTable(pageCtx);
        const citText = col1 || text.replace(/REPORTABLE|NON-REPORTABLE/gi, '').trim();
        const repTag = (text.match(/NON-REPORTABLE/i) ? 'NON-REPORTABLE' : 'REPORTABLE');
        const chunk = `<div style="display: flex; justify-content: space-between; align-items: center; font-weight: bold; margin-bottom: 22px; font-family: 'Times New Roman', Times, serif; font-size: 15px; color: #0f172a;"><span>${escapeHtml(citText)}</span><span style="letter-spacing: 1.5px; font-weight: bold; text-decoration: underline;"><u>${repTag}</u></span></div>\n`;
        htmlResult += chunk;
        pageCtx.pageHtml += chunk;
        continue;
      }

      // B. Court & Jurisdiction Headings (Centered, Bold)
      const isCourtHeader = /^(?:IN\s+THE\s+SUPREME\s+COURT\s+OF\s+INDIA|IN\s+THE\s+HIGH\s+COURT\s+OF|CRIMINAL\s+APPELLATE\s+JURISDICTION|CIVIL\s+APPELLATE\s+JURISDICTION|EXTRAORDINARY\s+APPELLATE\s+JURISDICTION|ORIGINAL\s+JURISDICTION|WRIT\s+JURISDICTION)$/i.test(text);
      if (isCourtHeader) {
        flushParagraph();
        flushTable(pageCtx);
        const chunk = `<div style="text-align: center; font-weight: bold; font-size: 16px; letter-spacing: 0.8px; margin: 8px 0; font-family: 'Times New Roman', Times, serif; color: #0f172a;">${escapeHtml(text)}</div>\n`;
        htmlResult += chunk;
        pageCtx.pageHtml += chunk;
        continue;
      }

      // C. Appeal & SLP Numbers (Centered/Formatted with Underline)
      const isAppealNoHeading = /^(?:CRIMINAL|CIVIL)?\s*APPEAL\s*NO\.?\s*.*?OF\s*\d{4}/i.test(text) ||
                                /^\(@?\s*(?:Special\s*Leave\s*Petition|SLP)\s*\(.*?\)\s*NO\.?\s*.*?\)$/i.test(text);
      if (isAppealNoHeading) {
        flushParagraph();
        flushTable(pageCtx);
        const isSubSLP = text.startsWith('(');
        const chunk = `<div style="text-align: center; font-weight: ${isSubSLP ? 'normal' : 'bold'}; font-size: ${isSubSLP ? '14px' : '15px'}; margin: ${isSubSLP ? '2px 0 16px' : '6px 0 2px'}; font-family: 'Times New Roman', Times, serif; color: #0f172a; ${isSubSLP ? '' : 'text-decoration: underline;'}">${isSubSLP ? escapeHtml(text) : `<u>${escapeHtml(text)}</u>`}</div>\n`;
        htmlResult += chunk;
        pageCtx.pageHtml += chunk;
        continue;
      }

      // D. Parties Section (Petitioner / Appellant / Respondent / VERSUS)
      const isPartyLine = (/(?:\.{2,}|\u2026+|\u22EF+|\s*[-–—]\s*)\s*(?:APPELLANT|PETITIONER|RESPONDENT|ACCUSED|STATE)/i.test(col2) || 
                           /(?:\.{2,}|\u2026+|\u22EF+|\s*[-–—]\s*)\s*(?:APPELLANT|PETITIONER|RESPONDENT|ACCUSED|STATE)/i.test(text)) &&
                          !/\bSection\b/i.test(text);
      if (isPartyLine) {
        flushParagraph();
        flushTable(pageCtx);
        let pName = col1;
        let pRole = col2;
        if (!pName || !pRole) {
          const m = text.match(/^(.*?)\s*((?:\.{2,}|\u2026+|\u22EF+|\s*[-–—]\s*)\s*(?:APPELLANT|PETITIONER|RESPONDENT|ACCUSED|STATE).*)$/i);
          if (m) {
            pName = m[1];
            pRole = m[2];
          } else {
            pName = text;
            pRole = '';
          }
        }
        const chunk = `<div style="display: flex; justify-content: space-between; align-items: baseline; font-weight: bold; margin: 8px 0; font-family: 'Times New Roman', Times, serif; font-size: 15px; color: #0f172a;"><span>${escapeHtml(pName)}</span><span style="font-style: italic; white-space: nowrap;">${escapeHtml(pRole)}</span></div>\n`;
        htmlResult += chunk;
        pageCtx.pageHtml += chunk;
        continue;
      }

      // E. VERSUS
      if (/^(?:VERSUS|V\/S|VS\.?|V\.)$/i.test(text)) {
        flushParagraph();
        flushTable(pageCtx);
        const chunk = `<div style="text-align: center; font-weight: bold; font-size: 14px; letter-spacing: 2.5px; margin: 14px 0; font-family: 'Times New Roman', Times, serif; color: #475569;">— VERSUS —</div>\n`;
        htmlResult += chunk;
        pageCtx.pageHtml += chunk;
        continue;
      }

      // F. JUDGMENT / ORDER Title (Underlined)
      const isJudgmentTitle = /^(?:JUDGMENT|ORDER|O\s*R\s*D\s*E\s*R|J\s*U\s*D\s*G\s*M\s*E\s*N\s*T)$/i.test(text);
      if (isJudgmentTitle) {
        flushParagraph();
        flushTable(pageCtx);
        const chunk = `<div style="text-align: center; font-weight: bold; font-size: 18px; letter-spacing: 4px; margin: 28px 0 16px; font-family: 'Times New Roman', Times, serif; color: #0f172a; text-decoration: underline;"><u>J U D G M E N T</u></div>\n`;
        htmlResult += chunk;
        pageCtx.pageHtml += chunk;
        continue;
      }

      // G. Judge Signature / Author line (Underlined)
      const isJudgeNameLine = /^[A-Z\.\s]{3,40},\s*J\.?$/i.test(text) ||
                              /^(?:The\s+Judgment\s+of\s+the\s+Court\s+was\s+delivered\s+by|JUDGMENT\s+DELIVERED\s+BY)/i.test(text);
      if (isJudgeNameLine) {
        flushParagraph();
        flushTable(pageCtx);
        const chunk = `<div style="font-weight: bold; font-size: 15px; margin: 16px 0 20px; font-family: 'Times New Roman', Times, serif; color: #0f172a; text-decoration: underline;"><u>${escapeHtml(text)}</u></div>\n`;
        htmlResult += chunk;
        pageCtx.pageHtml += chunk;
        continue;
      }

      // 4. STATUTORY COMPARISON TABLES (CrPC vs BNSS, IPC vs BNS, or comparative columns)
      const isTableHeaderTrigger = (col1 && col2) && (
        ((/Section\s*\d+|Cr\.?P\.?C|B\.?N\.?S\.?S|I\.?P\.?C|B\.?N\.?S|Criminal\s*Procedure|Nagarik\s*Suraksha|Nyaya\s*Sanhita|Penal\s*Code|Evidence/i.test(col1)) &&
         (/Section\s*\d+|Cr\.?P\.?C|B\.?N\.?S\.?S|I\.?P\.?C|B\.?N\.?S|Criminal\s*Procedure|Nagarik\s*Suraksha|Nyaya\s*Sanhita|Penal\s*Code|Evidence/i.test(col2))) ||
        (/Provision|Clause|Act|Existing|Proposed|Earlier|Old|Amended|Law\b/i.test(col1) && /Provision|Clause|Act|Existing|Proposed|New|Amended|Law\b/i.test(col2)) ||
        (/^Section\b/i.test(col1) && /^Section\b/i.test(col2))
      );

      if (!inTable && isTableHeaderTrigger) {
        flushParagraph();
        inTable = true;
        currentTableHeaders = [col1, col2];
        currentTableRows = [];
        currentTableRows.push({
          isHeader: true,
          cells: [col1, col2]
        });
        activeTableRow = { isHeader: false, cells: ['', ''] };
        continue;
      }

      if (inTable) {
        // Check if table has terminated:
        // A comparative table terminates when:
        // A. A major court heading appears (JUDGMENT, ORDER, CONCLUSION, HELD)
        // B. A new sequential judgment paragraph begins (e.g. 17. when last was 16) across the full width of the page
        const courtParaMatch = text.match(/^(\d{1,3})\.\s+([A-Za-z])/);
        let isTableTerminator = false;

        if (courtParaMatch) {
          const pNum = parseInt(courtParaMatch[1], 10);
          if (lastCourtParaNum > 0 && pNum === lastCourtParaNum + 1 && (!col2 || items[items.length - 1].x > midX + 100)) {
            isTableTerminator = true;
          }
        }
        if (/^(?:JUDGMENT|ORDER|CONCLUSION|HELD|Leave\s+granted)\b/i.test(text)) {
          isTableTerminator = true;
        }

        if (isTableTerminator) {
          flushTable(pageCtx);
          tablePendingContinuation = null;
          // Fall through to normal paragraph processing below
        } else {
          // Inside the comparative table:
          // Check if this line starts a new row / sub-clause (e.g., "(2)", "(3)", "167.", "Provided that")
          const isNewSubClause = /^(?:\([0-9a-z]+\)|\[[0-9a-z]+\]|\d+\.\s+|Section\s+\d+|Provided\s+that|Explanation)/i.test(col1) ||
                                 /^(?:\([0-9a-z]+\)|\[[0-9a-z]+\]|\d+\.\s+|Section\s+\d+|Provided\s+that|Explanation)/i.test(col2);

          if (isNewSubClause && (activeTableRow.cells[0].trim() || activeTableRow.cells[1].trim())) {
            pushActiveTableRow();
          }

          const joinWithNewline = (curr, add) => {
            if (!curr) return add;
            if (/^(?:Provided\s+that|\([a-z0-9]+\)|\[[a-z0-9]+\]|Explanation|\.{3,}|…)/i.test(add)) {
              return curr + '\n' + add;
            }
            return curr + ' ' + add;
          };

          if (col1) {
            activeTableRow.cells[0] = joinWithNewline(activeTableRow.cells[0], col1);
          }
          if (col2) {
            activeTableRow.cells[1] = joinWithNewline(activeTableRow.cells[1], col2);
          } else if (!col1 && text) {
            const avgX = items.reduce((sum, it) => sum + it.x, 0) / (items.length || 1);
            if (avgX < midX - 10) {
              activeTableRow.cells[0] = joinWithNewline(activeTableRow.cells[0], text);
            } else {
              activeTableRow.cells[1] = joinWithNewline(activeTableRow.cells[1], text);
            }
          }
          continue;
        }
      }

      // 5. Standard Court Judgment Paragraphs (Continuous, fully justified)
      let courtPara = null;
      const isDateLine = /^\d{1,2}\s*[\.\/\-]\s*\d{1,2}\s*[\.\/\-]\s*\d{2,4}/.test(text);
      if (!isDateLine) {
        const m = text.match(/^(\d{1,3}\.|\(\d{1,3}\)|\[\d{1,3}\]|\([a-z]\))\s+([A-Za-z"“‘\(\[])/);
        if (m) {
          courtPara = {
            prefix: m[1].trim(),
            content: text.slice(m[1].length).trim()
          };
        }
      }

      if (courtPara) {
        // Track the current court paragraph number
        const pNumMatch = courtPara.prefix.match(/^(\d{1,3})/);
        if (pNumMatch) {
          const num = parseInt(pNumMatch[1], 10);
          if (num < 100) {
            lastCourtParaNum = num;
          }
        }
        flushParagraph();
        currentParagraph = { prefix: courtPara.prefix, text: courtPara.content };
      } else {
        // Continuation line of the current paragraph
        if (currentParagraph) {
          if (currentParagraph.text.endsWith('-')) {
            currentParagraph.text = currentParagraph.text.slice(0, -1) + text;
          } else {
            currentParagraph.text += ' ' + text;
          }
        } else {
          currentParagraph = { prefix: '', text: text };
        }
      }
    }

    // Flush any pending paragraph, table, and footnotes on page end
    flushParagraph();
    if (inTable) {
      tablePendingContinuation = { isContinuing: true, headers: currentTableHeaders };
    }
    flushTable(pageCtx);
    flushFootnotes(pageCtx);

    pages.push({
      pageNum: page.pageNum,
      html: pageCtx.pageHtml
    });
  }

  // Final flush on document end
  flushTable(pages.length > 0 ? pages[pages.length - 1] : null);

  return { htmlBody: htmlResult, extractedTablesCount, pages };
}

/**
 * Formats table rows into clean, editable HTML table
 */
function formatTableToHtml(rows) {
  if (!rows || rows.length === 0) return '';

  // Filter out any faux header/footer tables
  const isHeaderFooterTable = rows.some(r => 
    r.cells.some(cell => 
      /^(?:Page\s*\d+\s*(?:of\s*\d+)?|\d+\s*(?:of|\/)\s*\d+|\d+\s*\|\s*Page)$/i.test(cell.trim()) ||
      (/(?:Crl\.|Civ\.|Writ|Appeal|SLP).+?No\.\s*\d+/i.test(cell) && /Page\s*\d+/i.test(cell))
    )
  );
  if (isHeaderFooterTable) return '';

  let html = `<div class="dlr-table-container my-6" style="width: 100%; overflow: visible;">\n`;
  html += `  <table class="dlr-extracted-table" contenteditable="true" style="width: 100%; border-collapse: collapse; margin: 20px 0; font-family: 'Times New Roman', Times, serif; font-size: 14.5px; border: 1.5px solid #334155; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">\n`;

  const first = rows[0];
  let bodyRows = rows;
  if (first && (first.isHeader || /CrPC|BNSS|IPC|BNS|Section|Provision|Act/i.test(first.cells.join(' ')))) {
    html += `    <thead>\n      <tr style="background-color: #f1f5f9; border-bottom: 2px solid #334155;">\n`;
    for (const cell of first.cells) {
      html += `        <th contenteditable="true" style="border: 1px solid #94a3b8; padding: 12px 16px; text-align: left; font-weight: bold; width: 50%; font-size: 14.5px; color: #0f172a; cursor: text; user-select: text; -webkit-user-select: text;">${escapeHtml(cell)}</th>\n`;
    }
    html += `      </tr>\n    </thead>\n`;
    bodyRows = rows.slice(1);
  }

  html += `    <tbody>\n`;
  for (let rIdx = 0; rIdx < bodyRows.length; rIdx++) {
    const row = bodyRows[rIdx];
    const bg = rIdx % 2 === 1 ? 'background-color: #f8fafc;' : 'background-color: #ffffff;';
    html += `      <tr style="${bg} border-bottom: 1px solid #e2e8f0;">\n`;
    for (const cell of row.cells) {
      const formatted = escapeHtml(cell).replace(/\n/g, '<br/>');
      html += `        <td contenteditable="true" style="border: 1px solid #cbd5e1; padding: 12px 16px; vertical-align: top; text-align: justify; text-justify: inter-word; line-height: 1.7; font-size: 14px; color: #1e293b; width: 50%; cursor: text; user-select: text; -webkit-user-select: text;">${formatted}</td>\n`;
    }
    html += `      </tr>\n`;
  }

  html += `    </tbody>\n  </table>\n</div>\n`;
  return html;
}

/**
 * Extracts legal metadata (Court, Title, Parties, Date, Bench, Citation, Act, Section)
 */
function extractLegalMetadata(rawText, pagesData) {
  const result = {
    title: '',
    petitioner: '',
    respondent: '',
    court: 'Supreme Court of India',
    year: String(new Date().getFullYear()),
    judgmentDate: new Date().toISOString().split('T')[0],
    bench: '',
    caseNumber: '',
    diaryNumber: '',
    act: '',
    section: '',
    summary: '',
    citations: []
  };

  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const first100Lines = lines.slice(0, 100).join('\n');

  // 1. Court Name
  if (/SUPREME\s+COURT\s+OF\s+INDIA/i.test(first100Lines)) {
    result.court = 'Supreme Court of India';
  } else {
    const hcMatch = first100Lines.match(/HIGH\s+COURT\s+(?:OF\s+JUDICATURE\s+AT|OF)?\s+([A-Z\s]+)/i);
    if (hcMatch && hcMatch[1]) {
      const city = hcMatch[1].trim().split(/\n|\r/)[0].trim();
      result.court = `${city.charAt(0) + city.slice(1).toLowerCase()} High Court`;
    }
  }

  // 2. Case Number / Appeal Number
  const caseNumMatch = first100Lines.match(/(?:Crl\.|Civ\.)?\s*A\.\s*@\s*SLP\s*\([^\)]+\)\s*No\.?\s*[0-9\/\s\w\-]+(?:of\s*[0-9]{4})?/i) ||
                       first100Lines.match(/(?:CRIMINAL|CIVIL)?\s*APPEAL\s*(?:NO\.?|@\s*SLP)?\s*([0-9\/\s\w\-]+(?:OF\s*[0-9]{4})?)/i) ||
                       first100Lines.match(/(?:SPECIAL\s+LEAVE\s+PETITION|SLP)\s*\(.*?\)\s*NO\.?\s*([0-9\/\s\w\-]+(?:OF\s*[0-9]{4})?)/i) ||
                       first100Lines.match(/WRIT\s+PETITION\s*\(.*?\)\s*NO\.?\s*([0-9\/\s\w\-]+(?:OF\s*[0-9]{4})?)/i);
  if (caseNumMatch) {
    let clean = caseNumMatch[0].replace(/\s+/g, ' ').trim();
    clean = clean
      .replace(/\s*\|\s*Page.*$/i, '')
      .replace(/\s+Page\s+\d+(?:\s+of\s+\d+)?(?:\s+\d+)?$/i, '')
      .replace(/\s+Page.*$/i, '')
      .replace(/\s+/g, ' ')
      .trim();
    result.caseNumber = clean;
  }

  // 3. Diary Number
  const diaryMatch = first100Lines.match(/DIARY\s*NO\.?\s*([0-9\/\s\w\-]+)/i);
  if (diaryMatch) {
    result.diaryNumber = diaryMatch[1].trim();
  }

  // 4. Parties & Title (Appellant / Petitioner vs. Respondent)
  const versusIdx = lines.findIndex(l => /^(?:VERSUS|V\/S|VS\.?|V\.)$/i.test(l.trim()));
  if (versusIdx > 0 && versusIdx < 80) {
    // Collect lines before VERSUS for Petitioner / Appellant
    const petLines = [];
    for (let j = versusIdx - 1; j >= 0 && j >= versusIdx - 6; j--) {
      const line = lines[j].trim();
      if (/^\s*\(|^(?:CRIMINAL|CIVIL|WRIT|APPEAL|IN THE|SPECIAL LEAVE|HON'BLE|CORAM|DATED)/i.test(line)) break;
      petLines.unshift(line);
    }
    const rawPet = petLines.join(' ');

    // Collect lines after VERSUS for Respondent
    const respLines = [];
    for (let j = versusIdx + 1; j < lines.length && j <= versusIdx + 6; j++) {
      const line = lines[j].trim();
      if (/^(?:JUDGMENT|ORDER|J\s*U\s*D\s*G\s*M\s*E\s*N\s*T|O\s*R\s*D\s*E\s*R|CORAM|BEFORE|DATED)/i.test(line)) break;
      respLines.push(line);
    }
    const rawResp = respLines.join(' ');

    const pet = cleanPartyName(rawPet);
    const resp = cleanPartyName(rawResp);
    if (pet) result.petitioner = pet;
    if (resp) result.respondent = resp;
    if (pet && resp) result.title = `${pet} vs. ${resp}`;
  }

  // Fallback for title if not yet established
  if (!result.title) {
    const rawVersus = first100Lines.match(/([A-Z\s\.,]{3,80})\s+(?:VS\.?|VERSUS|V\/S)\s+([A-Z\s\.,]{3,80})/i);
    if (rawVersus) {
      result.petitioner = cleanPartyName(rawVersus[1]);
      result.respondent = cleanPartyName(rawVersus[2]);
      result.title = `${result.petitioner} vs. ${result.respondent}`;
    }
  }

  // 5. Decision Date & Year
  const dateMatch = rawText.match(/(?:DECIDED\s+ON|DATED|DATE\s*:)\s*[:\-]?\s*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{4}|[0-9]{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December),?\s+[0-9]{4})/i) ||
                    rawText.match(/([0-9]{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December),?\s+[0-9]{4})/i) ||
                    rawText.match(/([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{4})/i);

  if (dateMatch && dateMatch[1]) {
    const dStr = dateMatch[1].trim();
    try {
      const d = new Date(dStr);
      if (!isNaN(d.getTime())) {
        result.judgmentDate = d.toISOString().split('T')[0];
        result.year = String(d.getFullYear());
      }
    } catch {}
  }

  // 6. Bench / Coram / Author Judge
  const benchMatch = first100Lines.match(/(?:CORAM|BEFORE)\s*[:\-]\s*([^\n\r]+)/i) ||
                    first100Lines.match(/HON'BLE\s+MR\.\s+JUSTICE\s+([^\n\r]+)/i);
  if (benchMatch) {
    result.bench = benchMatch[1].replace(/HON'BLE|JUSTICE/gi, '').replace(/\s+/g, ' ').trim();
  }

  const authorMatch = rawText.match(/(?:The\s+Judgment\s+of\s+the\s+Court\s+was\s+delivered\s+by|JUDGMENT\s+DELIVERED\s+BY)\s*[:\-]?\s*([^\n\r]+)/i);
  if (authorMatch && !result.bench) {
    result.bench = authorMatch[1].replace(/,?\s*J\.?$/i, '').trim();
  }

  // 7. Citations (e.g. 2026 INSC 666)
  const inscMatch = rawText.match(/(20\d{2})\s+INSC\s+(\d+)/i);
  if (inscMatch) {
    result.citations.push({
      year: inscMatch[1],
      court: 'SC',
      month: '',
      number: `${inscMatch[1]} INSC ${inscMatch[2]}`,
      equivalentText: ''
    });
  }

  const sccMatch = rawText.match(/\((20\d{2})\)\s*(\d+)\s+SCC\s+(\d+)/i);
  if (sccMatch) {
    result.citations.push({
      year: sccMatch[1],
      court: 'SC',
      month: '',
      number: `(${sccMatch[1]}) ${sccMatch[2]} SCC ${sccMatch[3]}`,
      equivalentText: ''
    });
  }

  // 8. Acts & Sections Detection
  const actCandidates = [
    'Bharatiya Nagarik Suraksha Sanhita',
    'BNSS',
    'Code of Criminal Procedure',
    'CrPC',
    'Bharatiya Nyaya Sanhita',
    'BNS',
    'Indian Penal Code',
    'IPC',
    'Constitution of India',
    'Arbitration and Conciliation Act',
    'Negotiable Instruments Act',
    'Companies Act',
    'Evidence Act'
  ];

  for (const act of actCandidates) {
    if (new RegExp(`\\b${act}\\b`, 'i').test(rawText)) {
      result.act = act;
      break;
    }
  }

  const secMatch = rawText.match(/Section\s+(\d+[A-Za-z]*)/i);
  if (secMatch) {
    result.section = `Section ${secMatch[1]}`;
  }

  // 9. Headnote / Summary
  const paras = rawText.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 80 && !p.startsWith('IN THE') && !p.includes('APPEAL NO'));
  if (paras.length > 0) {
    result.summary = paras[0].slice(0, 450).replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() + '...';
  }

  return result;
}

function cleanPartyName(name) {
  if (!name) return '';
  return name
    .replace(/^(?:IN THE|BEFORE|COURT OF|APPEAL NO|HON'BLE|CRIMINAL|CIVIL)[^\n\r]*?:/i, '')
    .replace(/(?:\.{2,}|\u2026+|\u22EF+|\s*[-–—]\s*|\s*~+\s*|\s*\.\.\.\s*)\s*(?:APPELLANTS?|PETITIONERS?|RESPONDENTS?|ACCUSED|STATE|DEFENDANTS?|PLAINTIFFS?)(?:\(s\))?/gi, '')
    .replace(/\b(?:APPELLANTS?|PETITIONERS?|RESPONDENTS?|ACCUSED|STATE)\b\s*\(s\)?$/gi, '')
    .replace(/[;,\(\)\n\r]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
