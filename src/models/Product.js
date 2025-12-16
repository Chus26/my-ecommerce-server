// ===== FILE: models/Product.js (CODE HOÀN CHỈNH) =====

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Schema con cho Review (Giữ nguyên của bà)
const reviewSchema = new Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fullName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, maxLength: 500 },
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

// Schema sản phẩm chính (ĐÃ NÂNG CẤP)
const productSchema = new Schema(
  {
    // Các trường cũ của bà
    code: { type: String, required: true, unique: true, sparse: true, trim: true },
    category: { type: String, required: true },
    img1: { type: String, required: true },
    img2: { type: String, required: true },
    img3: { type: String, required: true },
    img4: { type: String, required: true },
    long_desc: { type: String, required: true, min: 5 },
    name: { type: String, required: true },
    price: { type: Number, min: 1 },
    short_desc: { type: String, required: true, min: 5 },
    stock: { type: Number, required: true, min: 0 },
    
    // Phần Review (Giữ nguyên)
    reviews: [reviewSchema],
    rating: { type: Number, required: true, default: 0 },
    numReviews: { type: Number, required: true, default: 0 },

    // ===============================================
    // === PHẦN NÂNG CẤP AI - THÊM 2 TRƯỜNG MỚI NÀY ===
    // ===============================================
    isAccessory: {
      type: Boolean,
      default: false,
    },
    compatibilityTags: [
      {
        type: String,
        trim: true,
      },
    ],
    // ===============================================
  },
  { timestamps: true }
);

// === ĐÁNH INDEX (CHỈ MỤC) ĐỂ TĂNG TỐC TRUY VẤN AI ===
productSchema.index({ compatibilityTags: 1 });
productSchema.index({ isAccessory: 1, stock: 1 });

module.exports = mongoose.model("Product", productSchema);