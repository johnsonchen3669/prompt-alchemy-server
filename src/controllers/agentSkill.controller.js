const agentSkillService = require('../services/agentSkill.service');

class AgentSkillController {
  /**
   * 取得上架中的 Agent Skill 列表
   * GET /agent-skills
   */
  async getAgentSkills(req, res, next) {
    try {
      const data = await agentSkillService.getAgentSkills(req.query);
      res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 取得單一 Agent Skill 詳細內容
   * GET /agent-skills/:id
   */
  async getAgentSkillById(req, res, next) {
    try {
      const { id } = req.params;
      const data = await agentSkillService.getAgentSkillById(id);
      res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error) {
      if (error.message === '找不到該 Agent Skill') {
        return res.status(404).json({
          status: 'error',
          message: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * 增加 Agent Skill 的安裝指令複製次數
   * POST /agent-skills/:id/copy
   */
  async incrementCopyCount(req, res, next) {
    try {
      const { id } = req.params;
      const data = await agentSkillService.incrementCopyCount(id);
      res.status(200).json({
        status: 'success',
        message: '複製次數已累加',
        data,
      });
    } catch (error) {
      if (error.message.includes('找不到該 Agent Skill')) {
        return res.status(404).json({
          status: 'error',
          message: error.message,
        });
      }
      next(error);
    }
  }
}

module.exports = new AgentSkillController();
