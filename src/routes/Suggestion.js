const express = require("express");
const router = express.Router();
const { checkAuthToken, checkAdminAndConsultant } = require("../middlewares/Auth");
const suggestionControllers = require("../controllers/SuggestionController");

router.get(
  "/",
  checkAuthToken,
  checkAdminAndConsultant,
  suggestionControllers.getSuggestions
);

router.patch(
  "/:suggestionId/review",
  checkAuthToken,
  checkAdminAndConsultant,
  suggestionControllers.reviewSuggestion
);

module.exports = router;
