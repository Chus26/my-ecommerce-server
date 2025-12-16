// //unlink
// const fs = require("fs");

// exports.handleUnlinkFile = (path) => {
//   fs.unlink(path, (err) => {
//     if (err) {
//       throw new Error(err);
//     }
//   });
// };

//Xoá file (unlink)
const fs = require("fs");

exports.handleUnlinkFile = (path) => {
  fs.unlink(path, (err) => {
    if (err) {
      throw new Error(err);
    }
  });
};
