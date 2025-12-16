// // const mongoose = require("mongoose");
// // const Product = require("../models/Product");
// // const Order = require("../models/Order");
// // const Tag = require("../models/Tag");

// // /**
// //  * [STEP 1] Lấy TẤT CẢ các tag tương thích và ID sản phẩm
// //  * từ đơn hàng mới nhất của user.
// //  */
// // const getPurchaseData = async (userId) => {
// //   console.log("🔍 [STEP 1] Đang tìm đơn hàng mới nhất của user:", userId);
// //   const latestOrder = await Order.findOne({ userId })
// //     .sort({ createdAt: -1 })
// //     .populate("items.product", "name compatibilityTags isAccessory")
// //     .lean();

// //   // Nếu không có đơn hàng -> Trả về rỗng
// //   if (!latestOrder || !latestOrder.items?.length) {
// //     console.log("⚠️ Không tìm thấy đơn hàng hoặc đơn hàng rỗng.");
// //     return { tags: new Set(), purchasedProductIds: new Set(), anchorProductName: null };
// //   }

// //   console.log(
// //     "🧾 Đơn hàng mới nhất ID:",
// //     latestOrder._id,
// //     "| Ngày:",
// //     latestOrder.createdAt
// //   );

// //   const tags = new Set();
// //   const purchasedProductIds = new Set();
// //   let anchorProductName = null;

// //   latestOrder.items.forEach((item) => {
// //     if (item.product?._id) {
// //       purchasedProductIds.add(item.product._id.toString());
// //     }
    
// //     // Logic tìm sản phẩm chính (không phải phụ kiện)
// //     if (item.product && item.product.isAccessory === false) {
// //       // Nếu chưa có anchor name thì lấy tên sản phẩm này
// //       if (!anchorProductName) {
// //         anchorProductName = item.product.name;
// //       }
      
// //       if (item.product?.compatibilityTags?.length) {
// //         item.product.compatibilityTags.forEach((tag) => tags.add(tag));
// //       }
// //     }
// //   });

// //   console.log("📦 Tag tương thích THÔ:", [...tags]);
// //   console.log("🆔 ID sản phẩm đã mua:", [...purchasedProductIds]);
// //   console.log("⚓ Tên sản phẩm mỏ neo (Context):", anchorProductName);

// //   return { tags, purchasedProductIds, anchorProductName };
// // };

// // /**
// //  * Hàm chính: chọn sản phẩm phụ kiện gợi ý cho user
// //  */
// // exports.pickAccessoryCandidates = async ({ userId }) => {
// //   console.log("\n=======================");
// //   console.log("🎯 BẮT ĐẦU GỢI Ý (Data-Driven) CHO USER:", userId);
// //   console.log("=======================\n");

// //   // [STEP 1] Lấy tags, ID sản phẩm và TÊN SẢN PHẨM MUA GẦN NHẤT
// //   const { tags: allTagsFromOrder, purchasedProductIds, anchorProductName } =
// //     await getPurchaseData(userId);

// //   // [STEP 2] LỌC TAG "MỒI"
// //   console.log("🔥 [STEP 2.0] Đang lọc 'mồi'. Tag thô:", [...allTagsFromOrder]);

// //   let compatibilityTags = new Set();

// //   if (allTagsFromOrder.size > 0) {
// //     const identityTagObjects = await Tag.find({
// //       slug: { $in: [...allTagsFromOrder] },
// //       type: { $in: ["product_line", "product_model"] },
// //     }).select("slug");

// //     compatibilityTags = new Set(identityTagObjects.map((t) => t.slug));
// //   }

// //   // ==========================================================
// //   // ===== ⛔ THAY ĐỔI Ở ĐÂY: KHÔNG DÙNG FALLBACK NỮA =====
// //   // ==========================================================
// //   // [STEP 2.1] Kiểm tra nếu không có tag nào (Khách mới / Chưa mua đồ chính)
// //   if (compatibilityTags.size === 0) {
// //     console.log("⚠️ Khách hàng mới hoặc chưa mua sản phẩm chính -> KHÔNG GỢI Ý GÌ.");
// //     // Trả về danh sách rỗng ngay lập tức
// //     return { candidates: [], anchorProductName: null };
// //   }

// //   console.log("✅ [STEP 2.2] Tag mục tiêu SẠCH:", [...compatibilityTags]);

// //   // [STEP 3] Truy vấn DB (Chỉ chạy khi có tags)
// //   console.log("🚀 [STEP 3] Đang truy vấn MongoDB...");

// //   const purchasedIdsObject = [...purchasedProductIds].map(
// //     (id) => new mongoose.Types.ObjectId(id)
// //   );

// //   const result = await Product.aggregate([
// //     {
// //       $match: {
// //         isAccessory: true,
// //         stock: { $gt: 0 },
// //         compatibilityTags: { $in: [...compatibilityTags] },
// //         _id: { $nin: purchasedIdsObject },
// //       },
// //     },
// //     {
// //       $addFields: {
// //         matchingTags: {
// //           $size: {
// //             $setIntersection: ["$compatibilityTags", [...compatibilityTags]],
// //           },
// //         },
// //       },
// //     },
// //     { $sort: { matchingTags: -1, stock: -1 } },
// //     {
// //       $group: {
// //         _id: { $toLower: "$category" },
// //         doc: { $first: "$$ROOT" },
// //       },
// //     },
// //     { $replaceRoot: { newRoot: "$doc" } },
// //     { $limit: 4 },
// //     {
// //       $project: {
// //         _id: 1, name: 1, category: 1, price: 1, stock: 1, img1: 1,
// //       },
// //     },
// //   ]);

// //   console.log("\n🎉 [DONE] Hoàn tất gợi ý phụ kiện!\n");
  
// //   return { candidates: result, anchorProductName }; 
// // };

// const mongoose = require("mongoose");
// const Product = require("../models/Product");
// const Order = require("../models/Order");
// const Tag = require("../models/Tag");

// const getPurchaseData = async (userId) => {
//   console.log("🔍 [STEP 1] Đang tìm đơn hàng mới nhất của user:", userId);
//   const latestOrder = await Order.findOne({ userId })
//     .sort({ createdAt: -1 })
//     .populate("items.product", "name compatibilityTags isAccessory")
//     .lean();

//   if (!latestOrder || !latestOrder.items?.length) {
//     console.log("⚠️ Không tìm thấy đơn hàng hoặc đơn hàng rỗng.");
//     return { tags: new Set(), purchasedProductIds: new Set(), anchorProductName: null };
//   }

//   const tags = new Set();
//   const purchasedProductIds = new Set();
//   let anchorProductName = null;

//   latestOrder.items.forEach((item) => {
//     if (item.product?._id) {
//       purchasedProductIds.add(item.product._id.toString());
//     }
//     // Chỉ lấy tag từ sản phẩm chính (không phải phụ kiện)
//     if (item.product && item.product.isAccessory === false) {
//       if (!anchorProductName) {
//         anchorProductName = item.product.name;
//       }
//       if (item.product?.compatibilityTags?.length) {
//         item.product.compatibilityTags.forEach((tag) => tags.add(tag));
//       }
//     }
//   });
//   return { tags, purchasedProductIds, anchorProductName };
// };

// exports.pickAccessoryCandidates = async ({ userId }) => {
//   console.log("\n=======================");
//   console.log("🎯 BẮT ĐẦU GỢI Ý (Data-Driven) CHO USER:", userId);

//   const { tags: allTagsFromOrder, purchasedProductIds, anchorProductName } =
//     await getPurchaseData(userId);

//   let compatibilityTags = new Set();

//   if (allTagsFromOrder.size > 0) {
//     const identityTagObjects = await Tag.find({
//       slug: { $in: [...allTagsFromOrder] },
//       type: { $in: ["product_line", "product_model"] },
//     }).select("slug");
//     compatibilityTags = new Set(identityTagObjects.map((t) => t.slug));
//   }

//   // [STEP 2.1] KHÁCH MỚI HOẶC CHỈ MUA PHỤ KIỆN -> TRẢ VỀ RỖNG
//   if (compatibilityTags.size === 0) {
//     console.log("⚠️ Khách hàng mới hoặc chưa mua sản phẩm chính -> KHÔNG GỢI Ý.");
//     return { 
//         candidates: [], 
//         source: 'empty', 
//         anchorProductName: null 
//     };
//   }

//   console.log("✅ Tag mục tiêu SẠCH:", [...compatibilityTags]);

//   const purchasedIdsObject = [...purchasedProductIds].map(
//     (id) => new mongoose.Types.ObjectId(id)
//   );

//   const result = await Product.aggregate([
//     {
//       $match: {
//         isAccessory: true,
//         stock: { $gt: 0 },
//         compatibilityTags: { $in: [...compatibilityTags] },
//         _id: { $nin: purchasedIdsObject },
//       },
//     },
//     {
//       $addFields: {
//         matchingTags: {
//           $size: { $setIntersection: ["$compatibilityTags", [...compatibilityTags]] },
//         },
//       },
//     },
//     { $sort: { matchingTags: -1, stock: -1 } },
//     {
//       $group: {
//         _id: { $toLower: "$category" },
//         doc: { $first: "$$ROOT" },
//       },
//     },
//     { $replaceRoot: { newRoot: "$doc" } },
//     { $limit: 4 },
//     {
//       $project: {
//         _id: 1, name: 1, category: 1, price: 1, stock: 1, img1: 1,
//       },
//     },
//   ]);

//   return { 
//       candidates: result, 
//       source: 'learned', 
//       anchorProductName: anchorProductName 
//   }; 
// };

const mongoose = require("mongoose");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Tag = require("../models/Tag");

// Hàm lấy dữ liệu mua hàng (Đã tinh chỉnh)
const getPurchaseData = async (userId) => {
  console.log("🔍 [STEP 1] Đang tìm đơn hàng mới nhất của user:", userId);
  
  // Lấy đơn hàng mới nhất
  const latestOrder = await Order.findOne({ userId })
    .sort({ createdAt: -1 })
    .populate("items.product", "name compatibilityTags isAccessory")
    .lean();

  // Nếu không có đơn hàng nào -> Khách mới
  if (!latestOrder || !latestOrder.items?.length) {
    console.log("⚠️ Không tìm thấy đơn hàng hoặc đơn hàng rỗng.");
    return { tags: new Set(), purchasedProductIds: new Set(), anchorProductName: null };
  }

  const tags = new Set();
  const purchasedProductIds = new Set();
  let anchorProductName = null;
  let hasMainProduct = false; // Cờ kiểm tra xem đơn này có sản phẩm chính không

  latestOrder.items.forEach((item) => {
    if (item.product?._id) {
      purchasedProductIds.add(item.product._id.toString());
    }

    // --- QUAN TRỌNG: CHỈ LẤY DỮ LIỆU TỪ SẢN PHẨM CHÍNH (isAccessory = false) ---
    // Nếu khách mua phụ kiện (isAccessory = true), code sẽ bỏ qua, không lấy tag, không lấy tên.
    if (item.product && item.product.isAccessory === false) {
      hasMainProduct = true; // Đánh dấu là có mua sp chính
      if (!anchorProductName) {
        anchorProductName = item.product.name; // Lấy tên sản phẩm chính làm "mỏ neo"
      }
      if (item.product?.compatibilityTags?.length) {
        item.product.compatibilityTags.forEach((tag) => tags.add(tag));
      }
    }
  });

  // Nếu đơn hàng toàn phụ kiện (hasMainProduct vẫn là false)
  // Thì anchorProductName sẽ là null và tags sẽ rỗng.
  if (!hasMainProduct) {
      console.log("ℹ️ Đơn hàng mới nhất chỉ toàn phụ kiện. Coi như khách chưa có sản phẩm chính.");
  }

  return { tags, purchasedProductIds, anchorProductName };
};

exports.pickAccessoryCandidates = async ({ userId }) => {
  console.log("\n=======================");
  console.log("🎯 BẮT ĐẦU GỢI Ý (Data-Driven) CHO USER:", userId);

  const { tags: allTagsFromOrder, purchasedProductIds, anchorProductName } =
    await getPurchaseData(userId);

  let compatibilityTags = new Set();

  // Tìm các tag tương thích từ DB
  if (allTagsFromOrder.size > 0) {
    const identityTagObjects = await Tag.find({
      slug: { $in: [...allTagsFromOrder] },
      type: { $in: ["product_line", "product_model"] },
    }).select("slug");
    compatibilityTags = new Set(identityTagObjects.map((t) => t.slug));
  }

  // [STEP 2.1] KHÁCH MỚI HOẶC CHỈ MUA PHỤ KIỆN (compatibilityTags rỗng)
  // -> TRẢ VỀ RỖNG ĐỂ CONTROLLER HIỂN THỊ LỜI CHÀO MUA SP CHÍNH
  if (compatibilityTags.size === 0) {
    console.log("⚠️ Khách hàng mới hoặc chỉ mua phụ kiện -> KHÔNG GỢI Ý, CHỜ MUA SP CHÍNH.");
    return {
        candidates: [],
        source: 'empty', 
        anchorProductName: null // Đảm bảo null để không hiện "Tớ thấy cậu mới mua..."
    };
  }

  console.log("✅ Tag mục tiêu SẠCH:", [...compatibilityTags]);

  // Logic tìm sản phẩm (giữ nguyên)
  const purchasedIdsObject = [...purchasedProductIds].map(
    (id) => new mongoose.Types.ObjectId(id)
  );

  const result = await Product.aggregate([
    {
      $match: {
        isAccessory: true,
        stock: { $gt: 0 },
        compatibilityTags: { $in: [...compatibilityTags] },
        _id: { $nin: purchasedIdsObject },
      },
    },
    {
      $addFields: {
        matchingTags: {
          $size: { $setIntersection: ["$compatibilityTags", [...compatibilityTags]] },
        },
      },
    },
    { $sort: { matchingTags: -1, stock: -1 } },
    {
      $group: {
        _id: { $toLower: "$category" },
        doc: { $first: "$$ROOT" },
      },
    },
    { $replaceRoot: { newRoot: "$doc" } },
    { $limit: 4 },
    {
      $project: {
        _id: 1, name: 1, category: 1, price: 1, stock: 1, img1: 1,
      },
    },
  ]);

  return {
      candidates: result,
      source: 'learned',
      anchorProductName: anchorProductName
  };
};