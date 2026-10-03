import { query } from '../config/db.js';
import logger from '../utils/logger.js';
import { fastCache } from '../utils/cache.js';

class JudgmentRepository {
  /**
   * Insert a new judgment and explicitly calculate the search_vector in PostgreSQL
   */
  async createJudgment(data) {
    try {
      const searchText = [
        data.title, 
        data.court_name, 
        data.citation, 
        data.petitioner_name, 
        data.respondent_name, 
        data.act_name, 
        data.section_number, 
        data.topics, 
        data.head_note, 
        data.content
      ].filter(Boolean).join(' ');

      const sql = `
        INSERT INTO judgments (
          title, court_name, judgment_date, citation, 
          petitioner_name, respondent_name, act_name, 
          section_number, topics, head_note, content, pdf_file_path,
          search_vector
        ) VALUES (
          $1, $2, $3, $4, 
          $5, $6, $7, 
          $8, $9, $10, $11, $12,
          to_tsvector('simple', $13)
        )
        RETURNING id
      `;

      const values = [
        data.title, 
        data.court_name || null, 
        data.judgment_date || null, 
        data.citation || null,
        data.petitioner_name || null, 
        data.respondent_name || null, 
        data.act_name || null,
        data.section_number || null, 
        data.topics || null, 
        data.head_note || null, 
        data.content || null, 
        data.pdf_file_path || null,
        searchText
      ];

      const { rows } = await query(sql, values);
      fastCache.invalidatePrefix('search:');
      return rows[0].id;
    } catch (error) {
      logger.error('JudgmentRepository.createJudgment failed', error);
      throw error;
    }
  }

  /**
   * Check if a specific citation string already exists in the database
   */
  async checkCitationExists(dlrString) {
    try {
      const sql = `
        SELECT id FROM judgments 
        WHERE citation LIKE $1
        LIMIT 1
      `;
      const { rows } = await query(sql, [`%${dlrString}%`]);
      return rows.length > 0;
    } catch (error) {
      logger.error('JudgmentRepository.checkCitationExists failed', error);
      throw error;
    }
  }

  /**
   * Check if a citation matches an existing citation registered in the PostgreSQL cases table
   */
  async checkCitationMatch(number, year, month = null, court = null, excludeId = null) {
    const rawCleanNum = String(number || '').replace(/[^0-9a-zA-Z]/g, '').trim().toLowerCase();
    const cleanNum = rawCleanNum.replace(/^0+(?=\d)/, '');
    const cleanYr = String(year || '').trim();
    const cleanMo = String(month || '').trim().replace(/^0+/, '');
    const cleanCourt = String(court || 'sc').trim().toLowerCase();

    let sql = `SELECT id, title, case_number, citations FROM cases`;
    const params = [];
    if (excludeId) {
      const numericId = parseInt(excludeId, 10);
      if (!isNaN(numericId)) {
        params.push(numericId, String(excludeId));
        sql += ` WHERE id != $1 AND id::text != $2`;
      } else {
        params.push(String(excludeId));
        sql += ` WHERE id::text != $1`;
      }
    }

    const { rows } = await query(sql, params);
    for (const row of rows) {
      const cits = Array.isArray(row.citations) ? row.citations : (typeof row.citations === 'string' ? JSON.parse(row.citations || '[]') : []);
      for (const cit of cits) {
        const rawCNum = String(cit.number || '').replace(/[^0-9a-zA-Z]/g, '').trim().toLowerCase();
        const cNum = rawCNum.replace(/^0+(?=\d)/, '');
        const cYr = String(cit.year || '').trim();
        const cMo = String(cit.month || '').trim().replace(/^0+/, '');
        const cCourt = String(cit.court || 'sc').trim().toLowerCase();

        if (cNum === cleanNum &&
            (!cleanYr || cYr === cleanYr) &&
            (!cleanMo || cMo === cleanMo) &&
            (!cleanCourt || cCourt === cleanCourt)) {
          return {
            exists: true,
            caseId: row.id,
            caseTitle: row.title || row.case_number || 'Existing Case',
            caseNumber: row.case_number,
            citation: cit
          };
        }
      }
    }
    return { exists: false };
  }

  /**
   * Search judgments in PostgreSQL using Full Text Search and GIN index with ILIKE fallback
   */
  async searchJudgments(searchTerm = '', limit = 20, offset = 0) {
    const rawTerm = String(searchTerm || '').trim();
    const cacheKey = `search:judgments:${rawTerm.toLowerCase()}:${limit}:${offset}`;
    const cached = fastCache.get(cacheKey);
    if (cached) return cached;

    const cleanTerm = rawTerm.replace(/[()#:&|\-!\\/]/g, ' ').trim();
    const terms = cleanTerm.split(/\s+/).filter(Boolean);
    
    if (terms.length === 0) {
      const sql = `
        SELECT 
          id, title, court_name, judgment_date, citation, 
          petitioner_name, respondent_name, act_name, section_number, 
          topics, head_note, pdf_file_path
        FROM judgments 
        ORDER BY judgment_date DESC 
        LIMIT $1 OFFSET $2
      `;
      const { rows } = await query(sql, [limit, offset]);
      fastCache.set(cacheKey, rows, 30000);
      return rows;
    }

    const formattedTerm = terms.join(' & ');

    const sql = `
      SELECT 
        id, title, court_name, judgment_date, citation, 
        petitioner_name, respondent_name, act_name, section_number, 
        topics, head_note, pdf_file_path
      FROM judgments 
      WHERE search_vector @@ to_tsquery('simple', $1)
         OR title ILIKE $2
         OR citation ILIKE $2
         OR petitioner_name ILIKE $2
         OR respondent_name ILIKE $2
      ORDER BY judgment_date DESC
      LIMIT $3 OFFSET $4
    `;

    try {
      const { rows } = await query(sql, [formattedTerm, `%${cleanTerm}%`, limit, offset]);
      if (rows && rows.length > 0) {
        fastCache.set(cacheKey, rows, 30000);
        return rows;
      }
    } catch (tsErr) {
      logger.warn('tsquery search failed, attempting ILIKE fallback:', tsErr.message);
    }

    const fallbackSql = `
      SELECT 
        id, title, court_name, judgment_date, citation, 
        petitioner_name, respondent_name, act_name, section_number, 
        topics, head_note, pdf_file_path
      FROM judgments 
      WHERE title ILIKE $1 
         OR citation ILIKE $1 
         OR petitioner_name ILIKE $1 
         OR respondent_name ILIKE $1
         OR head_note ILIKE $1
         OR content ILIKE $1
      ORDER BY judgment_date DESC
      LIMIT $2 OFFSET $3
    `;
    const { rows } = await query(fallbackSql, [`%${cleanTerm}%`, limit, offset]);
    fastCache.set(cacheKey, rows, 30000);
    return rows;
  }
}

export default new JudgmentRepository();
