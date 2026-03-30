const Report = require("../models/Report");
const Mail = require("../models/Mail");
const AuditLog = require("../models/AuditLog");
const EscrowAccount = require("../models/EscrowAccount");
const RateConfig = require("../models/RateConfig");
const MailProcessing = require("../models/MailProcessing");

// ✅ GET all reports with filtering and pagination
exports.getReports = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search, 
      reportType, 
      status,
      dataSource,
      createdBy
    } = req.query;

    let query = {};

    // Search by report name or description
    if (search) {
      query.$or = [
        { reportName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by report type
    if (reportType) {
      query.reportType = reportType;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by data source
    if (dataSource) {
      query.dataSource = dataSource;
    }

    // Filter by creator
    if (createdBy) {
      query.createdBy = createdBy;
    }

    const skip = (page - 1) * limit;
    
    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    res.json({
      reports,
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

// ✅ CREATE report
exports.createReport = async (req, res) => {
  try {
    const report = new Report(req.body);
    
    // Set next run time if schedule is enabled
    if (report.schedule.enabled && report.schedule.frequency) {
      report.schedule.nextRun = calculateNextRun(report.schedule.frequency);
    }
    
    const saved = await report.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ✅ GET report by ID
exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ UPDATE report
exports.updateReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastModifiedBy: req.body.lastModifiedBy },
      { new: true, runValidators: true }
    );
    
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    
    // Update next run time if schedule is modified
    if (req.body.schedule && req.body.schedule.enabled) {
      report.schedule.nextRun = calculateNextRun(report.schedule.frequency);
    }
    
    await report.save();
    res.json(report);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ✅ DELETE report
exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    res.json({ message: "Report deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ EXECUTE report
exports.executeReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const startTime = Date.now();
    
    // Update report status to running
    report.lastRun = {
      status: 'running',
      runAt: new Date()
    };
    await report.save();

    let data = [];
    let error = null;

    try {
      // Execute query based on data source
      switch (report.dataSource) {
        case 'mail':
          data = await executeMailQuery(report.parameters);
          break;
        case 'audit_logs':
          data = await executeAuditLogQuery(report.parameters);
          break;
        case 'escrow_accounts':
          data = await executeEscrowAccountQuery(report.parameters);
          break;
        case 'rate_configs':
          data = await executeRateConfigQuery(report.parameters);
          break;
        case 'mail_processing':
          data = await executeMailProcessingQuery(report.parameters);
          break;
        default:
          throw new Error('Invalid data source');
      }

      // Update report with success
      report.lastRun = {
        status: 'success',
        runAt: new Date(),
        recordCount: data.length,
        executionTime: Date.now() - startTime,
        errorMessage: null
      };

    } catch (err) {
      error = err;
      // Update report with error
      report.lastRun = {
        status: 'failed',
        runAt: new Date(),
        recordCount: 0,
        executionTime: Date.now() - startTime,
        errorMessage: err.message
      };
    }

    await report.save();

    if (error) {
      return res.status(500).json({ message: error.message });
    }

    // Format response based on requested format
    let response;
    switch (report.format) {
      case 'csv':
        response = { data, format: 'csv' };
        break;
      case 'json':
      default:
        response = { data, format: 'json' };
    }

    res.json({
      report: {
        id: report._id,
        name: report.reportName,
        type: report.reportType,
        executedAt: report.lastRun.runAt,
        recordCount: data.length,
        executionTime: report.lastRun.executionTime
      },
      ...response
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ GET report templates
exports.getReportTemplates = async (req, res) => {
  try {
    const templates = [
      {
        name: 'Daily Mail Summary',
        type: 'operational',
        dataSource: 'mail',
        description: 'Summary of all mail processed today',
        parameters: {
          startDate: new Date(new Date().setHours(0, 0, 0, 0)),
          endDate: new Date(),
          groupBy: ['status'],
          sortBy: { field: 'createdAt', order: 'desc' }
        }
      },
      {
        name: 'Weekly Financial Report',
        type: 'financial',
        dataSource: 'mail',
        description: 'Financial summary for the past week',
        parameters: {
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          groupBy: ['mailClass'],
          sortBy: { field: 'paid', order: 'desc' }
        }
      },
      {
        name: 'Monthly Audit Summary',
        type: 'audit',
        dataSource: 'audit_logs',
        description: 'Audit activities for the past month',
        parameters: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          groupBy: ['action', 'severity'],
          sortBy: { field: 'timestamp', order: 'desc' }
        }
      },
      {
        name: 'Escrow Account Balance Report',
        type: 'financial',
        dataSource: 'escrow_accounts',
        description: 'Current status of all escrow accounts',
        parameters: {
          groupBy: ['status', 'accountType'],
          sortBy: { field: 'balance', order: 'desc' }
        }
      }
    ];

    res.json(templates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ GET report statistics
exports.getReportStats = async (req, res) => {
  try {
    const stats = await Report.aggregate([
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          activeReports: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
          },
          inactiveReports: {
            $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] }
          },
          draftReports: {
            $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] }
          },
          scheduledReports: {
            $sum: { $cond: [{ $eq: ["$schedule.enabled", true] }, 1, 0] }
          },
          financialReports: {
            $sum: { $cond: [{ $eq: ["$reportType", "financial"] }, 1, 0] }
          },
          operationalReports: {
            $sum: { $cond: [{ $eq: ["$reportType", "operational"] }, 1, 0] }
          },
          auditReports: {
            $sum: { $cond: [{ $eq: ["$reportType", "audit"] }, 1, 0] }
          },
          performanceReports: {
            $sum: { $cond: [{ $eq: ["$reportType", "performance"] }, 1, 0] }
          },
          customReports: {
            $sum: { $cond: [{ $eq: ["$reportType", "custom"] }, 1, 0] }
          }
        }
      }
    ]);

    res.json(stats[0] || {
      totalReports: 0,
      activeReports: 0,
      inactiveReports: 0,
      draftReports: 0,
      scheduledReports: 0,
      financialReports: 0,
      operationalReports: 0,
      auditReports: 0,
      performanceReports: 0,
      customReports: 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Helper functions
function calculateNextRun(frequency) {
  const now = new Date();
  switch (frequency) {
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    case 'quarterly':
      return new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
    case 'yearly':
      return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    default:
      return null;
  }
}

async function executeMailQuery(parameters) {
  let query = {};
  
  if (parameters.startDate || parameters.endDate) {
    query.createdAt = {};
    if (parameters.startDate) query.createdAt.$gte = new Date(parameters.startDate);
    if (parameters.endDate) query.createdAt.$lte = new Date(parameters.endDate);
  }

  // Apply filters
  if (parameters.filters) {
    for (const filter of parameters.filters) {
      applyFilter(query, filter);
    }
  }

  let mailQuery = Mail.find(query);
  
  // Apply grouping
  if (parameters.groupBy && parameters.groupBy.length > 0) {
    const groupStage = {
      $group: {
        _id: {},
        count: { $sum: 1 },
        totalPaid: { $sum: "$paid" }
      }
    };
    
    for (const field of parameters.groupBy) {
      groupStage.$group._id[field] = `$${field}`;
    }
    
    return await Mail.aggregate([{$match: query}, groupStage]);
  }

  // Apply sorting
  if (parameters.sortBy && parameters.sortBy.field) {
    const sort = {};
    sort[parameters.sortBy.field] = parameters.sortBy.order === 'asc' ? 1 : -1;
    mailQuery = mailQuery.sort(sort);
  }

  return await mailQuery.exec();
}

async function executeAuditLogQuery(parameters) {
  let query = {};
  
  if (parameters.startDate || parameters.endDate) {
    query.timestamp = {};
    if (parameters.startDate) query.timestamp.$gte = new Date(parameters.startDate);
    if (parameters.endDate) query.timestamp.$lte = new Date(parameters.endDate);
  }

  if (parameters.filters) {
    for (const filter of parameters.filters) {
      applyFilter(query, filter);
    }
  }

  let auditQuery = AuditLog.find(query);
  
  if (parameters.sortBy && parameters.sortBy.field) {
    const sort = {};
    sort[parameters.sortBy.field] = parameters.sortBy.order === 'asc' ? 1 : -1;
    auditQuery = auditQuery.sort(sort);
  }

  return await auditQuery.exec();
}

async function executeEscrowAccountQuery(parameters) {
  let query = {};
  
  if (parameters.filters) {
    for (const filter of parameters.filters) {
      applyFilter(query, filter);
    }
  }

  let accountQuery = EscrowAccount.find(query);
  
  if (parameters.sortBy && parameters.sortBy.field) {
    const sort = {};
    sort[parameters.sortBy.field] = parameters.sortBy.order === 'asc' ? 1 : -1;
    accountQuery = accountQuery.sort(sort);
  }

  return await accountQuery.exec();
}

async function executeRateConfigQuery(parameters) {
  let query = {};
  
  if (parameters.filters) {
    for (const filter of parameters.filters) {
      applyFilter(query, filter);
    }
  }

  let configQuery = RateConfig.find(query);
  
  if (parameters.sortBy && parameters.sortBy.field) {
    const sort = {};
    sort[parameters.sortBy.field] = parameters.sortBy.order === 'asc' ? 1 : -1;
    configQuery = configQuery.sort(sort);
  }

  return await configQuery.exec();
}

async function executeMailProcessingQuery(parameters) {
  let query = {};
  
  if (parameters.startDate || parameters.endDate) {
    query.createdAt = {};
    if (parameters.startDate) query.createdAt.$gte = new Date(parameters.startDate);
    if (parameters.endDate) query.createdAt.$lte = new Date(parameters.endDate);
  }

  if (parameters.filters) {
    for (const filter of parameters.filters) {
      applyFilter(query, filter);
    }
  }

  let processingQuery = MailProcessing.find(query);
  
  if (parameters.sortBy && parameters.sortBy.field) {
    const sort = {};
    sort[parameters.sortBy.field] = parameters.sortBy.order === 'asc' ? 1 : -1;
    processingQuery = processingQuery.sort(sort);
  }

  return await processingQuery.exec();
}

function applyFilter(query, filter) {
  switch (filter.operator) {
    case 'equals':
      query[filter.field] = filter.value;
      break;
    case 'contains':
      query[filter.field] = { $regex: filter.value, $options: 'i' };
      break;
    case 'greater_than':
      query[filter.field] = { $gt: filter.value };
      break;
    case 'less_than':
      query[filter.field] = { $lt: filter.value };
      break;
    case 'between':
      query[filter.field] = { $gte: filter.value[0], $lte: filter.value[1] };
      break;
  }
}
