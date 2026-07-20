const express = require('express');
const router = express.Router();
const promptController = require('../controllers/prompt.controller');

// 前台公開 Endpoint (無需 Token 即可存取)
router.get('/', promptController.getPrompts);
router.get('/:id', promptController.getPromptById);
router.post('/:id/copy', promptController.incrementCopyCount);

module.exports = router;
