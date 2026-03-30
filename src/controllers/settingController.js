const Setting = require("../models/Setting");

// ✅ GET all settings with filtering
exports.getSettings = async (req, res) => {
  try {
    const { 
      category, 
      isPublic, 
      isEditable,
      search 
    } = req.query;

    let query = {};

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by public status
    if (isPublic !== undefined) {
      query.isPublic = isPublic === 'true';
    }

    // Filter by editable status
    if (isEditable !== undefined) {
      query.isEditable = isEditable === 'true';
    }

    // Search by key, display name, or description
    if (search) {
      query.$or = [
        { key: { $regex: search, $options: "i" } },
        { displayName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const settings = await Setting.find(query).sort({ category: 1, key: 1 });

    // Group settings by category
    const groupedSettings = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {});

    res.json(groupedSettings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ GET setting by key
exports.getSettingByKey = async (req, res) => {
  try {
    const { category, key } = req.params;
    
    const setting = await Setting.findOne({ category, key });
    if (!setting) {
      return res.status(404).json({ message: "Setting not found" });
    }
    
    res.json(setting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ CREATE or UPDATE setting
exports.upsertSetting = async (req, res) => {
  try {
    const { category, key } = req.params;
    const { value, lastModifiedBy } = req.body;

    // Validate the setting value
    const validation = await validateSetting(category, key, value);
    if (!validation.isValid) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validation.errors 
      });
    }

    const setting = await Setting.findOneAndUpdate(
      { category, key },
      {
        category,
        key,
        value,
        lastModifiedBy,
        version: { $inc: 1 }
      },
      { 
        new: true, 
        upsert: true,
        runValidators: true 
      }
    );

    res.json(setting);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ✅ UPDATE setting
exports.updateSetting = async (req, res) => {
  try {
    const { category, key } = req.params;
    const { value, lastModifiedBy } = req.body;

    // Validate the setting value
    const validation = await validateSetting(category, key, value);
    if (!validation.isValid) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validation.errors 
      });
    }

    const setting = await Setting.findOneAndUpdate(
      { category, key },
      {
        value,
        lastModifiedBy,
        version: { $inc: 1 }
      },
      { 
        new: true, 
        runValidators: true 
      }
    );

    if (!setting) {
      return res.status(404).json({ message: "Setting not found" });
    }

    res.json(setting);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ✅ DELETE setting
exports.deleteSetting = async (req, res) => {
  try {
    const { category, key } = req.params;
    
    const setting = await Setting.findOneAndDelete({ category, key });
    if (!setting) {
      return res.status(404).json({ message: "Setting not found" });
    }
    
    res.json({ message: "Setting deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ BULK update settings
exports.bulkUpdateSettings = async (req, res) => {
  try {
    const { settings, lastModifiedBy } = req.body;
    const results = [];
    const errors = [];

    for (const settingUpdate of settings) {
      try {
        const validation = await validateSetting(
          settingUpdate.category, 
          settingUpdate.key, 
          settingUpdate.value
        );
        
        if (!validation.isValid) {
          errors.push({
            category: settingUpdate.category,
            key: settingUpdate.key,
            errors: validation.errors
          });
          continue;
        }

        const setting = await Setting.findOneAndUpdate(
          { category: settingUpdate.category, key: settingUpdate.key },
          {
            value: settingUpdate.value,
            lastModifiedBy,
            version: { $inc: 1 }
          },
          { 
            new: true, 
            upsert: true,
            runValidators: true 
          }
        );

        results.push(setting);
      } catch (err) {
        errors.push({
          category: settingUpdate.category,
          key: settingUpdate.key,
          error: err.message
        });
      }
    }

    res.json({
      updated: results.length,
      errors: errors.length,
      results,
      errors
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ✅ RESET settings to defaults
exports.resetSettings = async (req, res) => {
  try {
    const { category, keys, resetBy } = req.body;
    
    let query = {};
    if (category) {
      query.category = category;
    }
    if (keys && keys.length > 0) {
      query.key = { $in: keys };
    }

    const settings = await Setting.find(query);
    const results = [];

    for (const setting of settings) {
      if (setting.defaultValue !== undefined) {
        setting.value = setting.defaultValue;
        setting.lastModifiedBy = resetBy;
        setting.version += 1;
        await setting.save();
        results.push(setting);
      }
    }

    res.json({
      message: `${results.length} settings reset to defaults`,
      reset: results.length
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ✅ EXPORT settings
exports.exportSettings = async (req, res) => {
  try {
    const { category, includePrivate = false } = req.query;
    
    let query = {};
    if (category) {
      query.category = category;
    }
    
    if (!includePrivate || includePrivate === 'false') {
      query.isPublic = true;
    }

    const settings = await Setting.find(query).sort({ category: 1, key: 1 });
    
    // Format for export
    const exportData = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = {};
      }
      acc[setting.category][setting.key] = {
        value: setting.value,
        dataType: setting.dataType,
        displayName: setting.displayName,
        description: setting.description
      };
      return acc;
    }, {});

    res.json({
      exportedAt: new Date(),
      categories: Object.keys(exportData),
      settings: exportData
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ IMPORT settings
exports.importSettings = async (req, res) => {
  try {
    const { settings, importBy, overwrite = false } = req.body;
    const results = [];
    const errors = [];
    const skipped = [];

    for (const [category, categorySettings] of Object.entries(settings)) {
      for (const [key, settingData] of Object.entries(categorySettings)) {
        try {
          const existingSetting = await Setting.findOne({ category, key });
          
          if (existingSetting && !overwrite) {
            skipped.push({ category, key, reason: "Already exists and overwrite is false" });
            continue;
          }

          const validation = await validateSetting(category, key, settingData.value);
          if (!validation.isValid) {
            errors.push({
              category,
              key,
              errors: validation.errors
            });
            continue;
          }

          const setting = await Setting.findOneAndUpdate(
            { category, key },
            {
              category,
              key,
              value: settingData.value,
              dataType: settingData.dataType || 'string',
              displayName: settingData.displayName || key,
              description: settingData.description,
              lastModifiedBy: importBy,
              version: existingSetting ? existingSetting.version + 1 : 1
            },
            { 
              new: true, 
              upsert: true,
              runValidators: true 
            }
          );

          results.push(setting);
        } catch (err) {
          errors.push({
            category,
            key,
            error: err.message
          });
        }
      }
    }

    res.json({
      imported: results.length,
      skipped: skipped.length,
      errors: errors.length,
      results,
      skipped,
      errors
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ✅ GET setting categories
exports.getSettingCategories = async (req, res) => {
  try {
    const categories = await Setting.distinct('category');
    
    const categoryInfo = await Promise.all(
      categories.map(async (category) => {
        const count = await Setting.countDocuments({ category });
        const publicCount = await Setting.countDocuments({ category, isPublic: true });
        const editableCount = await Setting.countDocuments({ category, isEditable: true });
        
        return {
          category,
          totalSettings: count,
          publicSettings: publicCount,
          editableSettings: editableCount
        };
      })
    );

    res.json(categoryInfo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ VALIDATE setting value
exports.validateSetting = async (req, res) => {
  try {
    const { category, key, value } = req.body;
    
    const validation = await validateSetting(category, key, value);
    
    res.json(validation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Helper function to validate setting value
async function validateSetting(category, key, value) {
  try {
    const setting = await Setting.findOne({ category, key });
    
    if (!setting) {
      return { isValid: false, errors: ["Setting not found"] };
    }

    const errors = [];
    const rules = setting.validationRules || {};

    // Check if required
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push("This field is required");
    }

    // Type-specific validations
    if (value !== undefined && value !== null && value !== '') {
      switch (setting.dataType) {
        case 'string':
          if (rules.minLength && value.length < rules.minLength) {
            errors.push(`Minimum length is ${rules.minLength}`);
          }
          if (rules.maxLength && value.length > rules.maxLength) {
            errors.push(`Maximum length is ${rules.maxLength}`);
          }
          if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
            errors.push("Value does not match required pattern");
          }
          if (rules.options && !rules.options.includes(value)) {
            errors.push(`Value must be one of: ${rules.options.join(', ')}`);
          }
          break;
          
        case 'number':
          const numValue = Number(value);
          if (isNaN(numValue)) {
            errors.push("Value must be a number");
          } else {
            if (rules.min !== undefined && numValue < rules.min) {
              errors.push(`Minimum value is ${rules.min}`);
            }
            if (rules.max !== undefined && numValue > rules.max) {
              errors.push(`Maximum value is ${rules.max}`);
            }
          }
          break;
          
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push("Value must be true or false");
          }
          break;
          
        case 'array':
          if (!Array.isArray(value)) {
            errors.push("Value must be an array");
          }
          break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  } catch (err) {
    return { isValid: false, errors: [err.message] };
  }
}
