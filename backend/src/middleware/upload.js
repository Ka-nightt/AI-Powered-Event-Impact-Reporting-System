const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '..', '..', 'uploads', 'data');
const PHOTOS_DIR = path.join(__dirname, '..', '..', 'uploads', 'photos');
[DATA_DIR, PHOTOS_DIR].forEach((d) => fs.existsSync(d) || fs.mkdirSync(d, { recursive: true }));

const maxSizeBytes = (Number(process.env.MAX_UPLOAD_MB) || 15) * 1024 * 1024;

const dataStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, DATA_DIR),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, PHOTOS_DIR),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

const spreadsheetFilter = (req, file, cb) => {
  const allowed = ['.csv', '.xlsx', '.xls'];
  if (allowed.includes(path.extname(file.originalname).toLowerCase())) return cb(null, true);
  cb(new Error('Only .csv, .xlsx, or .xls files are allowed'));
};

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) return cb(null, true);
  cb(new Error('Only image files are allowed'));
};

const uploadSpreadsheet = multer({ storage: dataStorage, fileFilter: spreadsheetFilter, limits: { fileSize: maxSizeBytes } });
const uploadPhotos = multer({ storage: photoStorage, fileFilter: imageFilter, limits: { fileSize: maxSizeBytes } });

module.exports = { uploadSpreadsheet, uploadPhotos };
