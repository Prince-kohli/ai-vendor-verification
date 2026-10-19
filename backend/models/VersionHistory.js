const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  version: { type: Number, required: true },
  changes: [{
    field: String,
    previousValue: String,
    newValue: String
  }],
  changedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('VersionHistory', versionSchema);