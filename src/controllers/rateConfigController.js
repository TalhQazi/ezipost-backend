const RateConfig = require("../models/RateConfig");

// ✅ GET all rate configurations with filtering and pagination
exports.getRateConfigs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search, 
      rateType, 
      serviceName,
      status,
      currency,
      effectiveDate,
      expiryDate
    } = req.query;

    let query = {};

    // Search by service name or rate type
    if (search) {
      query.$or = [
        { serviceName: { $regex: search, $options: "i" } },
        { rateType: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by rate type
    if (rateType) {
      query.rateType = rateType;
    }

    // Filter by service name
    if (serviceName) {
      query.serviceName = { $regex: serviceName, $options: "i" };
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by currency
    if (currency) {
      query.currency = currency;
    }

    // Filter by effective date range
    if (effectiveDate) {
      query.effectiveDate = { $lte: new Date(effectiveDate) };
    }

    // Filter by expiry date
    if (expiryDate) {
      query.expiryDate = { $gte: new Date(expiryDate) };
    }

    const skip = (page - 1) * limit;
    
    const configs = await RateConfig.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await RateConfig.countDocuments(query);

    res.json({
      configs,
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

// ✅ CREATE rate configuration
exports.createRateConfig = async (req, res) => {
  try {
    const rateConfig = new RateConfig(req.body);
    const saved = await rateConfig.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ✅ GET rate configuration by ID
exports.getRateConfigById = async (req, res) => {
  try {
    const config = await RateConfig.findById(req.params.id);
    if (!config) {
      return res.status(404).json({ message: "Rate configuration not found" });
    }
    res.json(config);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ UPDATE rate configuration
exports.updateRateConfig = async (req, res) => {
  try {
    const config = await RateConfig.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastModifiedBy: req.body.lastModifiedBy },
      { new: true, runValidators: true }
    );
    
    if (!config) {
      return res.status(404).json({ message: "Rate configuration not found" });
    }
    
    res.json(config);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ✅ DELETE rate configuration
exports.deleteRateConfig = async (req, res) => {
  try {
    const config = await RateConfig.findByIdAndDelete(req.params.id);
    if (!config) {
      return res.status(404).json({ message: "Rate configuration not found" });
    }
    res.json({ message: "Rate configuration deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ CALCULATE shipping rate
exports.calculateRate = async (req, res) => {
  try {
    const { 
      rateType, 
      weight, 
      zone, 
      serviceType, 
      additionalServices = [],
      volume 
    } = req.body;

    // Find applicable rate configurations
    const query = {
      rateType,
      status: 'active',
      effectiveDate: { $lte: new Date() },
      $or: [
        { expiryDate: null },
        { expiryDate: { $gte: new Date() } }
      ]
    };

    if (serviceType) {
      query.serviceName = serviceType;
    }

    const configs = await RateConfig.find(query).sort({ priority: -1 });

    if (configs.length === 0) {
      return res.status(404).json({ message: "No applicable rate configuration found" });
    }

    let bestRate = null;
    let calculatedRate = 0;
    let breakdown = [];

    // Find the best matching configuration
    for (const config of configs) {
      // Check weight range
      const weightRange = config.weightRanges.find(range => 
        weight >= range.minWeight && weight <= range.maxWeight
      );

      if (weightRange) {
        bestRate = config;
        calculatedRate = config.baseRate + (weightRange.ratePerUnit * weight);
        breakdown.push({
          type: 'base_rate',
          description: 'Base rate',
          amount: config.baseRate
        });
        breakdown.push({
          type: 'weight_rate',
          description: `Weight rate (${weightRange.minWeight}-${weightRange.maxWeight} ${config.currency})`,
          amount: weightRange.ratePerUnit * weight
        });
        break;
      }
    }

    if (!bestRate) {
      return res.status(400).json({ message: "Weight not covered by any rate configuration" });
    }

    // Add zone rates if applicable
    if (zone) {
      const zoneRate = bestRate.zoneRates.find(z => z.zone === zone);
      if (zoneRate) {
        calculatedRate += zoneRate.rate;
        breakdown.push({
          type: 'zone_rate',
          description: `Zone ${zone} rate`,
          amount: zoneRate.rate
        });
      }
    }

    // Add additional charges
    for (const service of additionalServices) {
      const charge = bestRate.additionalCharges.find(c => c.chargeType === service);
      if (charge) {
        const chargeAmount = charge.chargeType === 'percentage' 
          ? calculatedRate * (charge.chargeAmount / 100)
          : charge.chargeAmount;
        
        calculatedRate += chargeAmount;
        breakdown.push({
          type: 'additional_charge',
          description: charge.chargeName,
          amount: chargeAmount
        });
      }
    }

    // Apply discounts if applicable
    if (volume) {
      const applicableDiscount = bestRate.discounts.find(discount => 
        discount.minVolume && volume >= discount.minVolume &&
        (!discount.maxVolume || volume <= discount.maxVolume) &&
        new Date() >= discount.validFrom &&
        (!discount.validUntil || new Date() <= discount.validUntil)
      );

      if (applicableDiscount) {
        const discountAmount = applicableDiscount.discountType === 'percentage'
          ? calculatedRate * (applicableDiscount.discountValue / 100)
          : applicableDiscount.discountValue;
        
        calculatedRate -= discountAmount;
        breakdown.push({
          type: 'discount',
          description: applicableDiscount.discountName,
          amount: -discountAmount
        });
      }
    }

    res.json({
      calculatedRate,
      currency: bestRate.currency,
      breakdown,
      appliedConfig: {
        id: bestRate._id,
        serviceName: bestRate.serviceName,
        rateType: bestRate.rateType
      }
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ✅ CLONE rate configuration
exports.cloneRateConfig = async (req, res) => {
  try {
    const originalConfig = await RateConfig.findById(req.params.id);
    if (!originalConfig) {
      return res.status(404).json({ message: "Rate configuration not found" });
    }

    const clonedConfig = new RateConfig({
      ...originalConfig.toObject(),
      _id: undefined,
      serviceName: req.body.serviceName || `${originalConfig.serviceName} (Copy)`,
      status: 'draft',
      createdBy: req.body.createdBy,
      lastModifiedBy: req.body.createdBy
    });

    const saved = await clonedConfig.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ✅ GET rate configuration statistics
exports.getRateConfigStats = async (req, res) => {
  try {
    const stats = await RateConfig.aggregate([
      {
        $group: {
          _id: null,
          totalConfigs: { $sum: 1 },
          activeConfigs: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
          },
          inactiveConfigs: {
            $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] }
          },
          draftConfigs: {
            $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] }
          },
          expiredConfigs: {
            $sum: { $cond: [{ $eq: ["$status", "expired"] }, 1, 0] }
          },
          domesticConfigs: {
            $sum: { $cond: [{ $eq: ["$rateType", "domestic"] }, 1, 0] }
          },
          internationalConfigs: {
            $sum: { $cond: [{ $eq: ["$rateType", "international"] }, 1, 0] }
          },
          expressConfigs: {
            $sum: { $cond: [{ $eq: ["$rateType", "express"] }, 1, 0] }
          },
          standardConfigs: {
            $sum: { $cond: [{ $eq: ["$rateType", "standard"] }, 1, 0] }
          },
          bulkConfigs: {
            $sum: { $cond: [{ $eq: ["$rateType", "bulk"] }, 1, 0] }
          },
          averageBaseRate: { $avg: "$baseRate" }
        }
      }
    ]);

    res.json(stats[0] || {
      totalConfigs: 0,
      activeConfigs: 0,
      inactiveConfigs: 0,
      draftConfigs: 0,
      expiredConfigs: 0,
      domesticConfigs: 0,
      internationalConfigs: 0,
      expressConfigs: 0,
      standardConfigs: 0,
      bulkConfigs: 0,
      averageBaseRate: 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
