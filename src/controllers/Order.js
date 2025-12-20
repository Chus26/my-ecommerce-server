//Model Đơn hàng
const Order = require("../models/Order.js");

//Model Người dùng
const User = require("../models/User.js");

//Model Sản phẩm
const Product = require("../models/Product.js");

//Kết quả Validation
const { validationResult } = require("express-validator");

//Cấu hình gửi Gmail
const Send = require("../../gmail-config.js");

//Socket io
const io = require("../../socket-io.js");

// ===== 1. THÊM CÁC IMPORT CHO TÍNH NĂNG GỢI Ý =====
const SuggestionLog = require("../models/SuggestionLog");
// (Giả sử đường dẫn service của bạn là ../../services)
const { pickAccessoryCandidates } = require("../services/candidateService"); 
const { askGeminiCuteAdvice } = require("../services/geminiService");
// ===================================================

const triggerAiSuggestionLog = async (savedOrder) => {
  try {
    const userId = savedOrder.userId;
    console.log(`[Log Trigger] Starting AI suggestion log for Order ${savedOrder._id}`);

    for (const item of savedOrder.items) {
      const mainProductId = item.product.id;
      const mainProductName = item.product.name;

      // --- SỬA LỖI DUY NHẤT TẠI ĐÂY: Thêm { } ---
      // Vì service trả về object { candidates, anchorProductName } nên phải dùng { candidates } để lấy mảng ra
      const { candidates } = await pickAccessoryCandidates({
        userId: userId,
        mainProductId: mainProductId
      });
      // ------------------------------------------

      if (!candidates || candidates.length === 0) {
        console.log(`[Log Trigger] No candidates found for product ${mainProductId}`);
        continue;
      }

      const productsForAI = candidates.map((p) => ({
        id: String(p._id),
        name: p.name,
        category: p.category,
        price: p.price
      }));

      let aiResponses = [];
      try {
        const result = await askGeminiCuteAdvice({
          products: productsForAI,
          mainProduct: mainProductName
        });
        if (result && Array.isArray(result.recommendations)) {
          aiResponses = result.recommendations;
        }
      } catch (err) {
        console.error(`[Log Trigger] AI advice failed: ${err.message}`);
      }

      const aiMap = new Map();
      aiResponses.forEach((r) => aiMap.set(String(r.id), r.advice));

      const recommendationItemsForLog = candidates.map((p) => {
        const advice =
          aiMap.get(String(p._id)) ||
          `Sản phẩm này rất hợp với ${mainProductName} bạn vừa mua!`;
        return {
          productId: p._id,
          productName: p.name,
          advice: advice
        };
      });

      await SuggestionLog.create({
        userId: userId,
        mainProductId: mainProductId,
        recommendations: recommendationItemsForLog,
        status: "pending"
      });

      console.log(`[Log Trigger] SUCCESS: Log created for MainProduct ${mainProductId}`);
    }
  } catch (error) {
    console.error("[Log Trigger] Fatal error in triggerAiSuggestionLog:", error);
  }
};


//Logic Tạo Đơn hàng - Client
exports.postCreateOrder = async (req, res, next) => {
  const { address, cart } = req.body;
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const toAbsImg = (img) => (/^https?:\/\//i.test(img) ? img : `${process.env.DOMAIN}/${img}`);

    // 1) Load sp + validate tồn kho, đồng thời chuẩn bị snapshot và bulk ops
    const items = [];
    const opsDec = [];
    const touchedIds = new Set();

    for (const c of cart) {
      const p = await Product.findById(c.id);
      if (!p) return res.status(404).json({ message: "Không tìm thấy sản phẩm trong giỏ." });

      const qty = Number(c.quantity) || 0;
      if (qty <= 0) return res.status(400).json({ message: "Số lượng không hợp lệ." });
      if (qty > Number(p.stock)) {
        return res.status(403).json({ message: "Số lượng vượt quá tồn kho sản phẩm!" });
      }

      items.push({
        product: {
          id: String(p._id),
          name: p.name,
          price: Number(p.price) || 0,
          img: toAbsImg(p.img1),
          category: p.category || "other",
          code: p.code,

          // Trường AI bắt buộc
          _id: p._id,
          isAccessory: p.isAccessory,
          compatibilityTags: p.compatibilityTags,
        },
        quantity: qty,
      });


      opsDec.push({
        updateOne: {
          filter: { _id: p._id, stock: { $gte: qty } }, // chặn âm kho
          update: { $inc: { stock: -qty } },
        },
      });
      touchedIds.add(String(p._id));
    }

    // 2) Giảm kho atomic
    if (opsDec.length) {
      const decRes = await Product.bulkWrite(opsDec, { ordered: true });
      // nếu vì race condition dẫn tới không update đủ -> báo lại để KH thao tác lại
      if ((decRes.matchedCount ?? 0) < opsDec.length || (decRes.modifiedCount ?? 0) < opsDec.length) {
        return res.status(409).json({ message: "Kho thay đổi, vui lòng thử lại." });
      }
    }

    // 3) Bắn realtime product sau khi giảm kho
    const updatedProducts = await Product.find({ _id: { $in: Array.from(touchedIds) } });
    for (const p of updatedProducts) {
      io.getIO().emit("product", { action: "PRODUCT", product: p });
    }

    // 4) Tính tổng và lưu đơn
    const safeTotal = items.reduce((s, it) => s + it.quantity * it.product.price, 0);
    const order = new Order({ 
      userId: req.userId, 
      items, 
      totalPrice: safeTotal, 
      address: address // ✅ BỔ SUNG ADDRESS VÀO ĐÂY
    });

    const user = await User.findById(req.userId);
    user.address = address;

    // ===== Email đẹp + tiền tệ "đ" =====
    const PLACEHOLDER = "https://via.placeholder.com/90?text=Image";
    const fmtVND = (v) => new Intl.NumberFormat("vi-VN").format(Number(v) || 0).replace(/,/g, ".") + " đ";

    const renderTableBody = order.items.map((item) => `
      <tr>
        <td style="padding:12px 10px;border-bottom:1px solid #e5e7eb;">
          <div style="font-weight:600;color:#111827">${item.product.name}</div>
          <div style="color:#6b7280;font-size:12px">Mã: ${item.product.id}</div>
        </td>
        <td style="padding:12px 10px;border-bottom:1px solid #e5e7eb;text-align:center;">
          <img src="${item.product.img || PLACEHOLDER}" alt="${item.product.name || ''}"
               style="width:80px;height:80px;object-fit:cover;border-radius:8px;display:inline-block" />
        </td>
        <td style="padding:12px 10px;border-bottom:1px solid #e5e7eb;white-space:nowrap;">${fmtVND(item.product.price)}</td>
        <td style="padding:12px 10px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
        <td style="padding:12px 10px;border-bottom:1px solid #e5e7eb;font-weight:600;white-space:nowrap;">
          ${fmtVND(item.quantity * item.product.price)}
        </td>
      </tr>
    `).join("");

    const html = `<!doctype html><html><head>
      <meta name="viewport" content="width=device-width,initial-scale=1"/>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <title>Đặt hàng thành công</title>
    </head>
    <body style="margin:0;background:#f5f7fb;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f7fb;">
        <tr><td align="center" style="padding:24px 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640"
                 style="max-width:640px;width:100%;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
            <tr><td style="background:linear-gradient(90deg,#1d4ed8,#10b981);padding:18px 20px;">
              <div style="color:#fff;font-size:18px;font-weight:700;">Xác nhận đặt hàng</div>
              <div style="color:#e0f2fe;font-size:12px;margin-top:2px;">Cảm ơn bạn đã mua sắm!</div>
            </td></tr>
            <tr><td style="padding:18px 20px 0 20px;">
              <div style="font-size:16px;font-weight:600;color:#111827;">Xin chào ${user.fullName},</div>
              <div style="font-size:13px;color:#374151;margin-top:6px">
                Số điện thoại: <strong>${user.phoneNumber}</strong><br/>
                Địa chỉ: <strong>${address}</strong>
              </div>
            </td></tr>
            <tr><td style="padding:14px 20px 8px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <thead>
                  <tr>
                    <th align="left"  style="font-size:12px;color:#6b7280;padding:8px 10px;border-bottom:1px solid #e5e7eb;">Sản phẩm</th>
                    <th align="center"style="font-size:12px;color:#6b7280;padding:8px 10px;border-bottom:1px solid #e5e7eb;">Ảnh</th>
                    <th align="left"  style="font-size:12px;color:#6b7280;padding:8px 10px;border-bottom:1px solid #e5e7eb;white-space:nowrap;">Đơn giá</th>
                    <th align="center"style="font-size:12px;color:#6b7280;padding:8px 10px;border-bottom:1px solid #e5e7eb;">SL</th>
                    <th align="left"  style="font-size:12px;color:#6b7280;padding:8px 10px;border-bottom:1px solid #e5e7eb;white-space:nowrap;">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>${renderTableBody}</tbody>
              </table>
            </td></tr>
            <tr><td style="padding:8px 20px 18px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="right" style="color:#374151;font-size:13px;padding:6px 0;">Tổng thanh toán:</td>
                  <td align="right" style="font-weight:700;font-size:18px;color:#111827;padding-left:12px;white-space:nowrap;">
                    ${fmtVND(order.totalPrice)}
                  </td>
                </tr>
              </table>
            </td></tr>
            <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:14px 20px;">
              <div style="font-size:12px;color:#6b7280;">Nếu có thắc mắc, hãy phản hồi email này để được hỗ trợ.</div>
              <div style="font-size:12px;color:#9ca3af;margin-top:6px;">© ${new Date().getFullYear()} Your Shop. All rights reserved.</div>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body></html>`;

  //   Send({ html, to: user.email, subject: "Đặt hàng thành công" }, (e) => e && console.error(e));
  //   await Promise.all([order.save(), user.save()]);
  //   return res.status(201).json({ message: "Tạo đơn hàng thành công." });
  // } catch (error) {
  Send({ html, to: user.email, subject: "Đặt hàng thành công" }, (e) => e && console.error(e));
    await Promise.all([order.save(), user.save()]);

    const populatedOrder = await Order.findById(order._id).populate({
      path: "userId",
      select: "-password",
    });

    io.getIO().emit("order", {
      action: "NEW_ORDER",
      order: populatedOrder,
    });
    triggerAiSuggestionLog(order);

    return res.status(201).json({ message: "Tạo đơn hàng thành công." });
    } catch (error) {

    const err = new Error(error);
    err.httpStatus = 500;
    next(err);
  }
};


//Lấy tất cả đơn hàng của người dùng hiện tại - Client
exports.getUserOrders = async (req, res, next) => {
  try {
    //Lấy danh sách đơn hàng của user hiện tại
    const orders = await Order.find({ userId: req.userId }).populate({
      path: "userId",
      select: "-password",
    });

    //Trả về response cho client
    res.status(200).json({ orders });
  } catch (error) {
    //Cấu hình error middleware
    const err = new Error(error);
    err.httpStatus = 500;
    //Chuyển tiếp đến error middleware
    next(err);
  }
};

//Lấy chi tiết đơn hàng của user hiện tại
exports.getUserDetailOrder = async (req, res, next) => {
  //OrderId
  const { orderId } = req.params;

  try {
    //Tìm đơn hàng theo orderId
    const order = await Order.findOne({
      $and: [{ userId: req.userId, _id: orderId }],
    }).populate({
      path: "userId",
      select: "-password",
    });

    //Trả về response cho client
    res.status(200).json({ order });
  } catch (error) {
    //Cấu hình error middleware
    const err = new Error(error);
    err.httpStatus = 500;
    //Chuyển tiếp đến error middleware
    next(err);
  }
};


// exports.getAdminOrders = async (req, res, next) => {
//   try {
//     // === (Phần thống kê giữ nguyên) ===
//     const [totalUsers, totalOrders, successfulOrders, earnings, balanceOrders] =
//       await Promise.all([
//         User.find({ role: "user" }).countDocuments(),
//         Order.countDocuments({}),
//         Order.countDocuments({
//           paymentStatus: "Paid",
//           deliveryStatus: "Delivered",
//         }),
//         // Tính earnings (tổng doanh thu)
//         Order.aggregate([
//           { $match: { paymentStatus: "Paid", deliveryStatus: "Delivered" } },
//           { $group: { _id: null, total: { $sum: { $toDouble: "$totalPrice" } } } },
//         ]).then((result) => result[0]?.total || 0),

//         // === 🚀 PHỤC HỒI LOGIC GỐC CỦA BẠN CHO 'balanceOrders' ===
//         Order.aggregate([
//           {
//             $match: {
//               paymentStatus: "Paid",
//               deliveryStatus: "Delivered",
//               createdAt: {
//                 $gte: new Date(new Date().getFullYear(), 0, 1),
//                 $lt: new Date(new Date().getFullYear() + 1, 0, 1),
//               },
//             },
//           },
//           {
//             $group: {
//               _id: { month: { $month: "$createdAt" } },
//               monthlyTotal: { $sum: { $toDouble: "$totalPrice" } },
//             },
//           },
//           {
//             $group: {
//               _id: null,
//               totalRevenueYear: { $sum: "$monthlyTotal" },
//               monthsWithRevenue: { $sum: 1 },
//             },
//           },
//         ]).then((result) => {
//           const stats = result[0];
//           return stats && stats.monthsWithRevenue > 0
//             ? stats.totalRevenueYear / stats.monthsWithRevenue
//             : 0;
//         }),
//         // === KẾT THÚC PHỤC HỒI ===
//       ]);

//     // === 🚀 PHỤC HỒI LOGIC DOANH THU THÁNG HIỆN TẠI ===
//     const currentDate = new Date();
//     const currentYear = currentDate.getFullYear();
//     const currentMonth = currentDate.getMonth() + 1;
//     const startDateCurrentMonth = new Date(currentYear, currentMonth - 1, 1);
//     const startDateNextMonth = new Date(currentYear, currentMonth, 1);

//     const totalCurrentMonthRevenue = await Order.aggregate([
//       {
//         $match: {
//           createdAt: { $gte: startDateCurrentMonth, $lt: startDateNextMonth },
//           paymentStatus: "Paid",
//           deliveryStatus: "Delivered",
//         },
//       },
//       { $group: { _id: null, total: { $sum: { $toDouble: "$totalPrice" } } } },
//     ]).then((result) => result[0]?.total || 0);
//     // === KẾT THÚC PHỤC HỒI ===

//     // Lấy TẤT CẢ đơn hàng (cho trang Quản lý Đơn hàng)
//     const allOrders = await Order.find({})
//       .populate({ path: "userId", select: "-password" })
//       .sort({ createdAt: -1 });

//     // (Đã XÓA 'lastestOrders')

//     // Gửi response
//     res.status(200).json({
//       totalUsers,
//       totalOrders,
//       successfulOrders,
//       earnings,
//       balance: balanceOrders,
//       totalCurrentMonthRevenue,
//       orders: allOrders, // <-- Mảng chứa TẤT CẢ đơn hàng
//     });
    
//   } catch (error) {
//     console.error("Error in getAdminOrders:", error);
//     const err = new Error(error);
//     err.httpStatus = 500;
//     next(err);
//   }
// };

exports.getAdminOrders = async (req, res, next) => {
  try {
    // 1. Lấy năm từ người dùng chọn (VD: 2023)
    const year = Number(req.query.year) || new Date().getFullYear();
    
    // --- KHUNG THỜI GIAN CỦA NĂM ĐÓ ---
    // Từ: 00:00:00 ngày 01/01/2023
    // Đến: 00:00:00 ngày 01/01/2024
    const startYear = new Date(year, 0, 1);      
    const endYear = new Date(year + 1, 0, 1);    

    // --- KHUNG THỜI GIAN CỦA "THÁNG NAY" TRONG NĂM ĐÓ ---
    // Ví dụ: Hôm nay là tháng 12. Thì sẽ tính từ 01/12/2023 -> 01/01/2024
    const today = new Date();
    const currentMonthIndex = today.getMonth(); 
    const startMonth = new Date(year, currentMonthIndex, 1); 
    const endMonth = new Date(year, currentMonthIndex + 1, 1);

    const [totalUsers, totalOrders, successfulOrders, earnings, monthRevenue] =
      await Promise.all([
        // 1. KHÁCH HÀNG: Chỉ đếm user đăng ký TRONG NĂM ĐÓ
        User.countDocuments({ 
          role: "user",
          createdAt: { $gte: startYear, $lt: endYear } 
        }),

        // 2. TỔNG ĐƠN HÀNG: Chỉ đếm đơn tạo ra TRONG NĂM ĐÓ
        Order.countDocuments({
          createdAt: { $gte: startYear, $lt: endYear }
        }),

        // 3. ĐƠN THÀNH CÔNG: Chỉ đếm đơn thành công TRONG NĂM ĐÓ
        Order.countDocuments({
          paymentStatus: "Paid",
          deliveryStatus: "Delivered",
          createdAt: { $gte: startYear, $lt: endYear }
        }),

        // 4. TỔNG DOANH THU: Chỉ cộng tiền đơn thành công TRONG NĂM ĐÓ
        Order.aggregate([
          { 
            $match: { 
              paymentStatus: "Paid", 
              deliveryStatus: "Delivered",
              createdAt: { $gte: startYear, $lt: endYear } 
            } 
          },
          { $group: { _id: null, total: { $sum: { $toDouble: "$totalPrice" } } } },
        ]).then((result) => result[0]?.total || 0),

        // 5. DOANH THU TRONG THÁNG: Tính tiền của tháng hiện tại nhưng thuộc NĂM ĐÓ
        Order.aggregate([
          {
            $match: {
              paymentStatus: "Paid",
              deliveryStatus: "Delivered",
              createdAt: { $gte: startMonth, $lt: endMonth }, // Lọc theo tháng của năm đó
            },
          },
          {
            $group: { _id: null, total: { $sum: { $toDouble: "$totalPrice" } } },
          },
        ]).then((result) => result[0]?.total || 0),
      ]);

    // DANH SÁCH ĐƠN HÀNG: Cũng chỉ lấy đơn TRONG NĂM ĐÓ
    const allOrders = await Order.find({
        createdAt: { $gte: startYear, $lt: endYear }
      })
      .populate({ path: "userId", select: "-password" })
      .sort({ createdAt: -1 });

    res.status(200).json({
      year,
      totalUsers,
      totalOrders,
      successfulOrders,
      earnings, 
      totalCurrentMonthRevenue: monthRevenue,
      orders: allOrders,
    });
    
  } catch (error) {
    console.error("Error in getAdminOrders:", error);
    const err = new Error(error);
    err.httpStatus = 500;
    next(err);
  }
};



//Lấy chi tiết đơn hàng Admin
exports.getAdminOrderDetail = async (req, res, next) => {
  //OrderId
  const { orderId } = req.params;

  try {
    //Tìm chi tiết đơn hàng
    const order = await Order.findById(orderId).populate({
      path: "userId",
      select: "-password",
    });

    //Trả về response cho admin
    res.status(200).json({ order: order });
  } catch (error) {
    //Cấu hình error middleware
    const err = new Error(error);
    err.httpStatus = 500;
    //Chuyển tiếp đến error middleware
    next(err);
  }
};

exports.patchAdminOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus, deliveryStatus } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (deliveryStatus) order.deliveryStatus = deliveryStatus;

    await order.save(); // Lưu trạng thái mới

    // Lấy lại đơn hàng VÀ populate userId SAU KHI đã save trạng thái mới
    const populatedUpdatedOrder = await Order.findById(order._id).populate({
      path: "userId",
      select: "-password", // Loại bỏ mật khẩu
    });

    // Gửi đi đơn hàng đã được populate đầy đủ qua socket
    io.getIO().emit("order", {
      action: "ADMIN_UPDATED_STATUS",
      orderId: populatedUpdatedOrder._id,
      order: populatedUpdatedOrder, // Dùng biến mới đã populate
    });

    // Trả về JSON response cũng là đơn hàng đã populate
    return res.status(200).json({
      message: "Cập nhật trạng thái thành công!",
      order: populatedUpdatedOrder, // Dùng biến mới đã populate
    });
  } catch (error) {
    const err = new Error(error);
    err.httpStatus = 500;
    next(err);
  }
};

// GET /api/orders/admin/revenue-monthly?year=2025
exports.cancelUserOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ _id: orderId, userId: req.userId });
    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

    if (order.deliveryStatus === "Delivered")
      return res.status(409).json({ message: "Đơn đã giao, không thể hủy." });
    if (order.deliveryStatus === "Shipping")
      return res.status(409).json({ message: "Đơn đang giao, không thể hủy." });
    if (order.deliveryStatus === "Canceled")
      return res.status(400).json({ message: "Đơn đã được hủy trước đó." });

    // Chuẩn hoá id (hỗ trợ đơn cũ có _id)
    const getPid = (it) => String(it?.product?.id || it?.product?._id || "");

    // 1) Hoàn kho atomic
    const opsInc = [];
    const ids = new Set();
    for (const it of order.items) {
      const pid = getPid(it);
      const qty = Number(it?.quantity) || 0;
      if (pid && qty > 0) {
        opsInc.push({ updateOne: { filter: { _id: pid }, update: { $inc: { stock: qty } } } });
        ids.add(pid);
      }
    }
    if (opsInc.length) await Product.bulkWrite(opsInc, { ordered: false });

    // 2) Emit realtime cho các sản phẩm vừa đổi kho
    if (ids.size) {
      const products = await Product.find({ _id: { $in: Array.from(ids) } });
      for (const p of products) io.getIO().emit("product", { action: "PRODUCT", product: p });
    }

    // 3) Cập nhật trạng thái đơn
    order.deliveryStatus = "Canceled";
    if (order.paymentStatus === "Paid") order.paymentStatus = "Refunded";
    await order.save();

    // Lấy lại đơn hàng đã populate userId sau khi cập nhật
    const populatedCanceledOrder = await Order.findById(order._id).populate({
      path: "userId",
      select: "-password",
    });

    // Gửi đơn hàng hủy qua socket
    io.getIO().emit("order", {
      action: "USER_CANCELED",
      orderId: populatedCanceledOrder._id,
      order: populatedCanceledOrder,
    });

    // Trả về response
    return res.status(200).json({
      message: "Đã hủy đơn hàng và hoàn kho.",
      order: populatedCanceledOrder,
    });
  } catch (error) {
    const err = new Error(error);
    err.httpStatus = 500;
    next(err);
  }
};


exports.getMonthlyRevenue = async (req, res, next) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();

    const agg = await Order.aggregate([
      {
        $match: {
          paymentStatus: "Paid",
          deliveryStatus: "Delivered",
          createdAt: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) },
        },
      },
      {
        $group: {
          _id: { m: { $month: "$createdAt" } },
          total: { $sum: { $toDouble: "$totalPrice" } },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, month: "$_id.m", total: 1, count: 1 } },
      { $sort: { month: 1 } },
    ]);

    // đủ 12 tháng
    const data = Array.from({ length: 12 }, (_, i) => {
      const f = agg.find(x => x.month === i + 1);
      return { month: i + 1, total: f?.total || 0, count: f?.count || 0 };
    });

    res.status(200).json({ year, data });
  } catch (error) {
    const err = new Error(error);
    err.httpStatus = 500;
    next(err);
  }
};


// @GET /api/orders/admin/revenue-by-product?year=2025&limit=10
exports.getRevenueByProduct = async (req, res, next) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const limit = Math.min(Number(req.query.limit) || 10, 50);

    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);

    // ===== THAY THẾ TOÀN BỘ PHẦN NÀY =====
    const rows = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lt: end },
          paymentStatus: "Paid",
          deliveryStatus: "Delivered",
        },
      },
      { $unwind: "$items" },
      {
        $project: {
          productCode: "$items.product.code", // Lấy code
          productName: "$items.product.name",
          fallbackId: "$items.product.id", // Lấy id dự phòng
          lineRevenue: {
            $multiply: [
              { $toDouble: "$items.quantity" },
              { $toDouble: "$items.product.price" },
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            code: { $ifNull: ["$productCode", "$fallbackId"] }, // Group theo code hoặc id
            name: "$productName",
          },
          total: { $sum: "$lineRevenue" },
        },
      },
      {
        $project: {
          _id: 0,
          productCode: "$_id.code", // Xuất ra productCode
          productName: "$_id.name",
          total: 1,
        },
      },
      { $sort: { total: -1 } },
      { $limit: limit },
    ]);
    // ===== KẾT THÚC THAY THẾ =====

    res.json({ year, data: rows });
  } catch (error) {
    const err = new Error(error);
    err.httpStatus = 500;
    next(err);
  }
};

// ... (Dán vào sau hàm 'exports.getRevenueByProduct')

/**
 * @route   GET /api/orders/admin/statistics/status-distribution
 * @desc    Lấy phân bổ trạng thái của tất cả đơn hàng
 * @access  Private/Admin
 * 
 */
  exports.getOrderStatusDistribution = async (req, res, next) => {
    try {
      // 1. Lấy năm từ query (nếu không có thì lấy năm hiện tại)
      const year = Number(req.query.year) || new Date().getFullYear();
      
      // 2. Tạo mốc thời gian đầu năm và cuối năm
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year + 1, 0, 1);

      const agg = await Order.aggregate([
        {
          // ✅ QUAN TRỌNG: Lọc đơn hàng theo năm trước khi gom nhóm
          $match: {
            createdAt: { $gte: startDate, $lt: endDate }
          }
        },
        {
          $group: {
            _id: "$deliveryStatus", // Gom nhóm theo trạng thái
            count: { $sum: 1 },     // Đếm số lượng
          },
        },
        {
          $project: {
            _id: 0,
            status: "$_id",
            count: 1,
          },
        },
        { $sort: { status: 1 } },
      ]);

      res.status(200).json({ data: agg });

    } catch (error) {
      const err = new Error(error);
      err.httpStatus = 500;
      next(err);
    }
  };

//   try {
//     const agg = await Order.aggregate([
//       {
//         // Nhóm tất cả đơn hàng theo 'deliveryStatus'
//         $group: {
//           _id: "$deliveryStatus", // Ví dụ: "Pending", "Shipping", "Delivered", "Canceled"
//           count: { $sum: 1 },     // Đếm số lượng cho mỗi trạng thái
//         },
//       },
//       {
//         // Định dạng lại output
//         $project: {
//           _id: 0,
//           status: "$_id", // Đổi tên _id thành status
//           count: 1,
//         },
//       },
//       { $sort: { status: 1 } },
//     ]);

//     // Kết quả: [ { status: "Pending", count: 15 }, { status: "Shipping", count: 5 }, ... ]
//     res.status(200).json({ data: agg });

//   } catch (error) {
//     const err = new Error(error);
//     err.httpStatus = 500;
//     next(err);
//   }
// };

/**
 * @route   GET /api/orders/admin/statistics/user-growth?year=2025
 * @desc    Lấy số lượng người dùng mới đăng ký theo tháng
 * @access  Private/Admin
 */
exports.getNewUserGrowth = async (req, res, next) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();

    // Query vào Model 'User' (đã import ở đầu file)
    const agg = await User.aggregate([
      {
        // Lọc user (không phải admin) và trong năm đã chọn
        $match: {
          role: "user",
          createdAt: {
            $gte: new Date(year, 0, 1),
            $lt: new Date(year + 1, 0, 1),
          },
        },
      },
      {
        // Nhóm theo tháng tạo
        $group: {
          _id: { m: { $month: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, month: "$_id.m", count: 1 } },
      { $sort: { month: 1 } },
    ]);

    // Tạo 12 tháng mẫu (để đảm bảo các tháng không có user vẫn xuất hiện)
    const data = Array.from({ length: 12 }, (_, i) => {
      const f = agg.find(x => x.month === i + 1);
      return { month: i + 1, count: f?.count || 0 };
    });

    // Kết quả: [ { month: 1, count: 50 }, { month: 2, count: 75 }, ... ]
    res.status(200).json({ year, data });

  } catch (error) {
    const err = new Error(error);
    err.httpStatus = 500;
    next(err);
  }
};

