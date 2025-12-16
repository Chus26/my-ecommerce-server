const Product = require("../models/Product");
const SuggestionLog = require("../models/SuggestionLog");
const { pickAccessoryCandidates } = require("../services/candidateService");
const { askGeminiCuteAdvice } = require("../services/geminiService");

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

exports.getAiAccessories = async (req, res) => {
  try {
    const userId = req.userId;
    const cacheThreshold = new Date(Date.now() - CACHE_DURATION_MS);

    // 1. KIỂM TRA CACHE (Giữ nguyên logic cache)
    const recentLog = await SuggestionLog.findOne({
      userId: userId,
      createdAt: { $gte: cacheThreshold },
    })
      .sort({ createdAt: -1 })
      .populate("recommendations.productId")
      .populate("mainProductId");

    if (recentLog && recentLog.recommendations.length > 0) {
      const finalItems = recentLog.recommendations
        .filter((rec) => rec.productId)
        .map((rec) => ({
           id: rec.productId._id,
           name: rec.productId.name,
           category: rec.productId.category,
           price: rec.productId.price,
           img: rec.productId.img1,
           stock: rec.productId.stock,
           advice: rec.advice
        }));

      let contextTitle = "BÉ AI 🤖 đã tìm vài món phụ kiện hay ho cho cậu nè:";
      if (recentLog.mainProductId && recentLog.mainProductId.name) {
          contextTitle = `Tớ thấy cậu mới mua ${recentLog.mainProductId.name}, tớ tìm cho cậu vài phụ kiện thích hợp nè:`;
      }
      return res.status(200).json({ recommendations: finalItems, contextTitle: contextTitle });
    }

    // 2. CACHE MISS - GỌI SERVICE
    const { candidates, source, anchorProductName } = await pickAccessoryCandidates({ userId: userId });
   
    // === TRƯỜNG HỢP: KHÁCH MỚI HOẶC CHỈ MUA PHỤ KIỆN ===
    // Nếu candidates rỗng, ta mặc định coi như chưa có sản phẩm chính để gợi ý.
    if (!candidates || candidates.length === 0) {
        // Trả về mảng rỗng VÀ câu chào ưu tiên cho việc mua sản phẩm chính
        return res.status(200).json({
            recommendations: [],
            // Đây là câu bạn yêu cầu ưu tiên:
            contextTitle: "Hãy mua sản phẩm chính để tớ gợi ý cho cậu phụ kiện cực xịn nhé! 😉"
        });
    }

    // === TRƯỜNG HỢP CÓ GỢI Ý (TỨC LÀ CÓ MUA SẢN PHẨM CHÍNH) ===
    let contextTitle = "BÉ AI 🤖 đã tìm vài món phụ kiện hay ho cho cậu nè:";
    
    // Chỉ hiển thị tên sản phẩm nếu anchorProductName tồn tại (tức là đã lọc qua isAccessory=false ở service)
    if (source === 'learned' && anchorProductName) {
       contextTitle = `Tớ thấy cậu mới mua ${anchorProductName}, tớ tìm cho cậu vài phụ kiện thích hợp nè:`;
    }

    const productsForAI = candidates.map((p) => ({ id: String(p._id), name: p.name, category: p.category, price: p.price }));
    let aiResponses = [];
    try {
      const result = await askGeminiCuteAdvice({ products: productsForAI });
      if (result && Array.isArray(result.recommendations)) aiResponses = result.recommendations;
    } catch (err) { console.error(err); }

    const aiMap = new Map();
    aiResponses.forEach((r) => aiMap.set(String(r.id), r.advice));
   
    const recommendationItemsForLog = [];
    const finalItems = candidates.map((p) => {
        const advice = aiMap.get(String(p._id)) || "Sản phẩm này đang được rất nhiều khách yêu thích đó 💕";
        recommendationItemsForLog.push({ productId: p._id, productName: p.name, advice: advice });
        return { id: p._id, name: p.name, category: p.category, price: p.price, img: p.img1, stock: p.stock, advice: advice };
    });

    if (recommendationItemsForLog.length > 0) {
        SuggestionLog.create({ userId, mainProductId: null, recommendations: recommendationItemsForLog, status: "pending" }).catch(console.error);
    }

    return res.status(200).json({
        recommendations: finalItems,
        contextTitle: contextTitle
    });

  } catch (error) {
    console.error(">>> getAiAccessories ERROR:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};