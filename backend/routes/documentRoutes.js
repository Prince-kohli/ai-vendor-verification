const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const upload = require('../middleware/upload');

router.post('/upload', upload.single('file'), documentController.uploadDocument);
router.get('/vendor/:vendorId', documentController.getVendorDocuments);
router.put('/:id/extracted-data', documentController.updateExtractedData);
module.exports = router;