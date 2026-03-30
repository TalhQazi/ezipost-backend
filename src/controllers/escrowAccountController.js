const mongoose = require("mongoose");
const EscrowAccount = require("../models/EscrowAccount");

// ✅ GET all escrow accounts with filtering and pagination
exports.getEscrowAccounts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search, 
      status, 
      accountType,
      bankName,
      currency,
      minBalance,
      maxBalance
    } = req.query;

    let query = {};

    // Search by account number, account name, or bank name
    if (search) {
      query.$or = [
        { accountNumber: { $regex: search, $options: "i" } },
        { accountName: { $regex: search, $options: "i" } },
        { bankName: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by account type
    if (accountType) {
      query.accountType = accountType;
    }

    // Filter by bank name
    if (bankName) {
      query.bankName = { $regex: bankName, $options: "i" };
    }

    // Filter by currency
    if (currency) {
      query.currency = currency;
    }

    // Filter by balance range
    if (minBalance || maxBalance) {
      query.balance = {};
      if (minBalance) query.balance.$gte = parseFloat(minBalance);
      if (maxBalance) query.balance.$lte = parseFloat(maxBalance);
    }

    const skip = (page - 1) * limit;
    
    const accounts = await EscrowAccount.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await EscrowAccount.countDocuments(query);

    res.json({
      accounts,
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

// ✅ CREATE escrow account
exports.createEscrowAccount = async (req, res) => {
  try {
    const escrowAccount = new EscrowAccount(req.body);
    const saved = await escrowAccount.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ✅ GET escrow account by ID
exports.getEscrowAccountById = async (req, res) => {
  try {
    const account = await EscrowAccount.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ message: "Escrow account not found" });
    }
    res.json(account);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ UPDATE escrow account
exports.updateEscrowAccount = async (req, res) => {
  try {
    const account = await EscrowAccount.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastModifiedBy: req.body.lastModifiedBy },
      { new: true, runValidators: true }
    );
    
    if (!account) {
      return res.status(404).json({ message: "Escrow account not found" });
    }
    
    res.json(account);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ✅ DELETE escrow account
exports.deleteEscrowAccount = async (req, res) => {
  try {
    const account = await EscrowAccount.findByIdAndDelete(req.params.id);
    if (!account) {
      return res.status(404).json({ message: "Escrow account not found" });
    }
    res.json({ message: "Escrow account deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ UPDATE escrow account balance
exports.updateEscrowBalance = async (req, res) => {
  try {
    const { amount, transactionType, description } = req.body;
    
    const { id } = req.params;
    let account;

    // Try finding by ID if it's a valid Mongo ID
    if (mongoose.Types.ObjectId.isValid(id)) {
      account = await EscrowAccount.findById(id);
    }

    // Otherwise (or if not found), try finding by accountNumber
    if (!account) {
      account = await EscrowAccount.findOne({ accountNumber: id });
    }

    if (!account) {
      return res.status(404).json({ message: "Escrow account not found" });
    }

    if (transactionType === 'debit') {
      if (account.balance < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      account.balance -= amount;
    } else if (transactionType === 'credit') {
      account.balance += amount;
    } else {
      return res.status(400).json({ message: "Invalid transaction type" });
    }

    account.lastModifiedBy = req.body.lastModifiedBy;
    await account.save();

    res.json({
      account,
      transaction: {
        amount,
        type: transactionType,
        description,
        newBalance: account.balance,
        timestamp: new Date()
      }
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ✅ GET escrow account statistics
exports.getEscrowStats = async (req, res) => {
  try {
    const stats = await EscrowAccount.aggregate([
      {
        $group: {
          _id: null,
          totalAccounts: { $sum: 1 },
          activeAccounts: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
          },
          inactiveAccounts: {
            $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] }
          },
          suspendedAccounts: {
            $sum: { $cond: [{ $eq: ["$status", "suspended"] }, 1, 0] }
          },
          frozenAccounts: {
            $sum: { $cond: [{ $eq: ["$status", "frozen"] }, 1, 0] }
          },
          totalBalance: { $sum: "$balance" },
          averageBalance: { $avg: "$balance" },
          checkingAccounts: {
            $sum: { $cond: [{ $eq: ["$accountType", "checking"] }, 1, 0] }
          },
          savingsAccounts: {
            $sum: { $cond: [{ $eq: ["$accountType", "savings"] }, 1, 0] }
          },
          businessAccounts: {
            $sum: { $cond: [{ $eq: ["$accountType", "business"] }, 1, 0] }
          }
        }
      }
    ]);

    res.json(stats[0] || {
      totalAccounts: 0,
      activeAccounts: 0,
      inactiveAccounts: 0,
      suspendedAccounts: 0,
      frozenAccounts: 0,
      totalBalance: 0,
      averageBalance: 0,
      checkingAccounts: 0,
      savingsAccounts: 0,
      businessAccounts: 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
