const express = require('express');
const router = express.Router();

// 前台 router
router.use('/health', require('./health.routes'))
router.use('/auth', require('./auth.routes'))
router.use('/utility', require('./utility.routes'))
router.use('/prompts', require('./prompt.routes'));
router.use('/favorites', require('./favorite.routes'));
router.use('/me/recipes', require('./skillRecipe.routes'));
router.use('/me/recipe-items', require('./skillRecipeItem.routes'));
router.use('/contacts', require('./contact.routes'));
router.use('/agent-skills', require('./agentSkill.routes'));
router.use('/faqs', require('./faq.routes'));

// 後台 router
router.use('/admin/parameters', require('./admin/parameter.routes'))
router.use('/admin/users', require('./admin/user.routes'))
router.use('/admin/skills', require('./admin/skill.routes'))
router.use('/admin/agent-skills', require('./admin/agentSkill.routes'))
router.use('/admin/contacts', require('./admin/contact.routes'))
router.use('/admin/faqs', require('./admin/faq.routes'))

module.exports = router;

