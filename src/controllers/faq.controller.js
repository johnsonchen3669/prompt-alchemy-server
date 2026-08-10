const faqService = require('../services/faq.service');

class FaqController {
  /**
   * 取得前台已啟用 FAQ 清單。
   * GET /faqs
   */
  async getFaqs(req, res, next) {
    try {
      const data = await faqService.getActiveFaqs();
      return res.status(200).json({
        status: 'success',
        data
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FaqController();
