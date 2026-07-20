const parameterService = require('../../services/parameter.service');

class ParameterController {
  /**
   * 取得參數列表
   * GET /admin/parameters?type=category
   */
  async getParameters(req, res, next) {
    try {
      const { type } = req.query;
      const data = await parameterService.getParameters(type);
      
      res.status(200).json({
        status: 'success',
        message: '取得參數列表成功',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 新增參數
   * POST /admin/parameters
   */
  async createParameter(req, res, next) {
    try {
      const data = await parameterService.createParameter(req.body);
      
      res.status(201).json({
        status: 'success',
        message: '新增參數成功',
        data
      });
    } catch (error) {
      if (error.message.includes('無效的參數類型') || error.message.includes('必填')) {
        return res.status(400).json({
          status: 'error',
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * 更新參數
   * PUT /admin/parameters/:id
   */
  async updateParameter(req, res, next) {
    try {
      const { id } = req.params;
      const data = await parameterService.updateParameter(id, req.body);
      
      res.status(200).json({
        status: 'success',
        message: '修改參數成功',
        data
      });
    } catch (error) {
      if (error.message === '找不到參數') {
        return res.status(404).json({
          status: 'error',
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * 刪除參數 (軟刪除 / 停用)
   * DELETE /admin/parameters/:id
   */
  async deleteParameter(req, res, next) {
    try {
      const { id } = req.params;
      const data = await parameterService.updateParameter(id, { isActive: false });
      
      res.status(200).json({
        status: 'success',
        message: '參數已刪除/停用',
        data
      });
    } catch (error) {
      if (error.message === '找不到參數') {
        return res.status(404).json({
          status: 'error',
          message: error.message
        });
      }
      next(error);
    }
  }
}

module.exports = new ParameterController();
