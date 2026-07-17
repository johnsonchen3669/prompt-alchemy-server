const uploadService = require('../services/upload.service');

/**
 * 處理檔案上傳
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: '未接收到上傳的檔案 (請確認欄位名稱為 file)'
      });
    }

    const fileUrl = await uploadService.uploadFileToBucket(req.file);

    res.status(200).json({
      status: 'success',
      message: '檔案上傳成功',
      data: {
        url: fileUrl
      }
    });
  } catch (error) {
    // 進入全域 Error Handler
    next(error);
  }
};

module.exports = {
  uploadFile
};
