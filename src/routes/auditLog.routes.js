const express = require("express");
const router = express.Router();
const {
  getAuditLogs,
  createAuditLog,
  getAuditLogById,
  deleteAuditLog,
  getAuditStats
} = require("../controllers/auditLogController");

router.get("/", getAuditLogs);
router.get("/stats", getAuditStats);
router.get("/:id", getAuditLogById);
router.post("/", createAuditLog);
router.delete("/:id", deleteAuditLog);

module.exports = router;
