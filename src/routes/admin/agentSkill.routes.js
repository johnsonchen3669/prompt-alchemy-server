const express = require('express');
const router = express.Router();
const agentSkillController = require('../../controllers/admin/agentSkill.controller');
const { vertfyToken, isAdmin } = require('../../middlewares/authenticate');

// 後台管理所有 Agent Skills 都需要驗證是否為 admin
router.use(vertfyToken, isAdmin);

// 取得 Agent Skill 列表
router.get('/', agentSkillController.getAgentSkills);

// 取得單一 Agent Skill
router.get('/:id', agentSkillController.getAgentSkillById);

// 新增 Agent Skill
router.post('/', agentSkillController.createAgentSkill);

// 更新 Agent Skill
router.put('/:id', agentSkillController.updateAgentSkill);

// 切換 Agent Skill 啟用 / 停用狀態
router.patch('/:id/active', agentSkillController.toggleActive);

module.exports = router;
