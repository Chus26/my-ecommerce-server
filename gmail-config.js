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

// LOGIC THÔNG MINH: Có chìa khóa Brevo thì dùng Brevo, không thì về Gmail
const useBrevo = process.env.BREVO_PASS && process.env.BREVO_PASS.length > 0;

let transporter;

if (useBrevo) {
  // ============================================
  // CẤU HÌNH BREVO (Dành cho Render)
  // ============================================
  console.log("🚀 PRODUCTION -> Dùng BREVO SMTP");
  transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      // 👇 QUAN TRỌNG: Brevo dùng Email login, KHÔNG PHẢI "apikey"
      user: "danvulop8@gmail.com", 
      pass: process.env.BREVO_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
} else {
  // ============================================
  // CẤU HÌNH GMAIL (Dành cho Localhost)
  // ============================================
  console.log("💻 DEV -> Dùng GMAIL SMTP");
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "danvulop8@gmail.com",
      pass: process.env.GMAIL_PASS,
    },
  });
}

const send = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      // 👇 Dùng chính mail của bạn để không bị Brevo chặn
      from: '"Boutique Shop" <danvulop8@gmail.com>', 
      to,
      subject,
      html,
    });
    console.log("✅ Gửi mail thành công! MessageID:", info.messageId);
    return info;
  } catch (err) {
    console.error("❌ Lỗi gửi mail:", err.message);
    return null;
  }
};

module.exports = send;