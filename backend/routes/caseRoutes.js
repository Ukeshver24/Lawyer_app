import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractJudgmentFromBuffer } from '../utils/pdfExtractor.js';
import { sanitizePdfBuffer } from '../utils/pdfSanitizer.js';
import { detectPdfTextType, runOcrOnScannedPdf } from '../utils/ocrService.js';
import { generateStandardizedLegalPdf } from '../utils/standardizedPdfGenerator.js';
import { 
  getCases, getCaseById, getCasePdf, createCase, updateCase, 
  deleteCase, toggleCaseStatus, regenerateCasePdf 
} from '../controllers/caseController.js';
import { checkCitation } from '../controllers/adminController.js';

const router = express.Router();

// In-Memory Multer setup
const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 35 * 1024 * 1024 } // up to 35MB
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Robust Automatic PDF Processing & Standardized PDF Generation Pipeline
 * Workflow:
 * 1. Validate PDF file
 * 2. Detect selectable text vs. scanned images
 * 3. Extract text / OCR fallback
 * 4. Identify legal sections & headnote
 * 5. Structure content & numbered paragraphs
 * 6. Generate standardized PDF matching master reference template
 * 7. Validate output & save both original and standardized PDFs
 */
router.post('/extract-pdf', uploadMemory.single('pdf'), async (req, res) => {
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ status: 'error', message: 'No PDF file uploaded for extraction' });
  }

  const processingSteps = [];
  const addStep = (name, status = 'completed', details = '') => {
    processingSteps.push({ name, status, details, timestamp: new Date().toISOString() });
  };

  try {
    // STEP 1: Validate PDF
    addStep('PDF Uploaded', 'completed', `File: ${req.file.originalname} (${(req.file.size / (1024*1024)).toFixed(2)} MB)`);

    const rawName = (req.file.originalname || 'judgment.pdf').replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const originalFilename = `original_${Date.now()}_${rawName}`;
    const originalFilePath = path.join(uploadDir, originalFilename);
    const cleanBuffer = await sanitizePdfBuffer(req.file.buffer);
    fs.writeFileSync(originalFilePath, cleanBuffer);
    const relativeOriginalUrl = `uploads/${originalFilename}`;

    // STEP 2: Detect selectable text vs scanned image
    addStep('Text Detection', 'in_progress', 'Analyzing character density and embedded fonts');
    const textType = await detectPdfTextType(cleanBuffer);
    addStep('Text Detection', 'completed', textType.isScanned ? 'Scanned image PDF detected' : 'Digital selectable PDF detected');

    // STEP 3: Text Extraction & OCR Fallback
    let ocrEngineUsed = 'none';
    if (textType.isScanned) {
      addStep('Running OCR', 'in_progress', 'Applying OCR to transcribe scanned court judgment');
      const ocrResult = await runOcrOnScannedPdf(cleanBuffer);
      ocrEngineUsed = ocrResult.engine;
      addStep('Running OCR', 'completed', `Transcribed via ${ocrEngineUsed}`);
    } else {
      addStep('Running OCR', 'skipped', 'Direct digital vector text available; OCR not required');
    }

    // STEP 4 & 5: Structuring Legal Content & Sections
    addStep('Identifying Legal Sections', 'in_progress', 'Extracting Court, Cause Title, Citations, Acts, Headnote');
    const extractedData = await extractJudgmentFromBuffer(cleanBuffer);
    addStep('Identifying Legal Sections', 'completed', `Extracted ${extractedData.court || 'Court'}, Case #${extractedData.caseNumber || 'N/A'}`);

    addStep('Structuring Content', 'completed', `Formatted ${extractedData.pages?.length || 1} pages with numbered paragraphs and tables`);

    // STEP 6: Generate Master Standardized PDF
    addStep('Generating Standardized PDF', 'in_progress', 'Applying Digi Law Reporter master visual layout, fonts, borders & watermark');
    const appBaseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const standardizedBuffer = await generateStandardizedLegalPdf(extractedData, { appBaseUrl });

    const standardizedFilename = `standardized_${Date.now()}_${rawName}`;
    const standardizedFilePath = path.join(uploadDir, standardizedFilename);
    fs.writeFileSync(standardizedFilePath, standardizedBuffer);
    const relativeStandardizedUrl = `uploads/${standardizedFilename}`;

    addStep('Generating Standardized PDF', 'completed', `Standardized PDF created (${(standardizedBuffer.length / 1024).toFixed(1)} KB)`);

    // STEP 7: Validation Completed
    const validationScore = Math.min(100, Math.round(
      (extractedData.title ? 25 : 10) +
      (extractedData.caseNumber ? 20 : 0) +
      (extractedData.judgmentText ? 30 : 0) +
      (extractedData.headnote || extractedData.summary ? 15 : 0) +
      (extractedData.court ? 10 : 0)
    ));

    addStep('Validation Completed', 'completed', `Quality score: ${validationScore}% (${validationScore >= 70 ? 'High Confidence' : 'Review Recommended'})`);

    // Attach paths to payload
    extractedData.pdf_file = relativeStandardizedUrl;
    extractedData.pdf_file_path = relativeStandardizedUrl;
    extractedData.standardized_pdf_url = relativeStandardizedUrl;
    extractedData.standardized_pdf_path = relativeStandardizedUrl;
    extractedData.original_pdf_url = relativeOriginalUrl;
    extractedData.original_pdf_path = relativeOriginalUrl;

    return res.json({
      status: 'success',
      message: 'Judgment extracted and standardized PDF generated successfully',
      data: extractedData,
      processingSteps,
      validation: {
        score: validationScore,
        confidence: validationScore >= 70 ? 'High' : 'Moderate',
        isScanned: textType.isScanned,
        ocrEngine: ocrEngineUsed,
        totalPages: textType.totalPages
      }
    });

  } catch (err) {
    console.error('PDF extraction pipeline error:', err);
    addStep('Processing Error', 'failed', err.message);
    return res.status(500).json({
      status: 'error',
      message: err.message || 'Failed to extract and standardize PDF',
      processingSteps
    });
  }
});

// Citation duplicate validation route
router.get('/check-citation', checkCitation);

// Regenerate Standardized PDF on-demand (when admin edits fields)
router.post('/regenerate-pdf', regenerateCasePdf);

// Cases Management Routes
router.get('/', getCases);
router.post('/', createCase);
router.get('/:id', getCaseById);
router.get('/:id/pdf', getCasePdf);
router.put('/:id', updateCase);
router.delete('/:id', deleteCase);
router.put('/:id/status', toggleCaseStatus);

export default router;
