// //Export uploads files
// module.exports = uploads;

//Đường dẫn (Path)
const path = require("path");

//Thư viện multer
const multer = require("multer");

//Cấu hình lưu trữ Multer
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/images"));
  },
  filename: (req, file, cb) => {
    cb(null, Math.random().toString() + file.originalname.replace(/\s/g, ""));
  },
});

//Bộ lọc file (filter files)

const uploads = multer({ storage: fileStorage });

//Xuất module upload file
module.exports = uploads;
