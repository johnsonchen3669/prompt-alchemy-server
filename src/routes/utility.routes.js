const express = require('express');
const multer = require('multer');
const utilityController = require('../controllers/utility.controller');

const router = express.Router();

// 使用記憶體暫存 (Memory Storage) 處理上傳檔案
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 限制最大 10MB
  }
});

/**
 * @openapi
 * /utility/upload:
 *   post:
 *     summary: 上傳檔案至 GCP Bucket
 *     description: 提供檔案上傳功能，並回傳公開可存取的 URL。
 *     tags:
 *       - Utility
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 要上傳的檔案
 *     responses:
 *       200:
 *         description: 檔案上傳成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: 檔案上傳成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       example: https://storage.googleapis.com/my-bucket/123456789-1234.png
 *       400:
 *         description: 上傳失敗 (例如未帶入檔案)
 */
router.post('/upload', upload.single('file'), utilityController.uploadFile);

module.exports = router;
