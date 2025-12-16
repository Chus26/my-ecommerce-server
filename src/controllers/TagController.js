// ===== FILE: controllers/TagController.js (CẬP NHẬT) =====

const Tag = require("../models/Tag");

// (Hàm getAllTags của bà giữ nguyên)
exports.getAllTags = async (req, res, next) => {
  try {
    const tags = await Tag.find().sort({ type: 1, name: 1 }).lean(); // Sắp xếp theo type
    res.status(200).json({ tags });
  } catch (error) {
    next(new Error(error));
  }
};

// (Hàm createTag của bà giữ nguyên)
exports.createTag = async (req, res, next) => {
  const { name, slug, type } = req.body;
  // (Kiểm tra lỗi, v.v...)
  try {
    const existed = await Tag.findOne({ slug });
    if (existed) {
      return res.status(409).json({ message: "Slug (tag AI) này đã tồn tại." });
    }
    const newTag = new Tag({ name, slug, type });
    await newTag.save();
    res.status(201).json({ message: "Tạo tag thành công!", tag: newTag });
  } catch (error) {
    next(new Error(error));
  }
};

// ===================================
// === DÁN 2 HÀM MỚI NÀY VÀO ĐÂY ===
// ===================================

// Xóa 1 tag
exports.deleteTag = async (req, res, next) => {
  const { tagId } = req.params;
  try {
    const tag = await Tag.findById(tagId);
    if (!tag) {
      return res.status(404).json({ message: "Không tìm thấy tag." });
    }
    
    // (Bà có thể thêm logic kiểm tra xem tag này có đang được
    // sản phẩm nào dùng không trước khi xóa, nhưng giờ cứ xóa thẳng)
    
    await Tag.findByIdAndDelete(tagId);
    res.status(200).json({ message: "Xóa tag thành công!", tagId: tagId });
  } catch (error) {
    next(new Error(error));
  }
};

// Cập nhật 1 tag
exports.updateTag = async (req, res, next) => {
    const { tagId } = req.params;
    const { name, slug, type } = req.body;
    try {
        const tag = await Tag.findById(tagId);
        if (!tag) {
            return res.status(404).json({ message: "Không tìm thấy tag." });
        }

        // Kiểm tra slug mới có trùng với cái khác không
        if (slug !== tag.slug) {
            const existed = await Tag.findOne({ slug });
            if (existed) {
                 return res.status(409).json({ message: "Slug (tag AI) này đã tồn tại." });
            }
        }
        
        tag.name = name;
        tag.slug = slug;
        tag.type = type;
        
        const updatedTag = await tag.save();
        res.status(200).json({ message: "Cập nhật tag thành công!", tag: updatedTag });
    } catch (error) {
        next(new Error(error));
    }
};