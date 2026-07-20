const express = require('express');
const router = express.Router();
const parameterController = require('../controllers/parameter.controller');

// 根據 API 規格：所有 /api/admin/* 都需驗證是否具備 admin 權限
// 若專案已有 middleware 可在此掛載，目前先將路由結構完成
// const authMiddleware = require('../middlewares/auth.middleware');
// router.use(authMiddleware.requireAdmin);

router.get('/', parameterController.getParameters);
router.post('/', parameterController.createParameter);
router.put('/:id', parameterController.updateParameter);
router.delete('/:id', parameterController.deleteParameter);

module.exports = router;
