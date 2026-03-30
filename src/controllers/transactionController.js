const Transaction = require("../models/Transaction");

// ✅ GET all transactions with filtering and pagination
exports.getTransactions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search, 
      transactionType, 
      status,
      paymentMethod,
      currency,
      minAmount,
      maxAmount,
      startDate,
      endDate,
      assignedTo,
      priority,
      hasEscrow
    } = req.query;

    let query = {};

    // Search by transaction ID, tracking number, or mail ID
    if (search) {
      query.$or = [
        { transactionId: { $regex: search, $options: "i" } },
        { trackingNumber: { $regex: search, $options: "i" } },
        { mailId: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by transaction type
    if (transactionType) {
      query.transactionType = transactionType;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by payment method
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    // Filter by currency
    if (currency) {
      query.currency = currency;
    }

    // Filter by amount range
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = parseFloat(minAmount);
      if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Filter by assigned user
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    // Filter by priority
    if (priority) {
      query.priority = priority;
    }

    // Filter by escrow transactions
    if (hasEscrow === 'true') {
      query['escrowAccount.accountId'] = { $exists: true };
    } else if (hasEscrow === 'false') {
      query['escrowAccount.accountId'] = { $exists: false };
    }

    const skip = (page - 1) * limit;
    
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
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

// ✅ CREATE transaction
exports.createTransaction = async (req, res) => {
  try {
    // Generate unique transaction ID if not provided
    if (!req.body.transactionId) {
      req.body.transactionId = await generateTransactionId();
    }

    const transaction = new Transaction(req.body);
    
    // Add initial timeline entry
    transaction.timeline.push({
      status: req.body.status || 'pending',
      notes: 'Transaction created',
      updatedBy: req.body.createdBy
    });

    const saved = await transaction.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ✅ GET transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ UPDATE transaction
exports.updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastModifiedBy: req.body.lastModifiedBy },
      { new: true, runValidators: true }
    );
    
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Add timeline entry if status changed
    if (req.body.status && req.body.status !== transaction.status) {
      transaction.timeline.push({
        status: req.body.status,
        notes: req.body.statusNotes || `Status changed to ${req.body.status}`,
        updatedBy: req.body.lastModifiedBy
      });
      await transaction.save();
    }
    
    res.json(transaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ✅ DELETE transaction
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.json({ message: "Transaction deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ UPDATE transaction status
exports.updateTransactionStatus = async (req, res) => {
  try {
    const { status, notes, updatedBy } = req.body;
    
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    transaction.status = status;
    transaction.lastModifiedBy = updatedBy;

    // Add timeline entry
    transaction.timeline.push({
      status,
      notes: notes || `Status changed to ${status}`,
      updatedBy,
      timestamp: new Date()
    });

    // Set completion date if completed
    if (status === 'completed') {
      transaction.completedDate = new Date();
    }

    // Set failure reason if failed
    if (status === 'failed' && notes) {
      transaction.failureReason = notes;
    }

    await transaction.save();
    res.json(transaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ✅ PROCESS refund
exports.processRefund = async (req, res) => {
  try {
    const { 
      refundAmount, 
      refundReason, 
      refundMethod, 
      refundReference, 
      processedBy 
    } = req.body;
    
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (transaction.status !== 'completed') {
      return res.status(400).json({ message: "Only completed transactions can be refunded" });
    }

    // Update refund details
    transaction.refundDetails = {
      refundAmount,
      refundReason,
      refundDate: new Date(),
      refundMethod,
      refundReference
    };

    // Update status
    transaction.status = 'refunded';
    transaction.lastModifiedBy = processedBy;

    // Add timeline entry
    transaction.timeline.push({
      status: 'refunded',
      notes: `Refund processed: ${refundReason}`,
      updatedBy: processedBy,
      timestamp: new Date()
    });

    await transaction.save();
    res.json(transaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ✅ ADD fee to transaction
exports.addFee = async (req, res) => {
  try {
    const { feeType, feeAmount, feeDescription, addedBy } = req.body;
    
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const newFee = {
      feeType,
      feeAmount,
      feeDescription,
      calculatedAt: new Date()
    };

    transaction.fees.push(newFee);
    transaction.lastModifiedBy = addedBy;

    await transaction.save();
    res.json(transaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ✅ UPLOAD document
exports.uploadDocument = async (req, res) => {
  try {
    const { documentType, fileName, fileUrl, uploadedBy } = req.body;
    
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const newDocument = {
      documentType,
      fileName,
      fileUrl,
      uploadedBy,
      uploadedAt: new Date()
    };

    transaction.documents.push(newDocument);
    transaction.lastModifiedBy = uploadedBy;

    await transaction.save();
    res.json(transaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ✅ BULK update transactions
exports.bulkUpdateTransactions = async (req, res) => {
  try {
    const { transactionIds, updates, updatedBy } = req.body;
    
    const result = await Transaction.updateMany(
      { _id: { $in: transactionIds } },
      { 
        ...updates, 
        lastModifiedBy: updatedBy,
        $push: {
          timeline: {
            status: updates.status || 'updated',
            notes: 'Bulk update applied',
            updatedBy,
            timestamp: new Date()
          }
        }
      }
    );

    res.json({
      message: `${result.modifiedCount} transactions updated`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ✅ GET transaction statistics
exports.getTransactionStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const stats = await Transaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          averageAmount: { $avg: "$amount" },
          pendingCount: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
          },
          processingCount: {
            $sum: { $cond: [{ $eq: ["$status", "processing"] }, 1, 0] }
          },
          completedCount: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
          },
          failedCount: {
            $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] }
          },
          cancelledCount: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] }
          },
          refundedCount: {
            $sum: { $cond: [{ $eq: ["$status", "refunded"] }, 1, 0] }
          },
          paymentTransactions: {
            $sum: { $cond: [{ $eq: ["$transactionType", "payment"] }, 1, 0] }
          },
          refundTransactions: {
            $sum: { $cond: [{ $eq: ["$transactionType", "refund"] }, 1, 0] }
          },
          escrowTransactions: {
            $sum: { $cond: [
              { $in: ["$transactionType", ["escrow_deposit", "escrow_withdrawal"]] }, 
              1, 
              0
            ] }
          },
          feeTransactions: {
            $sum: { $cond: [{ $eq: ["$transactionType", "fee"] }, 1, 0] }
          },
          totalFees: { $sum: { $size: "$fees" } },
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
          }
        }
      }
    ]);

    res.json(stats[0] || {
      totalTransactions: 0,
      totalAmount: 0,
      averageAmount: 0,
      pendingCount: 0,
      processingCount: 0,
      completedCount: 0,
      failedCount: 0,
      cancelledCount: 0,
      refundedCount: 0,
      paymentTransactions: 0,
      refundTransactions: 0,
      escrowTransactions: 0,
      feeTransactions: 0,
      totalFees: 0,
      lowPriorityCount: 0,
      mediumPriorityCount: 0,
      highPriorityCount: 0,
      urgentPriorityCount: 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Helper function to generate unique transaction ID
async function generateTransactionId() {
  const prefix = 'TXN';
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}
