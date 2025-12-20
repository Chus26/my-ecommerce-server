// ===== FILE: controllers/ProductController.js (ĐÃ NÂNG CẤP AI) =====

const Product = require("../models/Product");
const { validationResult } = require("express-validator");
const io = require("../../socket-io");
const { uploadMany, destroy } = require("../services/cloudinaryService");
const Order = require("../models/Order");
const User = require("../models/User");

// 📌 Lấy tất cả sản phẩm (Không đổi)
exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find({}).sort({ code: 1 });
    res.status(200).json({ products });
  } catch (error) {
    next(new Error(error));
  }
};

// controllers/ProductController.js
// (Dán hàm này vào bên dưới hàm getProducts)

// Lấy 8 sản phẩm thịnh hành (cho trang chủ)
exports.getTrendingProducts = async (req, res, next) => {
  try {
    const products = await Product.aggregate([
      { $sample: { size: 8 } }
    ]);

    res.status(200).json({ products });
  } catch (error) {
    next(new Error(error));
  }
};


// 📌 Lấy sản phẩm trong giỏ hàng (Không đổi)
exports.getProductsCart = async (req, res, next) => {
  const { productIds } = req.body;
  try {
    const products = await Product.find({ _id: { $in: productIds.split("\n") } });
    res.status(200).json({ products });
  } catch (error) {
    next(new Error(error));
  }
};

// 📌 Lấy chi tiết sản phẩm (Không đổi)
exports.getProduct = async (req, res, next) => {
  const { productId } = req.params;
  try {
    const product = await Product.findById(productId);
    const relatedProducts = await Product.find({
      $and: [{ category: product.category }, { _id: { $nin: [product._id] } }],
    });
    res.status(200).json({ product, relatedProducts });
  } catch (error) {
    next(new Error(error));
  }
};

// controllers/ProductController.js
// (Dán hàm này vào bên dưới hàm getProducts)

// Lấy 8 sản phẩm thịnh hành (cho trang chủ)
exports.getTrendingProducts = async (req, res, next) => {
  try {
    const products = await Product.aggregate([
      { $sample: { size: 8 } }
    ]);

    res.status(200).json({ products });
  } catch (error) {
    next(new Error(error));
  }
};


// 📌 Lấy dữ liệu để chỉnh sửa (Không đổi)
exports.getEditProduct = async (req, res, next) => {
  const { productId } = req.params;
  try {
    const product = await Product.findById(productId);
    return res.status(200).json({ product });
  } catch (error) {
    next(new Error(error));
  }
};

// ---------- CREATE (ĐÃ NÂNG CẤP) ----------
exports.postAdminCreateProduct = async (req, res, next) => {
  const {
    code, name, category, shortDescription, longDescription, price, stock,
    isAccessory,
    compatibilityTags
  } = req.body;

  try {
    const existed = await Product.findOne({ code });
    if (existed) return res.status(409).json({ message: "Mã hàng đã tồn tại!" });

    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const uploaded = await uploadMany(req.files || [], "products");
    const [i1, i2, i3, i4] = uploaded;
    if (!(i1 && i2 && i3 && i4)) {
      return res.status(422).json({ errors: [{ msg: "Cần đủ 4 ảnh" }] });
    }

    let tagsArray = [];
    if (compatibilityTags && typeof compatibilityTags === "string") {
      try {
        tagsArray = JSON.parse(compatibilityTags);
      } catch (e) {
        console.error("Lỗi parse compatibilityTags:", e);
      }
    }

    const product = new Product({
      code, name, category,
      short_desc: shortDescription,
      long_desc: longDescription,
      price, stock,
      img1: i1.url, img1_public_id: i1.public_id,
      img2: i2.url, img2_public_id: i2.public_id,
      img3: i3.url, img3_public_id: i3.public_id,
      img4: i4.url, img4_public_id: i4.public_id,
      isAccessory: isAccessory === "true",
      compatibilityTags: tagsArray
    });

    await product.save();
    return res.status(201).json({ message: "Tạo sản phẩm thành công!" });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "Mã hàng đã tồn tại!" });
    next(error);
  }
};

// ---------- UPDATE (ĐÃ NÂNG CẤP) ----------
exports.patchAdminEditProduct = async (req, res, next) => {
  const {
    code, name, category, shortDescription, longDescription, price, stock,
    isAccessory,
    compatibilityTags
  } = req.body;
  const { productId } = req.params;

  const slotToKeys = (idx) => {
    const map = [
      { urlKey: "img1", pidKey: "img1_public_id" },
      { urlKey: "img2", pidKey: "img2_public_id" },
      { urlKey: "img3", pidKey: "img3_public_id" },
      { urlKey: "img4", pidKey: "img4_public_id" },
    ];
    return map[idx];
  };

  const parseReplaceIndexes = (val) => {
    if (val == null) return [];
    if (Array.isArray(val)) return val.map((x) => Number(x)).filter(Number.isInteger);
    return [Number(val)].filter(Number.isInteger);
  };

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const p = await Product.findById(productId);
    if (!p) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    if (code && code !== p.code) {
      const existed = await Product.findOne({ code });
      if (existed) return res.status(409).json({ message: "Mã hàng đã tồn tại!" });
      p.code = code;
    }

    p.name = name;
    p.category = category;
    p.short_desc = shortDescription;
    p.long_desc = longDescription;
    p.price = price;
    p.stock = stock;

    p.isAccessory = isAccessory === "true" || isAccessory === true;

    let tagsArray = [];
    if (compatibilityTags && typeof compatibilityTags === "string") {
      try {
        tagsArray = JSON.parse(compatibilityTags);
      } catch (e) {
        console.error("Lỗi parse compatibilityTags:", e);
      }
    } else if (Array.isArray(compatibilityTags)) {
      tagsArray = compatibilityTags;
    }
    p.compatibilityTags = tagsArray;

    const hasFiles = Array.isArray(req.files) && req.files.length > 0;
    if (hasFiles) {
      const replaceIndexes =
        parseReplaceIndexes(req.body["replaceIndexes[]"] ?? req.body.replaceIndexes);

      if (replaceIndexes.length > 0) {
        if (replaceIndexes.length !== req.files.length) {
          return res.status(400).json({
            message: "Số ảnh tải lên không khớp số slot cần thay (replaceIndexes).",
          });
        }

        const uploaded = await uploadMany(req.files, "products");
        for (let i = 0; i < replaceIndexes.length; i++) {
          const slotIdx = replaceIndexes[i];
          if (slotIdx < 0 || slotIdx > 3) continue;

          const { urlKey, pidKey } = slotToKeys(slotIdx);
          const fileRes = uploaded[i];
          const oldPid = p[pidKey];
          if (oldPid) {
            try {
              await destroy(oldPid);
            } catch (e) {
              /* bỏ qua lỗi xoá */
            }
          }
          p[urlKey] = fileRes.url;
          p[pidKey] = fileRes.public_id;
        }
      } else if (req.files.length === 4) {
        const [i1, i2, i3, i4] = await uploadMany(req.files, "products");
        await Promise.allSettled([
          destroy(p.img1_public_id),
          destroy(p.img2_public_id),
          destroy(p.img3_public_id),
          destroy(p.img4_public_id),
        ]);
        p.img1 = i1.url; p.img1_public_id = i1.public_id;
        p.img2 = i2.url; p.img2_public_id = i2.public_id;
        p.img3 = i3.url; p.img3_public_id = i3.public_id;
        p.img4 = i4.url; p.img4_public_id = i4.public_id;
      } else {
        return res.status(400).json({
          message: "Thiếu replaceIndexes khi cập nhật 1..3 ảnh, hoặc gửi đủ 4 ảnh để thay toàn bộ.",
        });
      }
    }

    await p.save();
    io.getIO().emit("product", { action: "PRODUCT", product: p });
    return res.status(201).json({ message: "Cập nhật thành công!" });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "Mã hàng đã tồn tại!" });
    next(error);
  }
};

// ---------- DELETE (Không đổi) ----------
exports.deleteAdminProduct = async (req, res, next) => {
  const { productId } = req.params;
  try {
    const p = await Product.findById(productId);
    if (!p) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    await Promise.all([
      destroy(p.img1_public_id),
      destroy(p.img2_public_id),
      destroy(p.img3_public_id),
      destroy(p.img4_public_id),
    ]);

    await Product.findByIdAndDelete(productId);
    return res.status(200).json({ message: "Xoá thành công!" });
  } catch (error) {
    next(error);
  }
};

// 📌 Lấy sản phẩm liên quan (Không đổi)
exports.getRelatedProducts = async (req, res, next) => {
  const { productId } = req.params;
  const limit = Math.max(parseInt(req.query.limit, 10) || 8, 1);

  try {
    const current = await Product.findById(productId);
    if (!current) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    const relatedProducts = await Product.find({
      category: current.category,
      _id: { $ne: current._id },
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.status(200).json({ relatedProducts });
  } catch (error) {
    next(error);
  }
};

// 📌 Thêm đánh giá (Không đổi)
exports.addProductReview = async (req, res, next) => {
  const { productId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.userId;
  const files = req.files;

  try {
    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: "Vui lòng cung cấp xếp hạng (rating) từ 1 đến 5." });
    }
    if (!comment || comment.trim() === "") {
      return res.status(400).json({ message: "Vui lòng nhập nội dung đánh giá." });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm." });
    }

    const purchasedOrder = await Order.findOne({
      userId,
      "items.product.id": productId,
      deliveryStatus: "Delivered",
    });
    if (!purchasedOrder) {
      return res.status(403).json({
        message: "Bạn phải mua và nhận hàng thành công mới có thể đánh giá.",
      });
    }

    const alreadyReviewed = product.reviews.find(
      (r) => r.userId.toString() === userId.toString()
    );
    if (alreadyReviewed) {
      return res.status(409).json({ message: "Bạn đã đánh giá sản phẩm này rồi." });
    }

    const user = await User.findById(userId).select("fullName");

    let uploadedImages = [];
    if (files && files.length > 0) {
      const uploaded = await uploadMany(files, "reviews");
      uploadedImages = uploaded
        .filter((file) => file && file.url && file.public_id)
        .map((file) => ({
          url: file.url,
          public_id: file.public_id,
        }));
    }

    const review = {
      userId,
      fullName: user.fullName || "Người dùng",
      rating: ratingNum,
      comment: comment.trim(),
      images: uploadedImages,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

    await product.save();

    res.status(201).json({ message: "Đánh giá của bạn đã được thêm!" });
  } catch (error) {
    const err = new Error(error);
    err.httpStatus = 500;
    next(err);
  }
};

// ... (bên dưới hàm addProductReview)

// 📌 Lấy các đánh giá nổi bật (mới nhất)
exports.getFeaturedReviews = async (req, res, next) => {
  // Lấy 3 đánh giá (hoặc số lượng tùy ý từ query)
  const limit = parseInt(req.query.limit, 10) || 3;

  try {
    const featuredReviews = await Product.aggregate([
      // 1. Chỉ tìm các sản phẩm CÓ đánh giá (mảng reviews không rỗng)
      { $match: { "reviews.0": { $exists: true } } },

      // 2. Tách (unwind) mảng reviews thành các document riêng lẻ
      { $unwind: "$reviews" },

      // 3. Sắp xếp theo ngày tạo review (mới nhất trước)
      { $sort: { "reviews.createdAt": -1 } },

      // 4. Giới hạn số lượng (ví dụ: 3)
      { $limit: limit },

      // 5. Chọn lọc lại (project) các trường cần thiết cho gọn
      {
        $project: {
          _id: "$reviews._id",
          comment: "$reviews.comment",
          rating: "$reviews.rating",
          fullName: "$reviews.fullName",
          createdAt: "$reviews.createdAt",
          // (Bạn cũng có thể lấy tên sản phẩm nếu muốn)
          // productName: "$name",
          // productId: "$_id"
        },
      },
    ]);

    res.status(200).json({ reviews: featuredReviews });
  } catch (error) {
    next(new Error(error));
  }
};