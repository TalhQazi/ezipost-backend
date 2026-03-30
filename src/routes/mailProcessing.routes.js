const express = require("express");
const router = express.Router();
const {
  getMailProcessing,
  createMailProcessing,
  getMailProcessingById,
  updateMailProcessing,
  deleteMailProcessing,
  updateProcessingStep,
  addIssue,
  resolveIssue,
  uploadDocument,
  getMailProcessingStats
} = require("../controllers/mailProcessingController");

router.get("/", getMailProcessing);
router.get("/stats", getMailProcessingStats);
router.get("/:id", getMailProcessingById);
router.post("/", createMailProcessing);
router.put("/:id", updateMailProcessing);
router.patch("/:id/step", updateProcessingStep);
router.patch("/:id/issue", addIssue);
router.patch("/:id/issue/resolve", resolveIssue);
router.patch("/:id/document", uploadDocument);
router.delete("/:id", deleteMailProcessing);

module.exports = router;
