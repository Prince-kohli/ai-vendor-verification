const Vendor = require('../models/Vendor');
const VersionHistory = require('../models/VersionHistory');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { getFieldDiffs } = require('../utils/versionTracker');
const { sendMissingDocumentEmail } = require('../services/emailService');
const { verifyWithOpenCorporates } = require('../services/companyVerificationService');
const Task = require('../models/Task');
const Document = require('../models/Document');
/**
 * @desc    Create a new Vendor
 * @route   POST /api/vendors
 */
exports.createVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.create(req.body);
    return sendSuccess(res, vendor, 'Vendor created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all Vendors
 * @route   GET /api/vendors
 */
exports.getAllVendors = async (req, res, next) => {
  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 });
    return sendSuccess(res, vendors, 'Vendors retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single Vendor by ID
 * @route   GET /api/vendors/:id
 */
exports.getVendorById = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return sendError(res, 'Vendor not found', 404);
    }
    return sendSuccess(res, vendor, 'Vendor retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Vendor & track Version History
 * @route   PUT /api/vendors/:id
 */
exports.updateVendor = async (req, res, next) => {
  try {
    const oldVendor = await Vendor.findById(req.params.id);
    if (!oldVendor) {
      return sendError(res, 'Vendor not found', 404);
    }

    // Calculate Diffs
    const changes = getFieldDiffs(oldVendor, req.body);

    if (changes.length > 0) {
      const lastVersionDoc = await VersionHistory.findOne({ vendorId: req.params.id }).sort({ version: -1 });
      const nextVersion = lastVersionDoc ? lastVersionDoc.version + 1 : 1;

      await VersionHistory.create({
        vendorId: req.params.id,
        version: nextVersion,
        changes,
      });
    }

    const updatedVendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    return sendSuccess(res, updatedVendor, 'Vendor updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Version History for Vendor
 * @route   GET /api/vendors/:id/history
 */
exports.getVendorHistory = async (req, res, next) => {
  try {
    const history = await VersionHistory.find({ vendorId: req.params.id }).sort({ version: -1 });
    return sendSuccess(res, history, 'Version history fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Restore Vendor to previous version
 * @route   POST /api/vendors/:id/restore/:versionId
 */
exports.restoreVendorVersion = async (req, res, next) => {
  try {
    const targetVersion = await VersionHistory.findById(req.params.versionId);
    if (!targetVersion) {
      return sendError(res, 'Version record not found', 404);
    }

    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return sendError(res, 'Vendor not found', 404);
    }

    const restoredData = {};
    targetVersion.changes.forEach(c => {
      restoredData[c.field] = c.previousValue;
    });

    // Compute diff for this restore operation itself
    const changes = getFieldDiffs(vendor, restoredData);

    if (changes.length > 0) {
      const lastVersionDoc = await VersionHistory.findOne({ vendorId: req.params.id }).sort({ version: -1 });
      const nextVersion = lastVersionDoc ? lastVersionDoc.version + 1 : 1;

      await VersionHistory.create({
        vendorId: req.params.id,
        version: nextVersion,
        changes,
      });
    }

    const restoredVendor = await Vendor.findByIdAndUpdate(req.params.id, restoredData, { new: true });
    return sendSuccess(res, restoredVendor, `Restored version ${targetVersion.version} successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete Vendor
 * @route   DELETE /api/vendors/:id
 */
exports.deleteVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor) {
      return sendError(res, 'Vendor not found', 404);
    }
    await VersionHistory.deleteMany({ vendorId: req.params.id });
    return sendSuccess(res, null, 'Vendor and history deleted successfully');
  } catch (error) {
    next(error);
  }
};



/**
 * @desc    Verify vendor against external OpenCorporates API
 * @route   POST /api/vendors/:id/verify-external
 */
exports.verifyExternalCompany = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return sendError(res, 'Vendor not found', 404);
    }

    const verificationResult = await verifyWithOpenCorporates(
      vendor.companyName,
      vendor.registrationNumber
    );

    // Save verification result inside vendor record (optional/beneficial for tracking)
    vendor.externalVerification = {
      status: verificationResult.status,
      verifiedAt: new Date(),
      details: verificationResult.fetchedData,
    };
    await vendor.save();

    return sendSuccess(res, verificationResult, 'Company verification completed');
  } catch (error) {
    next(error);
  }
};




/**
 * @desc    Check Missing Documents & Send Automated Email to Client
 * @route   POST /api/vendors/:id/notify-missing-docs
 */
exports.notifyMissingDocs = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return sendError(res, 'Vendor not found', 404);
    }

    // Fetch vendor uploaded documents
    const docs = await Document.find({ vendorId: req.params.id });
    const uploadedDocTypes = docs.map(d => d.documentType);

    const REQUIRED_DOCS = ['Registration Certificate', 'GST Certificate', 'Bank Document'];
    const missingDocs = REQUIRED_DOCS.filter(type => !uploadedDocTypes.includes(type));

    if (missingDocs.length === 0) {
      return sendSuccess(res, { missingDocs: [] }, 'All required documents are uploaded. No missing documents.');
    }

    // Send Email via Email Service
    const emailResult = await sendMissingDocumentEmail(
      vendor.email,
      vendor.companyName,
      missingDocs
    );

    // Auto-update status to 'Action Required' as per workflow rule
    vendor.status = 'Action Required';
    await vendor.save();

    return sendSuccess(
      res,
      { missingDocs, emailResult, updatedStatus: vendor.status },
      `Notification email sent successfully to ${vendor.email}`
    );
  } catch (error) {
    next(error);
  }
};




exports.updateVendorStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, { status }, { new: true });
    return sendSuccess(res, vendor, `Status updated to ${status}`);
  } catch (error) { next(error); }
};

exports.createTask = async (req, res, next) => {
  try {
    const { title, priority, dueDate } = req.body;
    const task = await Task.create({
      vendorId: req.params.id,
      title,
      priority: priority || 'Medium',
      dueDate: dueDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'Pending',
    });
    return sendSuccess(res, task, 'Task created', 201);
  } catch (error) { next(error); }
};

exports.getVendorTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ vendorId: req.params.id }).sort({ createdAt: -1 });
    return sendSuccess(res, tasks, 'Vendor tasks fetched');
  } catch (error) { next(error); }
};

exports.toggleTaskStatus = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return sendError(res, 'Task not found', 404);
    task.status = task.status === 'Pending' ? 'Completed' : 'Pending';
    await task.save();
    return sendSuccess(res, task, `Task status changed to ${task.status}`);
  } catch (error) { next(error); }
};