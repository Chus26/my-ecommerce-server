// ===== FILE: routes/Tag.js (CẬP NHẬT) =====

const express = require("express");
const router = express.Router();
const tagController = require("../controllers/TagController");
const { checkAuthToken } = require("../middlewares/Auth"); 

// GET /api/tags (Giữ nguyên)
router.get("/", checkAuthToken, tagController.getAllTags);

// POST /api/tags (Giữ nguyên)
router.post("/", checkAuthToken, tagController.createTag);

// ===================================
// === THÊM 2 ROUTE MỚI NÀY VÀO ĐÂY ===
// ===================================

// PUT /api/tags/:tagId
router.put("/:tagId", checkAuthToken, tagController.updateTag);

// DELETE /api/tags/:tagId
router.delete("/:tagId", checkAuthToken, tagController.deleteTag);


module.exports = router;