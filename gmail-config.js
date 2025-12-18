// // const send = require("gmail-send")({
// //   user: "danvulop8@gmail.com",
// //   pass: process.env.GMAIL_PASS,
// // });

// // module.exports = send;

// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   service: "gmail", // Dùng preset 'gmail' cho chuẩn
//   auth: {
//     user: "danvulop8@gmail.com",
//     pass: process.env.GMAIL_PASS,
//   },
//   // 👇 CÁC DÒNG QUAN TRỌNG ĐỂ FIX TIMEOUT TRÊN RENDER 👇
//   family: 4,              // Ép buộc dùng IPv4 (Fix lỗi chính)
//   networkTimeout: 10000,  // Tăng thời gian chờ mạng lên 10s
//   connectionTimeout: 10000,
//   tls: {
//     rejectUnauthorized: false // Bỏ qua lỗi chứng chỉ SSL nếu có
//   }
// });

// const send = async ({ to, subject, html }) => {
//   try {
//     console.log("⏳ Đang gửi mail tới:", to);
//     const info = await transporter.sendMail({
//       from: '"Boutique Shop" <danvulop8@gmail.com>',
//       to: to,
//       subject: subject,
//       html: html,
//     });
//     console.log("✅ Email sent successfully:", info.messageId);
//     return info;
//   } catch (error) {
//     console.error("❌ Error sending email:", error);
//     return null;
//   }
// };

// module.exports = send;

// // const nodemailer = require("nodemailer");

// // const transporter = nodemailer.createTransport({
// //   host: process.env.SMTP_HOST,
// //   port: Number(process.env.SMTP_PORT || 2525),
// //   auth: {
// //     user: process.env.SMTP_USER,
// //     pass: process.env.SMTP_PASS,
// //   },
// // });

// // /**
// //  * Giữ nguyên logic cũ: Send({to, subject, html}, cb)
// //  */
// // module.exports = function send(options, cb) {
// //   transporter.sendMail(
// //     {
// //       from: process.env.FROM_EMAIL || "no-reply@boutique.local",
// //       to: options.to,
// //       subject: options.subject,
// //       html: options.html,
// //     },
// //     cb
// //   );
// // };

const nodemailer = require("nodemailer");

// 👇 LOGIC SIÊU CHUẨN:
// 1. process.env.RENDER: Biến này Render tự động có (Local không có).
// 2. process.env.NODE_ENV === 'production': Cách kiểm tra truyền thống.
// => Chỉ cần 1 trong 2 cái đúng là biết đang ở trên Server.
const isOnServer = process.env.RENDER || process.env.NODE_ENV === 'production';

let transporter;

if (isOnServer) {
  // ============================================
  // CẤU HÌNH BREVO (CHẠY TRÊN RENDER)
  // ============================================
  console.log("🚀 PHÁT HIỆN SERVER RENDER -> Dùng BREVO SMTP");
  transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: "danvulop8@gmail.com", 
      pass: process.env.BREVO_PASS, // Đảm bảo Render đã có biến này
    },
    tls: { rejectUnauthorized: false }
  });
} else {
  // ============================================
  // CẤU HÌNH GMAIL (CHẠY LOCALHOST)
  // ============================================
  console.log("💻 PHÁT HIỆN LOCALHOST -> Dùng GMAIL SMTP");
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "danvulop8@gmail.com",
      pass: process.env.GMAIL_PASS, // Local dùng App Password
    },
  });
}

const send = async ({ to, subject, html }) => {
  try {
    console.log(`📨 Đang gửi đến: ${to}`);
    console.log(`🔧 Chế độ gửi: ${isOnServer ? "BREVO (Server)" : "GMAIL (Local)"}`);

    const info = await transporter.sendMail({
      from: '"Boutique Shop" <danvulop8@gmail.com>',
      to,
      subject,
      html,
    });
    console.log("✅ Gửi thành công! ID:", info.messageId);
    return info;
  } catch (err) {
    console.error("❌ Gửi thất bại:", err.message);
    return null;
  }
};

module.exports = send;