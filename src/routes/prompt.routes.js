const express = require('express');
const router = express.Router();
const promptController = require('../controllers/prompt.controller');

// 前台公開 Endpoint (無需 Token 即可存取)
router.get(
  '/',
  /* #swagger.tags = ['Prompts']
     #swagger.summary = '取得上架中的 Prompt 列表'
     #swagger.description = '前台會員與訪客瀏覽上架中的 Prompt，可搭配關鍵字搜尋、分類或標籤篩選。此端點不需要登入。'
     #swagger.security = [] */
  /* #swagger.parameters['category'] = {
       in: 'query',
       description: '分類 ID (UUID)',
       required: false,
       '@schema': {
         type: 'string',
         format: 'uuid',
         example: '550e8400-e29b-41d4-a716-446655440000'
       }
  }
  #swagger.parameters['tag'] = {
       in: 'query',
       description: '標籤 ID (UUID)',
       required: false,
       '@schema': {
         type: 'string',
         format: 'uuid',
         example: '6ba7b810-9dad-41d1-80b4-00c04fd430c8'
       }
  }
  #swagger.parameters['search'] = {
       in: 'query',
       description: '關鍵字搜尋（標題、簡介或內容）',
       required: false,
       '@schema': {
         type: 'string',
         example: 'API 審查'
       }
  } */
  /* #swagger.responses[200] = {
       description: '成功取得 Prompt 列表',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             required: ['status', 'data'],
             properties: {
               status: { type: 'string', example: 'success' },
               data: {
                 type: 'array',
                 items: { $ref: '#/components/schemas/Prompt' }
               }
             }
           }
         }
       }
  }
  #swagger.responses[400] = {
       description: '分類 ID 格式錯誤',
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
  promptController.getPrompts
);

router.get(
  '/:id',
  /* #swagger.tags = ['Prompts']
     #swagger.summary = '取得單一 Prompt 詳細內容'
     #swagger.description = '前台會員與訪客取得指定上架 Prompt 的完整內容。此端點不需要登入。'
     #swagger.security = [] */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: 'Prompt ID (UUID)',
       required: true,
       '@schema': {
         type: 'string',
         format: 'uuid',
         example: '550e8400-e29b-41d4-a716-446655440000'
       }
  } */
  /* #swagger.responses[200] = {
       description: '成功取得 Prompt 詳情',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             required: ['status', 'data'],
             properties: {
               status: { type: 'string', example: 'success' },
               data: { $ref: '#/components/schemas/Prompt' }
             }
           }
         }
       }
  }
  #swagger.responses[404] = {
       description: '找不到該 Prompt',
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
  promptController.getPromptById
);

router.post(
  '/:id/copy',
  /* #swagger.tags = ['Prompts']
     #swagger.summary = '增加 Prompt 複製使用次數'
     #swagger.description = '前台使用者複製 Prompt 時，將該 Prompt 的 API 欄位 copyCount 增加 1。此端點不需要登入。'
     #swagger.security = [] */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: 'Prompt ID (UUID)',
       required: true,
       '@schema': {
         type: 'string',
         format: 'uuid',
         example: '550e8400-e29b-41d4-a716-446655440000'
       }
  } */
  /* #swagger.responses[200] = {
       description: '複製次數已累加',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             required: ['status', 'message', 'data'],
             properties: {
               status: { type: 'string', example: 'success' },
               message: { type: 'string', example: '複製次數已累加' },
               data: {
                 type: 'object',
                 required: ['id', 'copyCount'],
                 properties: {
                   id: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
                   copyCount: { type: 'integer', example: 126 }
                 }
               }
             }
           }
         }
       }
  }
  #swagger.responses[404] = {
       description: '找不到該 Prompt 或 Prompt 尚未上架',
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
  promptController.incrementCopyCount
);

module.exports = router;
