const AuditLog = require("../models/AuditLog");

// ✅ GET all audit logs with filtering and pagination
exports.getAuditLogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search, 
      action, 
      severity, 
      status, 
      userId,
      startDate,
      endDate 
    } = req.query;

    let query = {};

    // Search by action, resource, or details
    if (search) {
      query.$or = [
        { action: { $regex: search, $options: "i" } },
        { resource: { $regex: search, $options: "i" } },
        { details: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by action
    if (action) {
      query.action = action;
    }

    // Filter by severity
    if (severity) {
      query.severity = severity;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by userId
    if (userId) {
      query.userId = userId;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    const skip = (page - 1) * limit;
    
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AuditLog.countDocuments(query);

    res.json({
      logs,
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

// ✅ CREATE audit log entry
exports.createAuditLog = async (req, res) => {
  try {
    const auditLog = new AuditLog({
      ...req.body,
      timestamp: new Date()
    });
    
    const saved = await auditLog.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ✅ GET audit log by ID
exports.getAuditLogById = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ message: "Audit log not found" });
    }
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ DELETE audit log (for cleanup purposes)
exports.deleteAuditLog = async (req, res) => {
  try {
    const log = await AuditLog.findByIdAndDelete(req.params.id);
    if (!log) {
      return res.status(404).json({ message: "Audit log not found" });
    }
    res.json({ message: "Audit log deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ GET audit statistics
exports.getAuditStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) dateFilter.timestamp.$gte = new Date(startDate);
      if (endDate) dateFilter.timestamp.$lte = new Date(endDate);
    }

    const stats = await AuditLog.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalLogs: { $sum: 1 },
          successCount: {
            $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] }
          },
          failureCount: {
            $sum: { $cond: [{ $eq: ["$status", "failure"] }, 1, 0] }
          },
          warningCount: {
            $sum: { $cond: [{ $eq: ["$status", "warning"] }, 1, 0] }
          },
          criticalCount: {
            $sum: { $cond: [{ $eq: ["$severity", "critical"] }, 1, 0] }
          },
          highCount: {
            $sum: { $cond: [{ $eq: ["$severity", "high"] }, 1, 0] }
          },
          mediumCount: {
            $sum: { $cond: [{ $eq: ["$severity", "medium"] }, 1, 0] }
          },
          lowCount: {
            $sum: { $cond: [{ $eq: ["$severity", "low"] }, 1, 0] }
          }
        }
      }
    ]);

    res.json(stats[0] || {
      totalLogs: 0,
      successCount: 0,
      failureCount: 0,
      warningCount: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
