import { query } from '../config/db.js';
import logger from '../utils/logger.js';

export const getHomeStatsFromDb = async () => {
  const totalCasesRes = await query(`SELECT COUNT(*) FROM cases WHERE status = 'Published'`);
  const totalUsersRes = await query(`SELECT COUNT(*) FROM users WHERE status = 'Active'`);
  const recentCasesRes = await query(`
    SELECT id, case_number, title, petitioner, respondent, court, judgment_date, year, act, section, head_note, citations
    FROM cases 
    WHERE status = 'Published' 
    ORDER BY judgment_date DESC 
    LIMIT 6
  `);

  return {
    totalPublishedCases: parseInt(totalCasesRes.rows[0].count, 10) || 0,
    totalActiveUsers: parseInt(totalUsersRes.rows[0].count, 10) || 0,
    recentCases: recentCasesRes.rows
  };
};

export const searchCasesFromDb = async (params) => {
  let rawTerm = (params.keyword || params.q || params.citation || params.party || '').trim();
  const tab = (params.tab || params.mode || 'keyword').toLowerCase().trim();

  if (tab === 'citation' && !rawTerm && (params.number || params.year || params.court)) {
    const pYr = params.year || '';
    const pMo = params.month ? `(${params.month})` : '';
    const pCrt = params.court ? `(${params.court})` : '';
    const pNum = params.number ? `#${params.number}` : '';
    rawTerm = `${pYr} ${pMo} DLR ${pCrt} ${pNum}`.trim();
  }

  if (!rawTerm && tab !== 'all' && tab !== 'home') {
    return [];
  }

  let sql = `
    SELECT id, case_number, title, petitioner, respondent, court, judgment_date, year, act, section, head_note, judgment_text, citations, pdf_file, pdf_file_path
    FROM cases 
    WHERE status = 'Published'
  `;
  const values = [];

  if (rawTerm) {
    const cleanTerm = rawTerm.includes(':') ? rawTerm.split(':').slice(1).join(':').trim() : rawTerm;
    const lowerRaw = rawTerm.toLowerCase();

    const wordTokens = cleanTerm.split(/[\s,()#:]+/).filter(w => w.length > 0);
    const yearToken = wordTokens.find(w => /^(19|20)\d{2}$/.test(w));
    const numericTokens = wordTokens.filter(w => /^\d+$/.test(w) && w !== yearToken);

    let monthToken = null;
    let numberToken = null;

    if (numericTokens.length >= 2) {
      monthToken = numericTokens[0].replace(/^0+/, '');
      numberToken = numericTokens[1];
    } else if (numericTokens.length === 1) {
      const monthInBracketsMatch = cleanTerm.match(/\(\s*(0?[1-9]|1[0-2])\s*\)/);
      if (monthInBracketsMatch) {
        monthToken = monthInBracketsMatch[1].replace(/^0+/, '');
        numberToken = numericTokens[0] !== monthInBracketsMatch[1] ? numericTokens[0] : null;
      } else {
        numberToken = numericTokens[0];
      }
    }

    const isCitationQuery = tab === 'citation' || 
                            lowerRaw.startsWith('citation:') ||
                            Boolean(yearToken && numberToken) ||
                            Boolean(cleanTerm.toLowerCase().includes('dlr'));

    // 1. FIND BY CITATION (High-precision DB matching)
    if (isCitationQuery) {
      const hashMatch = cleanTerm.match(/#\s*([0-9a-zA-Z]+)/);
      const monthInBracketsMatch = cleanTerm.match(/\(\s*(0?[1-9]|1[0-2])\s*\)/);
      const courtInBracketsMatch = cleanTerm.match(/\(\s*([a-zA-Z]+)\s*\)/);

      const numTarget = (params.number || (hashMatch ? hashMatch[1] : null) || (wordTokens.length >= 4 ? wordTokens[wordTokens.length - 1] : null) || '')
        .replace(/^#+/, '').replace(/[^0-9a-zA-Z]/g, '').trim().toLowerCase().replace(/^0+(?=\d)/, '');

      const yrTarget = (params.year || yearToken || '').trim();
      const moTarget = (params.month || (monthInBracketsMatch ? monthInBracketsMatch[1] : null) || '').trim().replace(/^0+/, '');
      const courtTarget = (params.court || (courtInBracketsMatch ? courtInBracketsMatch[1] : null) || '').trim().toLowerCase();

      const res = await query(`
        SELECT id, case_number, title, petitioner, respondent, court, judgment_date, year, act, section, head_note, judgment_text, citations, pdf_file, pdf_file_path
        FROM cases 
        WHERE status = 'Published'
        ORDER BY judgment_date DESC
      `);
      const rows = res.rows || [];

      return rows.filter(row => {
        const cits = Array.isArray(row.citations) ? row.citations : (typeof row.citations === 'string' ? JSON.parse(row.citations || '[]') : []);
        
        // Direct string match against raw citations JSON or case number
        const rawCitsStr = JSON.stringify(cits).toLowerCase();
        if (cleanTerm && (rawCitsStr.includes(cleanTerm.toLowerCase()) || String(row.case_number || '').toLowerCase().includes(cleanTerm.toLowerCase()))) {
          return true;
        }

        return cits.some(cit => {
          const rawCitNum = String(cit.number || '').replace(/[^0-9a-zA-Z]/g, '').trim().toLowerCase();
          const citNum = rawCitNum.replace(/^0+(?=\d)/, '');
          const citYr = String(cit.year || '').trim();
          const citMo = String(cit.month || '').trim().replace(/^0+/, '');
          const citCourt = String(cit.court || 'sc').trim().toLowerCase();

          const numMatch = !numTarget || 
            citNum === numTarget || 
            citNum.includes(numTarget) || 
            numTarget.includes(citNum) ||
            String(cit.number || '').toLowerCase().includes(numTarget) ||
            String(cit.equivalent || cit.equivalentText || '').toLowerCase().includes(numTarget) ||
            String(row.case_number || '').toLowerCase().includes(numTarget);

          const yrMatch = !yrTarget || citYr === yrTarget || (row.judgment_date && String(row.judgment_date).startsWith(yrTarget)) || (row.year && String(row.year) === yrTarget);
          const moMatch = !moTarget || !citMo || citMo === moTarget;
          const courtMatch = !courtTarget || citCourt === courtTarget || citCourt.includes(courtTarget) || courtTarget.includes(citCourt);

          return numMatch && yrMatch && moMatch && courtMatch;
        });
      });
    }

    // 2. FIND BY SECTION / TITLE OR ACT
    else if (tab === 'section' || tab === 'act' || tab === 'title' || tab === 'section_only') {
      const numMatch = cleanTerm.match(/\d+[a-zA-Z]*/);
      values.push(`%${cleanTerm}%`);
      const sIdx = values.length;

      if (numMatch) {
        values.push(`%${numMatch[0]}%`);
        const nIdx = values.length;
        sql += ` AND (
          section ILIKE $${sIdx} OR 
          section ILIKE $${nIdx} OR 
          title ILIKE $${sIdx} OR 
          act ILIKE $${sIdx} OR 
          case_number ILIKE $${sIdx} OR
          petitioner ILIKE $${sIdx} OR
          respondent ILIKE $${sIdx} OR
          (act ILIKE $${nIdx} AND (act ILIKE '%section%' OR act ILIKE '%sec%' OR act ILIKE '%u/s%'))
        )`;
      } else {
        sql += ` AND (
          section ILIKE $${sIdx} OR 
          title ILIKE $${sIdx} OR 
          act ILIKE $${sIdx} OR 
          case_number ILIKE $${sIdx} OR 
          petitioner ILIKE $${sIdx} OR 
          respondent ILIKE $${sIdx}
        )`;
      }
    }

    // 3. FIND BY PARTY NAME
    else if (tab === 'party') {
      let courtPart = null;
      let partyPart = rawTerm;

      if (rawTerm.includes(':')) {
        const parts = rawTerm.split(':');
        courtPart = parts[0].trim();
        partyPart = parts.slice(1).join(':').trim();
      }

      if (courtPart && courtPart !== '' && courtPart.toLowerCase() !== 'all courts' && courtPart.toLowerCase() !== 'all jurisdiction') {
        values.push(`%${courtPart}%`);
        const cIdx = values.length;
        sql += ` AND (court ILIKE $${cIdx} OR ($${cIdx} ILIKE '%Supreme%' AND (court ILIKE '%SC%' OR court ILIKE '%Supreme%')))`;
      }

      if (partyPart && partyPart !== '') {
        values.push(`%${partyPart}%`);
        const pIdx = values.length;
        sql += ` AND (petitioner ILIKE $${pIdx} OR respondent ILIKE $${pIdx} OR title ILIKE $${pIdx} OR case_number ILIKE $${pIdx})`;
      }
    }

    // 4. FIND BY TOPIC
    else if (tab === 'topic') {
      values.push(`%${cleanTerm}%`);
      const tpIdx = values.length;
      sql += ` AND (act ILIKE $${tpIdx} OR head_note ILIKE $${tpIdx})`;
    }

    // 5. WORDS & PHRASES
    else if (tab === 'phrase' || tab === 'words') {
      values.push(`%${cleanTerm}%`);
      const phIdx = values.length;
      sql += ` AND (head_note ILIKE $${phIdx} OR judgment_text ILIKE $${phIdx})`;
    }

    // 6. KEYWORD SEARCH
    else {
      values.push(`%${cleanTerm}%`);
      const kIdx = values.length;
      sql += ` AND (
        title ILIKE $${kIdx} OR 
        petitioner ILIKE $${kIdx} OR 
        respondent ILIKE $${kIdx} OR 
        case_number ILIKE $${kIdx} OR 
        court ILIKE $${kIdx} OR 
        act ILIKE $${kIdx} OR 
        section ILIKE $${kIdx} OR 
        head_note ILIKE $${kIdx} OR 
        judgment_text ILIKE $${kIdx} OR 
        citations::text ILIKE $${kIdx}
      )`;
    }
  }

  sql += ` ORDER BY judgment_date DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  values.push(parseInt(params.limit || 50, 10), parseInt(params.offset || 0, 10));

  const res = await query(sql, values);
  return res.rows;
};

export const getCourtsFromDb = async () => {
  const courtMap = new Map(); // lowercase -> formatted court string to guarantee no duplicates
  
  try {
    const res = await query(`
      SELECT DISTINCT TRIM(court) as court 
      FROM cases 
      WHERE court IS NOT NULL AND TRIM(court) != '' AND status = 'Published'
    `);
    (res.rows || []).forEach(r => {
      const c = (r.court || '').trim();
      if (c && !courtMap.has(c.toLowerCase())) {
        courtMap.set(c.toLowerCase(), c);
      }
    });
  } catch (e) {
    logger.error('Error fetching distinct courts from cases:', e);
  }

  return Array.from(courtMap.values()).sort((a, b) => a.localeCompare(b));
};

export const getJudgmentByIdFromDb = async (id) => {
  const numericId = parseInt(id, 10);
  let res;
  if (!isNaN(numericId)) {
    res = await query(`SELECT * FROM cases WHERE (id = $1 OR id::text = $2) AND status = 'Published'`, [numericId, String(id)]);
  } else {
    res = await query(`SELECT * FROM cases WHERE id::text = $1 AND status = 'Published'`, [String(id)]);
  }
  return (res && res.rows && res.rows.length > 0) ? res.rows[0] : null;
};

