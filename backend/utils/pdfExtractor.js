import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { GoogleGenAI } from '@google/genai';

/**
 * AI-Powered Multimodal Legal Judgment Extractor
 * Uses Gemini Vision for 100% exact page-by-page replication of the original court judgment PDF.
 */
async function extractWithGeminiAI(pdfBuffer) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;

  const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash'];
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
                text: `You are an expert Indian Legal Precedent and Supreme Court Judgment Document Formatter for Digital Law Reporter.
Analyze the attached Indian Supreme Court / High Court judgment PDF and extract every single page with 100% textual, structural, and visual fidelity into a strict JSON structure.

JSON STRUCTURE:
{
  "title": "Primary Appellant/Petitioner vs. Primary Respondent",
  "petitioner": "Full Name of Appellant / Petitioner (without '... APPELLANT(S)')",
  "respondent": "Full Name of Respondent (without '... RESPONDENT(S)')",
  "court": "Supreme Court of India (or High Court Name)",
  "year": "YYYY",
  "judgmentDate": "YYYY-MM-DD",
  "bench": "Hon'ble Judge names",
  "caseNumber": "Full Appeal / SLP Number (e.g. Crl. A. @ SLP (Crl.) No. 4333 of 2026)",
  "diaryNumber": "Diary Number if present",
  "totalPages": 14,
  "act": "Primary Act(s) (e.g. Bharatiya Nagarik Suraksha Sanhita, 2023 / Code of Criminal Procedure, 1973)",
  "section": "Key Sections referenced (e.g. Section 167 CrPC / Section 187 BNSS)",
  "summary": "Comprehensive editorial headnote / synopsis summarizing facts, questions of law, and the final decision (2-3 structured paragraphs)",
  "citations": [
    { "year": "2026", "month": "", "court": "SC", "number": "2026 INSC 666", "equivalentText": "" }
  ],
  "pages": [
    {
      "pageNum": 1,
      "html": "... exact HTML for Page 1 ..."
    }
  ],
  "extractedTablesCount": 1
}

CRITICAL FORMATTING & EXTRACTION RULES:
1. Divide the output into EXACT 1-to-1 individual pages in the "pages" array (pageNum: 1, 2, 3... totalPages) matching each physical page of the PDF.
2. STRICT OMISSIONS / SCRUBBING:
   - NEVER include any QR codes or barcode text.
   - NEVER include digital signature certification boxes (e.g., "Digitally signed by...", "Signature Not Verified", "Date:...", "Reason:...").
   - NEVER include question mark symbols ('?' or '\\uFFFD') near judge signatures, dates, or names.
3. PAGE 1 LAYOUT (Universal Legal Format for Supreme Court, High Courts, and IndianKanoon prints):
   - Top Citation & Reportability / Bench Initials:
     <div style="display: flex; justify-content: space-between; align-items: center; font-weight: bold; font-family: 'Times New Roman', serif; font-size: 15px; margin-bottom: 24px;"><span>2026 INSC 666</span><span style="text-decoration: underline; letter-spacing: 1px;"><u>REPORTABLE</u></span></div>
     (For IndianKanoon/High Court prints, include top title, date, Author, Bench, and right-aligned case numbers if present).
   - Court Header (Centered, Bold):
     <div style="text-align: center; font-weight: bold; font-size: 16px; margin: 12px 0 4px; font-family: 'Times New Roman', serif;">IN THE SUPREME COURT OF INDIA</div> (or IN THE HIGH COURT OF JUDICATURE AT MADRAS / AT BOMBAY / IN THE HIGH COURT OF ANDHRA PRADESH / DELHI / GUJARAT / etc.)
   - Bench Location & Jurisdiction (Centered):
     <div style="text-align: center; font-weight: bold; font-size: 14.5px; margin: 2px 0; font-family: 'Times New Roman', serif;">AT AMARAVATI [3446]</div>
     <div style="text-align: center; font-size: 14px; font-style: italic; margin: 2px 0 12px; font-family: 'Times New Roman', serif; color: #475569;">(Special Original Jurisdiction)</div>
   - Date Line (Centered, Bold):
     <div style="text-align: center; font-weight: bold; font-size: 14px; margin: 4px 0; font-family: 'Times New Roman', serif;">THURSDAY, THE TWENTY NINETH DAY OF AUGUST TWO THOUSAND AND TWENTY FOUR</div>
   - Coram / Judges (Centered, Bold):
     <div style="text-align: center; font-weight: bold; font-size: 15px; letter-spacing: 2px; margin: 10px 0 4px; font-family: 'Times New Roman', serif;">PRESENT:</div>
     <div style="text-align: center; font-weight: bold; font-size: 15.5px; margin: 4px 0 8px; font-family: 'Times New Roman', serif;">HONOURABLE THE CHIEF JUSTICE DHIRAJ SINGH THAKUR</div>
     <div style="text-align: center; font-weight: bold; font-size: 15.5px; margin: 4px 0 8px; font-family: 'Times New Roman', serif;">THE HONOURABLE SRI JUSTICE R RAGHUNANDAN RAO</div>
   - Appeal / Writ Heading (Centered, Underlined):
     <div style="text-align: center; font-weight: bold; font-size: 15px; margin-bottom: 4px; font-family: 'Times New Roman', serif;"><u>WRIT PETITION NO: 18346/2024</u></div>
   - Parties Section (Cause Title):
     <div style="font-weight: bold; font-size: 15px; margin: 8px 0 4px; font-family: 'Times New Roman', serif; color: #0f172a;">Between:</div>
     <div style="display: flex; justify-content: space-between; align-items: baseline; font-weight: bold; font-size: 15px; margin: 12px 0; font-family: 'Times New Roman', serif;"><span>SHAURYA SUNIL KUMAR SINGH</span><span style="font-style: italic;">... APPELLANT(S)</span></div>
     <div style="text-align: center; font-weight: bold; font-size: 14px; letter-spacing: 2px; margin: 16px 0; font-family: 'Times New Roman', serif;">VERSUS</div> (or — AND —)
     <div style="display: flex; justify-content: space-between; align-items: baseline; font-weight: bold; font-size: 15px; margin: 12px 0; font-family: 'Times New Roman', serif;"><span>CENTRAL BUREAU OF INVESTIGATION</span><span style="font-style: italic;">... RESPONDENT(S)</span></div>
   - Counsels / Appearances (Clear block list):
     <div style="font-weight: bold; font-size: 14.5px; margin: 12px 0 4px; font-family: 'Times New Roman', serif;">Counsel for the Petitioner:</div>
     <div style="margin-left: 16px; font-family: 'Times New Roman', serif; font-size: 14px; color: #334155; margin-bottom: 4px;">1. Advocate Name</div>
   - JUDGMENT / ORDER Title (Centered, spaced):
     <div style="text-align: center; font-weight: bold; font-size: 18px; letter-spacing: 4px; margin: 28px 0 16px; font-family: 'Times New Roman', serif;">J U D G M E N T</div> (or <u>The Court made the following order:</u>)
   - Author Judge line:
     <div style="font-weight: bold; font-size: 15px; margin-bottom: 16px; font-family: 'Times New Roman', serif;"><u>SANJAY KAROL, J.</u></div> (or <i>(per Hon'ble Sri Justice R.Raghunandan Rao)</i>)
   - Numbered paragraphs: <p style="text-align: justify; text-justify: inter-word; line-height: 1.85; margin-bottom: 16px; font-family: 'Times New Roman', serif; font-size: 15px;"><strong>1.</strong> Leave granted.</p>
4. STATUTORY COMPARISON TABLES:
   Render side-by-side comparative statute tables with full content in clean multi-column HTML:
   <div class="dlr-table-container my-6 overflow-x-auto"><table class="dlr-extracted-table" style="width: 100%; border-collapse: collapse; margin: 16px 0; font-family: 'Times New Roman', serif; font-size: 14.5px; border: 1.5px solid #334155;"><thead><tr style="background-color: #f1f5f9; border-bottom: 2px solid #334155;"><th style="border: 1px solid #94a3b8; padding: 10px 14px; text-align: left; font-weight: bold; width: 50%;">Section 167 CrPC</th><th style="border: 1px solid #94a3b8; padding: 10px 14px; text-align: left; font-weight: bold; width: 50%;">Section 187 BNSS</th></tr></thead><tbody><tr><td style="border: 1px solid #cbd5e1; padding: 10px 14px; vertical-align: top; text-align: justify; line-height: 1.6;">...</td><td style="border: 1px solid #cbd5e1; padding: 10px 14px; vertical-align: top; text-align: justify; line-height: 1.6;">...</td></tr></tbody></table></div>
5. FOOTNOTES & RUNNING FOOTERS:
   - Footnotes at bottom of respective page: <div class="dlr-footnote-container" style="margin-top: 24px; padding-top: 8px; border-top: 1px solid #475569; width: 35%;"><sup>1</sup> Hereinafter 'subject FIR'.</div>
   - Running footer at bottom of EVERY page: <div class="dlr-page-running-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px; padding-top: 8px; font-size: 13px; font-family: 'Times New Roman', serif; color: #475569; border-top: 1px solid #e2e8f0;"><span>Crl. A. @ SLP (Crl.) No. 4333 of 2026</span><span>Page X of Y</span></div>
6. SIGNATURE BLOCK (Last Page):
   <div style="margin-top: 40px; text-align: right; font-family: 'Times New Roman', serif; font-size: 15px;"><p style="margin-bottom: 4px;">…………………………………………………… J.</p><p style="font-weight: bold; margin-bottom: 30px;">(SANJAY KAROL)</p><p style="margin-bottom: 4px;">…………………………………………………… J.</p><p style="font-weight: bold;">(NONGMEIKAPAM KOTISWAR SINGH)</p></div>
   <div style="margin-top: 20px; font-family: 'Times New Roman', serif; font-size: 15px;"><p>New Delhi</p><p>July 1, 2026</p></div>

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
        // Scrub summary
        if (parsed.summary) {
          parsed.summary = parsed.summary
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/\s*[\?？\uFFFD]\s*/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        }

        // Scrub all page HTMLs
        if (Array.isArray(parsed.pages) && parsed.pages.length > 0) {
          parsed.pages = parsed.pages.map(page => {
            let html = page.html || '';
            html = html
              .replace(/[\uFFFD\u200B\uFEFF]/g, '')
              .replace(/(?:^|\s)[\?？]\s*(?=[A-Z\.\s]{3,40},\s*J\.?|\.{3,}|…|Date|New Delhi|[A-Z][a-z]+)/gi, ' ')
              .replace(/\s*[\?？]\s*$/g, '')
              .replace(/^\s*[\?？]\s*/g, '')
              .replace(/<img[^>]*>/gi, '') // Strip any stray images or QR tags
              .trim();
            return {
              ...page,
              html
            };
          });

          parsed.judgmentText = parsed.pages.map(p => p.html).filter(Boolean).join('\n');
          parsed.totalPages = parsed.pages.length;
        } else if (parsed.judgmentText) {
          let html = parsed.judgmentText
            .replace(/[\uFFFD\u200B\uFEFF]/g, '')
            .replace(/(?:^|\s)[\?？]\s*(?=[A-Z\.\s]{3,40},\s*J\.?|\.{3,}|…|Date|New Delhi|[A-Z][a-z]+)/gi, ' ')
            .replace(/\s*[\?？]\s*$/g, '')
            .replace(/^\s*[\?？]\s*/g, '')
            .trim();
          parsed.pages = [{ pageNum: 1, html }];
          parsed.judgmentText = html;
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

  // 1. Primary Engine: High-Precision Gemini Vision AI (100% exact page reproduction)
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
    try {
      const aiResult = await extractWithGeminiAI(pdfBuffer);
      if (aiResult && aiResult.title && Array.isArray(aiResult.pages) && aiResult.pages.length > 0) {
        return aiResult;
      }
    } catch (e) {
      console.warn('Gemini extraction fallback:', e.message);
    }
  }

  // 2. Fallback Engine: Instant In-Memory PDF Parser
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
  const fontWeights = { times: 0, helvetica: 0, courier: 0, georgia: 0, other: 0 };

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });

    if (textContent && textContent.items) {
      for (const item of textContent.items) {
        const style = textContent.styles && textContent.styles[item.fontName];
        const fam = (style && style.fontFamily ? style.fontFamily : item.fontName || '').toLowerCase();
        const len = item.str ? item.str.length : 1;
        if (fam.includes('mono') || fam.includes('courier')) {
          fontWeights.courier += len;
        } else if (fam.includes('times') || fam.includes('serif')) {
          fontWeights.times += len;
        } else if (fam.includes('georgia')) {
          fontWeights.georgia += len;
        } else if (fam.includes('sans') || fam.includes('arial') || fam.includes('helvetica')) {
          fontWeights.helvetica += len;
        } else {
          fontWeights.other += len;
        }
      }
    }

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

  // Compute predominant font family detected in the original uploaded PDF
  let detectedFont = 'helvetica';
  let maxWeight = -1;
  for (const [font, weight] of Object.entries(fontWeights)) {
    if (weight > maxWeight) {
      maxWeight = weight;
      detectedFont = font;
    }
  }
  if (detectedFont === 'other') detectedFont = 'times';

  // Format body & metadata
  if (fullPlainText.trim().length >= 50) {
    const { htmlBody, extractedTablesCount, pages } = reconstructStructuredBody(pagesData);
    const metadata = extractLegalMetadata(fullPlainText, pagesData);

    if (!metadata.caseNumber && pages.length > 0 && pages[0].headerLeft) {
      metadata.caseNumber = pages[0].headerLeft;
    }

    // Clean petitioner and respondent names of trailing dots, slashes, or role badges
    if (metadata.petitioner) {
      metadata.petitioner = String(metadata.petitioner)
        .replace(/[\/\s\.\-]+$/, '')
        .replace(/(?:\.{2,}|\u2026+|\u22EF+|\s*[-–—]\s*)\s*APPELLANT.*$/i, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
    if (metadata.respondent) {
      metadata.respondent = String(metadata.respondent)
        .replace(/[\/\s\.\-]+$/, '')
        .replace(/(?:\.{2,}|\u2026+|\u22EF+|\s*[-–—]\s*)\s*RESPONDENT.*$/i, '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Clean judgmentText of duplicate court, title, and headnote preambles so only the judicial opinion is stored
    let cleanJudgmentBody = htmlBody;
    const standaloneHeading = /(?:^|>|\n)\s*(?:<[^>]*>)?\s*(?<!Date\s+of\s+)(?:J\s*U\s*D\s*G\s*M\s*E\s*N\s*T|O\s*R\s*D\s*E\s*R)\s*(?:<\/[^>]*>)?\s*(?:<|\n|$)/i;
    const matchJ = cleanJudgmentBody.match(standaloneHeading);
    if (matchJ && matchJ.index !== undefined) {
      cleanJudgmentBody = cleanJudgmentBody.substring(matchJ.index + matchJ[0].length).trim();
      cleanJudgmentBody = cleanJudgmentBody.replace(/^(?:<[^>]*>|\n|\s|\/div>)*?[A-Z\.\s]{3,50},\s*(?:C\.?J\.?|J\.?)(?:<\/[^>]*>)?(?:\s*<\/[^>]*>|\n|\s)*/i, '').trim();
    }

    return {
      ...metadata,
      judgmentText: cleanJudgmentBody,
      pages,
      totalPages: numPages,
      extractedTablesCount,
      numPages,
      font_family: detectedFont,
      detected_font: detectedFont
    };
  }

  // Default fallback if empty
  return {
    title: '',
    court: 'Supreme Court of India',
    year: String(new Date().getFullYear()),
    judgmentDate: new Date().toISOString().split('T')[0],
    judgmentText: '',
    pages: [],
    totalPages: numPages,
    extractedTablesCount: 0,
    font_family: detectedFont,
    detected_font: detectedFont
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

  let hasEmittedKanoonTitle = false;
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

  for (let pIdx = 0; pIdx < pagesData.length; pIdx++) {
    const page = pagesData[pIdx];
    const pageCtx = { pageNum: page.pageNum, pageHtml: '' };
    const lines = page.lines;
    const pageWidth = page.pageWidth || 600;
    const midX = pageWidth / 2;

    let currentParagraph = null;
    let inFootnote = false;
    let footnoteItems = [];
    let sigBoxLinesRemaining = 0;
    let partyBuffer = [];
    let inPartySection = false;
    let inAdvocateSection = false;

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
      let fullText = currentParagraph.text.trim();
      let pChunk = '';

      // Check for trailing judge signature lines bundled at the end of the final paragraph
      let signatureHtml = '';
      if (pIdx >= pagesData.length - 2) {
        const sigIdx = fullText.search(/(?:\.{3,}|…+|―+|-+)\s*J\.?|\([A-Z\.\s]{3,40}\)\s*(?:(?:\.{3,}|…+|―+|-+)\s*J\.?|\([A-Z\.\s]{3,40}\)|New\s+Delhi|[A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i);
        if (sigIdx > 15) {
          const bodyText = fullText.slice(0, sigIdx).trim();
          const sigRaw = fullText.slice(sigIdx).trim();
          fullText = bodyText;

          // Format trailing signature
          signatureHtml = `\n<div style="margin-top: 36px; text-align: right; font-family: 'Times New Roman', Times, serif; font-size: 15px; font-weight: bold; color: #0f172a;">${escapeHtml(sigRaw)}</div>\n`;
        }
      }

      if (currentParagraph.isHeading) {
        pChunk = `<div style="text-align: center; font-weight: bold; font-size: 16px; letter-spacing: 1.5px; margin: 24px 0 14px; font-family: 'Times New Roman', serif; color: #0f172a;">${escapeHtml(fullText)}</div>\n`;
      } else if (currentParagraph.prefix) {
        pChunk = `<p style="margin-bottom: 18px; line-height: 1.95; letter-spacing: 0.15px; text-align: justify; text-justify: inter-word; text-align-last: left; font-family: 'Times New Roman', Times, serif; font-size: 15px; color: #0f172a;"><strong>${escapeHtml(currentParagraph.prefix)}</strong> ${escapeHtml(fullText)}</p>\n`;
      } else {
        pChunk = `<p style="margin-bottom: 18px; line-height: 1.95; letter-spacing: 0.15px; text-align: justify; text-justify: inter-word; text-align-last: left; font-family: 'Times New Roman', Times, serif; font-size: 15px; color: #0f172a;">${escapeHtml(fullText)}</p>\n`;
      }

      if (signatureHtml) {
        pChunk += signatureHtml;
      }

      htmlResult += pChunk;
      pageCtx.pageHtml += pChunk;
      currentParagraph = null;
    };

    const flushPartyBuffer = () => {
      if (partyBuffer.length === 0) return;
      const joined = partyBuffer.join(' ').trim();
      partyBuffer = [];
      if (!joined) return;
      const chunk = `<div style="margin: 4px 0; font-family: 'Times New Roman', Times, serif; font-size: 15px; color: #0f172a; line-height: 1.6;">${escapeHtml(joined)}</div>\n`;
      htmlResult += chunk;
      pageCtx.pageHtml += chunk;
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
      // Clean invisible and corrupt glyphs (e.g. signature question mark artifacts)
      let text = line.lineText
        .replace(/[\uFFFD\u200B\uFEFF]/g, '')
        .replace(/(?:^|\s)[\?？]\s*(?=[A-Z\.\s]{3,40},\s*J\.?|\.{3,}|…|Date|New Delhi|[A-Z][a-z]+)/gi, ' ')
        .replace(/\s*[\?？]\s*$/g, '')
        .replace(/^\s*[\?？]\s*/g, '')
        .replace(/\s+[\?？]\s+/g, ' ')
        .trim();

      if (!text) continue;

      // 1. DIGITAL SIGNATURE / QR CODE / STAMP FILTER: Drop digital verification stamp, certificates & question marks
      const isSigTrigger = /Digitally\s+signed|Signature\s+Not\s+Verified|Signature\s+Valid|QR\s*Code|Scan\s+to\s+verify|https?:\/\/[^\s]*\/qr\//i.test(text);
      if (isSigTrigger) {
        sigBoxLinesRemaining = 4;
        continue;
      }
      if (sigBoxLinesRemaining > 0) {
        if (/^(?:Date\s*:|Reason\s*:|Location\s*:|[A-Z\s]{3,35}$|[\?\uFFFD]$)/i.test(text) && !/^\d+[\.\)]/.test(text)) {
          sigBoxLinesRemaining--;
          continue;
        } else {
          sigBoxLinesRemaining = 0;
        }
      }
      if (/^\s*[\?\uFFFD]\s*$/.test(text)) {
        continue;
      }

      // Scrub repeating inline initials that repeat inside sentences (e.g. HCJ & RRR,J)
      text = text.replace(/\bHCJ\s*&\s*RRR\s*,?\s*J\b/gi, '').replace(/\s+/g, ' ').trim();
      if (!text) continue;

      // 2. RUNNING HEADER on Pages > 1
      if (pIdx > 0 && idx <= 2) {
        if (/^(?:Order\s+dated|Writ\s+Petition|CRIMINAL\s+APPEAL|CIVIL\s+APPEAL|SLP|Page\s*\d+)/i.test(text) ||
            /vs.*on\s+\d{1,2}\s+[A-Za-z]+,?\s+\d{4}/i.test(text) ||
            /^(?:HCJ|RRR|[A-Z]{2,4}\s*&\s*[A-Z]{2,4},?\s*J)$/i.test(text) ||
            /^\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{4}$/.test(text)) {
          continue; // Suppress repeating running header from document body on later pages
        }
      }

      // 3. RUNNING FOOTER PRESERVATION: Capture running case footer, website, or IndianKanoon footer
      const isBottomRunningFooter = (idx >= lines.length - 3) && (
        /Page\s*\d+\s*(?:of\s*\d+)?/i.test(text) ||
        /^\d+\s*(?:of|\/)\s*\d+$/i.test(text) ||
        /https?:\/\/[a-z0-9\.\_\-\/]+/i.test(text) ||
        /Indian\s+Kanoon|http:\/\/indiankanoon/i.test(text) ||
        (/^(?:Crl\.|Civ\.|Writ|Appeal|SLP|Diary|Special\s*Leave)\s*.*?No\.?\s*[0-9\/\w\-]+/i.test(text) && /(?:Page\s*\d+|\b\d+\s*(?:of|\/)\s*\d+\b)/i.test(text))
      );

      if (isBottomRunningFooter) {
        flushParagraph();
        flushPartyBuffer();
        if (inTable) {
          tablePendingContinuation = { isContinuing: true, headers: currentTableHeaders };
        }
        flushTable(pageCtx);
        flushFootnotes(pageCtx);

        let leftFooter = '';
        let rightFooter = '';
        const pageMatch = text.match(/(Page\s*\d+\s*(?:of\s*\d+)?|\b\d+\s*(?:of|\/)\s*\d+\b|\b\d+\b)$/i);
        if (/Indian\s+Kanoon|http:\/\/indiankanoon/i.test(text)) {
          leftFooter = 'Indian Kanoon';
          const pM = text.match(/(\d+)$/);
          rightFooter = `Page ${pM ? pM[1] : (pIdx + 1)} of ${pagesData.length}`;
        } else if (pageMatch && !/https?:\/\//i.test(text)) {
          rightFooter = pageMatch[1].trim();
          leftFooter = text.slice(0, text.length - pageMatch[0].length).trim();
        } else if (/https?:\/\//i.test(text)) {
          leftFooter = text;
          if (idx + 1 < lines.length && /^\d+\s*(?:\/|of)\s*\d+$/i.test(lines[idx + 1].lineText.trim())) {
            rightFooter = lines[idx + 1].lineText.trim();
            idx++;
          }
        } else if (/^\d+\s*(?:\/|of)\s*\d+$/i.test(text)) {
          rightFooter = text;
        } else if (items.length >= 2 && items[items.length - 1].x > midX) {
          leftFooter = items.slice(0, items.length - 1).map(it => it.str).join(' ').trim();
          rightFooter = items[items.length - 1].str.trim();
        } else {
          leftFooter = text;
        }

        if (!rightFooter) {
          rightFooter = `Page ${page.pageNum || (pIdx + 1)} of ${pagesData.length}`;
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

      // 4. FOOTNOTE DIVIDER LINE (________ or --------- or *****)
      if (/^_{3,}|^-{3,}|^―{3,}|^\*{3,}/.test(text)) {
        flushParagraph();
        flushPartyBuffer();
        if (/^\*{3,}/.test(text)) {
          const divChunk = `<div style="text-align: center; letter-spacing: 4px; margin: 16px 0; color: #64748b;">* * * * *</div>\n`;
          htmlResult += divChunk;
          pageCtx.pageHtml += divChunk;
          continue;
        }
        if (inTable) {
          tablePendingContinuation = { isContinuing: true, headers: currentTableHeaders };
        }
        flushTable(pageCtx);
        inFootnote = true;
        continue;
      }

      // 5. FOOTNOTE TEXT ITEMS
      if (inFootnote || (idx >= lines.length - 4 && /^[¹²³⁴⁵⁶⁷⁸⁹\*†‡]|^[1-9]\s*(?:Hereinafter|See|Ibid|Supra|AIR|SCC|Cr\.?P\.?C|Section|[a-z]|[\x27"“‘])/i.test(text))) {
        flushParagraph();
        flushPartyBuffer();
        flushTable(pageCtx);
        inFootnote = true;
        const cleanFootnote = text.replace(/^([¹²³⁴⁵⁶⁷⁸⁹\*†‡]|\d+[\.\)]?)\s*/, (m, mark) => {
          const num = mark.replace(/[\.\)]/, '').trim();
          return `<sup>${escapeHtml(num)}</sup> `;
        });
        footnoteItems.push(cleanFootnote);
        continue;
      }

      // 6. IndianKanoon Document Title on Page 1 top (lines 0-3)
      if (pIdx === 0 && idx <= 3 && /vs/i.test(text)) {
        if (hasEmittedKanoonTitle) {
          if (idx + 1 < lines.length && /\d{1,2}\s+[A-Za-z]+,?\s+\d{4}/.test(lines[idx + 1].lineText)) {
            idx++;
          }
          continue;
        }
        hasEmittedKanoonTitle = true;
        flushParagraph();
        let fullTitle = text;
        if (idx + 1 < lines.length && /\d{1,2}\s+[A-Za-z]+,?\s+\d{4}/.test(lines[idx + 1].lineText)) {
          idx++;
          fullTitle += ' ' + lines[idx].lineText.trim();
        }
        const cleanTitle = fullTitle.replace(/,\s*on.*$/i, '').trim();
        const datePart = fullTitle.match(/on\s+(\d{1,2}\s+[A-Za-z]+,?\s+\d{4})/i);
        let chunk = `<div style="font-weight: bold; font-size: 16px; margin: 4px 0 4px; font-family: 'Times New Roman', serif; color: #0f172a;">${escapeHtml(cleanTitle)}</div>\n`;
        if (datePart) {
          chunk += `<div style="font-size: 14px; font-weight: bold; color: #475569; font-family: 'Times New Roman', serif; margin-bottom: 12px;">${escapeHtml(datePart[1])}</div>\n`;
        }
        htmlResult += chunk;
        pageCtx.pageHtml += chunk;
        continue;
      }

      // IndianKanoon Author & Bench
      if (pIdx === 0 && idx < 6 && /^Author\s*:\s*(.+)$/i.test(text)) {
        flushParagraph();
        const chunk = `<div style="font-size: 14px; color: #475569; font-family: 'Times New Roman', serif; margin: 2px 0;"><strong>${escapeHtml(text)}</strong></div>\n`;
        htmlResult += chunk;
        pageCtx.pageHtml += chunk;
        continue;
      }
      if (pIdx === 0 && idx < 6 && /^Bench\s*:\s*(.+)$/i.test(text)) {
        flushParagraph();
        const chunk = `<div style="font-size: 14px; color: #475569; font-family: 'Times New Roman', serif; margin: 2px 0 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;"><strong>${escapeHtml(text)}</strong></div>\n`;
        htmlResult += chunk;
        pageCtx.pageHtml += chunk;
        continue;
      }
      if (pIdx === 0 && idx < 6 && /^\d+$/.test(text)) {
        continue;
      }

      // Bench Initials & Case Number on Right Side (e.g. HCJ & RRR,J / W.P.No.18346/2024 / APHC010364302024)
      if (pIdx === 0 && idx < 10 && (/^(?:HCJ|RRR|[A-Z]{2,4}\s*&\s*[A-Z]{2,4},?\s*J)$/i.test(text) || /^W\.?P\.?No\.?\s*[0-9\/\-]+$/i.test(text) || /^APHC\d+$/i.test(text))) {
        flushParagraph();
        const chunk = `<div style="text-align: right; font-size: 13px; font-weight: bold; font-family: 'Times New Roman', serif; color: #475569; margin-bottom: 3px;">${escapeHtml(text)}</div>\n`;
        htmlResult += chunk;
        pageCtx.pageHtml += chunk;
        continue;
      }

      // 7. Detect 2-column or split text items (Physical Gutter Gap or MidX Split)
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

      // Top Running Note/Header on Page 1 (e.g. Order dated: ... / Case No on right)
      if (pIdx === 0 && idx <= 1 && (/^Order\s+dated\s*:/i.test(text) || (idx === 1 && /^(?:Writ\s+Petition|CRIMINAL|CIVIL)/i.test(text) && items[0]?.x > midX))) {
        flushParagraph();
        flushPartyBuffer();
        const chunk = `<div style="text-align: right; font-size: 13.5px; font-family: 'Times New Roman', Times, serif; color: #475569; margin-bottom: 4px;">${escapeHtml(text)}</div>\n`;
        htmlResult += chunk;
        pageCtx.pageHtml += chunk;
        continue;
      }

      // 8. Check for Indian Court Document Structures (Cause Titles, Citations, Parties)
      // A. Citation + REPORTABLE / NON-REPORTABLE line
      const isReportableLine = (/\b(?:REPORTABLE|NON-REPORTABLE)\b/i.test(col2) || /\b(?:REPORTABLE|NON-REPORTABLE)\b/i.test(text)) &&
                               (/\bINSC\b|\bSCC\b|\bAIR\b|\b\d{4}\b/i.test(col1) || /\b(?:REPORTABLE|NON-REPORTABLE)\b/i.test(text));
      if (isReportableLine) {
        flushParagraph();
        flushPartyBuffer();
        flushTable(pageCtx);
        const citText = col1 || text.replace(/REPORTABLE|NON-REPORTABLE/gi, '').trim();
        const repTag = (text.match(/NON-REPORTABLE/i) ? 'NON-REPORTABLE' : 'REPORTABLE');
        const chunk = `<div style="display: flex; justify-content: space-between; align-items: center; font-weight: bold; margin-bottom: 22px; font-family: 'Times New Roman', Times, serif; font-size: 15px; color: #0f172a;"><span>${escapeHtml(citText)}</span><span style="letter-spacing: 1.5px; font-weight: bold; text-decoration: underline;"><u>${repTag}</u></span></div>\n`;
        htmlResult += chunk;
        pageCtx.pageHtml += chunk;
        continue;
      }

      // B. Court & Jurisdiction Headings (Centered, Bold)
      const isCourtHeader = /^(?:(?:IN|BEFORE)\s+THE\s+)?(?:SUPREME\s+COURT\s+OF\s+INDIA|(?:[A-Z\s]+\s+BENCH\s+OF\s+)?HIGH\s+COURT\s+(?:OF\s+JUDICATURE\s+(?:AT|FOR)|OF)?\s+[A-Z\s&,]+|CRIMINAL\s+APPELLATE\s+JURISDICTION|CIVIL\s+APPELLATE\s+JURISDICTION|EXTRAORDINARY\s+(?:CIVIL\s+|CRIMINAL\s+)?(?:APPELLATE|ORIGINAL)\s+JURISDICTION|ORIGINAL\s+JURISDICTION|WRIT\s+JURISDICTION|APPELLATE\s+SIDE|CIVIL\s+ORIGINAL\s+JURISDICTION)$/i.test(text);
      if (isCourtHeader) {
        flushParagraph();
        flushPartyBuffer();
        flushTable(pageCtx);
        const chunk = `<div style="text-align: center; font-weight: bold; font-size: 16px; letter-spacing: 0.8px; margin: 10px 0 6px; font-family: 'Times New Roman', Times, serif; color: #0f172a;">${escapeHtml(text)}</div>\n`;
        htmlResult += chunk;
        pageCtx.pageHtml += chunk;
        continue;
      }

      // Bench city: AT AMARAVATI [3446] / AT MADURAI / BENCH AT JAIPUR / BENCH AT NAGPUR
      if (pIdx === 0 && idx < 15 && /^\(?\s*(?:AT\s+[A-Z\s]+(?:\s*\[\d+\])?|BENCH\s+AT\s+[A-Z\s]+|MADURAI\s+BENCH|NAGPUR\s+BENCH|JAIPUR\s+BENCH|LUCKNOW\s+BENCH|DHARWAD\s+BENCH|GULBARGA\s+BENCH)\s*\)?$/i.test(text)) {
        flushParagraph();
        const chunk = `<div style="text-align: center; font-weight: bold; font-size: 14.5px; margin: 2px 0; font-family: 'Times New Roman', serif; color: #0f172a;">${escapeHtml(text)}</div>\n`;
        htmlResult += chunk;
        pageCtx.pageHtml += chunk;
        continue;
      }

      // Jurisdiction: (Special Original Jurisdiction) / (Extraordinary Civil Jurisdiction)
      if (pIdx === 0 && idx < 15 && /^\(?\s*(?:Special\s+|Extraordinary\s+)?(?:Original|Appellate|Writ|Civil|Criminal)\s+(?:Original\s+|Appellate\s+)?Jurisdiction\s*\)?$/i.test(text)) {
        flushParagraph();
        const chunk = `<div style="text-align: center; font-size: 14px; font-style: italic; margin: 2px 0 12px; font-family: 'Times New Roman', serif; color: #475569;">${escapeHtml(text)}</div>\n`;
        htmlResult += chunk;
        pageCtx.pageHtml += chunk;
        continue;
      }

      // Spelled out Date in Words: THURSDAY, THE TWENTY NINTH DAY OF AUGUST / TWO THOUSAND AND TWENTY FOUR
      if (pIdx === 0 && idx < 16 && (/^(?:(?:MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY),?\s+)?THE\s+[A-Z\s]+DAY\s+OF\s+[A-Z]+$/i.test(text) || /^(?:TWO\s+THOUSAND\s+[A-Z\s]+|NINETEEN\s+[A-Z\s]+)$/i.test(text))) {
        flushParagraph();
        const chunk = `<div style="text-align: center; font-weight: bold; font-size: 14px; margin: 4px 0; font-family: 'Times New Roman', serif; color: #0f172a;">${escapeHtml(text)}</div>\n`;
        htmlResult += chunk;
        pageCtx.pageHtml += chunk;
        continue;
      }

      // C. Numeric Date Line (Centered, Bold)
      const isDateLine = /^(?:DATED|DATE\s*OF\s*(?:DECISION|JUDGMENT|ORDER)|DATE|ORDER\s+DATED|RESERVED\s+ON|PRONOUNCED\s+ON)\s*[:\-]\s*[0-9A-Za-z\s\.,\/\-]+$/i.test(text);
      if (isDateLine && pIdx === 0 && idx < 10) {
        flushParagraph();
        flushPartyBuffer();
        flushTable(pageCtx);
        const chunk = `<div style="text-align: center; font-weight: bold; font-size: 14.5px; margin: 6px 0 10px; font-family: 'Times New Roman', Times, serif; color: #0f172a;">${escapeHtml(text)}</div>\n`;
        htmlResult += chunk;
        pageCtx.pageHtml += chunk;
        continue;
      }

      // D. CORAM / PRESENT / BEFORE Heading (Centered, Bold)
      const isCoramHeader = /^(?:PRESENT|CORAM|BEFORE)\s*[:\-]?$/i.test(text);
      if (isCoramHeader) {
        flushParagraph();
        flushPartyBuffer();
        flushTable(pageCtx);
        const chunk = `<div style="text-align: center; font-weight: bold; font-size: 15px; letter-spacing: 2px; margin: 10px 0 4px; font-family: 'Times New Roman', Times, serif; color: #0f172a;">${escapeHtml(text)}</div>\n`;
        htmlResult += chunk;
        pageCtx.pageHtml += chunk;
        continue;
      }

      // E. Hon'ble Judge Name Line (Centered, Bold)
      const isCoramJudge = /^(?:THE\s+)?(?:HON['’]BLE|HONOURABLE)\s+(?:THE\s+CHIEF\s+JUSTICE|(?:SRI|SMT\.|MR\.|MS\.|MRS\.|DR\.)?\s*JUSTICE)\s+[A-Z\.\s]+$/i.test(text) ||
                           /^(?:CHIEF\s+JUSTICE|(?:SRI|SMT\.|MR\.|MS\.|MRS\.|DR\.)\s*JUSTICE)\s+[A-Z\.\s]+$/i.test(text);
      if (isCoramJudge && pIdx === 0 && idx < 20) {
        flushParagraph();
        flushPartyBuffer();
        flushTable(pageCtx);
        const chunk = `<div style="text-align: center; font-weight: bold; font-size: 15.5px; margin: 4px 0 8px; font-family: 'Times New Roman', Times, serif; color: #0f172a;">${escapeHtml(text)}</div>\n`;
        htmlResult += chunk;
        pageCtx.pageHtml += chunk;
        continue;
      }

      // F. Appeal & Case Numbers (Centered/Formatted with Underline)
      const isAppealNoHeading = /^(?:CRIMINAL|CIVIL)?\s*APPEAL\s*NO\.?\s*.*?OF\s*\d{4}/i.test(text) ||
                                /^(?:WRIT\s+PETITION|W\.?P\.?|CIVIL\s+MISC|C\.?M\.?A\.?|O\.?S\.?A\.?|CONTEMPT\s+PETITION|REVIEW\s+(?:APPLICATION|PETITION)|WRIT\s+APPEAL|W\.?A\.?|ORIGINAL\s+PETITION|O\.?P\.?|CRL\.?\s*(?:O\.?P\.?|R\.?C\.?|M\.?C\.?|REV\.?)|FIRST\s+APPEAL|SECOND\s+APPEAL|F\.?A\.?|S\.?A\.?|T\.?C\.?A\.?)(?:\s*\([^\)]*\))?\s*(?:NO\.?|NUMBER|NO\s*:)?\s*[0-9\/\s\w\-]+(?:\s*(?:OF|\/)\s*[0-9]{4})?$/i.test(text) ||
                                /^\(@?\s*(?:Special\s*Leave\s*Petition|SLP)\s*\(.*?\)\s*NO\.?\s*.*?\)$/i.test(text);
      if (isAppealNoHeading && idx < 20) {
        flushParagraph();
        flushPartyBuffer();
        flushTable(pageCtx);
        const isSubSLP = text.startsWith('(');
        const chunk = `<div style="text-align: center; font-weight: ${isSubSLP ? 'normal' : 'bold'}; font-size: ${isSubSLP ? '14px' : '15px'}; margin: ${isSubSLP ? '2px 0 14px' : '8px 0 14px'}; font-family: 'Times New Roman', Times, serif; color: #0f172a; ${isSubSLP ? '' : 'text-decoration: underline;'}">${isSubSLP ? escapeHtml(text) : `<u>${escapeHtml(text)}</u>`}</div>\n`;
        htmlResult += chunk;
        pageCtx.pageHtml += chunk;
        inPartySection = true;
        continue;
      }

      // Between:
      if (/^Between\s*[:\-]?$/i.test(text)) {
        flushParagraph();
        const chunk = `<div style="font-weight: bold; font-size: 15px; margin: 8px 0 4px; font-family: 'Times New Roman', serif; color: #0f172a;">Between:</div>\n`;
        htmlResult += chunk;
        pageCtx.pageHtml += chunk;
        inPartySection = true;
        continue;
      }

      // G. Parties Section (Petitioner / Appellant / Respondent / VERSUS)
      const isPartyLine = (/(?:\.{2,}|\u2026+|\u22EF+|\s*[-–—]\s*)\s*(?:APPELLANTS?|PETITIONERS?|RESPONDENTS?|ACCUSED|STATE)/i.test(col2) || 
                           /(?:\.{2,}|\u2026+|\u22EF+|\s*[-–—]\s*)\s*(?:APPELLANTS?|PETITIONERS?|RESPONDENTS?|ACCUSED|STATE)/i.test(text)) &&
                          !/\bSection\b/i.test(text);
      if (isPartyLine) {
        flushParagraph();
        flushTable(pageCtx);
        let pName = col1;
        let pRole = col2;
        if (!pName || !pRole) {
          const m = text.match(/^(.*?)\s*((?:\.{2,}|\u2026+|\u22EF+|\s*[-–—]\s*)\s*(?:APPELLANTS?|PETITIONERS?|RESPONDENTS?|ACCUSED|STATE).*)$/i);
          if (m) {
            pName = m[1];
            pRole = m[2];
          } else {
            pName = text;
            pRole = '';
          }
        }

        if (partyBuffer.length > 0) {
          pName = partyBuffer.join(' ') + ' ' + pName;
          partyBuffer = [];
        }

        const chunk = `<div style="display: flex; justify-content: space-between; align-items: baseline; font-weight: bold; margin: 8px 0; font-family: 'Times New Roman', Times, serif; font-size: 15px; color: #0f172a;"><span>${escapeHtml(pName)}</span><span style="font-style: italic; white-space: nowrap; margin-left: 16px;">${escapeHtml(pRole)}</span></div>\n`;
        htmlResult += chunk;
        pageCtx.pageHtml += chunk;
        continue;
      }

      // H. VERSUS / AND
      if (/^(?:VERSUS|V\/S|VS\.?|V\.|AND)$/i.test(text)) {
        flushParagraph();
        flushPartyBuffer();
        flushTable(pageCtx);
        const chunk = `<div style="text-align: center; font-weight: bold; font-size: 14px; letter-spacing: 2.5px; margin: 14px 0; font-family: 'Times New Roman', Times, serif; color: #475569;">— ${escapeHtml(text.toUpperCase())} —</div>\n`;
        htmlResult += chunk;
        pageCtx.pageHtml += chunk;
        continue;
      }

      // If in party section before PRAYER or JUDGMENT, buffer party addresses
      if (inPartySection && pIdx === 0 && idx < 20 && !/^(?:PRAYER|ORDER|JUDGMENT|Court\s+made|Counsel\s+for|For\s+Petitioner|For\s+Respondent)/i.test(text)) {
        partyBuffer.push(text);
        continue;
      } else if (partyBuffer.length > 0) {
        flushPartyBuffer();
      }

      // I. PRAYER SECTION
      if (/^PRAYER\s*[:\-]/i.test(text)) {
        flushParagraph();
        flushPartyBuffer();
        inPartySection = false;
        inAdvocateSection = false;
        const m = text.match(/^(PRAYER\s*[:\-])\s*(.*)$/i);
        const prefix = m ? m[1] : 'PRAYER :';
        const rest = m ? m[2] : text.replace(/^PRAYER\s*[:\-]\s*/i, '');
        currentParagraph = { prefix, text: rest };
        continue;
      }

      // J. ADVOCATE / COUNSEL APPEARANCES
      if (/^(?:Counsel\s+for\s+(?:the\s+)?(?:Petitioner|Appellant|Respondent|State|Applicant|Opposite\s+Party)|For\s+(?:the\s+)?(?:Petitioner|Appellant|Respondent|State|Defendant|Plaintiff|Applicant)|Advocate[s]?\s+for\s+(?:the\s+)?(?:Petitioner|Appellant|Respondent))\s*(?:\([^\)]*\))?\s*[:\-]?/i.test(text)) {
        flushParagraph();
        flushPartyBuffer();
        inAdvocateSection = true;
        const chunk = `<div style="font-weight: bold; font-size: 14.5px; margin: 12px 0 4px; font-family: 'Times New Roman', serif; color: #0f172a;">${escapeHtml(text)}</div>\n`;
        htmlResult += chunk;
        pageCtx.pageHtml += chunk;
        continue;
      }
      if (/Counsel\s+for\s+(?:the\s+)?Respondent/i.test(text) && /^\d+\.\s+[A-Z\s]+/i.test(text)) {
        flushParagraph();
        const parts = text.split(/(?=Counsel\s+for\s+(?:the\s+)?Respondent)/i);
        const p1 = parts[0]?.trim();
        const p2 = parts[1]?.trim();
        let chunk = '';
        if (p1) chunk += `<div style="margin-left: 16px; font-family: 'Times New Roman', serif; font-size: 14px; color: #334155; margin-bottom: 4px;">${escapeHtml(p1)}</div>\n`;
        if (p2) chunk += `<div style="font-weight: bold; font-size: 14.5px; margin: 12px 0 4px; font-family: 'Times New Roman', serif; color: #0f172a;">${escapeHtml(p2)}</div>\n`;
        htmlResult += chunk;
        pageCtx.pageHtml += chunk;
        continue;
      }
      if (/Court\s+(?:made|passed)\s+the|following\s+order\s+of\s+the\s+Court\s+was\s+delivered/i.test(text)) {
        flushParagraph();
        flushPartyBuffer();
        inAdvocateSection = false;
        const parts = text.split(/Court\s+(?:made|passed)\s+the|following\s+order\s+of\s+the\s+Court\s+was\s+delivered/i);
        if (parts[0]?.trim()) {
          const cChunk = `<div style="margin-left: 16px; font-family: 'Times New Roman', serif; font-size: 14px; color: #334155; margin-bottom: 8px;">${escapeHtml(parts[0].trim())}</div>\n`;
          htmlResult += cChunk;
          pageCtx.pageHtml += cChunk;
        }
        if (idx + 1 < lines.length && /following\s+order/i.test(lines[idx + 1].lineText)) {
          idx++;
        }
        const orderChunk = `<div style="font-weight: bold; font-size: 15px; margin: 18px 0 10px; font-family: 'Times New Roman', serif; color: #0f172a; text-decoration: underline;"><u>The Court made the following order:</u></div>\n`;
        htmlResult += orderChunk;
        pageCtx.pageHtml += orderChunk;
        continue;
      }
      if (inAdvocateSection && idx < 30 && (/^\d+\.\s+[A-Z\s\(\)]+/i.test(text) || /^(?:Special\s+Government|Government\s+Pleader|Standing\s+Counsel|Senior\s+Counsel|Not\s+ready|Advocate)/i.test(text))) {
        flushParagraph();
        const chunk = `<div style="margin-left: 16px; font-family: 'Times New Roman', Times, serif; font-size: 14px; color: #334155; line-height: 1.5; margin-bottom: 4px;">${escapeHtml(text)}</div>\n`;
        htmlResult += chunk;
        pageCtx.pageHtml += chunk;
        continue;
      } else if (inAdvocateSection && !/^(?:Counsel|For\s+|\*|―|_|-)/i.test(text)) {
        inAdvocateSection = false;
      }

      // Order Author line: (per Hon'ble Sri Justice R.Raghunandan Rao)
      if (/^\(?\s*per\s+(?:HON['’]BLE|HONOURABLE)\s+(?:SRI|MR\.|MS\.|DR\.)?\s*JUSTICE/i.test(text)) {
        flushParagraph();
        const m = text.match(/^(\(?\s*per\s+[^)]+\)?)\s*(.*)$/i);
        const auth = m ? m[1] : text;
        const rest = m ? m[2] : '';
        const aChunk = `<div style="font-style: italic; font-weight: bold; font-size: 14.5px; margin: 8px 0 12px; font-family: 'Times New Roman', serif; color: #334155;">${escapeHtml(auth)}</div>\n`;
        htmlResult += aChunk;
        pageCtx.pageHtml += aChunk;
        if (rest.trim()) {
          currentParagraph = { prefix: '', text: rest.trim() };
        }
        continue;
      }


      // I. PRAYER SECTION
      if (/^PRAYER\s*[:\-]/i.test(text)) {
        flushParagraph();
        flushPartyBuffer();
        inPartySection = false;
        inAdvocateSection = false;
        const m = text.match(/^(PRAYER\s*[:\-])\s*(.*)$/i);
        const prefix = m ? m[1] : 'PRAYER :';
        const rest = m ? m[2] : text.replace(/^PRAYER\s*[:\-]\s*/i, '');
        currentParagraph = { prefix, text: rest };
        continue;
      }

      // J. ADVOCATE / COUNSEL APPEARANCES
      if (/^(?:For\s+Petitioner|For\s+Appellant|For\s+Respondent|For\s+State|For\s+Defendant|For\s+Plaintiff)\s*[:\-]/i.test(text)) {
        flushParagraph();
        flushPartyBuffer();
        inAdvocateSection = true;
        const chunk = `<div style="margin: 4px 0; font-family: 'Times New Roman', Times, serif; font-size: 14.5px; color: #0f172a; line-height: 1.6;">${escapeHtml(text)}</div>\n`;
        htmlResult += chunk;
        pageCtx.pageHtml += chunk;
        continue;
      }
      if (inAdvocateSection && idx < 28 && /^(?:Special\s+Government|Government\s+Pleader|Standing\s+Counsel|Senior\s+Counsel|Not\s+ready|Advocate)/i.test(text)) {
        flushParagraph();
        const chunk = `<div style="margin: 2px 0 2px 20px; font-family: 'Times New Roman', Times, serif; font-size: 14px; color: #334155; line-height: 1.5;">${escapeHtml(text)}</div>\n`;
        htmlResult += chunk;
        pageCtx.pageHtml += chunk;
        continue;
      } else if (inAdvocateSection && !/^(?:For\s+|\*|―|_|-)/i.test(text)) {
        inAdvocateSection = false;
      }

      // K. JUDGMENT / ORDER Title (Underlined)
      const isJudgmentTitle = /^(?:JUDGMENT|ORDER|O\s*R\s*D\s*E\s*R|J\s*U\s*D\s*G\s*M\s*E\s*N\s*T)$/i.test(text);
      if (isJudgmentTitle) {
        flushParagraph();
        flushPartyBuffer();
        flushTable(pageCtx);
        inPartySection = false;
        inAdvocateSection = false;
        const titleLabel = /O\s*R\s*D\s*E\s*R/i.test(text) ? 'O R D E R' : 'J U D G M E N T';
        const chunk = `<div style="text-align: center; font-weight: bold; font-size: 18px; letter-spacing: 4px; margin: 28px 0 16px; font-family: 'Times New Roman', Times, serif; color: #0f172a; text-decoration: underline;"><u>${titleLabel}</u></div>\n`;
        htmlResult += chunk;
        pageCtx.pageHtml += chunk;
        continue;
      }

      // L. Judge Signature / Author line (Underlined)
      const isJudgeNameLine = /^[A-Z\.\s]{3,40},\s*J\.?$/i.test(text) ||
                              /^(?:The\s+Judgment\s+of\s+the\s+Court\s+was\s+delivered\s+by|JUDGMENT\s+DELIVERED\s+BY)/i.test(text);
      if (isJudgeNameLine) {
        flushParagraph();
        flushPartyBuffer();
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

      // 5. Judge Signature Lines on Final Pages (Right-Aligned, Bold)
      if (pIdx >= pagesData.length - 2 && (
        /^(?:\.{3,}|…+|―+|-+)\s*J\.?$/i.test(text) ||
        /^\([A-Z\.\s]{3,40}\)$/.test(text) ||
        /^\[[A-Z\.\s]{3,40}\]$/.test(text)
      )) {
        flushParagraph();
        const chunk = `<div style="text-align: right; margin: 12px 0 2px; font-family: 'Times New Roman', Times, serif; font-size: 15px; font-weight: bold; color: #0f172a;">${escapeHtml(text)}</div>\n`;
        htmlResult += chunk;
        pageCtx.pageHtml += chunk;
        continue;
      }

      // City / Date at Final Page bottom (e.g. New Delhi, July 1, 2026)
      if (pIdx >= pagesData.length - 2 && idx >= lines.length - 6 && (
        /^(?:New\s+Delhi|Chennai|Amaravati|Hyderabad|Mumbai|Bangalore|Bengaluru|Kolkata|Ahmedabad|Allahabad|Lucknow|Chandigarh|Patna|Cuttack|Jabalpur|Jaipur|Jodhpur|Srinagar|Jammu|Shimla|Ranchi|Bilaspur|Nainital|Guwahati)\.?$/i.test(text) ||
        /^(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\.?$/i.test(text) ||
        /^\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December),?\s+\d{4}\.?$/i.test(text) ||
        /^Dated?\s*[:\-]\s*[0-9A-Za-z\s,\.\/\-]+$/i.test(text)
      )) {
        flushParagraph();
        const chunk = `<div style="margin: 6px 0 2px; font-family: 'Times New Roman', Times, serif; font-size: 14.5px; color: #334155;">${escapeHtml(text)}</div>\n`;
        htmlResult += chunk;
        pageCtx.pageHtml += chunk;
        continue;
      }

      // 6. Standard Court Judgment Paragraphs (Continuous, fully justified)
      let courtPara = null;
      const isNumberedDateLine = /^\d{1,2}\s*[\.\/\-]\s*\d{1,2}\s*[\.\/\-]\s*\d{2,4}/.test(text);
      if (!isNumberedDateLine) {
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
      html += `        <td contenteditable="true" style="border: 1px solid #cbd5e1; padding: 12px 16px; vertical-align: top; text-align: justify; text-justify: inter-word; line-height: 1.75; letter-spacing: 0.1px; font-size: 14px; color: #1e293b; width: 50%; cursor: text; user-select: text; -webkit-user-select: text;">${formatted}</td>\n`;
    }
    html += `      </tr>\n`;
  }

  html += `    </tbody>\n  </table>\n</div>\n`;
  return html;
}

// Helper to convert word dates to numbers (e.g. "twenty nineth day of august two thousand and twenty four")
function convertDateWordsToNumbers(text) {
  if (!text) return '';
  const wordMap = {
    first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
    eleventh: 11, twelfth: 12, thirteenth: 13, fourteenth: 14, fifteenth: 15, sixteenth: 16, seventeenth: 17,
    eighteenth: 18, nineteenth: 19, twentieth: 20, 'twenty first': 21, 'twenty-first': 21, 'twenty second': 22,
    'twenty-second': 22, 'twenty third': 23, 'twenty-third': 23, 'twenty fourth': 24, 'twenty-fourth': 24,
    'twenty fifth': 25, 'twenty-fifth': 25, 'twenty sixth': 26, 'twenty-sixth': 26, 'twenty seventh': 27,
    'twenty-seventh': 27, 'twenty eighth': 28, 'twenty-eighth': 28, 'twenty ninth': 29, 'twenty-ninth': 29,
    'twenty nineth': 29, 'thirtieth': 30, 'thirty first': 31, 'thirty-first': 31
  };

  const yearMap = {
    'two thousand and twenty six': 2026,
    'two thousand twenty six': 2026,
    'two thousand and twenty five': 2025,
    'two thousand twenty five': 2025,
    'two thousand and twenty four': 2024,
    'two thousand twenty four': 2024,
    'two thousand and twenty three': 2023,
    'two thousand twenty three': 2023,
    'two thousand and twenty two': 2022,
    'two thousand twenty two': 2022,
    'two thousand and twenty one': 2021,
    'two thousand twenty one': 2021,
    'two thousand and twenty': 2020,
    'two thousand twenty': 2020
  };

  let lower = text.toLowerCase().replace(/\s+/g, ' ');

  for (const [yWord, yNum] of Object.entries(yearMap)) {
    if (lower.includes(yWord)) {
      for (const [dWord, dNum] of Object.entries(wordMap)) {
        const regex = new RegExp(`(?:the\\s+)?${dWord}\\s+day\\s+of\\s+([a-z]+),?\\s+${yWord}`, 'i');
        const m = lower.match(regex);
        if (m) {
          return `${dNum} ${m[1]} ${yNum}`;
        }
      }
    }
  }
  return text;
}

function parseIndianDate(str) {
  if (!str) return null;
  const converted = convertDateWordsToNumbers(str.trim());

  // 1. Match DD.MM.YYYY or DD/MM/YYYY or DD-MM-YYYY
  const numMatch = converted.match(/\b(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{4})\b/);
  if (numMatch) {
    const [_, d, m, y] = numMatch;
    const day = parseInt(d, 10);
    const mon = parseInt(m, 10);
    const yr = parseInt(y, 10);
    if (day >= 1 && day <= 31 && mon >= 1 && mon <= 12 && yr >= 1900 && yr <= 2099) {
      return {
        iso: `${yr}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        year: String(yr)
      };
    }
  }

  // 2. Match DD Month YYYY (e.g. 29 August 2024, 29th August, 2024, 8 November, 1966)
  const dmyMatch = converted.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December),?\s+(\d{4})/i);
  if (dmyMatch) {
    const months = { january: '01', february: '02', march: '03', april: '04', may: '05', june: '06', july: '07', august: '08', september: '09', october: '10', november: '11', december: '12' };
    const d = dmyMatch[1].padStart(2, '0');
    const m = months[dmyMatch[2].toLowerCase()];
    const y = dmyMatch[3];
    return { iso: `${y}-${m}-${d}`, year: y };
  }

  // 3. Match Month DD, YYYY (e.g. July 1, 2026, May 5, 2021)
  const mdyMatch = converted.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/i);
  if (mdyMatch) {
    const months = { january: '01', february: '02', march: '03', april: '04', may: '05', june: '06', july: '07', august: '08', september: '09', october: '10', november: '11', december: '12' };
    const m = months[mdyMatch[1].toLowerCase()];
    const d = mdyMatch[2].padStart(2, '0');
    const y = mdyMatch[3];
    return { iso: `${y}-${m}-${d}`, year: y };
  }

  const d = new Date(converted);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    if (y >= 1900 && y <= 2099) {
      return {
        iso: `${y}-${m}-${day}`,
        year: String(y)
      };
    }
  }
  return null;
}

/**
 * Extracts legal metadata (Court, Title, Parties, Date, Bench, Citation, Act, Section, Issues, Summary)
 */
function extractLegalMetadata(rawText, pagesData = []) {
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
    issues: '',
    importantPoints: '',
    summary: '',
    citations: []
  };

  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const first100Lines = lines.slice(0, 100).join('\n');

  // Multi-page helper collections
  const firstPages = pagesData.slice(0, Math.min(4, pagesData.length));
  const firstPagesLines = firstPages.flatMap(p => (p.lines || []).map(b => b.lineText || '')).filter(Boolean);
  const firstPagesText = firstPagesLines.join('\n');

  const lastPages = pagesData.slice(Math.max(0, pagesData.length - 2));
  const lastPagesLines = lastPages.flatMap(p => (p.lines || []).map(b => b.lineText || '')).filter(Boolean);
  const lastPagesText = lastPagesLines.join('\n');

  // ----------------------------------------------------
  // 1. CITATIONS EXTRACTION
  // ----------------------------------------------------
  const seenCitations = new Set();
  const addCitation = (cit) => {
    if (cit && cit.number && !seenCitations.has(cit.number)) {
      seenCitations.add(cit.number);
      result.citations.push(cit);
    }
  };

  // Supreme Court Neutral Citation (e.g. 2026 INSC 666)
  const inscMatch = rawText.match(/\b(20\d{2})\s+INSC\s+(\d+)\b/i);
  if (inscMatch) {
    addCitation({
      year: inscMatch[1],
      court: 'SC',
      month: '',
      number: `${inscMatch[1]} INSC ${inscMatch[2]}`,
      equivalentText: ''
    });
  }

  // High Court Neutral Citations (e.g. 2024:DHC:1234 or 2024:BHC:567)
  const hcNeutralMatches = [...rawText.matchAll(/\b(20\d{2}):([A-Z]{2,6}(?:-[A-Z]{2,4})?):(\d+)\b/gi)];
  for (const m of hcNeutralMatches.slice(0, 3)) {
    addCitation({
      year: m[1],
      court: m[2].toUpperCase(),
      month: '',
      number: `${m[1]}:${m[2].toUpperCase()}:${m[3]}`,
      equivalentText: ''
    });
  }

  // Indian Kanoon Equivalent Citations (e.g. "Equivalent citations: AIR1967MAD482, [1967]63ITR679(MAD), AIR 1967 MADRAS 433")
  const eqMatch = firstPagesText.match(/Equivalent\s+citations\s*:\s*([^\n\r]+)/i);
  if (eqMatch) {
    const rawCits = eqMatch[1].split(/,\s*/);
    for (const c of rawCits) {
      const clean = c.trim();
      if (!clean) continue;
      const yrMatch = clean.match(/\b(19\d{2}|20\d{2})\b/);
      addCitation({
        year: yrMatch ? yrMatch[1] : '',
        court: '',
        month: '',
        number: clean,
        equivalentText: ''
      });
    }
  }

  // AIR Citations (e.g. AIR 1967 MADRAS 433, AIR 1976 AP 408)
  const airMatches = [...rawText.matchAll(/\bAIR\s*(19\d{2}|20\d{2})\s+([A-Z\s]{2,10})\s+(\d+)\b/gi)];
  for (const m of airMatches.slice(0, 4)) {
    addCitation({
      year: m[1],
      court: m[2].trim(),
      month: '',
      number: `AIR ${m[1]} ${m[2].trim()} ${m[3]}`,
      equivalentText: ''
    });
  }

  // SCC Citations (e.g. (2020) 9 SCC 101, (2006) 8 SCC 212)
  const sccMatches = [...rawText.matchAll(/\((19\d{2}|20\d{2})\)\s*(\d+)\s+SCC\s+(\d+)/gi)];
  for (const m of sccMatches.slice(0, 4)) {
    addCitation({
      year: m[1],
      court: 'SC',
      month: '',
      number: `(${m[1]}) ${m[2]} SCC ${m[3]}`,
      equivalentText: ''
    });
  }

  // ----------------------------------------------------
  // 2. COURT NAME EXTRACTION
  // ----------------------------------------------------
  let detectedCourt = '';
  const top30Lines = (firstPagesLines.length > 0 ? firstPagesLines.slice(0, 30) : lines.slice(0, 30)).join('\n');

  // Check Supreme Court in top header lines or INSC citation
  if (/IN\s+THE\s+SUPREME\s+COURT\s+OF\s+INDIA|REPORTABLE[\s\S]{0,60}IN\s+THE\s+SUPREME\s+COURT/i.test(top30Lines) ||
      (/\bINSC\b/i.test(top30Lines) && !/HIGH\s+COURT/i.test(top30Lines))) {
    detectedCourt = 'Supreme Court of India';
  }

  // Check 25 Indian High Courts in top header lines
  if (!detectedCourt) {
    const hcMap = [
      { pattern: /HIGH\s+COURT\s+OF\s+JUDICATURE\s+AT\s+MADRAS|HIGH\s+COURT\s+OF\s+MADRAS|MADRAS\s+HIGH\s+COURT/i, name: 'Madras High Court' },
      { pattern: /HIGH\s+COURT\s+OF\s+ANDHRA\s+PRADESH|ANDHRA\s+PRADESH\s+HIGH\s+COURT/i, name: 'Andhra Pradesh High Court' },
      { pattern: /HIGH\s+COURT\s+OF\s+JUDICATURE\s+AT\s+BOMBAY|BOMBAY\s+HIGH\s+COURT|HIGH\s+COURT\s+OF\s+BOMBAY/i, name: 'Bombay High Court' },
      { pattern: /HIGH\s+COURT\s+OF\s+DELHI|DELHI\s+HIGH\s+COURT/i, name: 'Delhi High Court' },
      { pattern: /HIGH\s+COURT\s+AT\s+CALCUTTA|CALCUTTA\s+HIGH\s+COURT/i, name: 'Calcutta High Court' },
      { pattern: /HIGH\s+COURT\s+OF\s+JUDICATURE\s+AT\s+ALLAHABAD|ALLAHABAD\s+HIGH\s+COURT|HIGH\s+COURT\s+OF\s+ALLAHABAD/i, name: 'Allahabad High Court' },
      { pattern: /HIGH\s+COURT\s+OF\s+GUJARAT|GUJARAT\s+HIGH\s+COURT/i, name: 'Gujarat High Court' },
      { pattern: /HIGH\s+COURT\s+OF\s+KARNATAKA|KARNATAKA\s+HIGH\s+COURT/i, name: 'Karnataka High Court' },
      { pattern: /HIGH\s+COURT\s+OF\s+KERALA|KERALA\s+HIGH\s+COURT/i, name: 'Kerala High Court' },
      { pattern: /HIGH\s+COURT\s+OF\s+MADHYA\s+PRADESH|MADHYA\s+PRADESH\s+HIGH\s+COURT/i, name: 'Madhya Pradesh High Court' },
      { pattern: /HIGH\s+COURT\s+OF\s+PUNJAB\s+AND\s+HARYANA|PUNJAB\s+AND\s+HARYANA\s+HIGH\s+COURT/i, name: 'Punjab and Haryana High Court' },
      { pattern: /HIGH\s+COURT\s+OF\s+JUDICATURE\s+FOR\s+RAJASTHAN|RAJASTHAN\s+HIGH\s+COURT/i, name: 'Rajasthan High Court' },
      { pattern: /HIGH\s+COURT\s+OF\s+JUDICATURE\s+AT\s+PATNA|PATNA\s+HIGH\s+COURT/i, name: 'Patna High Court' },
      { pattern: /HIGH\s+COURT\s+(?:FOR\s+THE\s+STATE\s+OF\s+)?TELANGANA|TELANGANA\s+HIGH\s+COURT/i, name: 'Telangana High Court' },
      { pattern: /HIGH\s+COURT\s+OF\s+ORISSA|ORISSA\s+HIGH\s+COURT/i, name: 'Orissa High Court' },
      { pattern: /GAUHATI\s+HIGH\s+COURT/i, name: 'Gauhati High Court' },
      { pattern: /HIGH\s+COURT\s+OF\s+CHHATTISGARH|CHHATTISGARH\s+HIGH\s+COURT/i, name: 'Chhattisgarh High Court' },
      { pattern: /HIGH\s+COURT\s+OF\s+JHARKHAND|JHARKHAND\s+HIGH\s+COURT/i, name: 'Jharkhand High Court' },
      { pattern: /HIGH\s+COURT\s+OF\s+UTTARAKHAND|UTTARAKHAND\s+HIGH\s+COURT/i, name: 'Uttarakhand High Court' },
      { pattern: /HIGH\s+COURT\s+OF\s+HIMACHAL\s+PRADESH|HIMACHAL\s+PRADESH\s+HIGH\s+COURT/i, name: 'Himachal Pradesh High Court' },
      { pattern: /HIGH\s+COURT\s+OF\s+JAMMU\s+AND\s+KASHMIR|JAMMU\s+AND\s+KASHMIR\s+HIGH\s+COURT/i, name: 'Jammu & Kashmir High Court' }
    ];

    for (const hc of hcMap) {
      if (hc.pattern.test(top30Lines)) {
        detectedCourt = hc.name;
        break;
      }
    }
  }

  // Check Indian Kanoon / Law Report citations if court is not yet determined
  if (!detectedCourt && result.citations.length > 0) {
    const citString = result.citations.map(c => c.number || '').join(' ');
    if (/\b(?:MADRAS|MAD|\(MAD\))\b/i.test(citString)) detectedCourt = 'Madras High Court';
    else if (/\b(?:BOMBAY|BOM|\(BOM\)|BHC)\b/i.test(citString)) detectedCourt = 'Bombay High Court';
    else if (/\b(?:DELHI|DHC)\b/i.test(citString)) detectedCourt = 'Delhi High Court';
    else if (/\b(?:CALCUTTA|CAL|\(CAL\))\b/i.test(citString)) detectedCourt = 'Calcutta High Court';
    else if (/\b(?:ALLAHABAD|ALL|\(ALL\))\b/i.test(citString)) detectedCourt = 'Allahabad High Court';
    else if (/\b(?:ANDHRA|AP|\(AP\))\b/i.test(citString)) detectedCourt = 'Andhra Pradesh High Court';
    else if (/\b(?:KERALA|KER|\(KER\))\b/i.test(citString)) detectedCourt = 'Kerala High Court';
    else if (/\b(?:PUNJAB|P&H)\b/i.test(citString)) detectedCourt = 'Punjab and Haryana High Court';
    else if (/\b(?:GUJARAT|GUJ)\b/i.test(citString)) detectedCourt = 'Gujarat High Court';
    else if (/\b(?:MADHYA|MP)\b/i.test(citString)) detectedCourt = 'Madhya Pradesh High Court';
    else if (/\b(?:PATNA|PAT)\b/i.test(citString)) detectedCourt = 'Patna High Court';
    else if (/\b(?:ORISSA|ORI)\b/i.test(citString)) detectedCourt = 'Orissa High Court';
    else if (/\b(?:RAJASTHAN|RAJ)\b/i.test(citString)) detectedCourt = 'Rajasthan High Court';
    else if (/\b(?:KARNATAKA|KAR|KANT)\b/i.test(citString)) detectedCourt = 'Karnataka High Court';
    else if (/\b(?:SC|SCC|INSC|SCR)\b/i.test(citString)) detectedCourt = 'Supreme Court of India';
  }

  // Check court official portal hints
  if (!detectedCourt) {
    if (/mhc\.tn\.gov\.in/i.test(rawText)) detectedCourt = 'Madras High Court';
    else if (/aphc\.gov\.in|\bAPHC\d{10,}\b/i.test(rawText)) detectedCourt = 'Andhra Pradesh High Court';
    else if (/delhihighcourt\.nic\.in/i.test(rawText)) detectedCourt = 'Delhi High Court';
    else if (/bombayhighcourt\.nic\.in/i.test(rawText)) detectedCourt = 'Bombay High Court';
    else if (/SUPREME\s+COURT\s+OF\s+INDIA/i.test(rawText)) detectedCourt = 'Supreme Court of India';
  }

  if (detectedCourt) {
    result.court = detectedCourt;
  }

  // ----------------------------------------------------
  // 3. CASE NUMBER & APPEAL NUMBER
  // ----------------------------------------------------
  const candidateLines = (firstPagesLines.length > 0 ? firstPagesLines : lines).slice(0, 60);

  // A. Check for full Appeal + SLP combination: e.g. Crl. A. @ SLP (Crl.) No. 4333 of 2026
  for (const l of candidateLines) {
    const slpA = l.match(/^(?:(?:Crl\.|Civ\.)?\s*A\.\s*@\s*SLP\s*\([^\)]+\)\s*No\.?\s*[0-9\/\s\w\-]+(?:\s*(?:of|\/)\s*[0-9]{4})?)/i);
    if (slpA) {
      result.caseNumber = slpA[0].replace(/\s+/g, ' ').replace(/\s+Page\s+\d+.*$/i, '').trim();
      break;
    }
  }

  // B. Check for standard Appeals, Writs, and Petitions
  if (!result.caseNumber) {
    for (const l of candidateLines) {
      const caseMatch = l.match(/^(?:(?:CRIMINAL|CIVIL)?\s*APPEAL\s*(?:NO\.?|@\s*SLP)?\s*[0-9\/\s\w\-]+(?:\s*(?:OF|\/)\s*[0-9]{4})?|(?:SPECIAL\s+LEAVE\s+PETITION|SLP)\s*\(.*?\)\s*NO\.?\s*[0-9\/\s\w\-]+(?:\s*(?:OF|\/)\s*[0-9]{4})?|(?:WRIT\s+PETITION|W\.?P\.?|CIVIL\s+MISC|C\.?M\.?A\.?|C\.?R\.?P\.?|O\.?S\.?A\.?|F\.?A\.?O\.?|CONTEMPT\s+PETITION|REVIEW\s+APPLICATION|COMPANY\s+APPEAL|TAX\s+APPEAL|COMMERCIAL\s+APPEAL)(?:\s*\([^\)]*\))?\s*(?:NO\.?|NUMBER|NO\s*:)?\s*[0-9\/\s\w\-]+(?:\s*(?:OF|\/)\s*[0-9]{4})?)/i);
      if (caseMatch) {
        let cleaned = caseMatch[0].replace(/\s+/g, ' ').replace(/\s+Page\s+\d+.*$/i, '').trim();
        // If appeal number contains placeholder underscores (e.g. CRIMINAL APPEAL NO. ____ OF 2026), combine with SLP
        if (cleaned.includes('___')) {
          const fullSlp = firstPagesText.match(/\(@?\s*Special\s+Leave\s+Petition\s*\([^\)]+\)\s*NO\.?\s*[0-9\/\s\w\-]+(?:OF\s*[0-9]{4})?\)/i);
          if (fullSlp) {
            cleaned = `${cleaned} ${fullSlp[0]}`.replace(/\s+/g, ' ').trim();
          }
        }
        result.caseNumber = cleaned;
        break;
      }
    }
  }

  // C. Check Indian Kanoon header case number e.g. W.P.No.18346/2024 or W.P. 799 of 1963
  if (!result.caseNumber) {
    const kanoonWp = firstPagesText.match(/\b(W\.?P\.?(?:\s*No\.?|\s+)?\s*\d+\s*(?:of|\/)\s*\d{4}|\bW\.?P\.?\s*No\.?\s*\d+\/\d{4}|\bW\.?P\.?\s*\d+\s+of\s+\d{4})\b/i);
    if (kanoonWp) {
      result.caseNumber = kanoonWp[1].replace(/\s+/g, ' ').trim();
    }
  }

  // D. Check CNR / e-Court filing number e.g. APHC010364302024
  if (!result.caseNumber) {
    const cnr = firstPagesText.match(/\b([A-Z]{4}\d{12})\b/);
    if (cnr) {
      result.caseNumber = cnr[1];
    }
  }

  // 4. DIARY NUMBER
  const diaryMatch = firstPagesText.match(/DIARY\s*NO\.?\s*([0-9\/\s\w\-]+)/i);
  if (diaryMatch) {
    result.diaryNumber = diaryMatch[1].trim();
  }

  // ----------------------------------------------------
  // 5. PARTIES & TITLE (Petitioner vs. Respondent)
  // ----------------------------------------------------
  const searchLines = candidateLines;

  // Pattern A: Indian Kanoon header format: "Petitioner vs. Respondent ... on Date"
  const kanoonHeaderLine = searchLines.slice(0, 5).find(l => /^(?:[A-Z0-9\.\s,–—'\(\)]+)\s+(?:vs\.?|versus|v\/s)\s+(?:[A-Z0-9\.\s,–—'\(\)]+)/i.test(l));
  if (kanoonHeaderLine) {
    const kanoonTitleMatch = kanoonHeaderLine.match(/^(.+?)\s+(?:vs\.?|versus|v\/s)\s+(.+)$/i);
    if (kanoonTitleMatch) {
      const pet = cleanPartyName(kanoonTitleMatch[1]);
      const resp = cleanPartyName(kanoonTitleMatch[2]);
      if (pet && resp) {
        result.petitioner = pet;
        result.respondent = resp;
        result.title = `${pet} vs. ${resp}`;
      }
    }
  }

  // Pattern B: Official Court Cause Title with ... Petitioner(s) / ... Respondent(s)
  if (!result.title) {
    const petIdx = searchLines.findIndex(l => /(?:\.{2,}|\u2026+|\u22EF+|\s*[-–—]\s*)\s*(?:PETITIONERS?|APPELLANTS?)(?:\(s\))?/i.test(l));
    const respIdx = searchLines.findIndex(l => /(?:\.{2,}|\u2026+|\u22EF+|\s*[-–—]\s*)\s*(?:RESPONDENTS?)(?:\(s\))?/i.test(l));
    const vsIdx = searchLines.findIndex(l => /^(?:VS\.?|VERSUS|V\/S|V\.|-?\s*AND\s*-?)$/i.test(l.trim()));

    if (petIdx >= 0) {
      let petLines = [];
      const inlinePet = searchLines[petIdx].replace(/(?:\.{2,}|\u2026+|\u22EF+|\s*[-–—]\s*)\s*(?:PETITIONERS?|APPELLANTS?)(?:\(s\))?/gi, '').trim();

      if (inlinePet && !/^S\/o|^D\/o|^W\/o/i.test(inlinePet)) {
        result.petitioner = cleanPartyName(inlinePet);
      } else if (inlinePet && /^S\/o|^D\/o|^W\/o/i.test(inlinePet)) {
        const prevLine = petIdx > 0 ? searchLines[petIdx - 1].trim() : '';
        result.petitioner = cleanPartyName(`${prevLine} ${inlinePet}`);
      } else {
        for (let j = petIdx - 1; j >= 0 && j >= petIdx - 5; j--) {
          const l = searchLines[j].trim();
          if (/^(?:WRIT|CRIMINAL|CIVIL|APPEAL|PETITION|ORDER|DATED|CORAM|HON'BLE|BEFORE|IN THE|SPECIAL LEAVE|\(@)/i.test(l)) break;
          petLines.unshift(l);
        }
        if (petLines.length > 0) {
          result.petitioner = cleanPartyName(petLines.join(' '));
        }
      }
    }

    if (respIdx >= 0) {
      let respLines = [];
      const startResp = vsIdx >= 0 ? vsIdx + 1 : Math.max(0, respIdx - 6);
      for (let j = startResp; j < respIdx; j++) {
        const l = searchLines[j].trim();
        if (/^(?:PRAYER|ORDER|JUDGMENT|CORAM|WITH\s+)/i.test(l)) break;
        respLines.push(l);
      }

      const inlineResp = searchLines[respIdx].replace(/(?:\.{2,}|\u2026+|\u22EF+|\s*[-–—]\s*)\s*RESPONDENTS?(?:\(s\))?/gi, '').trim();
      if (inlineResp) {
        respLines.push(inlineResp);
      }

      if (respLines.length > 0) {
        let rName = '';
        if (/^\d+[\.\)]\s*/.test(respLines[0])) {
          rName = respLines[0].replace(/^\d+[\.\)]\s*/, '');
          if (respLines.some(l => /^\s*2[\.\)]/i.test(l))) {
            rName += ' & Ors.';
          }
        } else {
          rName = respLines.join(' ');
        }
        result.respondent = cleanPartyName(rName);
      }
    }

    if (result.petitioner && result.respondent) {
      result.title = `${result.petitioner} vs. ${result.respondent}`;
    }
  }

  // Pattern C: Verses divider between lines
  if (!result.title) {
    const versusIdx = searchLines.findIndex(l => /^(?:VERSUS|V\/S|VS\.?|V\.|-?\s*AND\s*-?)$/i.test(l.trim()));
    if (versusIdx > 0 && versusIdx < 50) {
      const petLines = [];
      for (let j = versusIdx - 1; j >= 0 && j >= versusIdx - 4; j--) {
        const line = searchLines[j].trim();
        if (/^\s*\(|^(?:CRIMINAL|CIVIL|WRIT|APPEAL|IN THE|SPECIAL LEAVE|HON'BLE|CORAM|DATED|Between)/i.test(line)) break;
        petLines.unshift(line);
      }

      const respLines = [];
      for (let j = versusIdx + 1; j < searchLines.length && j <= versusIdx + 5; j++) {
        const line = searchLines[j].trim();
        if (/^(?:JUDGMENT|ORDER|CORAM|BEFORE|DATED|PRAYER|Counsel|WITH\s+)/i.test(line)) break;
        respLines.push(line);
      }

      const pet = cleanPartyName(petLines.join(' '));
      const resp = cleanPartyName(respLines.join(' '));
      if (pet) result.petitioner = pet;
      if (resp) result.respondent = resp;
      if (pet && resp) result.title = `${pet} vs. ${resp}`;
    }
  }

  // Fallback regex match across first 100 lines
  if (!result.title) {
    const rawVersus = first100Lines.match(/([A-Z\s\.,]{3,80})\s+(?:VS\.?|VERSUS|V\/S)\s+([A-Z\s\.,]{3,80})/i);
    if (rawVersus) {
      result.petitioner = cleanPartyName(rawVersus[1]);
      result.respondent = cleanPartyName(rawVersus[2]);
      if (result.petitioner && result.respondent) {
        result.title = `${result.petitioner} vs. ${result.respondent}`;
      }
    }
  }

  // ----------------------------------------------------
  // 6. DECISION DATE & YEAR
  // ----------------------------------------------------
  let detectedDate = null;

  // 1. Supreme Court closing signing date on final page (e.g. "New Delhi\nJuly 1, 2026" or "New Delhi, May 5, 2021")
  if (result.court === 'Supreme Court of India' && lastPagesText) {
    const scClosingDate = lastPagesText.match(/(?:New\s+Delhi|Amaravati|Chennai|Mumbai|Kolkata),?\s*[\r\n\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+,?\s+\d{4})/i);
    if (scClosingDate) {
      detectedDate = parseIndianDate(scClosingDate[1]);
    }
  }

  // 2. High Court Order Date in top header (first 15 lines of page 1: e.g. DATED: 27.07.2022 or Order dated : 27.07.2022)
  if (!detectedDate) {
    const headerLinesText = searchLines.slice(0, 15).join('\n');
    const orderDateMatch = headerLinesText.match(/(?:ORDER\s+DATED|DATED|DATE\s+OF\s+DECISION|DATE\s+OF\s+ORDER|DECIDED\s+ON)\s*[:\-]?\s*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{4}|[0-9]{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+,?\s+[0-9]{4})/i);
    if (orderDateMatch) {
      detectedDate = parseIndianDate(orderDateMatch[1]);
    }
  }

  // 3. Indian Kanoon header date (e.g. "... on 8 November, 1966" or ", on 29 August, 2024")
  if (!detectedDate) {
    const kanoonDateMatch = firstPagesText.match(/(?:(?:\.{2,}|\u2026+)?\s*\bon|,\s*\bon)\s+(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December),?\s+\d{4}|\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{4})/i);
    if (kanoonDateMatch) {
      detectedDate = parseIndianDate(kanoonDateMatch[1]);
    }
  }

  // 4. Date written in words in header (e.g. THURSDAY, THE TWENTY NINETH DAY OF AUGUST TWO THOUSAND AND TWENTY FOUR)
  if (!detectedDate) {
    const wordDateMatch = firstPagesText.match(/(?:(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+)?(?:THE\s+)?([A-Z\s\-]+DAY\s+OF\s+[A-Z]+,?\s+[A-Z\s]+(?:TWENTY|THOUSAND)[A-Z\s]+)/i);
    if (wordDateMatch) {
      detectedDate = parseIndianDate(wordDateMatch[1]);
    }
  }

  // 5. Closing signing date on last 2 pages for any court
  if (!detectedDate && lastPagesText) {
    const closingDateMatch = lastPagesText.match(/(?:New\s+Delhi|Chennai|Amaravati|Mumbai|Kolkata|Chandigarh|Cuttack|Jabalpur|Jodhpur|Hyderabad|Bengaluru),?\s*[\r\n\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+,?\s+\d{4})/i);
    if (closingDateMatch) {
      detectedDate = parseIndianDate(closingDateMatch[1]);
    }
  }

  if (detectedDate) {
    result.judgmentDate = detectedDate.iso;
    result.year = detectedDate.year;
  }

  // ----------------------------------------------------
  // 7. BENCH / CORAM / JUDGES
  // ----------------------------------------------------
  let detectedBench = '';

  // A. Check PRESENT / CORAM block in first pages
  const coramBlock = firstPagesText.match(/(?:PRESENT|CORAM|BEFORE)\s*[:\-]?\s*([\s\S]{10,400}?)(?:\n\s*\n|WRIT|APPEAL|Between|PRAYER|JUDGMENT|ORDER|Case\s+No)/i);
  if (coramBlock) {
    const rawJudges = coramBlock[1]
      .split('\n')
      .map(l => l.trim())
      .filter(l => /(?:HON['’]BLE|HONOURABLE|JUSTICE|CHIEF\s+JUSTICE)/i.test(l));
    if (rawJudges.length > 0) {
      const formatted = rawJudges.map(j => {
        let name = j.replace(/THE\s+HONOURABLE|HONOURABLE|HON['’]BLE|THE|MR\.|MS\.|DR\.|SRI/gi, '').replace(/\s+/g, ' ').trim();
        if (/CHIEF\s+JUSTICE/i.test(j)) {
          return `Hon'ble The Chief Justice ${name.replace(/CHIEF\s+JUSTICE/gi, '').trim()}`;
        }
        return `Hon'ble Mr. Justice ${name.replace(/JUSTICE/gi, '').trim()}`;
      });
      detectedBench = formatted.join(' & ');
    }
  }

  // B. Multi-judge Constitution Bench
  if (!detectedBench && (/Constitution\s+Bench/i.test(firstPagesText) || /Constitution\s+Bench/i.test(rawText))) {
    detectedBench = 'Constitution Bench (5-Judge Bench)';
  }

  // C. Indian Kanoon Bench / Author metadata
  if (!detectedBench) {
    const benchMetaMatch = firstPagesText.match(/^Bench\s*:\s*(.+)$/im);
    const authorMetaMatch = firstPagesText.match(/^Author\s*:\s*(.+)$/im);
    if (benchMetaMatch) {
      const names = benchMetaMatch[1].split(',').map(n => n.trim()).filter(Boolean);
      detectedBench = names.map(n => `Hon'ble Mr. Justice ${n}`).join(' & ');
    } else if (authorMetaMatch) {
      detectedBench = `Hon'ble Mr. Justice ${authorMetaMatch[1].trim()}`;
    }
  }

  // D. Signatures on final 2 pages (e.g. …………………………………… J. \n (SANJAY KAROL))
  if (!detectedBench && lastPagesText) {
    const sigMatches = [
      ...lastPagesText.matchAll(/(?:(?:\.{3,}|…+|―+|-+)\s*J\.?\s*[\r\n\s]*[\(\[]\s*([A-Z\.\s]{3,50})\s*[\)\]]|[\(\[]\s*([A-Z\.\s]{3,50})\s*[\)\]]\s*[\r\n\s]*(?:\.{3,}|…+|―+|-+)\s*J\.?)/gi)
    ];
    if (sigMatches.length > 0) {
      const judges = sigMatches.map(m => {
        const raw = (m[1] || m[2]).trim();
        const formatted = raw.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase());
        return `Hon'ble Mr. Justice ${formatted}`;
      });
      detectedBench = judges.join(' & ');
    }
  }

  // E. Author line right below JUDGMENT
  if (!detectedBench) {
    const authorMatch = firstPagesText.match(/J\s*U\s*D\s*G\s*M\s*E\s*N\s*T\s*[\r\n]+\s*([A-Z\.\s]{3,40}),?\s*J\.?/i) ||
                        rawText.match(/(?:The\s+Judgment\s+of\s+the\s+Court\s+was\s+delivered\s+by|JUDGMENT\s+DELIVERED\s+BY)\s*[:\-]?\s*([^\n\r]+)/i);
    if (authorMatch) {
      const raw = authorMatch[1].replace(/,?\s*J\.?$/i, '').trim();
      const formatted = raw.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase());
      detectedBench = `Hon'ble Mr. Justice ${formatted}`;
    }
  }

  if (detectedBench) {
    result.bench = detectedBench;
  }

  // ----------------------------------------------------
  // 8. ACTS & SECTIONS
  // ----------------------------------------------------
  const actCandidates = [
    { name: 'Bharatiya Nagarik Suraksha Sanhita, 2023', pattern: /\b(?:Bharatiya\s+Nagarik\s+Suraksha\s+Sanhita|BNSS)\b/i },
    { name: 'Code of Criminal Procedure, 1973', pattern: /\b(?:Code\s+of\s+Criminal\s+Procedure|Cr\.?P\.?C\.?)\b/i },
    { name: 'Bharatiya Nyaya Sanhita, 2023', pattern: /\b(?:Bharatiya\s+Nyaya\s+Sanhita|BNS)\b/i },
    { name: 'Indian Penal Code, 1860', pattern: /\b(?:Indian\s+Penal\s+Code|IPC)\b/i },
    { name: 'Bharatiya Sakshya Adhiniyam, 2023', pattern: /\b(?:Bharatiya\s+Sakshya\s+Adhiniyam|BSA)\b/i },
    { name: 'Indian Evidence Act, 1872', pattern: /\b(?:Indian\s+Evidence\s+Act|Evidence\s+Act)\b/i },
    { name: 'Constitution of India', pattern: /\bConstitution\s+of\s+India\b|Article\s+\d+/i },
    { name: 'Registration Act, 1908', pattern: /\bRegistration\s+Act\b/i },
    { name: 'Payment of Taxes (Transfer of Property) Act, 1949', pattern: /\bPayment\s+of\s+Taxes\s*\(Transfer\s+of\s+Property\)\s*Act\b/i },
    { name: 'Prevention of Corruption Act, 1988', pattern: /\bPrevention\s+of\s+Corruption\s+Act\b/i },
    { name: 'Prevention of Money Laundering Act, 2002', pattern: /\bPrevention\s+of\s+Money\s+Laundering\s+Act\b|\bPMLA\b/i },
    { name: 'Tamil Nadu Co-operative Societies Act, 1983', pattern: /\b(?:Tamil\s+Nadu\s+Co-?operative\s+Societies\s+Act|Co-?operative\s+Societies\s+Act)\b/i },
    { name: 'Maharashtra State Reservation (SEBC) Act', pattern: /\bMaharashtra\s+State\s+Reservation.+?Act\b/i },
    { name: 'Negotiable Instruments Act, 1881', pattern: /\bNegotiable\s+Instruments\s+Act\b|\bNI\s+Act\b/i },
    { name: 'Arbitration and Conciliation Act, 1996', pattern: /\bArbitration\s+and\s+Conciliation\s+Act\b/i },
    { name: 'Companies Act, 2013', pattern: /\bCompanies\s+Act\b/i },
    { name: 'Specific Relief Act, 1963', pattern: /\bSpecific\s+Relief\s+Act\b/i },
    { name: 'Code of Civil Procedure, 1908', pattern: /\b(?:Code\s+of\s+Civil\s+Procedure|CPC)\b/i },
    { name: 'Motor Vehicles Act, 1988', pattern: /\bMotor\s+Vehicles\s+Act\b/i },
    { name: 'Protection of Children from Sexual Offences Act, 2012', pattern: /\b(?:Protection\s+of\s+Children\s+from\s+Sexual\s+Offences|POCSO)\b/i },
    { name: 'Narcotic Drugs and Psychotropic Substances Act, 1985', pattern: /\b(?:Narcotic\s+Drugs\s+and\s+Psychotropic\s+Substances|NDPS)\b/i }
  ];

  for (const a of actCandidates) {
    if (a.pattern.test(rawText)) {
      result.act = a.name;
      break;
    }
  }

  const sectionsList = [];
  const secMatches = [...rawText.matchAll(/\b(?:Section|Sec\.|Sections)\s+([0-9A-Za-z,\s\(\)\/]+?)(?=\s+(?:of|read|and|\.|;))/gi)];
  for (const m of secMatches.slice(0, 3)) {
    const clean = `Section ${m[1].replace(/\s+/g, ' ').trim()}`;
    if (!sectionsList.includes(clean) && clean.length < 35) {
      sectionsList.push(clean);
    }
  }

  const artMatches = [...rawText.matchAll(/\bArticle\s+([0-9A-Za-z\(\)]+)\b/gi)];
  for (const m of artMatches.slice(0, 2)) {
    const clean = `Article ${m[1]}`;
    if (!sectionsList.includes(clean)) {
      sectionsList.push(clean);
    }
  }

  if (sectionsList.length > 0) {
    result.section = sectionsList.slice(0, 3).join(', ');
  }

  // ----------------------------------------------------
  // 9. HEADNOTE / SUMMARY / ISSUES
  // ----------------------------------------------------
  let openingFact = '';

  // Look for explicit Prayer or introductory statement
  const prayerMatch = rawText.match(/(?:PRAYER\s*[:\-]\s*)([\s\S]{30,400}?)(?=\n\s*(?:For\s+|Counsel|\d+\.|\*|ORDER|JUDGMENT))/i);
  if (prayerMatch) {
    openingFact = prayerMatch[1].replace(/\s+/g, ' ').trim();
  }

  if (!openingFact) {
    const introductoryMatch = rawText.match(/(?:(?:The\s+present\s+appeal|This\s+appeal|These\s+two\s+writ\s+petitions|This\s+writ\s+petition|Leave\s+granted[\.\s]+The\s+present|This\s+Constitution\s+Bench)[\s\S]{30,400}?)(?=\n\s*\n|\.\s+[A-Z0-9])/i);
    if (introductoryMatch) {
      openingFact = introductoryMatch[0].replace(/\s+/g, ' ').trim();
    }
  }

  if (!openingFact) {
    const substantiveParas = rawText.split(/\n\s*\n/).map(p => p.trim()).filter(p =>
      p.length > 80 &&
      !/^(?:IN THE|BEFORE|CORAM|DATED|W\.?P\.?|CIVIL APPEAL|CRIMINAL APPEAL|REPORTABLE|Equivalent|Author|Bench|\d+$|Order dated)/i.test(p) &&
      !p.includes('APHC010364302024') &&
      !p.includes('IN THE HIGH COURT') &&
      !p.includes('IN THE SUPREME COURT')
    );
    if (substantiveParas.length > 0) {
      openingFact = substantiveParas[0].replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    }
  }

  openingFact = openingFact.slice(0, 350).trim();

  let disposition = '';
  const lastLinesList = lastPagesText.split('\n').map(l => l.trim()).filter(Boolean);
  const dispLine = lastLinesList.slice(-20).find(l =>
    /(?:writ petition|appeal|petitions?)\s+(?:is|are)\s+(?:allowed|dismissed|disposed of)|rule is made absolute|order accordingly|Leave granted/i.test(l)
  );
  if (dispLine) {
    disposition = dispLine.replace(/\s+/g, ' ').trim();
  }

  const summaryParts = [];
  if (openingFact) summaryParts.push(openingFact);
  if (result.act) summaryParts.push(`Key statutory provisions under consideration: ${result.act}${result.section ? ` (${result.section})` : ''}.`);
  if (disposition) summaryParts.push(`Held: ${disposition}`);

  result.summary = summaryParts.join(' ');

  // Framed questions / Issues
  const issuesBlock = rawText.match(/(?:\(\d+\)\s*Questions\s+Framed|Points\s+for\s+determination|Issues\s+for\s+consideration)\s*[:\-]?\s*([\s\S]{20,500}?)(?:\(\d+\)|\n\s*\n\s*\n)/i);
  if (issuesBlock) {
    result.issues = issuesBlock[1].replace(/\s+/g, ' ').trim();
  }

  return result;
}

function cleanPartyName(name) {
  if (!name) return '';
  return name
    .replace(/^(?:IN THE|BEFORE|COURT OF|APPEAL NO|HON'BLE|CRIMINAL|CIVIL|WRIT|ORDER|JUDGMENT)[^\n\r]*?:/i, '')
    .replace(/(?:\.{2,}|\u2026+|\u22EF+|\s*[-–—]\s*|\s*~+\s*|\s*\.\.\.\s*)\s*(?:APPELLANTS?|PETITIONERS?|RESPONDENTS?|ACCUSED|STATE|DEFENDANTS?|PLAINTIFFS?)(?:\(s\))?/gi, '')
    .replace(/\b(?:APPELLANTS?|PETITIONERS?|RESPONDENTS?|ACCUSED|STATE)\b\s*\(s\)?$/gi, '')
    .replace(/\s*(?:\.{2,}|\u2026+)?\s*on\s+\d+.*$/i, '') // Indian Kanoon '... on 8 November 1966'
    .replace(/,\s*on\s+\d+.*$/i, '') // Indian Kanoon ', on 29 August 2024'
    .replace(/\bWITH\s+(?:CIVIL|CRIMINAL|WRIT|APPEAL|SLP).*$/is, '') // Strip connected appeals
    .replace(/^\d+[\.\)]\s*/, '') // Strip leading list numbers like '1.' or '1)'
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
