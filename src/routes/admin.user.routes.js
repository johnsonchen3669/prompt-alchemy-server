const express = require('express');
const router = express.Router();
const adminUserController = require('../controllers/admin.user.controller');
const { vertfyToken, isAdmin } = require('../middlewares/authenticate');

router.use(vertfyToken, isAdmin);

router.get('/', adminUserController.getUsers);
// 根據 API 設計文件，目前我們只需要實作更新會員，註冊則是共用前台，或是可以另外加
router.put('/:id', adminUserController.updateUser);

module.exports = router;
