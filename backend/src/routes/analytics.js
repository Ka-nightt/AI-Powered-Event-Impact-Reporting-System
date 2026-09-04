const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/analyticsController');

router.get('/dashboard', ctrl.getDashboard);
router.get('/trend', ctrl.getTrend);
router.get('/:eventId', ctrl.getEventAnalytics);

module.exports = router;
