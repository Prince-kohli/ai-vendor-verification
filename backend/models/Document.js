const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  documentType: { type: String, enum: ['Registration Certificate', 'GST Certificate', 'Bank Document'], required: true },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  extractedData: {
    companyName: String,
    registrationNumber: String,
    gstNumber: String,
    address: String,
    bankAccountNumber: String,
    ifscCode: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);