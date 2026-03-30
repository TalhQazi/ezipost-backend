const express = require("express");
const router = express.Router();
const {
  getReports,
  createReport,
  getReportById,
  updateReport,
  deleteReport,
  executeReport,
  getReportTemplates,
  getReportStats
} = require("../controllers/reportController");

router.get("/", getReports);
router.get("/templates", getReportTemplates);
router.get("/stats", getReportStats);
router.get("/:id", getReportById);
router.post("/", createReport);
router.post("/:id/execute", executeReport);
router.put("/:id", updateReport);
router.delete("/:id", deleteReport);

module.exports = router;
