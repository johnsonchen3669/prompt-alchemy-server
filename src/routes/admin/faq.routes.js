const express = require('express');
const router = express.Router();
const adminFaqController = require('../../controllers/admin/faq.controller');
const { vertfyToken, isAdmin } = require('../../middlewares/authenticate');

router.use(vertfyToken, isAdmin);

router.get(
  '/',
  /* #swagger.tags = ['Admin FAQs']
     #swagger.summary = '取得後台 FAQ 清單'
     #swagger.description = '取得 FAQ 完整管理清單，包含啟用與已停用資料。'
     #swagger.security = [{ bearerAuth: [] }] */
  /* #swagger.responses[200] = {
       description: '成功取得後台 FAQ 清單',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               data: {
                 type: 'array',
                 items: { $ref: '#/components/schemas/FAQ' }
               }
             }
           }
         }
       }
  }
  #swagger.responses[401] = { description: '未登入或 Token 無效', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[403] = { description: '權限不足', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[500] = { description: '伺服器發生未預期的錯誤', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } } */
  adminFaqController.getFaqs
);

router.get(
  '/:id',
  /* #swagger.tags = ['Admin FAQs']
     #swagger.summary = '取得後台單筆 FAQ'
     #swagger.description = '依 FAQ UUID 取得完整管理資料，包含已停用資料。'
     #swagger.security = [{ bearerAuth: [] }] */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: 'FAQ ID (UUID)',
       required: true,
       '@schema': {
         type: 'string',
         format: 'uuid',
         example: '60000000-0000-4000-a000-000000000001'
       }
  } */
  /* #swagger.responses[200] = {
       description: '成功取得 FAQ',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               data: { $ref: '#/components/schemas/FAQ' }
             }
           }
         }
       }
  }
  #swagger.responses[400] = { description: 'FAQ ID 格式錯誤', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  #swagger.responses[401] = { description: '未登入或 Token 無效', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[403] = { description: '權限不足', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[404] = { description: '找不到 FAQ', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  #swagger.responses[500] = { description: '伺服器發生未預期的錯誤', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } } */
  adminFaqController.getFaqById
);

router.post(
  '/',
  /* #swagger.tags = ['Admin FAQs']
     #swagger.summary = '建立 FAQ'
     #swagger.description = '建立 FAQ；question 與 answer 必須為非空白字串，sortOrder 預設為 0，isActive 預設為 true。'
     #swagger.security = [{ bearerAuth: [] }] */
  /* #swagger.requestBody = {
       required: true,
       content: {
         'application/json': {
           schema: {
             type: 'object',
             required: ['question', 'answer'],
             properties: {
               question: { type: 'string', minLength: 1, example: '如何使用 Prompt 鍊金坊？' },
               answer: { type: 'string', minLength: 1, example: '瀏覽並複製想使用的 Prompt。' },
               sortOrder: { type: 'integer', minimum: 0, default: 0, example: 1 },
               isActive: { type: 'boolean', default: true, example: true }
             }
           }
         }
       }
  } */
  /* #swagger.responses[201] = {
       description: '建立 FAQ 成功',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               message: { type: 'string', example: '建立 FAQ 成功' },
               data: { $ref: '#/components/schemas/FAQ' }
             }
           }
         }
       }
  }
  #swagger.responses[400] = { description: '請求格式錯誤或必填欄位缺失', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  #swagger.responses[401] = { description: '未登入或 Token 無效', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[403] = { description: '權限不足', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[500] = { description: '伺服器發生未預期的錯誤', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } } */
  adminFaqController.createFaq
);

router.put(
  '/:id',
  /* #swagger.tags = ['Admin FAQs']
     #swagger.summary = '更新 FAQ'
     #swagger.description = '部分更新 FAQ 的問題、答案、排序或啟用狀態；至少需要提供一個可更新欄位。'
     #swagger.security = [{ bearerAuth: [] }] */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: 'FAQ ID (UUID)',
       required: true,
       '@schema': {
         type: 'string',
         format: 'uuid',
         example: '60000000-0000-4000-a000-000000000001'
       }
  } */
  /* #swagger.requestBody = {
       required: true,
       content: {
         'application/json': {
           schema: {
             type: 'object',
             minProperties: 1,
             properties: {
               question: { type: 'string', minLength: 1, example: '更新後的問題' },
               answer: { type: 'string', minLength: 1, example: '更新後的答案' },
               sortOrder: { type: 'integer', minimum: 0, example: 2 },
               isActive: { type: 'boolean', example: true }
             }
           }
         }
       }
  } */
  /* #swagger.responses[200] = {
       description: '更新 FAQ 成功',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               message: { type: 'string', example: '更新 FAQ 成功' },
               data: { $ref: '#/components/schemas/FAQ' }
             }
           }
         }
       }
  }
  #swagger.responses[400] = { description: '請求格式錯誤、沒有可更新欄位，或 ID 格式錯誤', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  #swagger.responses[401] = { description: '未登入或 Token 無效', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[403] = { description: '權限不足', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[404] = { description: '找不到 FAQ', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  #swagger.responses[500] = { description: '伺服器發生未預期的錯誤', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } } */
  adminFaqController.updateFaq
);

router.delete(
  '/:id',
  /* #swagger.tags = ['Admin FAQs']
     #swagger.summary = '軟刪除 FAQ'
     #swagger.description = '停用指定 FAQ，不從資料庫移除資料；回應會包含停用後的 FAQ。'
     #swagger.security = [{ bearerAuth: [] }] */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: 'FAQ ID (UUID)',
       required: true,
       '@schema': {
         type: 'string',
         format: 'uuid',
         example: '60000000-0000-4000-a000-000000000001'
       }
  } */
  /* #swagger.responses[200] = {
       description: '刪除 FAQ 成功，回傳 isActive 為 false 的 FAQ',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               message: { type: 'string', example: '刪除 FAQ 成功' },
               data: { $ref: '#/components/schemas/FAQ' }
             }
           }
         }
       }
  }
  #swagger.responses[400] = { description: 'FAQ ID 格式錯誤', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  #swagger.responses[401] = { description: '未登入或 Token 無效', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[403] = { description: '權限不足', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[404] = { description: '找不到 FAQ', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  #swagger.responses[500] = { description: '伺服器發生未預期的錯誤', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } } */
  adminFaqController.deleteFaq
);

module.exports = router;
