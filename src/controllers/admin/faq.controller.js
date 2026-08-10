const faqService = require('../../services/faq.service');

const NOT_FOUND_MESSAGE = '找不到 FAQ';

/**
 * 回傳統一格式的錯誤回應。
 * @param {import('express').Response} res Express response
 * @param {number} statusCode HTTP 狀態碼
 * @param {string} message 錯誤訊息
 * @returns {import('express').Response} Express response
 */
function sendError(res, statusCode, message) {
  return res.status(statusCode).json({
    status: 'error',
    message
  });
}

/**
 * 處理 FAQ service 預期內的錯誤，其餘錯誤交由全域 error handler 處理。
 * @param {Error} error Service 拋出的錯誤
 * @param {import('express').Response} res Express response
 * @param {import('express').NextFunction} next Express next function
 * @returns {import('express').Response|void} Express response，或將錯誤傳給 next
 */
function handleServiceError(error, res, next) {
  if (error.message === NOT_FOUND_MESSAGE) {
    return sendError(res, 404, error.message);
  }

  const validationMessages = [
    'FAQ 資料格式錯誤',
    'question 為必填且不可為空白',
    'answer 為必填且不可為空白',
    'sortOrder 必須是大於或等於 0 的整數',
    'isActive 必須是 boolean',
    '沒有可更新的 FAQ 欄位'
  ];
  if (validationMessages.includes(error.message)) {
    return sendError(res, 400, error.message);
  }

  return next(error);
}

class AdminFaqController {
  /**
   * 取得後台 FAQ 清單。
   * GET /admin/faqs
   * @param {import('express').Request} req Express request
   * @param {import('express').Response} res Express response
   * @param {import('express').NextFunction} next Express next function
   * @returns {Promise<import('express').Response|void>} FAQ 清單回應
   */
  async getFaqs(req, res, next) {
    try {
      const data = await faqService.getFaqsForAdmin();
      return res.status(200).json({
        status: 'success',
        data
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 取得後台單筆 FAQ。
   * GET /admin/faqs/:id
   * @param {import('express').Request} req Express request，`req.params.id` 為 FAQ UUID
   * @param {import('express').Response} res Express response
   * @param {import('express').NextFunction} next Express next function
   * @returns {Promise<import('express').Response|void>} FAQ 資料或 404 錯誤回應
   */
  async getFaqById(req, res, next) {
    try {
      const data = await faqService.getFaqByIdForAdmin(req.params.id);
      return res.status(200).json({
        status: 'success',
        data
      });
    } catch (error) {
      return handleServiceError(error, res, next);
    }
  }

  /**
   * 建立 FAQ。
   * POST /admin/faqs
   * @param {import('express').Request} req Express request，body 包含 question、answer、sortOrder 與 isActive
   * @param {import('express').Response} res Express response
   * @param {import('express').NextFunction} next Express next function
   * @returns {Promise<import('express').Response|void>} 新建 FAQ 或 400 錯誤回應
   */
  async createFaq(req, res, next) {
    try {
      const data = await faqService.createFaq(req.body);
      return res.status(201).json({
        status: 'success',
        message: '建立 FAQ 成功',
        data
      });
    } catch (error) {
      return handleServiceError(error, res, next);
    }
  }

  /**
   * 部分更新 FAQ。
   * PUT /admin/faqs/:id
   * @param {import('express').Request} req Express request，`req.params.id` 為 FAQ UUID
   * @param {import('express').Response} res Express response
   * @param {import('express').NextFunction} next Express next function
   * @returns {Promise<import('express').Response|void>} 更新後 FAQ，或 400、404 錯誤回應
   */
  async updateFaq(req, res, next) {
    try {
      const data = await faqService.updateFaq(req.params.id, req.body);
      return res.status(200).json({
        status: 'success',
        message: '更新 FAQ 成功',
        data
      });
    } catch (error) {
      return handleServiceError(error, res, next);
    }
  }

  /**
   * 軟刪除 FAQ。
   * DELETE /admin/faqs/:id
   * @param {import('express').Request} req Express request，`req.params.id` 為 FAQ UUID
   * @param {import('express').Response} res Express response
   * @param {import('express').NextFunction} next Express next function
   * @returns {Promise<import('express').Response|void>} 停用後 FAQ 或 404 錯誤回應
   */
  async deleteFaq(req, res, next) {
    try {
      const data = await faqService.deleteFaq(req.params.id);
      return res.status(200).json({
        status: 'success',
        message: '刪除 FAQ 成功',
        data
      });
    } catch (error) {
      return handleServiceError(error, res, next);
    }
  }
}

module.exports = new AdminFaqController();
