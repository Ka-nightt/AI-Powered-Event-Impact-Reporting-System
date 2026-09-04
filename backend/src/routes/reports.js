const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportController');

router.post('/:eventId/generate', ctrl.generateReport);
router.get('/:eventId', ctrl.listReports);
router.get('/download/:id', ctrl.downloadReport);

module.exports = router;
