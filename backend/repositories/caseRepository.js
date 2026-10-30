import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../config/db.js';
import logger from '../utils/logger.js';
import { fastCache } from '../utils/cache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all cases (with optional status filter & pagination) from PostgreSQL
export const getAllCasesFromDb = async ({ status, limit = 50, offset = 0 }) => {
  const cacheKey = `cases:list:${status || 'all'}:${limit}:${offset}`;
  const cached = fastCache.get(cacheKey);
  if (cached) return cached;

  // Optimized column selection omitting heavy judgment_text and search_vector for ultra-fast transfer
  let sql = `
    SELECT 
      id, case_number, title, petitioner, respondent, court, 
      judgment_date, year, act, section, head_note, status, citations, 
      pdf_file, pdf_file_path, original_pdf_path, extracted_data, processing_status,
      use_professional_font, font_family,
      created_at, updated_at 
    FROM cases
  `;
  const values = [];

  if (status) {
    values.push(status);
    sql += ` WHERE status = $1`;
  }

  sql += ` ORDER BY judgment_date DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  values.push(parseInt(limit, 10), parseInt(offset, 10));

  const res = await query(sql, values);
  const data = res.rows;
  fastCache.set(cacheKey, data, 45000); // 45s fast cache
  return data;
};

// Get single case by ID from PostgreSQL
export const getCaseByIdFromDb = async (id) => {
  const cacheKey = `cases:single:${id}`;
  const cached = fastCache.get(cacheKey);
  if (cached) return cached;

  const numericId = parseInt(id, 10);
  let res;
  if (!isNaN(numericId)) {
    res = await query(`SELECT * FROM cases WHERE id = $1 OR id::text = $2`, [numericId, String(id)]);
  } else {
    res = await query(`SELECT * FROM cases WHERE id::text = $1`, [String(id)]);
  }
  
  const caseItem = (res && res.rows && res.rows.length > 0) ? res.rows[0] : null;
  if (caseItem) {
    fastCache.set(cacheKey, caseItem, 60000);
  }
  return caseItem;
};

// Create new case precedent in PostgreSQL
export const createCaseInDb = async (caseData) => {
  const {
    caseNumber, title, petitioner, respondent, court, judgmentDate,
    year, act, section, headNote, judgmentText, status, citations,
    pdf_file, pdf_file_path, original_pdf_path, extracted_data, processing_status,
    use_professional_font, font_family
  } = caseData;

  const validDate = judgmentDate && String(judgmentDate).trim().length >= 8 
    ? String(judgmentDate).trim() 
    : new Date().toISOString().split('T')[0];
  const validYear = parseInt(year || (validDate ? validDate.substring(0, 4) : '2026'), 10) || new Date().getFullYear();

  const sql = `
    INSERT INTO cases (
      case_number, title, petitioner, respondent, court, judgment_date,
      year, act, section, head_note, judgment_text, status, citations,
      pdf_file, pdf_file_path, original_pdf_path, extracted_data, processing_status,
      use_professional_font, font_family
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14, $15, $16, $17::jsonb, $18, $19, $20)
    RETURNING *
  `;

  const values = [
    caseNumber,
    title,
    petitioner || null,
    respondent || null,
    court || 'Supreme Court of India',
    validDate,
    validYear,
    act || null,
    section || null,
    headNote || null,
    judgmentText || null,
    status || 'Published',
    JSON.stringify(citations || []),
    pdf_file || pdf_file_path || null,
    pdf_file_path || pdf_file || null,
    original_pdf_path || null,
    extracted_data ? (typeof extracted_data === 'string' ? extracted_data : JSON.stringify(extracted_data)) : null,
    processing_status || 'completed',
    use_professional_font !== undefined ? Boolean(use_professional_font) : false,
    font_family || 'times'
  ];

  const res = await query(sql, values);
  fastCache.invalidatePrefix('cases:');
  fastCache.invalidatePrefix('search:');
  return res.rows[0];
};

// Update case precedent in PostgreSQL
export const updateCaseInDb = async (id, caseData) => {
  const {
    caseNumber, title, petitioner, respondent, court, judgmentDate,
    year, act, section, headNote, judgmentText, status, citations,
    pdf_file, pdf_file_path, original_pdf_path, extracted_data, processing_status,
    use_professional_font, font_family
  } = caseData;

  const numericId = parseInt(id, 10);
  const validDate = judgmentDate && String(judgmentDate).trim().length >= 8 
    ? String(judgmentDate).trim() 
    : new Date().toISOString().split('T')[0];
  const validYear = parseInt(year || (validDate ? validDate.substring(0, 4) : '2026'), 10) || new Date().getFullYear();

  const sql = `
    UPDATE cases
    SET 
      case_number = $1, title = $2, petitioner = $3, respondent = $4,
      court = $5, judgment_date = $6, year = $7, act = $8, section = $9,
      head_note = $10, judgment_text = $11, status = $12, citations = $13::jsonb,
      pdf_file = COALESCE($14, pdf_file), pdf_file_path = COALESCE($15, pdf_file_path),
      original_pdf_path = COALESCE($16, original_pdf_path),
      extracted_data = COALESCE($17::jsonb, extracted_data),
      processing_status = COALESCE($18, processing_status),
      use_professional_font = COALESCE($19, use_professional_font),
      font_family = COALESCE($20, font_family),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $21 OR id::text = $22
    RETURNING *
  `;

  const values = [
    caseNumber,
    title,
    petitioner || null,
    respondent || null,
    court || 'Supreme Court of India',
    validDate,
    validYear,
    act || null,
    section || null,
    headNote || null,
    judgmentText || null,
    status || 'Published',
    JSON.stringify(citations || []),
    pdf_file || pdf_file_path || null,
    pdf_file_path || pdf_file || null,
    original_pdf_path || null,
    extracted_data ? (typeof extracted_data === 'string' ? extracted_data : JSON.stringify(extracted_data)) : null,
    processing_status || null,
    use_professional_font !== undefined ? Boolean(use_professional_font) : null,
    font_family || null,
    isNaN(numericId) ? 0 : numericId,
    String(id)
  ];

  const res = await query(sql, values);
  fastCache.invalidatePrefix('cases:');
  fastCache.invalidatePrefix('search:');
  return (res && res.rows && res.rows.length > 0) ? res.rows[0] : null;
};

// Delete case permanently from PostgreSQL and clean up secondary tables & storage
export const deleteCaseFromDb = async (id) => {
  const numericId = parseInt(id, 10);
  let res;
  if (!isNaN(numericId)) {
    res = await query(`DELETE FROM cases WHERE id = $1 OR id::text = $2 RETURNING *`, [numericId, String(id)]);
    try {
      await query(`DELETE FROM judgments WHERE id = $1 OR id::text = $2`, [numericId, String(id)]);
    } catch (e) {
      logger.warn('Secondary judgments delete warning:', e.message);
    }
  } else {
    res = await query(`DELETE FROM cases WHERE id::text = $1 RETURNING *`, [String(id)]);
    try {
      await query(`DELETE FROM judgments WHERE id::text = $1`, [String(id)]);
    } catch (e) {
      logger.warn('Secondary judgments delete warning:', e.message);
    }
  }

  // Remove physical files associated with deleted case from uploads/
  if (res && res.rows && res.rows.length > 0) {
    const deleted = res.rows[0];
    const candidateFiles = [deleted.pdf_file, deleted.pdf_file_path, deleted.original_pdf_path].filter(Boolean);
    for (const filePath of candidateFiles) {
      try {
        const cleanPath = String(filePath).replace(/^[\\\/]+/, '').replace(/^uploads[\\\/]/i, '').replace(/^[\\\/]+/, '');
        const fullPath = path.join(__dirname, '../uploads', cleanPath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          logger.info(`Deleted file from disk: ${cleanPath}`);
        }
      } catch (err) {
        logger.warn('Could not remove file for deleted case:', err.message);
      }
    }
  }

  // Wipe all cache so neither web nor mobile search can return stale records
  fastCache.flush();
  return (res && res.rows && res.rows.length > 0) ? res.rows[0] : null;
};

// Update case status in PostgreSQL
export const updateCaseStatusInDb = async (id, status) => {
  const numericId = parseInt(id, 10);
  const res = !isNaN(numericId)
    ? await query(`UPDATE cases SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 OR id::text = $3 RETURNING *`, [status, numericId, String(id)])
    : await query(`UPDATE cases SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id::text = $2 RETURNING *`, [status, String(id)]);

  fastCache.invalidatePrefix('cases:');
  fastCache.invalidatePrefix('search:');
  return (res && res.rows && res.rows.length > 0) ? res.rows[0] : null;
};
