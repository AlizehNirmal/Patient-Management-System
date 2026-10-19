const multer = require('multer');
const HttpError = require('../utils/httpError');

const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

// Reads one uploaded file into memory (req.file). Only PDF, JPG and PNG up to 5 MB.
module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new HttpError(400, 'Only PDF, JPG and PNG files are allowed'));
  },
}).single('file');
