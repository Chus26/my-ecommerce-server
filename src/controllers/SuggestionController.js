// ===== FILE: src/controllers/SuggestionController.js =====
const SuggestionLog = require("../models/SuggestionLog");
const mongoose = require("mongoose");

exports.getSuggestions = async (req, res, next) => {
  try {
    const sortedSuggestions = await SuggestionLog.find({})
      .populate("userId", "fullName email")
      .populate("mainProductId", "name code")
      .sort({ createdAt: -1 });

    const pending = sortedSuggestions.filter(s => s.status === "pending");
    const others = sortedSuggestions.filter(s => s.status !== "pending");

    const suggestionsFinal = [...pending, ...others];

    res.status(200).json({ suggestions: suggestionsFinal });
  } catch (error) {
    const err = new Error(error);
    err.httpStatus = 500;
    next(err);
  }
};

exports.reviewSuggestion = async (req, res, next) => {
  const { suggestionId } = req.params;
  const { status, note } = req.body;
  const consultantId = req.userId;

  if (!mongoose.Types.ObjectId.isValid(suggestionId)) {
    const err = new Error("Suggestion ID không hợp lệ.");
    err.httpStatus = 400;
    return next(err);
  }

  if (!["approved", "rejected"].includes(status)) {
    const err = new Error("Trạng thái (status) không hợp lệ.");
    err.httpStatus = 400;
    return next(err);
  }

  try {
    const suggestion = await SuggestionLog.findOneAndUpdate(
      { _id: suggestionId, status: "pending" },
      {
        $set: {
          status: status,
          consultantNote: note || "",
          reviewedBy: consultantId,
        },
      },
      { new: true }
    ).populate("reviewedBy", "fullName email");

    if (!suggestion) {
      const existingSuggestion = await SuggestionLog.findById(suggestionId);
      if (!existingSuggestion) {
        const err = new Error("Không tìm thấy gợi ý này.");
        err.httpStatus = 404;
        return next(err);
      } else {
        const err = new Error("Gợi ý này đã được xử lý trước đó.");
        err.httpStatus = 409;
        return next(err);
      }
    }

    res.status(200).json({
      message: "Cập nhật trạng thái thành công!",
      suggestion: suggestion,
    });
  } catch (error) {
    const err = new Error(error.message || "Lỗi máy chủ nội bộ.");
    err.httpStatus = 500;
    next(err);
  }
};
