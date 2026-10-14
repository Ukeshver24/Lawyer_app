import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument, rgb } from 'pdf-lib';
import QRCode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function stampFile(filePath, caseId = 12) {
  try {
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

    const scaleX = pageWidth / 612;
    const scaleY = pageHeight / 792;

    const qrX = 60.5 * scaleX;
    const qrY = 720.0 * scaleY;
    const qrW = 66.0 * scaleX;
    const qrH = 66.0 * scaleY;

    // 1. Cover old Supreme Court plain-text QR code with white box
    page.drawRectangle({
      x: qrX - 1.5,
      y: qrY - 1.5,
      width: qrW + 3.0,
      height: qrH + 3.0,
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
    console.log(`✅ STAMPED: ${filePath} -> ${targetUrl} (Size: ${stampedBytes.length} bytes)`);
    return true;
  } catch (e) {
    console.error(`❌ Failed to stamp ${filePath}:`, e.message);
    return false;
  }
}

// Find and stamp all pdf files in all upload directories on the server
const searchDirs = [
  path.join(__dirname, 'uploads'),
  '/www/wwwroot/law_backend/uploads',
  '/www/wwwroot/law_backend/backend/uploads',
  '/www/wwwroot/lawyer_app_new/backend/uploads',
  '/www/wwwroot/law.gradixtech.com/uploads'
];

console.log('Scanning directories for judgment PDFs to stamp...');
let totalStamped = 0;

for (const dir of searchDirs) {
  if (fs.existsSync(dir)) {
    console.log(`Checking directory: ${dir}`);
    const files = fs.readdirSync(dir);
    for (const f of files) {
      if (f.endsWith('.pdf')) {
        const full = path.join(dir, f);
        const ok = await stampFile(full, 12);
        if (ok) totalStamped++;
      }
    }
  }
}

console.log(`\n🎉 Finished! Total stamped PDFs: ${totalStamped}`);
