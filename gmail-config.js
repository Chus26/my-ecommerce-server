// Thay thế toàn bộ nội dung file cũ bằng đoạn này:
const nodemailer = require("nodemailer");

// Tạo transporter với cấu hình Port 587 (TLS) để không bị Render chặn
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // false cho port 587, true cho port 465
  auth: {
    user: "danvulop8@gmail.com",
    // Đảm bảo biến môi trường này đã được đặt trên Render
    pass: process.env.GMAIL_PASS, 
  },
  tls: {
    rejectUnauthorized: false // Giúp tránh lỗi chứng chỉ SSL trên server
  }
});

// Tạo hàm send tương thích với cách gọi cũ của bạn
const send = async ({ to, subject, html }) => {
  try {
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
    // Không ném lỗi để tránh crash server nếu mail lỗi
    return null; 
  }
};

module.exports = send;