const express = require("express");
const router = express.Router();
const {
  getTransactions,
  createTransaction,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  updateTransactionStatus,
  processRefund,
  addFee,
  uploadDocument,
  bulkUpdateTransactions,
  getTransactionStats
} = require("../controllers/transactionController");

router.get("/", getTransactions);
router.get("/stats", getTransactionStats);
router.get("/:id", getTransactionById);
router.post("/", createTransaction);
router.put("/:id", updateTransaction);
router.patch("/:id/status", updateTransactionStatus);
router.patch("/:id/refund", processRefund);
router.patch("/:id/fee", addFee);
router.patch("/:id/document", uploadDocument);
router.patch("/bulk", bulkUpdateTransactions);
router.delete("/:id", deleteTransaction);

module.exports = router;
