
// //Export default Order Model, orders collection
// module.exports = mongoose.model("Order", orderSchema);

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PAYMENT = {
  WAITING: "Waiting for pay",
  PAID: "Paid",
  REFUNDED: "Refunded",
};
const DELIVERY = {
  WAITING: "Waiting for progressing",
  SHIPPING: "Shipping",
  DELIVERED: "Delivered",
  CANCELED: "Canceled",
};

const orderSchema = new Schema(
  {
    userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        product: { type: Object, required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    totalPrice: { type: Number, required: true, min: 0 },

    address: { 
      type: String, 
      required: [true, "Vui lòng nhập địa chỉ giao hàng"] // Thêm 'required'
    },

    deliveryStatus: {
      type: String,
      enum: Object.values(DELIVERY),
      default: DELIVERY.WAITING,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT),
      default: PAYMENT.WAITING,
      index: true,
    },
  },
  { timestamps: true }
);

// phục vụ aggregate doanh thu theo trạng thái + thời gian
orderSchema.index({ paymentStatus: 1, deliveryStatus: 1, createdAt: 1 });

module.exports = mongoose.model("Order", orderSchema);
// (tuỳ chọn) module.exports.PAYMENT = PAYMENT; module.exports.DELIVERY = DELIVERY;
