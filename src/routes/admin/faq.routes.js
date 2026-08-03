const express = require('express');
const router = express.Router();
const adminFaqController = require('../../controllers/admin/faq.controller');
const { vertfyToken, isAdmin } = require('../../middlewares/authenticate');

router.use(vertfyToken, isAdmin);

router.get(
  '/',
  /* #swagger.tags = ['Admin FAQs']
     #swagger.summary = '取得後台 FAQ 清單'
     #swagger.description = '取得 FAQ 完整管理清單，包含啟用與已停用資料。' */
  /* #swagger.responses[200] = {
       description: '成功取得後台 FAQ 清單',
       content: { "application/json": { schema: {
         type: 'object',
         properties: {
           status: { type: 'string', example: 'success' },
           data: { type: 'array', items: {
             type: 'object',
             properties: {
               id: { type: 'string', format: 'uuid', example: '60000000-0000-4000-a000-000000000001' },
               question: { type: 'string', example: 'Prompt 鍊金坊是什麼？' },
               answer: { type: 'string', example: 'Prompt 鍊金坊是一個整理與分享 AI Prompt、Skill 的收藏平台。' },
               sortOrder: { type: 'integer', minimum: 0, example: 1 },
               isActive: { type: 'boolean', example: true },
               createdAt: { type: 'string', format: 'date-time' },
               updatedAt: { type: 'string', format: 'date-time' }
             }
           } }
         }
       } } }
     }
     #swagger.responses[401] = { description: '未登入或 Token 無效' }
     #swagger.responses[403] = { description: '權限不足' }
     #swagger.responses[500] = { description: '伺服器發生未預期的錯誤' } */
  adminFaqController.getFaqs
);

router.get(
  '/:id',
  /* #swagger.tags = ['Admin FAQs']
     #swagger.summary = '取得後台單筆 FAQ'
     #swagger.description = '依 FAQ UUID 取得完整管理資料，包含已停用資料。' */
  /* #swagger.parameters['id'] = { in: 'path', description: 'FAQ ID (UUID)', required: true, type: 'string', format: 'uuid' } */
  /* #swagger.responses[200] = {
       description: '成功取得 FAQ',
       content: { "application/json": { schema: {
         type: 'object', properties: {
           status: { type: 'string', example: 'success' },
           data: { type: 'object', properties: {
             id: { type: 'string', format: 'uuid' },
             question: { type: 'string' }, answer: { type: 'string' },
             sortOrder: { type: 'integer', minimum: 0 }, isActive: { type: 'boolean' },
             createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' }
           } }
         }
       } } }
     }
     #swagger.responses[400] = { description: 'FAQ ID 格式錯誤' }
     #swagger.responses[401] = { description: '未登入或 Token 無效' }
     #swagger.responses[403] = { description: '權限不足' }
     #swagger.responses[404] = { description: '找不到 FAQ' } */
  adminFaqController.getFaqById
);

router.post(
  '/',
  /* #swagger.tags = ['Admin FAQs']
     #swagger.summary = '建立 FAQ'
     #swagger.description = '新 FAQ 預設為啟用。' */
  /* #swagger.requestBody = {
       required: true,
       content: { "application/json": { schema: {
         type: 'object', required: ['question', 'answer'],
         properties: {
           question: { type: 'string', example: '如何使用 Prompt 鍊金坊？' },
           answer: { type: 'string', example: '瀏覽並複製想使用的 Prompt。' },
           sortOrder: { type: 'integer', minimum: 0, default: 0, example: 1 },
           isActive: { type: 'boolean', default: true, example: true }
         }
       } } }
     } */
  /* #swagger.responses[201] = { description: '建立 FAQ 成功' }
     #swagger.responses[400] = { description: '請求格式錯誤或必填欄位缺失' }
     #swagger.responses[401] = { description: '未登入或 Token 無效' }
     #swagger.responses[403] = { description: '權限不足' } */
  adminFaqController.createFaq
);

router.put(
  '/:id',
  /* #swagger.tags = ['Admin FAQs']
     #swagger.summary = '更新 FAQ'
     #swagger.description = '支援部分更新問題、答案、排序與啟用狀態。' */
  /* #swagger.parameters['id'] = { in: 'path', description: 'FAQ ID (UUID)', required: true, type: 'string', format: 'uuid' } */
  /* #swagger.requestBody = {
       required: true,
       content: { "application/json": { schema: {
         type: 'object', minProperties: 1,
         properties: {
           question: { type: 'string', example: '更新後的問題' },
           answer: { type: 'string', example: '更新後的答案' },
           sortOrder: { type: 'integer', minimum: 0, example: 2 },
           isActive: { type: 'boolean', example: true }
         }
       } } }
     } */
  /* #swagger.responses[200] = { description: '更新 FAQ 成功' }
     #swagger.responses[400] = { description: '請求格式錯誤、沒有可更新欄位，或 ID 格式錯誤' }
     #swagger.responses[401] = { description: '未登入或 Token 無效' }
     #swagger.responses[403] = { description: '權限不足' }
     #swagger.responses[404] = { description: '找不到 FAQ' } */
  adminFaqController.updateFaq
);

router.delete(
  '/:id',
  /* #swagger.tags = ['Admin FAQs']
     #swagger.summary = '軟刪除 FAQ' */
  /* #swagger.parameters['id'] = { in: 'path', description: 'FAQ ID (UUID)', required: true, type: 'string', format: 'uuid' } */
  /* #swagger.responses[200] = { description: '刪除 FAQ 成功，回傳 isActive 為 false 的 FAQ' }
     #swagger.responses[400] = { description: 'FAQ ID 格式錯誤' }
     #swagger.responses[401] = { description: '未登入或 Token 無效' }
     #swagger.responses[403] = { description: '權限不足' }
     #swagger.responses[404] = { description: '找不到 FAQ' } */
  adminFaqController.deleteFaq
);

module.exports = router;
