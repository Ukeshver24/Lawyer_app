import express from 'express';
import { getHomeData, searchJudgments, getJudgmentDetail, getCourts } from '../controllers/publicController.js';
import { getSettings } from '../controllers/adminController.js';

const router = express.Router();

// Public Legal Portal Endpoints
router.get('/courts', getCourts);
router.get('/home', getHomeData);
router.get('/search', searchJudgments);
router.get('/cases/search', searchJudgments);
router.get('/cases', searchJudgments);
router.get('/cases/:id', getJudgmentDetail);
router.get('/judgment/:id', getJudgmentDetail);
router.get('/settings', getSettings);

// Instant Push Notification Health Check & Manual Trigger
router.get('/test-notification', async (req, res) => {
  try {
    const { notifyMobileAppNewJudgement } = await import('../services/fcmService.js');
    const result = await notifyMobileAppNewJudgement({
      id: 999999,
      caseNumber: 'TEST-001',
      title: '🔔 Digi Law Reporter Push Notification Test',
      court: 'Supreme Court of India',
      citation: '2026 INSC TEST'
    });
    res.json({
      status: result.success ? 'success' : 'failed',
      result
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
      stack: err.stack
    });
  }
});

export default router;
