const express = require('express');
const router = express.Router();
const adminSkillController = require('../../controllers/admin/skill.controller');
const { vertfyToken, isAdmin } = require('../../middlewares/authenticate');

router.use(vertfyToken, isAdmin);

router.get(
  '/',
  /* #swagger.tags = ['Admin Skills']
     #swagger.summary = '取得後台 Prompt 列表'
     #swagger.description = '後台管理者瀏覽所有 Prompt，可搭配關鍵字、內容類型、分類或啟用狀態篩選。'
     #swagger.security = [{ bearerAuth: [] }] */
  /* #swagger.parameters['keyword'] = {
       in: 'query',
       description: '依 title 或 intro 搜尋關鍵字',
       required: false,
       '@schema': { type: 'string' }
  }
  #swagger.parameters['contentTypeId'] = {
       in: 'query',
       description: '內容類型 ID (UUID)',
       required: false,
       '@schema': {
         type: 'string',
         format: 'uuid',
         example: '20000000-0000-4000-a000-000000000001'
       }
  }
  #swagger.parameters['categoryId'] = {
       in: 'query',
       description: '分類 ID (UUID)',
       required: false,
       '@schema': {
         type: 'string',
         format: 'uuid',
         example: '30000000-0000-4000-a000-000000000001'
       }
  }
  #swagger.parameters['active'] = {
       in: 'query',
       description: '啟用狀態篩選',
       required: false,
       '@schema': {
         type: 'string',
         enum: ['active', 'inactive']
       }
  } */
  /* #swagger.responses[200] = {
       description: '成功取得後台 Prompt 列表',
       content: {
         'application/json': {
           schema: {
             type: 'object',
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
  #swagger.responses[400] = { description: '查詢參數格式錯誤', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  #swagger.responses[401] = { description: '未登入或 Token 無效', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[403] = { description: '權限不足', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[500] = { description: '伺服器發生未預期的錯誤', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } } */
  adminSkillController.getSkills
);

router.get(
  '/:id',
  /* #swagger.tags = ['Admin Skills']
     #swagger.summary = '取得單筆後台 Prompt'
     #swagger.description = '後台管理者取得單一 Prompt 的完整資料，供編輯表單使用，包含已停用資料。'
     #swagger.security = [{ bearerAuth: [] }] */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: 'Prompt ID (UUID)',
       required: true,
       '@schema': {
         type: 'string',
         format: 'uuid',
         example: 'd7c92002-1925-4c0a-8933-203a9a9ebf0b'
       }
  } */
  /* #swagger.responses[200] = {
       description: '成功取得 Prompt 詳情',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               data: { $ref: '#/components/schemas/Prompt' }
             }
           }
         }
       }
  }
  #swagger.responses[400] = { description: 'Prompt ID 格式錯誤', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  #swagger.responses[401] = { description: '未登入或 Token 無效', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[403] = { description: '權限不足', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[404] = { description: '找不到 Prompt', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  #swagger.responses[500] = { description: '伺服器發生未預期的錯誤', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } } */
  adminSkillController.getSkillById
);

router.post(
  '/',
  /* #swagger.tags = ['Admin Skills']
     #swagger.summary = '新增 Prompt'
     #swagger.description = '後台管理者新增 Prompt。未提供的可選欄位會由 repository 使用空值或資料庫預設值處理。'
     #swagger.security = [{ bearerAuth: [] }] */
  /* #swagger.requestBody = {
       required: true,
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               title: { type: 'string', example: '新 Prompt 標題' },
               slug: { type: 'string', example: 'new-prompt-slug' },
               intro: { type: 'string', example: '簡介說明' },
               contentTypeId: { type: 'string', format: 'uuid', example: '20000000-0000-4000-a000-000000000001' },
               categoryId: { type: 'string', format: 'uuid', example: '30000000-0000-4000-a000-000000000001' },
               modelType: { type: 'array', items: { type: 'string' }, example: ['gpt-4o'] },
               tags: { type: 'array', items: { type: 'string' }, example: ['40000000-0000-4000-a000-000000000001'] },
               promptContent: { type: 'string', example: 'Prompt 詳細內容...' },
               useCase: { type: 'string', example: '使用場景說明' },
               exampleInput: { type: 'string', example: '範例輸入' },
               exampleOutput: { type: 'array', items: { type: 'object' }, example: [{ input: '問題', output: '回答' }] },
               sourceUrl: { type: 'string', format: 'uri', example: 'https://example.com/source' },
               isActive: { type: 'boolean', default: true, example: true }
             }
           }
         }
       }
  } */
  /* #swagger.responses[201] = {
       description: '成功新增 Prompt',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               data: { $ref: '#/components/schemas/Prompt' }
             }
           }
         }
       }
  }
  #swagger.responses[400] = { description: '請求格式錯誤或資料庫約束不符', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  #swagger.responses[401] = { description: '未登入或 Token 無效', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[403] = { description: '權限不足', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[500] = { description: '伺服器發生未預期的錯誤', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } } */
  adminSkillController.createSkill
);

router.put(
  '/:id',
  /* #swagger.tags = ['Admin Skills']
     #swagger.summary = '修改 Prompt'
     #swagger.description = '部分更新現有 Prompt 的可編輯欄位；未提供的欄位會維持原值。'
     #swagger.security = [{ bearerAuth: [] }] */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: 'Prompt ID (UUID)',
       required: true,
       '@schema': {
         type: 'string',
         format: 'uuid',
         example: 'd7c92002-1925-4c0a-8933-203a9a9ebf0b'
       }
  } */
  /* #swagger.requestBody = {
       required: true,
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               title: { type: 'string', example: '更新後的標題' },
               slug: { type: 'string', example: 'updated-prompt-slug' },
               intro: { type: 'string', example: '更新後的簡介' },
               contentTypeId: { type: 'string', format: 'uuid', example: '20000000-0000-4000-a000-000000000001' },
               categoryId: { type: 'string', format: 'uuid', example: '30000000-0000-4000-a000-000000000001' },
               modelType: { type: 'array', items: { type: 'string' } },
               tags: { type: 'array', items: { type: 'string' } },
               promptContent: { type: 'string', example: '更新後的 Prompt 內容' },
               useCase: { type: 'string', example: '更新後的使用場景' },
               exampleInput: { type: 'string', example: '更新後的範例輸入' },
               exampleOutput: { type: 'array', items: { type: 'object' } },
               sourceUrl: { type: 'string', format: 'uri', example: 'https://example.com/updated-source' },
               isActive: { type: 'boolean', example: false }
             }
           }
         }
       }
  } */
  /* #swagger.responses[200] = {
       description: '成功修改 Prompt',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               data: { $ref: '#/components/schemas/Prompt' }
             }
           }
         }
       }
  }
  #swagger.responses[400] = { description: '請求格式錯誤或資料庫約束不符', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  #swagger.responses[401] = { description: '未登入或 Token 無效', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[403] = { description: '權限不足', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[404] = { description: '找不到 Prompt', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  #swagger.responses[500] = { description: '伺服器發生未預期的錯誤', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } } */
  adminSkillController.updateSkill
);

module.exports = router;
