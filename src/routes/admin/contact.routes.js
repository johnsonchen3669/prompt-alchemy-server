const express = require('express');
const router = express.Router();
const adminContactController = require('../../controllers/admin/contact.controller');
const { vertfyToken, isAdmin } = require('../../middlewares/authenticate');

router.use(vertfyToken, isAdmin);

router.get('/', adminContactController.getContacts);
router.patch('/:id/status', adminContactController.updateContactStatus);
router.put('/:id/status', adminContactController.updateContactStatus);
router.delete('/:id', adminContactController.deleteContact);

module.exports = router;
