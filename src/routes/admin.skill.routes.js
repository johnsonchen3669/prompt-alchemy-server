const express = require('express');
const router = express.Router();
const adminSkillController = require('../controllers/admin.skill.controller');
const { vertfyToken, isAdmin } = require('../middlewares/authenticate');

router.use(vertfyToken, isAdmin);

router.get('/', adminSkillController.getSkills);
router.get('/:id', adminSkillController.getSkillById);
router.post('/', adminSkillController.createSkill);
router.put('/:id', adminSkillController.updateSkill);

module.exports = router;
