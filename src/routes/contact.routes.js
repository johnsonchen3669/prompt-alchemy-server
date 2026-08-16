const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');

router.post(
  '/',
  /* #swagger.tags = ['Contacts']
     #swagger.summary = '提交聯絡表單'
     #swagger.description = '訪客或會員提交聯絡資訊與訊息給管理者；此端點不需要登入。'
     #swagger.security = [] */
  /* #swagger.requestBody = {
       required: true,
       content: {
         'application/json': {
           schema: {
             type: 'object',
             required: ['name', 'email', 'message'],
             properties: {
               name: { type: 'string', example: '王小明' },
               email: { type: 'string', format: 'email', example: 'member@example.com' },
               message: { type: 'string', example: '我想了解 Prompt 鍊金坊的使用方式。' }
             }
           }
         }
       }
  } */
  /* #swagger.responses[201] = {
       description: '聯絡表單已成功送出',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             required: ['status', 'message', 'data'],
             properties: {
               status: { type: 'string', example: 'success' },
               message: { type: 'string', example: '聯絡表單已成功送出' },
               data: { $ref: '#/components/schemas/Contact' }
             }
           }
         }
       }
  }
  #swagger.responses[400] = {
       description: '名稱、Email 或聯絡內容缺失或格式不正確',
       content: {
         'application/json': {
           schema: { $ref: '#/components/schemas/ErrorResponse' }
         }
       }
  }
  #swagger.responses[500] = {
       description: '伺服器發生未預期的錯誤',
       content: {
         'application/json': {
           schema: { $ref: '#/components/schemas/ErrorResponse' }
         }
       }
  } */
  contactController.createContact
);

module.exports = router;
