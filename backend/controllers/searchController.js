import judgmentRepository from '../repositories/judgmentRepository.js';
import logger from '../utils/logger.js';

export const search = async (req, res) => {
  try {
    const { q = '', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // GIN index based fast search with ILIKE fallback
    const results = await judgmentRepository.searchJudgments(q, parseInt(limit), offset);

    res.json({
      status: 'success',
      count: results ? results.length : 0,
      data: results || []
    });

  } catch (error) {
    logger.error('Search API error', error);
    res.json({ status: 'success', count: 0, data: [] });
  }
};
