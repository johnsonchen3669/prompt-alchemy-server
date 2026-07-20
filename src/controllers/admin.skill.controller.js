const promptRepository = require('../database/repositories/prompt.repository');
const promptService = require('../services/prompt.service');

class AdminSkillController {
  /**
   * 取得所有技能列表
   */
  async getSkills(req, res, next) {
    try {
      const { keyword, contentTypeId, categoryId, active } = req.query;
      const rows = await promptRepository.findAllForAdmin({ keyword, contentTypeId, categoryId, active });
      
      const data = rows.map(row => promptService._mapToApiFormat(row));
      
      res.status(200).json({
        status: 'success',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 取得單筆技能
   */
  async getSkillById(req, res, next) {
    try {
      const { id } = req.params;
      const row = await promptRepository.findByIdForAdmin(id);
      
      if (!row) {
        return res.status(404).json({ status: 'error', message: '找不到資料' });
      }

      res.status(200).json({
        status: 'success',
        data: promptService._mapToApiFormat(row)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 新增技能
   */
  async createSkill(req, res, next) {
    try {
      const data = req.body;
      data.userId = req.user.userId; // 設定為目前的 admin
      
      const row = await promptRepository.createSkill(data);
      
      res.status(201).json({
        status: 'success',
        data: promptService._mapToApiFormat(row)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 修改技能
   */
  async updateSkill(req, res, next) {
    try {
      const { id } = req.params;
      const data = req.body;

      const row = await promptRepository.findByIdForAdmin(id);
      if (!row) {
        return res.status(404).json({ status: 'error', message: '找不到資料' });
      }

      const updatedRow = await promptRepository.updateSkill(id, data);
      
      res.status(200).json({
        status: 'success',
        data: promptService._mapToApiFormat(updatedRow)
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminSkillController();
