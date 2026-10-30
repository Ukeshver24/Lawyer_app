import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createWorker } from 'tesseract.js';
import { GoogleGenAI } from '@google/genai';

/**
 * Detects whether a PDF contains selectable machine-readable text or is a scanned image PDF.
 * 
 * @param {Buffer} pdfBuffer - Raw PDF file buffer
 * @returns {Promise<{ isScanned: boolean, totalPages: number, charCount: number, avgCharsPerPage: number }>}
 */
export async function detectPdfTextType(pdfBuffer) {
  if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer)) {
    throw new Error('Invalid PDF buffer provided for text detection');
  }

  const uint8 = new Uint8Array(pdfBuffer);
  const loadingTask = pdfjsLib.getDocument({
    data: uint8,
    useSystemFonts: true,
    disableFontFace: true
  });

  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;

  let totalChars = 0;
  for (let i = 1; i <= Math.min(totalPages, 10); i++) {
    const page = await pdfDoc.getPage(i);
    const content = await page.getTextContent();
    const str = content.items.map(it => it.str || '').join(' ').trim();
    totalChars += str.length;
  }

  const samplePages = Math.min(totalPages, 10);
  const avgCharsPerPage = samplePages > 0 ? Math.round(totalChars / samplePages) : 0;

  // If a legal document has fewer than 60 characters per page on average, it is a scanned image
  const isScanned = avgCharsPerPage < 60;

  return {
    isScanned,
    totalPages,
    charCount: totalChars,
    avgCharsPerPage
  };
}

/**
 * Runs OCR on a scanned PDF buffer using Gemini Multimodal or Tesseract.js fallback.
 * 
 * @param {Buffer} pdfBuffer 
 * @returns {Promise<{ text: string, pages: Array<{ pageNum: number, text: string }>, engine: string }>}
 */
export async function runOcrOnScannedPdf(pdfBuffer) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  // 1. First-class OCR: Gemini Vision Multimodal
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const base64Pdf = pdfBuffer.toString('base64');

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
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
                text: `You are an OCR and Legal Document Transcription system for Indian Legal Judgments.
This PDF is a scanned document. Extract and transcribe EVERY SINGLE WORD faithfully and accurately from all pages.
Do not omit any paragraphs, numbers, names, dates, statutory provisions, or tables.
Format output as clean text, preserving original paragraph numbers (1., 2., 3...) and section names.`
              }
            ]
          }
        ]
      });

      const extractedText = response.text ? response.text.trim() : '';
      if (extractedText && extractedText.length > 100) {
        return {
          text: extractedText,
          engine: 'gemini-vision-ocr'
        };
      }
    } catch (geminiErr) {
      console.warn('Gemini OCR fallback to local engine:', geminiErr.message);
    }
  }

  // 2. Offline Fallback: Tesseract.js OCR
  try {
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(pdfBuffer);
    await worker.terminate();

    return {
      text: text || '',
      engine: 'tesseract-ocr'
    };
  } catch (tessErr) {
    console.warn('Tesseract OCR error:', tessErr.message);
    return {
      text: '',
      engine: 'none'
    };
  }
}
