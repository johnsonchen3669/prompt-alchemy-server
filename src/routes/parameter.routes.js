const express = require('express');
const router = express.Router();
const parameterController = require('../controllers/parameter.controller');

const { vertfyToken, isAdmin } = require('../middlewares/authenticate');

// 根據 API 規格：所有 /api/admin/* 都需驗證是否具備 admin 權限
router.use(vertfyToken, isAdmin);

router.get('/', parameterController.getParameters);
router.post('/', parameterController.createParameter);
router.put('/:id', parameterController.updateParameter);
router.delete('/:id', parameterController.deleteParameter);

module.exports = router;
