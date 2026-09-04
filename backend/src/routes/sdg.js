const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/sdgController');

router.get('/', ctrl.listSdgGoals);

module.exports = router;
