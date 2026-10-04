import express from 'express';
import multer from 'multer';
import { extractJudgmentFromBuffer } from '../utils/pdfExtractor.js';
import { sanitizePdfBuffer } from '../utils/pdfSanitizer.js';
import { getCases, getCaseById, createCase, updateCase, deleteCase, toggleCaseStatus } from '../controllers/caseController.js';
import { checkCitation } from '../controllers/adminController.js';

const router = express.Router();

// 100% In-Memory Multer setup (Zero disk persistence, zero cache)
const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 35 * 1024 * 1024 } // up to 35MB
});

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// In-Memory PDF Extraction & Original File Preservation Route
router.post('/extract-pdf', uploadMemory.single('pdf'), async (req, res) => {
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ status: 'error', message: 'No PDF file uploaded for extraction' });
  }

  try {
    const rawName = (req.file.originalname || 'judgment.pdf').replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const filename = `pdf_${Date.now()}_${rawName}`;
    const filePath = path.join(uploadDir, filename);
    const cleanBuffer = await sanitizePdfBuffer(req.file.buffer);
    fs.writeFileSync(filePath, cleanBuffer);

    const relativePdfUrl = `uploads/${filename}`;
    const extractedData = await extractJudgmentFromBuffer(cleanBuffer);
    
    extractedData.pdf_file = relativePdfUrl;
    extractedData.pdf_file_path = relativePdfUrl;

    return res.json({
      status: 'success',
      message: 'Judgment extracted successfully from PDF',
      data: extractedData
    });
  } catch (err) {
    console.error('PDF extraction error:', err);
    return res.status(500).json({
      status: 'error',
      message: err.message || 'Failed to extract judgment data from PDF'
    });
  }
});

// Citation duplicate validation route (fast, public/admin)
router.get('/check-citation', checkCitation);

// Cases Management Routes
router.get('/', getCases);
router.post('/', createCase);
router.get('/:id', getCaseById);
router.put('/:id', updateCase);
router.delete('/:id', deleteCase);
router.put('/:id/status', toggleCaseStatus);

export default router;
