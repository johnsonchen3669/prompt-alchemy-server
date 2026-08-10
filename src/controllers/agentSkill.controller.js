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
   * 依目標 agent 取得這筆 Agent Skill 組好的安裝指令
   * GET /agent-skills/:id/install-command?agent=claude-code
   */
  async getInstallCommands(req, res, next) {
    try {
      const { id } = req.params;
      const { agent } = req.query;
      const commands = await agentSkillService.getInstallCommands(id, agent);
      res.status(200).json({
        status: 'success',
        data: { commands },
      });
    } catch (error) {
      if (error.message === '找不到該 Agent Skill') {
        return res.status(404).json({
          status: 'error',
          message: error.message,
        });
      }
      if (error.message.startsWith('不支援的目標 Agent')) {
        return res.status(400).json({
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
