// const send = require("gmail-send")({
//   user: "danvulop8@gmail.com",
//   pass: process.env.GMAIL_PASS,
// });

// module.exports = send;

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // Dùng preset 'gmail' cho chuẩn
  auth: {
    user: "danvulop8@gmail.com",
    pass: process.env.GMAIL_PASS,
  },
  // 👇 CÁC DÒNG QUAN TRỌNG ĐỂ FIX TIMEOUT TRÊN RENDER 👇
  family: 4,              // Ép buộc dùng IPv4 (Fix lỗi chính)
  networkTimeout: 10000,  // Tăng thời gian chờ mạng lên 10s
  connectionTimeout: 10000,
  tls: {
    rejectUnauthorized: false // Bỏ qua lỗi chứng chỉ SSL nếu có
  }
});

const send = async ({ to, subject, html }) => {
  try {
    console.log("⏳ Đang gửi mail tới:", to);
    const info = await transporter.sendMail({
      from: '"Boutique Shop" <danvulop8@gmail.com>',
      to: to,
      subject: subject,
      html: html,
    });
    console.log("✅ Email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return null;
  }
};

module.exports = send;

// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: Number(process.env.SMTP_PORT || 2525),
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
// });

// /**
//  * Giữ nguyên logic cũ: Send({to, subject, html}, cb)
//  */
// module.exports = function send(options, cb) {
//   transporter.sendMail(
//     {
//       from: process.env.FROM_EMAIL || "no-reply@boutique.local",
//       to: options.to,
//       subject: options.subject,
//       html: options.html,
//     },
//     cb
//   );
// };
