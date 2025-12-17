const nodemailer = require("nodemailer");

// Kiểm tra xem đang chạy trên Render (Production) hay Local
const isProduction = process.env.NODE_ENV === "production";

let transporter;

if (isProduction) {
  // ============================================
  // CẤU HÌNH CHO RENDER (Dùng Brevo SMTP)
  // ============================================
  console.log("🚀 Server Mode: PRODUCTION -> Dùng BREVO để gửi mail (Fix lỗi Timeout)");
  transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",  // Server của Brevo
    port: 587,                     // Cổng chuẩn quốc tế
    secure: false,                 // false cho port 587
    auth: {
      user: "danvulop8@gmail.com", // Email login Brevo
      pass: process.env.BREVO_PASS, // Biến môi trường chứa Key Brevo
    },
    tls: {
      rejectUnauthorized: false    // Tránh lỗi chứng chỉ SSL
    }
  });
} else {
  // ============================================
  // CẤU HÌNH CHO LOCALHOST (Dùng Gmail)
  // ============================================
  console.log("💻 Server Mode: DEV -> Dùng GMAIL như cũ");
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "danvulop8@gmail.com",
      pass: process.env.GMAIL_PASS, // Biến môi trường chứa App Password Gmail
    },
  });
}

const send = async ({ to, subject, html }) => {
  try {
    console.log(`⏳ Đang gửi mail tới: ${to}...`);
    const info = await transporter.sendMail({
      from: '"Boutique Shop Support" <danvulop8@gmail.com>',
      to: to,
      subject: subject,
      html: html,
    });
    console.log("✅ Gửi mail THÀNH CÔNG! MessageID:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Gửi mail THẤT BẠI:", error);
    return null; // Trả về null để không làm crash server
  }
};

module.exports = send;