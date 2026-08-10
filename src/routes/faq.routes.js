const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faq.controller');

router.get(
  '/',
  /* #swagger.tags = ['FAQs']
     #swagger.summary = '取得已啟用的 FAQ 清單'
     #swagger.description = '前台訪客取得已啟用的常見問題，依管理者設定的順序顯示。'
     #swagger.security = [] */
  /* #swagger.responses[200] = {
       description: '成功取得 FAQ 清單',
       content: {
         "application/json": {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               data: {
                 type: 'array',
                 items: {
                   type: 'object',
                   properties: {
                     id: { type: 'string', format: 'uuid', example: '60000000-0000-4000-a000-000000000001' },
                     question: { type: 'string', example: 'Prompt 鍊金坊是什麼？' },
                     answer: { type: 'string', example: 'Prompt 鍊金坊是一個整理與分享 AI Prompt、Skill 的收藏平台。' }
                   }
                 }
               }
             }
           }
         }
       }
     }
     #swagger.responses[500] = { description: '伺服器發生未預期的錯誤' } */
  faqController.getFaqs
);

module.exports = router;
