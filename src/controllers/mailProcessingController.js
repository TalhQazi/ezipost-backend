const MailProcessing = require("../models/MailProcessing");

// ✅ GET all mail processing records with filtering and pagination
exports.getMailProcessing = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search, 
      processingStage, 
      priority,
      assignedTo,
      startDate,
      endDate,
      hasIssues
    } = req.query;

    let query = {};

    // Search by tracking number or mail ID
    if (search) {
      query.$or = [
        { trackingNumber: { $regex: search, $options: "i" } },
        { mailId: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by processing stage
    if (processingStage) {
      query.processingStage = processingStage;
    }

    // Filter by priority
    if (priority) {
      query.priority = priority;
    }

    // Filter by assigned user
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Filter by records with issues
    if (hasIssues === 'true') {
      query['issues.0'] = { $exists: true };
    } else if (hasIssues === 'false') {
      query.issues = { $size: 0 };
    }

    const skip = (page - 1) * limit;
    
    const records = await MailProcessing.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MailProcessing.countDocuments(query);

    res.json({
      records,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ CREATE mail processing record
exports.createMailProcessing = async (req, res) => {
  try {
    const mailProcessing = new MailProcessing(req.body);
    const saved = await mailProcessing.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ✅ GET mail processing record by ID
exports.getMailProcessingById = async (req, res) => {
  try {
    const record = await MailProcessing.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Mail processing record not found" });
    }
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ UPDATE mail processing record
exports.updateMailProcessing = async (req, res) => {
  try {
    const record = await MailProcessing.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastModifiedBy: req.body.lastModifiedBy },
      { new: true, runValidators: true }
    );
    
    if (!record) {
      return res.status(404).json({ message: "Mail processing record not found" });
    }
    
    res.json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ✅ DELETE mail processing record
exports.deleteMailProcessing = async (req, res) => {
  try {
    const record = await MailProcessing.findByIdAndDelete(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Mail processing record not found" });
    }
    res.json({ message: "Mail processing record deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ UPDATE processing step
exports.updateProcessingStep = async (req, res) => {
  try {
    const { stepIndex, status, notes, completedBy } = req.body;
    
    const record = await MailProcessing.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Mail processing record not found" });
    }

    if (stepIndex >= record.processingSteps.length) {
      return res.status(400).json({ message: "Invalid step index" });
    }

    record.processingSteps[stepIndex].status = status;
    record.processingSteps[stepIndex].notes = notes;
    record.processingSteps[stepIndex].completedBy = completedBy;
    
    if (status === 'completed') {
      record.processingSteps[stepIndex].completedAt = new Date();
    }

    record.lastModifiedBy = completedBy;
    await record.save();

    res.json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ✅ ADD issue to mail processing
exports.addIssue = async (req, res) => {
  try {
    const { type, description, severity, reportedBy } = req.body;
    
    const record = await MailProcessing.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Mail processing record not found" });
    }

    const newIssue = {
      type,
      description,
      severity,
      reportedBy,
      reportedAt: new Date()
    };

    record.issues.push(newIssue);
    record.lastModifiedBy = reportedBy;
    await record.save();

    res.json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ✅ RESOLVE issue
exports.resolveIssue = async (req, res) => {
  try {
    const { issueIndex, resolution, resolvedBy } = req.body;
    
    const record = await MailProcessing.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Mail processing record not found" });
    }

    if (issueIndex >= record.issues.length) {
      return res.status(400).json({ message: "Invalid issue index" });
    }

    record.issues[issueIndex].status = 'resolved';
    record.issues[issueIndex].resolution = resolution;
    record.issues[issueIndex].resolvedBy = resolvedBy;
    record.issues[issueIndex].resolvedAt = new Date();

    record.lastModifiedBy = resolvedBy;
    await record.save();

    res.json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ✅ UPLOAD document
exports.uploadDocument = async (req, res) => {
  try {
    const { documentType, fileName, fileUrl, uploadedBy } = req.body;
    
    const record = await MailProcessing.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Mail processing record not found" });
    }

    const newDocument = {
      documentType,
      fileName,
      fileUrl,
      uploadedBy,
      uploadedAt: new Date()
    };

    record.documents.push(newDocument);
    record.lastModifiedBy = uploadedBy;
    await record.save();

    res.json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ✅ GET mail processing statistics
exports.getMailProcessingStats = async (req, res) => {
  try {
    const stats = await MailProcessing.aggregate([
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          receivedCount: {
            $sum: { $cond: [{ $eq: ["$processingStage", "received"] }, 1, 0] }
          },
          verifiedCount: {
            $sum: { $cond: [{ $eq: ["$processingStage", "verified"] }, 1, 0] }
          },
          processedCount: {
            $sum: { $cond: [{ $eq: ["$processingStage", "processed"] }, 1, 0] }
          },
          completedCount: {
            $sum: { $cond: [{ $eq: ["$processingStage", "completed"] }, 1, 0] }
          },
          failedCount: {
            $sum: { $cond: [{ $eq: ["$processingStage", "failed"] }, 1, 0] }
          },
          lowPriorityCount: {
            $sum: { $cond: [{ $eq: ["$priority", "low"] }, 1, 0] }
          },
          mediumPriorityCount: {
            $sum: { $cond: [{ $eq: ["$priority", "medium"] }, 1, 0] }
          },
          highPriorityCount: {
            $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] }
          },
          urgentPriorityCount: {
            $sum: { $cond: [{ $eq: ["$priority", "urgent"] }, 1, 0] }
          },
          recordsWithIssues: {
            $sum: { $cond: [{ $gt: [{ $size: "$issues" }, 0] }, 1, 0] }
          }
        }
      }
    ]);

    res.json(stats[0] || {
      totalRecords: 0,
      receivedCount: 0,
      verifiedCount: 0,
      processedCount: 0,
      completedCount: 0,
      failedCount: 0,
      lowPriorityCount: 0,
      mediumPriorityCount: 0,
      highPriorityCount: 0,
      urgentPriorityCount: 0,
      recordsWithIssues: 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
