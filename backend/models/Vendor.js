const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  contactPerson: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, default: '' },
  registrationNumber: { type: String, default: '' },
  gstNumber: { type: String, default: '' },
  bankAccountNumber: { type: String, default: '' },
  ifscCode: { type: String, default: '' },
  status: {
    type: String,
    enum: ['Draft', 'Under Review', 'Action Required', 'Approved', 'Rejected'],
    default: 'Draft'
  },
  verificationResult: {
    nameMatch: { type: String, default: '' },
    regNumberMatch: { type: String, default: '' },
    addressMatch: { type: String, default: '' },
    overallStatus: {
      type: String,
      enum: ['Verified', 'Mismatch', 'Unable to Verify', ''],
      default: ''
    }
  },
  documentChecklist: {
    registrationCertificate: { type: String, enum: ['Available', 'Missing', 'Verified'], default: 'Missing' },
    gstCertificate: { type: String, enum: ['Available', 'Missing', 'Verified'], default: 'Missing' },
    bankDocument: { type: String, enum: ['Available', 'Missing', 'Verified'], default: 'Missing' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Vendor', vendorSchema);