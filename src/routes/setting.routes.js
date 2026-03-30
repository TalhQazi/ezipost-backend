const express = require("express");
const router = express.Router();
const {
  getSettings,
  getSettingByKey,
  upsertSetting,
  updateSetting,
  deleteSetting,
  bulkUpdateSettings,
  resetSettings,
  exportSettings,
  importSettings,
  getSettingCategories,
  validateSetting
} = require("../controllers/settingController");

router.get("/", getSettings);
router.get("/categories", getSettingCategories);
router.get("/export", exportSettings);
router.get("/validate", validateSetting);
router.get("/:category/:key", getSettingByKey);
router.put("/:category/:key", updateSetting);
router.post("/:category/:key", upsertSetting);
router.delete("/:category/:key", deleteSetting);
router.post("/bulk", bulkUpdateSettings);
router.post("/reset", resetSettings);
router.post("/import", importSettings);

module.exports = router;
