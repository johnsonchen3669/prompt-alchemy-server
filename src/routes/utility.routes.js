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

router.post(
  '/upload',
  /* #swagger.tags = ['Utility']
     #swagger.summary = '上傳檔案至 GCP Bucket'
     #swagger.description = '提供檔案上傳功能，成功後回傳公開可存取的檔案 URL；單一檔案大小上限為 10 MB。此端點不需要登入。'
     #swagger.security = [] */
  /* #swagger.requestBody = {
       required: true,
       content: {
         'multipart/form-data': {
           schema: {
             type: 'object',
             required: ['file'],
             properties: {
               file: {
                 type: 'string',
                 format: 'binary',
                 description: '要上傳的檔案'
               }
             }
           }
         }
       }
  } */
  /* #swagger.responses[200] = {
       description: '檔案上傳成功',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             required: ['status', 'message', 'data'],
             properties: {
               status: { type: 'string', example: 'success' },
               message: { type: 'string', example: '檔案上傳成功' },
               data: {
                 type: 'object',
                 required: ['url'],
                 properties: {
                   url: { type: 'string', format: 'uri', example: 'https://storage.googleapis.com/my-bucket/123456789-1234.png' }
                 }
               }
             }
           }
         }
       }
  }
  #swagger.responses[400] = {
       description: '未提供上傳檔案或欄位名稱不是 file',
       content: {
         'application/json': {
           schema: { $ref: '#/components/schemas/ErrorResponse' }
         }
       }
  }
  #swagger.responses[413] = {
       description: '檔案大小超過 10 MB 限制',
       content: {
         'application/json': {
           schema: { $ref: '#/components/schemas/ErrorResponse' }
         }
       }
  }
  #swagger.responses[500] = {
       description: '檔案儲存服務發生未預期的錯誤',
       content: {
         'application/json': {
           schema: { $ref: '#/components/schemas/ErrorResponse' }
         }
       }
  } */
  upload.single('file'),
  utilityController.uploadFile
);

module.exports = router;
