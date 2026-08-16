const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faq.controller');

router.get(
  '/',
  /* #swagger.tags = ['FAQs']
     #swagger.summary = '取得已啟用的 FAQ 清單'
     #swagger.description = '前台訪客取得已啟用的常見問題，依管理者設定的順序顯示。此端點不需要登入。'
     #swagger.security = [] */
  /* #swagger.responses[200] = {
       description: '成功取得 FAQ 清單',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             required: ['status', 'data'],
             properties: {
               status: { type: 'string', example: 'success' },
               data: {
                 type: 'array',
                 items: { $ref: '#/components/schemas/PublicFAQ' }
               }
             }
           }
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
  faqController.getFaqs
);

module.exports = router;
