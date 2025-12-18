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

const axios = require("axios");
const nodemailer = require("nodemailer");

// ===============================
// Detect môi trường (Server hay Local)
// ===============================
const isOnServer = process.env.RENDER || process.env.NODE_ENV === "production";

/**
 * ==========================================
 * SEND MAIL BẰNG BREVO API (DÀNH CHO RENDER)
 * Cách này dùng HTTP (Cổng 443) nên không bao giờ bị chặn
 * ==========================================
 */
const sendByBrevoAPI = async ({ to, subject, html }) => {
  try {
    console.log("🚀 SERVER: Gửi mail bằng BREVO API (HTTP)");

    const res = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Boutique Shop", // Tên hiển thị khi nhận mail
          email: "danvulop8@gmail.com", // Email đã xác thực trong Brevo
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY, // Lấy từ biến môi trường
          "Content-Type": "application/json",
        },
        timeout: 10000, // Tự ngắt sau 10s nếu treo
      }
    );

    console.log("✅ BREVO API gửi thành công. MessageID:", res.data.messageId);
    return res.data;
  } catch (err) {
    console.error(
      "❌ BREVO API gửi thất bại:",
      err.response?.data || err.message
    );
    // Lưu ý: Không throw lỗi để tránh crash app, chỉ log ra console
    return null;
  }
};

/**
 * ==========================================
 * SEND MAIL BẰNG GMAIL SMTP (DÀNH CHO LOCAL)
 * Cách này tiện lợi khi test ở máy nhà
 * ==========================================
 */
const sendByGmailSMTP = async ({ to, subject, html }) => {
  try {
    console.log("💻 LOCAL: Gửi mail bằng GMAIL SMTP");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER || "danvulop8@gmail.com",
        pass: process.env.GMAIL_PASS, // App Password 16 ký tự
      },
    });

    const info = await transporter.sendMail({
      from: '"Boutique Shop" <danvulop8@gmail.com>',
      to,
      subject,
      html,
    });

    console.log("✅ GMAIL gửi thành công:", info.messageId);
    return info;
  } catch (err) {
    console.error("❌ GMAIL gửi thất bại:", err.message);
    return null;
  }
};

/**
 * ==========================================
 * HÀM SEND CHÍNH (CONTROLLER GỌI HÀM NÀY)
 * ==========================================
 */
const send = async ({ to, subject, html }) => {
  console.log(`📨 Đang gửi đến: ${to}`);
  // Tự động chọn cách gửi dựa trên môi trường
  if (isOnServer) {
    return await sendByBrevoAPI({ to, subject, html });
  } else {
    return await sendByGmailSMTP({ to, subject, html });
  }
};

module.exports = send;