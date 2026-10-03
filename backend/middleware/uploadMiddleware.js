import multer from 'multer';
import fs from 'fs';
import path from 'path';

const uploadBase = process.env.UPLOAD_PATH || 'uploads/';

// Ensure upload directory exists
if (!fs.existsSync(uploadBase)) {
  fs.mkdirSync(uploadBase, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadBase);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

export default upload;
