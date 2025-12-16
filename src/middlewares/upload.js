// middlewares/upload.js
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  // Có thể bật validate mime/size:
  // limits: { fileSize: 5 * 1024 * 1024 },
  // fileFilter: (req, file, cb) => {
  //   if (!/^image\/(jpe?g|png|webp|gif)$/.test(file.mimetype)) return cb(null, false);
  //   cb(null, true);
  // },
});
module.exports = { upload };
