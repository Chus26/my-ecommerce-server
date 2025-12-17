//Model Người dùng
const User = require("../models/User");

const mongoose = require("mongoose");

//Kết quả validation
const { validationResult } = require("express-validator");

//Json Webtoken
const jwt = require("jsonwebtoken");

//BcryptJS
const bcrypt = require("bcryptjs");

//Controller Đăng ký
// exports.postUserSignup = async (req, res, next) => {
//   //Lấy dữ liệu từ body
//   const { fullName, email, password, phoneNumber } = req.body;

//   try {
//     //Lỗi validation
//     const errors = validationResult(req);

//     //Kiểm tra có lỗi validation hay không
//     if (!errors.isEmpty()) {
//       //Trả về response khi có lỗi validation
//       return res.status(422).json({ errors: errors.array() });
//     }

//     //Mã hoá mật khẩu
//     const hashedPassword = await bcrypt.hash(password, 10);

//     //Tạo user mới
//     const newUser = await User({
//       fullName: fullName.trimLeft().trimRight(),
//       email,
//       password: hashedPassword,
//       phoneNumber,
//     });

//     //Lưu user mới vào collection users
//     await newUser.save();

//     //Tạo JWT token
//     const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
//       expiresIn: "3h",
//     });

//     //Trả về response khi đăng ký thành công
//     res.status(201).json({
//       token: token,
//       userName: newUser.fullName,
//     });
//   } catch (error) {
//     //Cấu hình error middleware
//     const err = new Error(error);
//     err.httpStatus = 500;
//     //Chuyển tiếp đến error middleware
//     next(err);
//   }
// };
exports.postUserSignup = async (req, res, next) => {
  const { fullName, email, password, phoneNumber } = req.body;

  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullName: fullName.trim(),
      email,
      password: hashedPassword,
      phoneNumber,
      role: "user",
    });

    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "3h" }
    );

    res.status(201).json({
      token,
      userName: newUser.fullName,
    });
  } catch (error) {
    const err = new Error(error);
    err.httpStatus = 500;
    next(err);
  }
};

//Controller Đăng nhập Người dùng
exports.postUserLogin = async (req, res, next) => {
  //Lấy email từ body
  const { email } = req.body;

  try {
    //Lỗi validation
    const errors = validationResult(req);

    //Kiểm tra có lỗi validation hay không
    if (!errors.isEmpty()) {
      //Trả về response khi có lỗi validation
      return res.status(422).json({ errors: errors.array() });
    }

    //Tìm user theo email
    const user = await User.findOne({ email: email });

    //Tạo JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "3h",
    });

    //Trả về response khi đăng nhập thành công
    res.status(201).json({
      token: token,
      userName: user.fullName,
    });
  } catch (error) {
    //Cấu hình error middleware
    const err = new Error(error);
    err.httpStatus = 500;
    //Chuyển tiếp đến error middleware
    next(err);
  }
};

//Controller Đăng nhập Admin
exports.postAdminLogin = async (req, res, next) => {
  //Lấy email từ body
  const { email } = req.body;

  try {
    //Lỗi validation
    const errors = validationResult(req);

    //Kiểm tra có lỗi validation hay không
    if (!errors.isEmpty()) {
      //Trả về response khi có lỗi validation
      return res.status(422).json({ errors: errors.array() });
    }

    //Tìm user theo email
    const user = await User.findOne({ email: email });

    //Kiểm tra role
    if (user.role === "user") {
      //Khi user không phải admin hoặc consultant
      return res
        .status(403)
        .json({ message: "Không có quyền - Vai trò người dùng không được phép." });
    }

    //Tạo JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "3h",
    });

    //Trả về response khi đăng nhập admin thành công
    res.status(201).json({
      token: token,
      userName: user.fullName,
      userRole: user.role,
    });
  } catch (error) {
    //Cấu hình error middleware
    const err = new Error(error);
    err.httpStatus = 500;
    //Chuyển tiếp đến error middleware
    next(err);
  }
};

//Lấy thông tin người dùng hiện tại - Client
exports.getCurrentUser = async (req, res, next) => {
  try {
    //Tìm user hiện tại bằng userId
    const user = await User.findById(req.userId).select("-_id -password");

    //Trả về user hiện tại
    res.status(200).json({ user: user });
  } catch (error) {
    //Cấu hình error middleware
    const err = new Error(error);
    err.httpStatus = 500;
    //Chuyển tiếp đến error middleware
    next(err);
  }
};

// ... (code postUserSignup, postUserLogin, postAdminLogin, getCurrentUser của bạn giữ nguyên) ...

// ===== THÊM HÀM MỚI VÀO CUỐI FILE auth.controller.js =====

//Controller Cập nhật thông tin User
// ... (code postUserSignup, postUserLogin, postAdminLogin, getCurrentUser của bạn giữ nguyên) ...

// ===== THÊM HÀM MỚI VÀO CUỐI FILE auth.controller.js =====

//Controller Cập nhật thông tin User
// exports.updateUserProfile = async (req, res, next) => {
//   // Lấy dữ liệu từ body
//   const { fullName, phoneNumber, currentPassword, newPassword } = req.body;
//   const userId = req.userId; // Lấy từ middleware checkAuthToken

//   try {
//     // 1. Tìm user
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ errors: [{ msg: "Không tìm thấy người dùng." }] });
//     }

//     // 2. Cập nhật thông tin cơ bản
//     user.fullName = fullName.trimLeft().trimRight();
//     user.phoneNumber = phoneNumber;

//     // 3. Xử lý cập nhật mật khẩu (nếu có)
//     if (newPassword && newPassword.trim() !== "") {
//       // 3.1. Yêu cầu mật khẩu hiện tại
//       if (!currentPassword) {
//         return res.status(422).json({
//           errors: [{ path: "currentPassword", msg: "Vui lòng nhập mật khẩu hiện tại." }],
//         });
//       }

//       // 3.2. Kiểm tra mật khẩu hiện tại
//       const isMatch = await bcrypt.compare(currentPassword, user.password);
//       if (!isMatch) {
//         return res.status(401).json({
//           errors: [{ path: "currentPassword", msg: "Mật khẩu hiện tại không đúng." }],
//         });
//       }
      
//       // 3.3. Kiểm tra độ dài mật khẩu mới
//       if (newPassword.trim().length < 6) {
//          return res.status(422).json({
//           errors: [{ path: "newPassword", msg: "Mật khẩu mới phải có ít nhất 6 ký tự." }],
//         });
//       }

//       // 3.4. Hash và lưu mật khẩu mới
//       user.password = await bcrypt.hash(newPassword, 10);
//     }

//     // 4. Lưu thay đổi
//     await user.save();

//     // 5. Trả về response thành công
//     res.status(200).json({
//       message: "Cập nhật thông tin thành công!",
//       userName: user.fullName, // Gửi lại tên mới để frontend cập nhật
//     });

//   } catch (error) {
//     const err = new Error(error);
//     err.httpStatus = 500;
//     next(err);
//   }
// };
// Controller cập nhật thông tin User
exports.updateUserProfile = async (req, res, next) => {
  const { fullName, email, phoneNumber, currentPassword, newPassword } = req.body;
  const userId = req.userId;

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ errors: [{ msg: "Không tìm thấy người dùng." }] });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email: email });
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(409).json({
          errors: [{ path: "email", msg: "Email này đã được sử dụng bởi tài khoản khác." }],
        });
      }
      user.email = email;
    }

    user.fullName = fullName.trim();
    user.phoneNumber = phoneNumber;

    if (newPassword && newPassword.trim() !== "") {
      if (!currentPassword) {
        return res.status(422).json({
          errors: [{ path: "currentPassword", msg: "Vui lòng nhập mật khẩu hiện tại." }],
        });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({
          errors: [{ path: "currentPassword", msg: "Mật khẩu hiện tại không đúng." }],
        });
      }

      if (newPassword.trim().length < 6) {
        return res.status(422).json({
          errors: [{ path: "newPassword", msg: "Mật khẩu mới phải có ít nhất 6 ký tự." }],
        });
      }

      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();

    res.status(200).json({
      message: "Cập nhật thông tin thành công!",
      userName: user.fullName,
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) {
      const err = new Error("Email này đã được sử dụng.");
      err.httpStatus = 409;
      return next(err);
    }
    const err = new Error(error);
    err.httpStatus = 500;
    next(err);
  }
};



// === Lấy tất cả người dùng (Cho Admin) ===
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({ users });
  } catch (error) {
    const err = new Error(error);
    err.httpStatus = 500;
    next(err);
  }
};

// === Cập nhật vai trò người dùng (Cho Admin) ===
exports.updateUserRole = async (req, res, next) => {
  const { userId, newRole } = req.body;

  if (!["user", "admin", "consultant"].includes(newRole)) {
    return res.status(422).json({ message: "Vai trò không hợp lệ." });
  }

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "ID người dùng không hợp lệ." });
  }

  if (req.userId === userId) {
    return res
      .status(403)
      .json({ message: "Bạn không thể tự thay đổi vai trò của chính mình." });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    user.role = newRole;
    await user.save();

    res.status(200).json({
      message: "Cập nhật vai trò thành công!",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    const err = new Error(error);
    err.httpStatus = 500;
    next(err);
  }
};

// === Admin thêm người dùng ===
exports.adminAddUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { fullName, email, password, phoneNumber, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullName: fullName.trim(),
      email,
      password: hashedPassword,
      phoneNumber,
      role: role || "user",
    });

    await newUser.save();

    res.status(201).json({
      message: "Tạo người dùng mới thành công!",
      user: {
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        phoneNumber: newUser.phoneNumber,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      const err = new Error("Email này đã tồn tại.");
      err.httpStatus = 409;
      return next(err);
    }
    const err = new Error(error);
    err.httpStatus = 500;
    next(err);
  }
};

// === Admin cập nhật người dùng ===
// exports.adminUpdateUser = async (req, res, next) => {
//   const { userId } = req.params;
//   const { fullName, email, phoneNumber, role, newPassword } = req.body;

//   if (!mongoose.Types.ObjectId.isValid(userId)) {
//     return res.status(400).json({ message: "ID người dùng không hợp lệ." });
//   }

//   if (req.userId === userId) {
//     return res.status(403).json({ message: "Bạn không thể tự cập nhật chính mình qua giao diện này." });
//   }

//   try {
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "Không tìm thấy người dùng." });
//     }

//     user.fullName = fullName.trim();
//     user.email = email;
//     user.phoneNumber = phoneNumber;

//     if (role && ["user", "admin", "consultant"].includes(role)) {
//       user.role = role;
//     }

//     if (newPassword && newPassword.trim().length >= 6) {
//       user.password = await bcrypt.hash(newPassword, 10);
//     } else if (newPassword && newPassword.trim().length > 0) {
//       return res.status(422).json({
//         errors: [{ path: "newPassword", msg: "Mật khẩu mới phải có ít nhất 6 ký tự." }],
//       });
//     }

//     await user.save();

//     res.status(200).json({
//       message: "Cập nhật thông tin người dùng thành công!",
//       user: {
//         _id: user._id,
//         fullName: user.fullName,
//         email: user.email,
//         role: user.role,
//         phoneNumber: user.phoneNumber,
//       },
//     });
//   } catch (error) {
//     if (error.code === 11000) {
//       const err = new Error("Email này đã được sử dụng bởi người dùng khác.");
//       err.httpStatus = 409;
//       return next(err);
//     }
//     const err = new Error(error);
//     err.httpStatus = 500;
//     next(err);
//   }
// };

// === Admin cập nhật người dùng ===
exports.adminUpdateUser = async (req, res, next) => {
  const { userId } = req.params;
  // Lấy cả newPassword và password (để dự phòng trường hợp frontend gửi key khác nhau)
  const { fullName, email, phoneNumber, role, newPassword, password } = req.body;

  // Xác định mật khẩu muốn đổi là cái nào (ưu tiên newPassword, nếu không có thì lấy password)
  const passwordToUpdate = newPassword || password;

  // In ra để debug xem Frontend gửi gì lên
  console.log("Admin update body:", req.body);
  console.log("Password detected:", passwordToUpdate);

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "ID người dùng không hợp lệ." });
  }

  // Chặn tự sửa chính mình (để tránh Admin tự tước quyền admin của mình hoặc tự khóa mình)
  if (req.userId === userId) {
    return res.status(403).json({ message: "Bạn không thể tự cập nhật chính mình qua giao diện này." });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    // Cập nhật thông tin cơ bản
    user.fullName = fullName ? fullName.trim() : user.fullName;
    user.email = email || user.email;
    user.phoneNumber = phoneNumber || user.phoneNumber;

    // Cập nhật Role
    if (role && ["user", "admin", "consultant"].includes(role)) {
      user.role = role;
    }

    // === LOGIC CẬP NHẬT MẬT KHẨU ===
    // Kiểm tra biến passwordToUpdate thay vì chỉ newPassword
    if (passwordToUpdate && passwordToUpdate.trim().length >= 6) {
      console.log("Đang tiến hành mã hóa mật khẩu mới...");
      user.password = await bcrypt.hash(passwordToUpdate, 10);
    } 
    // Nếu có gửi mật khẩu nhưng quá ngắn
    else if (passwordToUpdate && passwordToUpdate.trim().length > 0) {
      return res.status(422).json({
        errors: [{ path: "password", msg: "Mật khẩu mới phải có ít nhất 6 ký tự." }],
      });
    }
    // Nếu passwordToUpdate là rỗng hoặc null -> Bỏ qua, giữ mật khẩu cũ

    await user.save();

    res.status(200).json({
      message: "Cập nhật thông tin người dùng thành công!",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      const err = new Error("Email này đã được sử dụng bởi người dùng khác.");
      err.httpStatus = 409;
      return next(err);
    }
    const err = new Error(error);
    err.httpStatus = 500;
    next(err);
  }
};

// === Admin xóa người dùng ===
exports.adminDeleteUser = async (req, res, next) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "ID người dùng không hợp lệ." });
  }

  if (req.userId === userId) {
    return res.status(403).json({ message: "Bạn không thể tự xóa chính mình." });
  }

  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }
    res.status(200).json({ message: "Xóa người dùng thành công." });
  } catch (error) {
    const err = new Error(error);
    err.httpStatus = 500;
    next(err);
  }
};
