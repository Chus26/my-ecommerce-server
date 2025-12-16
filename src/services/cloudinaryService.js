// services/cloudinaryService.js
const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadBuffer(buffer, folder = "products") {
  const base64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;
  const r = await cloudinary.uploader.upload(base64, {
    folder,
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  });
  return { url: r.secure_url, public_id: r.public_id };
}

async function uploadMany(files = [], folder = "products") {
  const arr = await Promise.all(files.map(f => uploadBuffer(f.buffer, folder)));
  return [arr[0], arr[1], arr[2], arr[3]]; // luôn 4 slot (có thể undefined)
}

async function destroy(public_id) {
  if (!public_id) return;
  try { await cloudinary.uploader.destroy(public_id); } catch {}
}

module.exports = { uploadMany, destroy };
