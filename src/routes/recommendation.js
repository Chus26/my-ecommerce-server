const express = require("express");
const { getAiAccessories } = require("../controllers/aiRecommendationController");
const { checkAuthToken } = require("../middlewares/Auth");

const router = express.Router();
router.get("/ai-accessories", checkAuthToken, getAiAccessories);
module.exports = router;
