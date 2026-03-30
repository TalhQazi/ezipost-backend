const express = require("express");
const router = express.Router();
const {
  getRateConfigs,
  createRateConfig,
  getRateConfigById,
  updateRateConfig,
  deleteRateConfig,
  calculateRate,
  cloneRateConfig,
  getRateConfigStats
} = require("../controllers/rateConfigController");

router.get("/", getRateConfigs);
router.get("/stats", getRateConfigStats);
router.get("/calculate", calculateRate);
router.get("/:id", getRateConfigById);
router.post("/", createRateConfig);
router.post("/:id/clone", cloneRateConfig);
router.put("/:id", updateRateConfig);
router.delete("/:id", deleteRateConfig);

module.exports = router;
