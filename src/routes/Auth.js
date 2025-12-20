// ===== FILE: src/routes/Auth.js =====

const express = require("express");
const router = express.Router();
const authControllers = require("../controllers/Auth");
const { body } = require("express-validator");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const {
  checkAuthToken,
  checkAdmin,
  checkAdminAndConsultant,
} = require("../middlewares/Auth");

// @POST /api/auth/signup
router.post(
  "/signup",
  [
    body("fullName")
      .trim()
      .matches(/^[A-Za-zÀ-ỹ\s]+$/u)
      .withMessage("Họ tên chỉ được chứa chữ cái và khoảng trắng.")
      .isLength({ min: 5 })
      .withMessage("Họ tên phải có ít nhất 5 ký tự."),
    body("email")
      .notEmpty()
      .withMessage("Email không được để trống.")
      .isEmail()
      .withMessage("Email phải hợp lệ.")
      .custom(async (value) => {
        const user = await User.findOne({ email: value });
        if (user) return Promise.reject("Email đã tồn tại, vui lòng chọn email khác.");
        return true;
      }),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Mật khẩu phải có ít nhất 6 ký tự."),
    body("phoneNumber")
      .notEmpty()
      .withMessage("Số điện thoại không được để trống.")
      .custom((value) => {
        const phoneRegexPattern = /^(\+?84|0)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9\d)\d{7}$/;
        if (!phoneRegexPattern.test(value)) {
          throw new Error("Số điện thoại không hợp lệ, phải có 10 số và bắt đầu bằng +84 hoặc 0...");
        }
        return true;
      }),
  ],
  authControllers.postUserSignup
);

// @POST /api/auth/login/admin
router.post(
  "/login/admin",
  [
    body("email")
      .custom(async (value) => {
        const user = await User.findOne({ email: value });
        if (!user) return Promise.reject("Không tìm thấy người dùng với email " + value);
        return true;
      }),
    body("password").custom(async (value, { req }) => {
      if (!req.body.email) throw new Error("Vui lòng nhập email trước khi nhập mật khẩu");
      const user = await User.findOne({ email: req.body.email });
      if (!user) return Promise.reject("Mật khẩu không hợp lệ");
      const isPasswordMatching = await bcrypt.compare(value, user.password);
      if (!isPasswordMatching) return Promise.reject("Mật khẩu không hợp lệ");
      return true;
    }),
  ],
  authControllers.postAdminLogin
);

// @POST /api/auth/login
router.post(
  "/login",
  [
    body("email").custom(async (value) => {
      const user = await User.findOne({ email: value });
      if (!user) return Promise.reject("Không tìm thấy người dùng với email " + value);
      return true;
    }),
    body("password").custom(async (value, { req }) => {
      if (!req.body.email) throw new Error("Vui lòng nhập email trước khi nhập mật khẩu");
      const user = await User.findOne({ email: req.body.email });
      if (!user) return Promise.reject("Mật khẩu không hợp lệ");
      const isPasswordMatching = await bcrypt.compare(value, user.password);
      if (!isPasswordMatching) return Promise.reject("Mật khẩu không hợp lệ");
      return true;
    }),
  ],
  authControllers.postUserLogin
);

// @GET /api/auth/user
router.get("/user", checkAuthToken, authControllers.getCurrentUser);

// @PATCH /api/auth/profile
router.patch(
  "/profile",
  checkAuthToken,
  [
    body("fullName", "Họ tên không được để trống").trim().notEmpty(),
    // === THÊM VALIDATION CHO EMAIL ===
    body("email")
        .notEmpty().withMessage("Email không được để trống.")
        .isEmail().withMessage("Email phải hợp lệ.")
        .normalizeEmail(), // Chuẩn hóa email
    // ===================================
    body("phoneNumber")
      .notEmpty()
      .withMessage("Số điện thoại không được để trống.")
      .custom((value) => {
        const phoneRegexPattern = /^(\+?84|0)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9\d)\d{7}$/;
        if (!phoneRegexPattern.test(value)) {
          throw new Error("Số điện thoại không hợp lệ...");
        }
        return true;
      }),
  ],
  authControllers.updateUserProfile
);

// === QUẢN LÝ USER CHO ADMIN ===

// @GET /api/auth/users
router.get("/users", checkAuthToken, checkAdmin, authControllers.getAllUsers);

// @POST /api/auth/users
router.post(
  "/users",
  checkAuthToken,
  checkAdmin,
  [
    body("fullName")
      .trim()
      .isLength({ min: 5 })
      .withMessage("Họ tên phải có ít nhất 5 ký tự."),
    body("email")
      .isEmail()
      .withMessage("Email phải hợp lệ.")
      .custom(async (value) => {
        const user = await User.findOne({ email: value });
        if (user) return Promise.reject("Email đã tồn tại.");
        return true;
      }),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Mật khẩu phải có ít nhất 6 ký tự."),
    body("phoneNumber").notEmpty().withMessage("Số điện thoại không được để trống."),
    body("role")
      .optional()
      .isIn(["user", "admin", "consultant"])
      .withMessage("Vai trò không hợp lệ."),
  ],
  authControllers.adminAddUser
);

// @PATCH /api/auth/users/:userId
router.patch(
  "/users/:userId",
  checkAuthToken,
  checkAdmin,
  [
    body("fullName")
      .trim()
      .isLength({ min: 5 })
      .withMessage("Họ tên phải có ít nhất 5 ký tự."),
    body("email").isEmail().withMessage("Email phải hợp lệ."),
    body("phoneNumber").notEmpty().withMessage("Số điện thoại không được để trống."),
    body("role")
      .optional()
      .isIn(["user", "admin", "consultant"])
      .withMessage("Vai trò không hợp lệ."),
    body("newPassword")
      .optional({ checkFalsy: true })
      .isLength({ min: 6 })
      .withMessage("Mật khẩu mới phải có ít nhất 6 ký tự."),
  ],
  authControllers.adminUpdateUser
);

// @DELETE /api/auth/users/:userId
router.delete(
  "/users/:userId",
  checkAuthToken,
  checkAdmin,
  authControllers.adminDeleteUser
);


module.exports = router;
