// ===== FILE: services/geminiService.js (Giới hạn TỐI ĐA 15 từ) =====

const { GoogleGenerativeAI } = require("@google/generative-ai");

const MODEL_NAME = "gemini-2.5-flash";
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

exports.askGeminiCuteAdvice = async ({ products }) => {
  try {
    const generationConfig = {
      temperature: 0.7,
      maxOutputTokens: 2000, // 👈 Tăng lên để không bị cắt giữa chừng
      responseMimeType: "application/json", // 👈 Ép buộc trả về JSON chuẩn
    };

    const fullPrompt = `
Vai trò: Bạn là "Chuyên gia Apple Store" kiêm "Trợ lý AI thông minh", am hiểu sâu sắc về sản phẩm Apple và phong cách sống của người dùng.

Nhiệm vụ: Viết lời khuyên ngắn gọn, sang trọng và tự nhiên cho từng sản phẩm trong danh sách.

Yêu cầu:
1. Giọng văn **chuyên nghiệp, tinh tế, truyền cảm hứng**, như nhân viên Apple chính hãng trò chuyện 1-1.
2. **CỰC KỲ QUAN TRỌNG:** Mỗi lời khuyên chỉ **1 câu DUY NHẤT** và **TUYỆT ĐỐI không quá 15 TỪ**.
3. Tập trung vào **trải nghiệm người dùng** và **giá trị thực tế**, không mô tả kỹ thuật.
4. Không dùng emoji, không dùng từ “quảng cáo”, không quá khoa trương.
5. Gợi cảm giác **“nâng cấp xứng đáng”** hoặc **“trải nghiệm hoàn hảo hơn”**.

Giọng văn:
- **Tự nhiên & tinh tế**, như đang gợi ý nhẹ nhàng.
- **Hiện đại & gần gũi**, phản ánh phong cách Apple.

Ví dụ (Đúng 15 từ hoặc ít hơn):
* (MacBook Air) "Mỏng, mạnh, và sẵn sàng cho mọi ý tưởng của bạn." (8 từ)
* (AirPods Pro) "Cảm nhận sự tĩnh lặng tuyệt đối với khả năng chống ồn chủ động vượt trội." (13 từ)
* (iPhone 15 Pro) "Thiết kế cho những ai muốn nắm bắt thế giới theo cách riêng." (11 từ)
* (MagSafe Charger) "Sạc nhanh, gọn gàng và tinh tế – đúng phong cách Apple bạn yêu thích." (13 từ)
* (Apple Watch SE) "Lựa chọn thông minh để theo dõi sức khỏe, vừa thời trang vừa năng động." (14 từ)

Danh sách sản phẩm:
${JSON.stringify(products, null, 2)}

Trả về JSON hợp lệ (Quan trọng: Chỉ JSON, không có \`\`\`):
{
  "recommendations": [
    { "id": "string", "advice": "string" }
  ]
}
`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      generationConfig,
    });

    const text = (await result.response.text()).trim();
    console.log(">>> GEMINI RAW OUTPUT (Strict 15 words):", text);

    const clean = text
      .replace(/^```json|```$/g, "")
      .replace(/^```|```$/g, "")
      .trim();

    try {
      return JSON.parse(clean);
    } catch (parseError) {
      console.error(">>> GEMINI JSON PARSE FAILED:", parseError);
      console.error(">>> Raw text was:", text);
      return { recommendations: [] };
    }
  } catch (err) {
    console.error(">>> GEMINI API ERROR:", err?.message || err);
    return { recommendations: [] };
  }
};
