const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');

router
  .route('/')
  .post(vendorController.createVendor)
  .get(vendorController.getAllVendors);

router
  .route('/:id')
  .get(vendorController.getVendorById)
  .put(vendorController.updateVendor)
  .delete(vendorController.deleteVendor);

router.get('/:id/history', vendorController.getVendorHistory);
router.post('/:id/restore/:versionId', vendorController.restoreVendorVersion);
router.post('/:id/verify-external', vendorController.verifyExternalCompany);
router.post('/:id/notify-missing-docs', vendorController.notifyMissingDocs);
router.patch('/:id/status', vendorController.updateVendorStatus);
router.post('/:id/tasks', vendorController.createTask);
router.get('/:id/tasks', vendorController.getVendorTasks);
router.patch('/tasks/:taskId/toggle', vendorController.toggleTaskStatus);
module.exports = router;