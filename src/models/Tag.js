// ===== TẠO FILE MỚI: models/Tag.js =====

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tagSchema = new Schema(
  {
    name: {
      // Tên hiển thị cho Admin (VD: "iPhone 17 Pro")
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      // Tên tag cho AI (VD: "product_iphone_17_pro")
      type: String,
      required: true,
      unique: true, // Không trùng
      trim: true,
    },
    // (Quan trọng) Phân loại tag để gom nhóm cho dễ
    type: {
      type: String,
      required: true,
      enum: [
        "product_line", // Dòng sản phẩm (iphone, ipad...)
        "product_model",  // Mẫu cụ thể (iphone_17, ipad_air_7...)
        "connector",      // Cổng kết nối (usb_c, lightning...)
        "feature",        // Tính năng (magsafe...)
      ],
      default: "product_model",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tag", tagSchema);