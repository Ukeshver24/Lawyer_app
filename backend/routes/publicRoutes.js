import express from 'express';
import { getHomeData, searchJudgments, getJudgmentDetail, getCourts } from '../controllers/publicController.js';
import { getSettings } from '../controllers/adminController.js';

const router = express.Router();

// Public Legal Portal Endpoints
router.get('/courts', getCourts);
router.get('/home', getHomeData);
router.get('/search', searchJudgments);
router.get('/judgment/:id', getJudgmentDetail);
router.get('/settings', getSettings);

export default router;
