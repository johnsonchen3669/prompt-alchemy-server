const express = require('express');
const router = express.Router();
const promptController = require('../controllers/prompt.controller');

// 前台公開 Endpoint (無需 Token 即可存取)
router.get(
  '/',
  /* #swagger.tags = ['Prompts']
     #swagger.summary = '取得上架中的 Prompt 列表'
     #swagger.description = '前台會員與訪客瀏覽上架中 (isActive = true) 的 Prompt 列表，可搭配關鍵字搜尋、類別或標籤篩選。' */
  /* #swagger.parameters['category'] = {
       in: 'query',
       description: '分類 ID',
       required: false,
       type: 'string'
  } */
  /* #swagger.parameters['tag'] = {
       in: 'query',
       description: '標籤 ID',
       required: false,
       type: 'string'
  } */
  /* #swagger.parameters['search'] = {
       in: 'query',
       description: '關鍵字搜尋 (標題、簡介或內容)',
       required: false,
       type: 'string'
  } */
  /* #swagger.responses[200] = {
       description: '成功取得 Prompt 列表',
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
                     id: { type: 'string', format: 'uuid', example: 'd7c92002-1925-4c0a-8933-203a9a9ebf0b' },
                     title: { type: 'string', example: '後端 API 審查' },
                     slug: { type: 'string', example: 'backend-api-review' },
                     intro: { type: 'string', example: '檢查 Express / Next.js API 的錯誤處理、安全性與回傳結構。' },
                     contentTypeId: { type: 'string', example: '62891464-fb7e-4295-b544-a3b78936722b' },
                     modelType: { type: 'array', items: { type: 'string' } },
                     promptContent: { type: 'string', example: '請你扮演資深後端工程師...' },
                     useCase: { type: 'string', example: '程式碼審查' },
                     exampleInput: { type: 'string', example: 'router.post("/login", ...)' },
                     exampleOutput: { type: 'array', items: { type: 'object' } },
                     categoryId: { type: 'string', example: '5f40e0ac-86d0-4b9c-9573-351e9da96775' },
                     category: { type: 'string', example: '後端開發' },
                     tags: { type: 'array', items: { type: 'string' } },
                     sourceUrl: { type: 'string', example: 'https://example.com' },
                     copyCount: { type: 'integer', example: 125 },
                     favoriteCount: { type: 'integer', example: 32 },
                     isNew: { type: 'boolean', example: true },
                     isHot: { type: 'boolean', example: true },
                     isActive: { type: 'boolean', example: true },
                     createdAt: { type: 'string', format: 'date-time' },
                     updatedAt: { type: 'string', format: 'date-time' }
                   }
                 }
               }
             }
           }
         }
       }
  } */
  promptController.getPrompts
);

router.get(
  '/:id',
  /* #swagger.tags = ['Prompts']
     #swagger.summary = '取得單一 Prompt 詳細內容'
     #swagger.description = '前台會員與訪客點擊進入 Prompt 詳情頁時調用。' */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: 'Prompt ID (UUID)',
       required: true,
       type: 'string'
  } */
  /* #swagger.responses[200] = {
       description: '成功取得 Prompt 詳情',
       content: {
         "application/json": {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               data: {
                 type: 'object',
                 properties: {
                   id: { type: 'string', format: 'uuid', example: 'd7c92002-1925-4c0a-8933-203a9a9ebf0b' },
                   title: { type: 'string', example: '後端 API 審查' },
                   slug: { type: 'string', example: 'backend-api-review' },
                   intro: { type: 'string', example: '檢查 Express API 結構' },
                   promptContent: { type: 'string', example: '請你扮演資深後端工程師...' },
                   copyCount: { type: 'integer', example: 126 },
                   favoriteCount: { type: 'integer', example: 32 },
                   isActive: { type: 'boolean', example: true }
                 }
               }
             }
           }
         }
       }
    }
    #swagger.responses[404] = { description: '找不到該 Prompt' } */
  promptController.getPromptById
);

router.post(
  '/:id/copy',
  /* #swagger.tags = ['Prompts']
     #swagger.summary = '增加 Prompt 複製使用次數'
     #swagger.description = '前台使用者點擊一鍵複製 Prompt 時觸發，自動在資料庫內將 copy_count 累加 1。' */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: 'Prompt ID (UUID)',
       required: true,
       type: 'string'
  } */
  /* #swagger.responses[200] = {
       description: '複製次數已累加',
       content: {
         "application/json": {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               message: { type: 'string', example: '複製次數已累加' },
               data: {
                 type: 'object',
                 properties: {
                   id: { type: 'string', format: 'uuid', example: 'd7c92002-1925-4c0a-8933-203a9a9ebf0b' },
                   copyCount: { type: 'integer', example: 126 }
                 }
               }
             }
           }
         }
       }
    }
    #swagger.responses[404] = { description: '找不到該 Prompt 或未上架' } */
  promptController.incrementCopyCount
);

module.exports = router;
