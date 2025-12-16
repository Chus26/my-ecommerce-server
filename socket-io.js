// let io;

// module.exports = {
//   init: (httpServer, config) => {
//     io = require("socket.io")(httpServer, config);
//     return io;
//   },
//   getIO: () => {
//     if (!io) {
//       throw new Error("SocketIO not found");
//     } else {
//       return io;
//     }
//   },
// };
// Socket (hay WebSocket) dùng để tạo kết nối hai chiều (real-time, thời gian thực) giữa client (trình duyệt, ứng dụng di động) và server.

let io;

module.exports = {
  //Khởi tạo socket.io
  init: (httpServer, config) => {
    io = require("socket.io")(httpServer, config);
    return io;
  },
  //Lấy instance của io
  getIO: () => {
    if (!io) {
      throw new Error("Không tìm thấy SocketIO");
    } else {
      return io;
    }
  },
};
