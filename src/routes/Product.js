// // Lấy express
// const express = require("express");

// // Router
// const router = express.Router();

// // Middleware xác thực
// const { checkAuthToken, checkAdmin } = require("../middlewares/Auth");

// // Controller Sản phẩm
// const productControllers = require("../controllers/Product");

// // Uploads (multer memory cho Cloudinary)
// const { upload } = require("../middlewares/upload");

// // Express validator
// const { body } = require("express-validator");

// // ---------------- Client ----------------

// // @GET  /api/products/   @Client lấy sản phẩm trang chủ
// router.get("/", productControllers.getProducts);

// // @POST /api/products/products-cart  @Client lấy thông tin sản phẩm trong giỏ hàng
// router.post("/products-cart", productControllers.getProductsCart);

// // ✅ đặt ROUTE LIÊN QUAN TRƯỚC
// // @GET  /api/products/:productId/related   @Client lấy sản phẩm liên quan
// router.get("/:productId/related", productControllers.getRelatedProducts);

// // @GET  /api/products/:productId   @Client trang chi tiết sản phẩm
// router.get("/:productId", productControllers.getProduct);

// // ---------------- Admin ----------------

// // @GET  /api/products/admin/:productId   @Admin lấy thông tin sản phẩm để chỉnh sửa
// router.get(
//   "/admin/:productId",
//   checkAuthToken,
//   checkAdmin,
//   productControllers.getEditProduct
// );

// // @POST  /api/products/admin/new-product   @Admin tạo sản phẩm mới
// router.post(
//   "/admin/new-product",
//   checkAuthToken,
//   checkAdmin,
//   upload.array("images", 4), // 👈 FE gửi field "images" (4 ảnh)
//   [
//     // bắt buộc đúng 4 ảnh
//     body("images").custom((_, { req }) => {
//       if (!req.files || req.files.length !== 4) {
//         throw new Error("Số lượng ảnh phải đúng 4");
//       }
//       return true;
//     }),
//     body("code").trim().notEmpty().withMessage("Mã hàng không được để trống"),
//     body("name").trim().notEmpty().withMessage("Tên sản phẩm không được để trống"),
//     body("category").trim().notEmpty().withMessage("Danh mục không được để trống"),
//     body("shortDescription").trim().isLength({ min: 5 }).withMessage("Mô tả ngắn phải có ít nhất 5 ký tự"),
//     body("longDescription").trim().isLength({ min: 5 }).withMessage("Mô tả chi tiết phải có ít nhất 5 ký tự"),
//     body("price")
//       .notEmpty().withMessage("Giá không được để trống")
//       .custom((value) => {
//         if (Number(value) <= 0) throw new Error("Giá không được nhỏ hơn hoặc bằng 0");
//         return true;
//       }),
//     body("stock")
//       .notEmpty().withMessage("Số lượng tồn kho không được để trống")
//       .custom((value) => {
//         if (Number(value) < 0) throw new Error("Số lượng tồn kho không được nhỏ hơn 0");
//         return true;
//       }),
//   ],
//   productControllers.postAdminCreateProduct
// );

// // @PATCH  /api/products/admin/edit-product/:productId   @Admin chỉnh sửa sản phẩm
// router.patch(
//   "/admin/edit-product/:productId",
//   checkAuthToken,
//   checkAdmin,
//   upload.array("images", 4), // 👈 có thể không gửi ảnh mới; nếu gửi: tối đa 4
//   [
//     body("name").trim().notEmpty().withMessage("Tên sản phẩm không được để trống"),
//     body("category").trim().notEmpty().withMessage("Danh mục không được để trống"),
//     body("shortDescription").trim().isLength({ min: 5 }).withMessage("Mô tả ngắn phải có ít nhất 5 ký tự"),
//     body("longDescription").trim().isLength({ min: 5 }).withMessage("Mô tả chi tiết phải có ít nhất 5 ký tự"),
//     body("price")
//       .notEmpty().withMessage("Giá không được để trống")
//       .custom((value) => {
//         if (Number(value) <= 0) throw new Error("Giá không được nhỏ hơn hoặc bằng 0");
//         return true;
//       }),
//     body("stock")
//       .notEmpty().withMessage("Số lượng tồn kho không được để trống")
//       .custom((value) => {
//         if (Number(value) < 0) throw new Error("Số lượng tồn kho không được nhỏ hơn 0");
//         return true;
//       }),
//   ],
//   productControllers.patchAdminEditProduct
// );

// // @DELETE  /api/products/admin/:productId   @Admin xoá sản phẩm
// router.delete(
//   "/admin/:productId",
//   checkAuthToken,
//   checkAdmin,
//   productControllers.deleteAdminProduct
// );

// // === SỬA ĐỔI ROUTE NÀY ===
// router.post(
//   "/:productId/reviews",
//   checkAuthToken,
//   upload.array("reviewImages", 5), // <-- THÊM DÒNG NÀY (Tên field là 'reviewImages', tối đa 5 ảnh)
//   productControllers.addProductReview
// );


// // ❗ Xuất router ở CUỐI FILE
// module.exports = router;

// Lấy express
const express = require("express");

// Router
const router = express.Router();

// Middleware xác thực
const { checkAuthToken, checkAdmin } = require("../middlewares/Auth");

// Controller Sản phẩm
const productControllers = require("../controllers/Product");

// Uploads (multer memory cho Cloudinary)
const { upload } = require("../middlewares/upload");

// Express validator
const { body } = require("express-validator");

// ---------------- Client ----------------

// @GET  /api/products/    @Client lấy sản phẩm trang chủ
router.get("/", productControllers.getProducts);

router.get("/trending", productControllers.getTrendingProducts);

// @POST /api/products/products-cart  @Client lấy thông tin sản phẩm trong giỏ hàng
router.post("/products-cart", productControllers.getProductsCart);

// ✅ đặt ROUTE LIÊN QUAN TRƯỚC
// @GET  /api/products/:productId/related    @Client lấy sản phẩm liên quan
router.get("/:productId/related", productControllers.getRelatedProducts);

// === 🚀 ROUTE MỚI CHO ĐÁNH GIÁ NỔI BẬT ===
// @GET  /api/products/reviews/featured   @Client lấy đánh giá nổi bật cho trang chủ
router.get(
  "/reviews/featured",
  productControllers.getFeaturedReviews
);
// =========================================

// @GET  /api/products/:productId    @Client trang chi tiết sản phẩm
// (Route này PHẢI đặt sau /reviews/featured)
router.get("/:productId", productControllers.getProduct);

// ---------------- Admin ----------------

// @GET  /api/products/admin/:productId    @Admin lấy thông tin sản phẩm để chỉnh sửa
router.get(
  "/admin/:productId",
  checkAuthToken,
  checkAdmin,
  productControllers.getEditProduct
);

// @POST  /api/products/admin/new-product    @Admin tạo sản phẩm mới
router.post(
  "/admin/new-product",
  checkAuthToken,
  checkAdmin,
  upload.array("images", 4), // 👈 FE gửi field "images" (4 ảnh)
  [
    // bắt buộc đúng 4 ảnh
    body("images").custom((_, { req }) => {
      if (!req.files || req.files.length !== 4) {
        throw new Error("Số lượng ảnh phải đúng 4");
      }
      return true;
    }),
    body("code").trim().notEmpty().withMessage("Mã hàng không được để trống"),
    body("name").trim().notEmpty().withMessage("Tên sản phẩm không được để trống"),
    body("category").trim().notEmpty().withMessage("Danh mục không được để trống"),
    body("shortDescription")
      .trim()
      .isLength({ min: 5 })
      .withMessage("Mô tả ngắn phải có ít nhất 5 ký tự"),
    body("longDescription")
      .trim()
      .isLength({ min: 5 })
      .withMessage("Mô tả chi tiết phải có ít nhất 5 ký tự"),
    body("price")
      .notEmpty()
      .withMessage("Giá không được để trống")
      .custom((value) => {
        if (Number(value) <= 0)
          throw new Error("Giá không được nhỏ hơn hoặc bằng 0");
        return true;
      }),
    body("stock")
      .notEmpty()
      .withMessage("Số lượng tồn kho không được để trống")
      .custom((value) => {
        if (Number(value) < 0)
          throw new Error("Số lượng tồn kho không được nhỏ hơn 0");
        return true;
      }),
  ],
  productControllers.postAdminCreateProduct
);

// @PATCH  /api/products/admin/edit-product/:productId    @Admin chỉnh sửa sản phẩm
router.patch(
  "/admin/edit-product/:productId",
  checkAuthToken,
  checkAdmin,
  upload.array("images", 4), // 👈 có thể không gửi ảnh mới; nếu gửi: tối đa 4
  [
    body("name").trim().notEmpty().withMessage("Tên sản phẩm không được để trống"),
    body("category").trim().notEmpty().withMessage("Danh mục không được để trống"),
    body("shortDescription")
      .trim()
      .isLength({ min: 5 })
      .withMessage("Mô tả ngắn phải có ít nhất 5 ký tự"),
    body("longDescription")
      .trim()
      .isLength({ min: 5 })
      .withMessage("Mô tả chi tiết phải có ít nhất 5 ký tự"),
    body("price")
      .notEmpty()
      .withMessage("Giá không được để trống")
      .custom((value) => {
        if (Number(value) <= 0)
          throw new Error("Giá không được nhỏ hơn hoặc bằng 0");
        return true;
      }),
    body("stock")
      .notEmpty()
      .withMessage("Số lượng tồn kho không được để trống")
      .custom((value) => {
        if (Number(value) < 0)
          throw new Error("Số lượng tồn kho không được nhỏ hơn 0");
        return true;
      }),
  ],
  productControllers.patchAdminEditProduct
);

// @DELETE  /api/products/admin/:productId    @Admin xoá sản phẩm
router.delete(
  "/admin/:productId",
  checkAuthToken,
  checkAdmin,
  productControllers.deleteAdminProduct
);

// === SỬA ĐỔI ROUTE NÀY ===
router.post(
  "/:productId/reviews",
  checkAuthToken,
  upload.array("reviewImages", 5), // <-- Tên field là 'reviewImages', tối đa 5 ảnh
  productControllers.addProductReview
);

// ❗ Xuất router ở CUỐI FILE
module.exports = router;