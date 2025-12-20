

// // //Lấy express
// // const express = require("express");
// // const router = express.Router();

// // const orderControllers = require("../controllers/Order");
// // const { body } = require("express-validator");
// // const { checkAuthToken, checkAdminAndConsultant } = require("../middlewares/Auth");

// // // Client
// // router.post(
// //   "/",
// //   checkAuthToken,
// //   [body("address").notEmpty().withMessage("Vui lòng nhập địa chỉ của bạn.")],
// //   orderControllers.postCreateOrder
// // );
// // router.get("/", checkAuthToken, orderControllers.getUserOrders);
// // router.patch("/:orderId/cancel", checkAuthToken, orderControllers.cancelUserOrder);

// // // Admin: ĐẶT ROUTE CỤ THỂ TRƯỚC ROUTE ĐỘNG
// // router.get(
// //   "/admin/revenue-monthly",
// //   checkAuthToken,
// //   checkAdminAndConsultant,
// //   orderControllers.getMonthlyRevenue
// // );

// // router.get(
// //   "/admin/revenue-by-product",
// //   checkAuthToken,
// //   checkAdminAndConsultant,
// //   orderControllers.getRevenueByProduct
// // );


// // router.get(
// //   "/admin",
// //   checkAuthToken,
// //   checkAdminAndConsultant,
// //   orderControllers.getAdminOrders
// // );

// // router.get(
// //   "/admin/:orderId",
// //   checkAuthToken,
// //   checkAdminAndConsultant,
// //   orderControllers.getAdminOrderDetail
// // );

// // router.patch(
// //   "/admin/:orderId/status",
// //   checkAuthToken,
// //   checkAdminAndConsultant,
// //   orderControllers.patchAdminOrderStatus
// // );

// // // Client detail
// // router.get("/:orderId", checkAuthToken, orderControllers.getUserDetailOrder);

// // module.exports = router;

// // Lấy Express
// const express = require("express");
// const router = express.Router();

// const orderControllers = require("../controllers/Order");
// const { body } = require("express-validator");
// const { checkAuthToken, checkAdminAndConsultant } = require("../middlewares/Auth");

// // ==================== Client Routes ====================
// router.post(
//   "/",
//   checkAuthToken,
//   [body("address").notEmpty().withMessage("Vui lòng nhập địa chỉ của bạn.")],
//   orderControllers.postCreateOrder
// );

// router.get("/", checkAuthToken, orderControllers.getUserOrders);
// router.patch("/:orderId/cancel", checkAuthToken, orderControllers.cancelUserOrder);

// // ==================== Admin Routes ====================
// // Route thống kê đặt trước để không bị ghi đè
// router.get(
//   "/admin/revenue-monthly",
//   checkAuthToken,
//   checkAdminAndConsultant,
//   orderControllers.getMonthlyRevenue
// );

// router.get(
//   "/admin/revenue-by-product",
//   checkAuthToken,
//   checkAdminAndConsultant,
//   orderControllers.getRevenueByProduct
// );

// // 2 Route thống kê mới
// router.get(
//   "/admin/statistics/status-distribution",
//   checkAuthToken,
//   checkAdminAndConsultant,
//   orderControllers.getOrderStatusDistribution
// );

// router.get(
//   "/admin/statistics/user-growth",
//   checkAuthToken,
//   checkAdminAndConsultant,
//   orderControllers.getNewUserGrowth
// );

// router.get(
//   "/admin",
//   checkAuthToken,
//   checkAdminAndConsultant,
//   orderControllers.getAdminOrders
// );

// // Route động với :orderId (Admin)
// router.get(
//   "/admin/:orderId",
//   checkAuthToken,
//   checkAdminAndConsultant,
//   orderControllers.getAdminOrderDetail
// );

// router.patch(
//   "/admin/:orderId/status",
//   checkAuthToken,
//   checkAdminAndConsultant,
//   orderControllers.patchAdminOrderStatus
// );

// // Route động Client (phải ở cuối cùng)
// router.get("/:orderId", checkAuthToken, orderControllers.getUserDetailOrder);

// module.exports = router;

// Lấy Express
const express = require("express");
const router = express.Router();

const orderControllers = require("../controllers/Order");
const { body } = require("express-validator");
const { checkAuthToken, checkAdminAndConsultant } = require("../middlewares/Auth");

// ==================== Client Routes ====================
router.post(
  "/",
  checkAuthToken,
  [body("address").notEmpty().withMessage("Vui lòng nhập địa chỉ của bạn.")],
  orderControllers.postCreateOrder
);

router.get("/", checkAuthToken, orderControllers.getUserOrders);
router.patch("/:orderId/cancel", checkAuthToken, orderControllers.cancelUserOrder);

// ==================== Admin Routes ====================
// Route thống kê đặt trước để không bị ghi đè
router.get(
  "/admin/revenue-monthly",
  checkAuthToken,
  checkAdminAndConsultant,
  orderControllers.getMonthlyRevenue
);

router.get(
  "/admin/revenue-by-product",
  checkAuthToken,
  checkAdminAndConsultant,
  orderControllers.getRevenueByProduct
);

// 2 Route thống kê mới
router.get(
  "/admin/statistics/status-distribution",
  checkAuthToken,
  checkAdminAndConsultant,
  orderControllers.getOrderStatusDistribution
);

router.get(
  "/admin/statistics/user-growth",
  checkAuthToken,
  checkAdminAndConsultant,
  orderControllers.getNewUserGrowth
);

// 👇👇👇 THÊM ĐOẠN NÀY ĐỂ FIX LỖI FRONTEND EXCEL 👇👇👇
router.get(
  "/admin/all",
  checkAuthToken,
  checkAdminAndConsultant,
  orderControllers.getAdminOrders
);
// 👆👆👆 ----------------------------------------- 👆👆👆

router.get(
  "/admin",
  checkAuthToken,
  checkAdminAndConsultant,
  orderControllers.getAdminOrders
);

// Route động với :orderId (Admin)
router.get(
  "/admin/:orderId",
  checkAuthToken,
  checkAdminAndConsultant,
  orderControllers.getAdminOrderDetail
);

router.patch(
  "/admin/:orderId/status",
  checkAuthToken,
  checkAdminAndConsultant,
  orderControllers.patchAdminOrderStatus
);



// Route động Client (phải ở cuối cùng)
router.get("/:orderId", checkAuthToken, orderControllers.getUserDetailOrder);

module.exports = router;