const Mail = require("../models/Mail");

// ✅ GET all mails (with search + filter)
exports.getMails = async (req, res) => {
  try {
    const { search, status } = req.query;

    let query = {};

    if (search) {
      query.$or = [
        { id: { $regex: search, $options: "i" } },
        { tracking: { $regex: search, $options: "i" } },
      ];
    }

    if (status && status !== "All Statuses") {
      query.status = status;
    }

    const mails = await Mail.find(query).sort({ createdAt: -1 });

    res.json(mails);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ CREATE mail
exports.createMail = async (req, res) => {
  try {
    const newMail = new Mail(req.body);
    const saved = await newMail.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ✅ DELETE mail
exports.deleteMail = async (req, res) => {
  try {
    await Mail.findByIdAndDelete(req.params.id);
    res.json({ message: "Mail deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};