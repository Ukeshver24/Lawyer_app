import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument, rgb } from 'pdf-lib';
import QRCode from 'qrcode';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Stamps an authentic judgment PDF with an interactive scannable QR Code
 * Replaces the Supreme Court's static plain-text citation QR code on Page 1
 * with a high-resolution QR code pointing directly to:
 * https://law.gradixtech.com/judgment/{caseId}?open_pdf=1
 */
export async function stampJudgmentPdf(filePath, caseId) {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }

    const buffer = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    if (pdfDoc.getPageCount() === 0) return false;

    const page = pdfDoc.getPage(0);
    const pageHeight = page.getHeight();
    const pageWidth = page.getWidth();

    const targetUrl = `https://law.gradixtech.com/judgment/${caseId}?open_pdf=1`;
    const qrPngBuffer = await QRCode.toBuffer(targetUrl, {
      margin: 0,
      width: 320,
      color: { dark: '#000000', light: '#FFFFFF' }
    });
    const qrImage = await pdfDoc.embedPng(qrPngBuffer);

    // Standard Supreme Court Page 1 top-left QR code position
    const scaleX = pageWidth / 612;
    const scaleY = pageHeight / 792;

    const qrX = 50 * scaleX;
    const qrY = 716 * scaleY;
    const qrW = 73 * scaleX;
    const qrH = 73 * scaleY;

    // 1. Cover old Supreme Court plain-text QR code with clean white box
    page.drawRectangle({
      x: qrX - 2,
      y: qrY - 2,
      width: qrW + 4,
      height: qrH + 4,
      color: rgb(1, 1, 1)
    });

    // 2. Draw our interactive high-resolution QR code
    page.drawImage(qrImage, {
      x: qrX,
      y: qrY,
      width: qrW,
      height: qrH
    });

    const stampedBytes = await pdfDoc.save();
    fs.writeFileSync(filePath, Buffer.from(stampedBytes));
    logger.info(`Stamped PDF for Case ${caseId} with QR URL: ${targetUrl}`);
    return true;
  } catch (err) {
    logger.error(`Error stamping PDF for Case ${caseId}:`, err);
    return false;
  }
}
