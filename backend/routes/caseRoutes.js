import express from 'express';
import multer from 'multer';
import { extractJudgmentFromBuffer } from '../utils/pdfExtractor.js';
import { getCases, getCaseById, createCase, updateCase, deleteCase, toggleCaseStatus } from '../controllers/caseController.js';
import { checkCitation } from '../controllers/adminController.js';

const router = express.Router();

// 100% In-Memory Multer setup (Zero disk persistence, zero cache)
const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 35 * 1024 * 1024 } // up to 35MB
});

// In-Memory PDF Extraction Route
router.post('/extract-pdf', uploadMemory.single('pdf'), async (req, res) => {
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ status: 'error', message: 'No PDF file uploaded for extraction' });
  }

  try {
    const extractedData = await extractJudgmentFromBuffer(req.file.buffer);
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
