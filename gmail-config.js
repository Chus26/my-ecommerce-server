const send = require("gmail-send")({
  user: "danvulop8@gmail.com",
  pass: process.env.GMAIL_PASS,
});

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
