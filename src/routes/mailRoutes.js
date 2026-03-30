const express = require("express");
const router = express.Router();
const {
  getMails,
  createMail,
  deleteMail,
} = require("../controllers/mailController");

router.get("/", getMails);
router.post("/", createMail);
router.delete("/:id", deleteMail);

module.exports = router;