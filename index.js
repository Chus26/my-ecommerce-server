//Cấu hình Dotenv
require("dotenv").config();

//Lấy các packages
const express = require("express");
const cors = require("cors");
const path = require("path");

//Import các module từ file khác
const authRoutes = require("./src/routes/Auth");
const productRoutes = require("./src/routes/Product");
const orderRoutes = require("./src/routes/Order");
const suggestionRoutes = require("./src/routes/Suggestion");
const tagRoutes = require("./src/routes/Tag");
 // <-- THÊM DÒNG NÀY
const connectDB = require("./src/config/db");

//Khởi tạo ứng dụng
const app = express();

//Áp dụng các middleware
app.use(cors()); // Middleware chia sẻ tài nguyên giữa các nguồn (CORS)
app.use(express.json()); // Phân tích dữ liệu JSON từ body request
app.use(express.static(path.join(__dirname, "./src/public")));
app.use("/api/auth", authRoutes); // Định nghĩa routes cho auth
app.use("/api/products", productRoutes); // Định nghĩa routes cho sản phẩm
app.use("/api/orders", orderRoutes); // Định nghĩa routes cho đơn hàng
app.use("/api/suggestions", suggestionRoutes);
// app.js
app.use("/api/recommendations", require("./src/routes/recommendation"));
app.use("/api/tags", tagRoutes); // <-- THÊM DÒNG NÀY


//Middleware xử lý lỗi
app.use((error, req, res, next) => {
  //Gửi phản hồi lỗi
  res.status(error.httpStatus).json({ message: error.message });
});

//Cấu hình PORT
const PORT = process.env.PORT || 5000;

//Kết nối tới MongoDB
connectDB()
  .then(() => {
    console.log("Kết nối DB thành công");
    //Lắng nghe ứng dụng
    const server = app.listen(PORT, () => {
      console.log(`Server đang lắng nghe tại PORT ${PORT}`);
    });

    const io = require("./socket-io").init(server, {
      cors: {
        origin: "*",
      },
    });
    io.on("connection", (socket) => {
      console.log("Client đã kết nối!");
      //Sau khi kết nối
      //Xử lý tin nhắn chat
      
    });
  })
  .catch((err) => {
    //Có lỗi xảy ra
    console.log(err);
  });
