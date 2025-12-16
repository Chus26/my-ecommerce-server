// ===== FILE: src/models/SuggestionLog.js (Nội dung mới) =====

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Schema cho từng sản phẩm được gợi ý
const RecommendationItemSchema = new Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    productName: { type: String },
    reason: { type: String }, // Lý do AI gợi ý (nếu có)
    advice: { type: String }, // Lời khuyên AI (nếu có)
  },
  { _id: false }
);

// Schema chính cho log gợi ý
const suggestionLogSchema = new Schema(
  {
    // Người dùng nhận được gợi ý
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Sản phẩm chính mà người dùng đang xem (nếu có)
    mainProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    // Các sản phẩm đã được AI gợi ý cho user này
    recommendations: [RecommendationItemSchema],
    // Trạng thái kiểm duyệt của Consultant
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"], // Chờ duyệt, Đã duyệt, Đã từ chối
      default: "pending", // Mặc định là chờ duyệt
    },
    // Ghi chú của Consultant
    consultantNote: {
      type: String,
      default: "",
    },
    // (Optional) ID của Consultant đã duyệt
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true } // Tự động thêm createdAt, updatedAt
);

suggestionLogSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("SuggestionLog", suggestionLogSchema);
