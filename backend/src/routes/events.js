const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/eventController');

router.get('/', ctrl.listEvents);
router.post('/', ctrl.createEvent);
router.get('/:id', ctrl.getEvent);
router.put('/:id', ctrl.updateEvent);
router.delete('/:id', ctrl.deleteEvent);

module.exports = router;
