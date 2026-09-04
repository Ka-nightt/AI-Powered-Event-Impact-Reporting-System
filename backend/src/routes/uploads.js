const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/uploadController');
const { uploadSpreadsheet } = require('../middleware/upload');

router.post('/:eventId/attendance/preview', uploadSpreadsheet.single('file'), ctrl.previewAttendance);
router.post('/:eventId/attendance/confirm', ctrl.confirmAttendance);
router.post('/:eventId/survey/preview', uploadSpreadsheet.single('file'), ctrl.previewSurvey);
router.post('/:eventId/survey/confirm', ctrl.confirmSurvey);
router.get('/:eventId', ctrl.listUploads);

module.exports = router;
