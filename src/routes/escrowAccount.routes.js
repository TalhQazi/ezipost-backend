const express = require("express");
const router = express.Router();
const {
  getEscrowAccounts,
  createEscrowAccount,
  getEscrowAccountById,
  updateEscrowAccount,
  deleteEscrowAccount,
  updateEscrowBalance,
  getEscrowStats
} = require("../controllers/escrowAccountController");

router.get("/", getEscrowAccounts);
router.get("/stats", getEscrowStats);
router.get("/:id", getEscrowAccountById);
router.post("/", createEscrowAccount);
router.put("/:id", updateEscrowAccount);
router.patch("/:id/balance", updateEscrowBalance);
router.delete("/:id", deleteEscrowAccount);

module.exports = router;
