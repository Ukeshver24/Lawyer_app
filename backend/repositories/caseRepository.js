import { query } from '../config/db.js';
import logger from '../utils/logger.js';
import { fastCache } from '../utils/cache.js';

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
      pdf_file, pdf_file_path,
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
    pdf_file, pdf_file_path
  } = caseData;

  const validDate = judgmentDate && String(judgmentDate).trim().length >= 8 
    ? String(judgmentDate).trim() 
    : new Date().toISOString().split('T')[0];
  const validYear = parseInt(year || (validDate ? validDate.substring(0, 4) : '2026'), 10) || new Date().getFullYear();

  const sql = `
    INSERT INTO cases (
      case_number, title, petitioner, respondent, court, judgment_date,
      year, act, section, head_note, judgment_text, status, citations,
      pdf_file, pdf_file_path
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14, $15)
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
    pdf_file_path || pdf_file || null
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
    pdf_file, pdf_file_path
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
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $16 OR id::text = $17
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
    isNaN(numericId) ? 0 : numericId,
    String(id)
  ];

  const res = await query(sql, values);
  fastCache.invalidatePrefix('cases:');
  fastCache.invalidatePrefix('search:');
  return (res && res.rows && res.rows.length > 0) ? res.rows[0] : null;
};

// Delete case permanently from PostgreSQL
export const deleteCaseFromDb = async (id) => {
  const numericId = parseInt(id, 10);
  let res;
  if (!isNaN(numericId)) {
    res = await query(`DELETE FROM cases WHERE id = $1 OR id::text = $2 RETURNING *`, [numericId, String(id)]);
  } else {
    res = await query(`DELETE FROM cases WHERE id::text = $1 RETURNING *`, [String(id)]);
  }
  fastCache.invalidatePrefix('cases:');
  fastCache.invalidatePrefix('search:');
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
