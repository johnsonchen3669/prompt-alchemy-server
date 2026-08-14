const agentSkillRepository = require('../../database/repositories/agent_skill.repository');
const agentSkillService = require('../../services/agentSkill.service');

class AdminAgentSkillController {
  /**
   * 取得所有 Agent Skill 列表（後台用，包含停用項目）
   */
  async getAgentSkills(req, res, next) {
    try {
      const { keyword, categoryId, active } = req.query;
      const rows = await agentSkillRepository.findAllForAdmin({ keyword, categoryId, active });
      
      const data = rows.map(row => agentSkillService._mapToApiFormat(row));
      
      res.status(200).json({
        status: 'success',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 取得單筆 Agent Skill
   */
  async getAgentSkillById(req, res, next) {
    try {
      const { id } = req.params;
      const row = await agentSkillRepository.findByIdForAdmin(id);
      
      if (!row) {
        return res.status(404).json({ status: 'error', message: '找不到資料' });
      }

      res.status(200).json({
        status: 'success',
        data: agentSkillService._mapToApiFormat(row)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 新增 Agent Skill
   */
  async createAgentSkill(req, res, next) {
    try {
      const data = req.body;
      data.userId = req.user.userId; // 設定為目前的 admin
      
      const row = await agentSkillRepository.create(data);
      
      res.status(201).json({
        status: 'success',
        data: agentSkillService._mapToApiFormat(row)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 修改 Agent Skill
   */
  async updateAgentSkill(req, res, next) {
    try {
      const { id } = req.params;
      const data = req.body;

      const row = await agentSkillRepository.findByIdForAdmin(id);
      if (!row) {
        return res.status(404).json({ status: 'error', message: '找不到資料' });
      }

      const updatedRow = await agentSkillRepository.update(id, data);
      
      res.status(200).json({
        status: 'success',
        data: agentSkillService._mapToApiFormat(updatedRow)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 切換啟用 / 停用狀態
   */
  async toggleActive(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ status: 'error', message: 'isActive 必須是布林值' });
      }

      const row = await agentSkillRepository.findByIdForAdmin(id);
      if (!row) {
        return res.status(404).json({ status: 'error', message: '找不到資料' });
      }

      const updatedRow = await agentSkillRepository.setActive(id, isActive);
      
      res.status(200).json({
        status: 'success',
        data: agentSkillService._mapToApiFormat(updatedRow)
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminAgentSkillController();
