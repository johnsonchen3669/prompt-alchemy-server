const express = require('express');
const router = express.Router();

// 前台 router
router.use('/health', require('./health.routes'))
router.use('/auth', require('./auth.routes'))
router.use('/utility', require('./utility.routes'))
router.use('/prompts', require('./prompt.routes'));

// 後台 router
router.use('/admin/parameters', require('./admin/parameter.routes'))
router.use('/admin/users', require('./admin/user.routes'))
router.use('/admin/skills', require('./admin/skill.routes'))

module.exports = router;
