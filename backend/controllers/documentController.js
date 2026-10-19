const Document = require('../models/Document');
const { extractDataWithAI } = require('../services/aiService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) return sendError(res, 'No file uploaded', 400);

    const { vendorId, documentType } = req.body;
    const filePath = req.file.path;

    // Call Gemini AI
    const extractedData = await extractDataWithAI(filePath, documentType);

    // Save to DB
    const newDoc = await Document.create({
      vendorId,
      documentType,
      fileName: req.file.originalname,
      filePath,
      extractedData
    });

    return sendSuccess(res, newDoc, 'Document uploaded and analyzed successfully', 201);
  } catch (error) {
    next(error);
  }
};

exports.getVendorDocuments = async (req, res, next) => {
  try {
    const docs = await Document.find({ vendorId: req.params.vendorId });
    return sendSuccess(res, docs, 'Documents retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update extracted data of a document (User correction)
 * @route   PUT /api/documents/:id/extracted-data
 */
exports.updateExtractedData = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { extractedData } = req.body;

    const updatedDoc = await Document.findByIdAndUpdate(
      id,
      { extractedData },
      { new: true }
    );

    if (!updatedDoc) return sendError(res, 'Document not found', 404);

    return sendSuccess(res, updatedDoc, 'Extracted data updated successfully');
  } catch (error) {
    next(error);
  }
};