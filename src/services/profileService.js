// services/profileService.js
const Order = require("../models/Order");

/**
 * Lấy danh sách các category từ các đơn hàng gần nhất của người dùng.
 */
exports.getUserPurchaseHistory = async (userId, lookback = 10) => {
  const orders = await Order.find({ userId })
    .sort({ createdAt: -1 })
    .limit(lookback)
    .populate("items.product", "category") // Chỉ cần lấy category
    .lean();

  const categories = new Set();
  for (const order of orders) {
    for (const item of order.items || []) {
      if (item.product?.category) {
        categories.add(String(item.product.category).toLowerCase());
      }
    }
  }
  return { categories };
};