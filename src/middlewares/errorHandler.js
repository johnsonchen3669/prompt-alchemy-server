const multer = require('multer');

// 常見 PostgreSQL SQLSTATE 對應的客戶端錯誤訊息。
const PG_ERROR_MESSAGES = {
  '22P02': '欄位格式錯誤，請確認傳入的 ID 是否為正確格式',
  '23502': '缺少必填欄位',
  '23503': '關聯的資料不存在',
  '23505': '資料重複，請確認是否已存在',
  '23514': '欄位值不符合資料庫限制',
};

/**
 * Express 全域錯誤處理 middleware。
 * @param {Error & {code?: string, status?: number, statusCode?: number, type?: string}} err 錯誤物件
 * @param {import('express').Request} req Express request
 * @param {import('express').Response} res Express response
 * @param {import('express').NextFunction} next Express next function
 * @returns {import('express').Response|void} JSON 錯誤回應，或將錯誤繼續傳遞
 */
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  console.error('[Error]', err);

  if (err instanceof multer.MulterError) {
    const statusCode = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? '上傳檔案超過大小限制'
      : '上傳檔案格式錯誤';
    return res.status(statusCode).json({ status: 'error', message });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      status: 'error',
      message: 'JSON 格式錯誤'
    });
  }

  if (err.code === 'NOT_FOUND') {
    return res.status(404).json({
      status: 'error',
      message: err.message || '找不到資料'
    });
  }

  const pgMessage = err.code && PG_ERROR_MESSAGES[err.code];
  if (pgMessage) {
    return res.status(400).json({
      status: 'error',
      message: pgMessage
    });
  }

  const statusCode = err.statusCode || err.status;
  if (Number.isInteger(statusCode) && statusCode >= 400 && statusCode < 500) {
    return res.status(statusCode).json({
      status: 'error',
      message: err.message || '請求處理失敗'
    });
  }

  return res.status(500).json({
    status: 'error',
    message: '伺服器發生未預期的錯誤'
  });
}

module.exports = errorHandler;
