import { getHomeStatsFromDb, searchCasesFromDb, getJudgmentByIdFromDb, getCourtsFromDb } from '../repositories/publicRepository.js';
import logger from '../utils/logger.js';

// GET /api/public/courts
export const getCourts = async (req, res) => {
  try {
    const courts = await getCourtsFromDb();
    res.json({
      success: true,
      data: courts
    });
  } catch (error) {
    logger.error('Failed to get courts:', error);
    res.json({ success: true, data: [] });
  }
};

// GET /api/public/home
export const getHomeData = async (req, res) => {
  try {
    const data = await getHomeStatsFromDb();
    res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Failed to get Home data:', error);
    res.status(500).json({ success: false, message: 'Server error fetching home data' });
  }
};

// GET /api/public/search
export const searchJudgments = async (req, res) => {
  try {
    const keyword = req.query.keyword || req.query.q || '';
    const tab = req.query.tab || req.query.mode || 'keyword';

    // In search mode, if query is empty and no court/year/section/citation filter is set, return empty results
    const hasFilter = req.query.court || req.query.year || req.query.section || req.query.party || req.query.citation || req.query.number;
    if (!keyword.trim() && !hasFilter && tab !== 'all' && tab !== 'home') {
      return res.json({
        success: true,
        count: 0,
        data: []
      });
    }

    const results = await searchCasesFromDb({ ...req.query, keyword, tab });
    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    logger.error('Failed to execute search query:', error);
    res.status(500).json({ success: false, message: 'Server error performing legal search' });
  }
};

// GET /api/public/judgment/:id
export const getJudgmentDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const judgment = await getJudgmentByIdFromDb(id);

    if (!judgment) {
      return res.status(404).json({ success: false, message: 'Judgment precedent record not found' });
    }

    res.json({
      success: true,
      data: judgment
    });
  } catch (error) {
    logger.error(`Failed to fetch judgment detail for ID ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Server error fetching judgment record' });
  }
};
