const express = require('express');
const router = express.Router();
const adminSkillController = require('../../controllers/admin/skill.controller');
const { vertfyToken, isAdmin } = require('../../middlewares/authenticate');

router.use(vertfyToken, isAdmin);

router.get(
  '/',
  /* #swagger.tags = ['Admin Skills']
     #swagger.summary = '取得後台 Prompt 列表'
     #swagger.description = '後台管理者瀏覽所有 Prompt/Skill，可搭配關鍵字、資料類型、分類或啟用狀態篩選。' */
  /* #swagger.parameters['keyword'] = {
       in: 'query',
       description: '關鍵字搜尋',
       required: false,
       type: 'string'
  } */
  /* #swagger.parameters['contentTypeId'] = {
       in: 'query',
       description: '資料類型 ID',
       required: false,
       type: 'string'
  } */
  /* #swagger.parameters['categoryId'] = {
       in: 'query',
       description: '分類 ID',
       required: false,
       type: 'string'
  } */
  /* #swagger.parameters['active'] = {
       in: 'query',
       description: '啟用狀態篩選，允許的值：active（僅看啟用）、inactive（僅看未啟用）',
       required: false,
       type: 'string'
  } */
  /* #swagger.responses[200] = {
       description: '成功取得後台 Prompt 列表',
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
                     intro: { type: 'string', example: '簡介說明' },
                     contentTypeId: { type: 'string', example: 'ct-1' },
                     categoryId: { type: 'string', example: 'cat-1' },
                     tags: { type: 'array', items: { type: 'string' } },
                     isActive: { type: 'boolean', example: true },
                     copyCount: { type: 'integer', example: 15 },
                     favoriteCount: { type: 'integer', example: 42 },
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
  adminSkillController.getSkills
);

router.get(
  '/:id',
  /* #swagger.tags = ['Admin Skills']
     #swagger.summary = '取得單筆後台 Prompt'
     #swagger.description = '後台管理者取得單一 Prompt/Skill 的完整資料，供編輯表單使用。' */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: 'Prompt ID (UUID)',
       required: true,
       type: 'string'
  } */
  /* #swagger.responses[200] = {
       description: '成功取得 Prompt 詳情'
    }
    #swagger.responses[404] = { description: '找不到資料' } */
  adminSkillController.getSkillById
);

router.post(
  '/',
  /* #swagger.tags = ['Admin Skills']
     #swagger.summary = '新增 Prompt'
     #swagger.description = '後台管理者新增 Prompt/Skill。' */
  /* #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['title', 'slug', 'contentTypeId', 'categoryId', 'promptContent'],
             properties: {
               title: { type: 'string', example: '新 Prompt 標題' },
               slug: { type: 'string', example: 'new-prompt-slug' },
               intro: { type: 'string', example: '簡介說明' },
               contentTypeId: { type: 'string', example: 'ct-1' },
               categoryId: { type: 'string', example: 'cat-1' },
               modelType: { type: 'array', items: { type: 'string' } },
               tags: { type: 'array', items: { type: 'string' } },
               promptContent: { type: 'string', example: 'Prompt 詳細內容...' },
               useCase: { type: 'string', example: '使用場景說明' },
               exampleInput: { type: 'string', example: '範例輸入' },
               exampleOutput: { type: 'array', items: { type: 'object' } },
               isActive: { type: 'boolean', example: true }
             }
           }
         }
       }
  } */
  /* #swagger.responses[201] = { description: '成功新增 Prompt' } */
  adminSkillController.createSkill
);

router.put(
  '/:id',
  /* #swagger.tags = ['Admin Skills']
     #swagger.summary = '修改 Prompt'
     #swagger.description = '修改現有 Prompt/Skill 的資料（同新增欄位，支援部分或完整更新）。' */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: 'Prompt ID (UUID)',
       required: true,
       type: 'string'
  } */
  /* #swagger.responses[200] = {
       description: '成功修改 Prompt'
    }
    #swagger.responses[404] = { description: '找不到資料' } */
  adminSkillController.updateSkill
);

module.exports = router;
