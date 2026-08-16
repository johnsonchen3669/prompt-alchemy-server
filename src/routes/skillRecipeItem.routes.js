const express = require('express');

const router = express.Router();

const skillRecipeController = require('../controllers/skillRecipe.controller');
const { vertfyToken } = require('../middlewares/authenticate');

router.use(vertfyToken);

router.get(
  '/',
  /* #swagger.tags = ['Recipes']
     #swagger.summary = '取得我的 Recipe 項目對照表'
     #swagger.description = '取得目前登入者所有 Recipe 與收藏項目的關聯，回傳每筆關聯的 Recipe UUID 與 favorite ID，供收藏清單標示項目所屬 Recipe。'
     #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.responses[200] = {
       description: '成功取得 Recipe 項目對照表',
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['status', 'data'],
             properties: {
               status: { type: 'string', example: 'success' },
               data: {
                 type: 'array',
                 items: {
                   type: 'object',
                   required: ['recipe_id', 'favorite_id'],
                   properties: {
                     recipe_id: {
                       type: 'string',
                       format: 'uuid',
                       example: '5c6f0f6c-1ab8-4b35-8b4c-5f438b0a7a9e'
                     },
                     favorite_id: {
                       description: '收藏 ID；PGlite 回傳 number，PostgreSQL/pg 預設回傳十進位字串。',
                       oneOf: [
                         { type: 'integer', format: 'int64', example: 42 },
                         { type: 'string', pattern: '^[0-9]+$', example: '42' }
                       ]
                     }
                   }
                 }
               }
             }
           }
         }
       }
  }
  #swagger.responses[401] = {
       description: '未帶 token 或 token 失效',
       content: { "application/json": { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } }
  }
  #swagger.responses[500] = {
       description: '伺服器發生未預期的錯誤',
       content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
  } */
  skillRecipeController.listMyRecipeItems
);

module.exports = router;
