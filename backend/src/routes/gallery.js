const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/galleryController');
const { uploadPhotos } = require('../middleware/upload');

router.post('/:eventId', uploadPhotos.array('photos', 20), ctrl.uploadPhotos);
router.get('/:eventId', ctrl.listPhotos);
router.delete('/photo/:id', ctrl.deletePhoto);

module.exports = router;
