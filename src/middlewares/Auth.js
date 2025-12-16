//Json webtoken
const jwt = require("jsonwebtoken");

//Model Người dùng
const User = require("../models/User");

//Kiểm tra JWT token
exports.checkAuthToken = (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Không được phép: Không tìm thấy token." });
  }

  try {
    //Giải mã token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //Đưa userId vào req từ payload đã giải mã của jwt
    req.userId = decoded.userId;

    next();
  } catch (error) {
    res.status(403).json({ message: "Cấm truy cập: Token không hợp lệ." });
  }
};

//Kiểm tra Admin
exports.checkAdmin = async (req, res, next) => {
  try {
    //Lấy user thông qua userId
    const user = await User.findById(req.userId);

    //Không phải admin
    if (user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Cấm truy cập: Bạn không có quyền!" });
    }

    next();
  } catch (error) {
    //Cấu hình error middleware
    const err = new Error(error);
    err.httpStatus = 500;
    //Chuyển tiếp tới error middleware
    next(err);
  }
};

//Kiểm tra Admin và Consultant
exports.checkAdminAndConsultant = async (req, res, next) => {
  try {
    //Lấy user thông qua userId
    const user = await User.findById(req.userId);

    //Không phải admin/consultant
    if (user.role === "user") {
      return res
        .status(403)
        .json({ message: "Cấm truy cập: Bạn không có quyền!" });
    }

    next();
  } catch (error) {
    //Cấu hình error middleware
    const err = new Error(error);
    err.httpStatus = 500;
    //Chuyển tiếp tới error middleware
    next(err);
  }
};
