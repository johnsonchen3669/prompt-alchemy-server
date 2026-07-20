const promptService = require('../services/prompt.service');

class PromptController {
  /**
   * 取得上架中的 Prompt 列表
   * GET /prompts
   */
  async getPrompts(req, res, next) {
    try {
      const data = await promptService.getPrompts(req.query);
      res.status(200).json({
        status: 'success',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 取得單一 Prompt 詳細內容
   * GET /prompts/:id
   */
  async getPromptById(req, res, next) {
    try {
      const { id } = req.params;
      const data = await promptService.getPromptById(id);
      res.status(200).json({
        status: 'success',
        data
      });
    } catch (error) {
      if (error.message === '找不到該 Prompt') {
        return res.status(404).json({
          status: 'error',
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * 增加 Prompt 複製使用次數
   * POST /prompts/:id/copy
   */
  async incrementCopyCount(req, res, next) {
    try {
      const { id } = req.params;
      const data = await promptService.incrementCopyCount(id);
      res.status(200).json({
        status: 'success',
        message: '複製次數已累加',
        data
      });
    } catch (error) {
      if (error.message.includes('找不到該 Prompt')) {
        return res.status(404).json({
          status: 'error',
          message: error.message
        });
      }
      next(error);
    }
  }
}

module.exports = new PromptController();
