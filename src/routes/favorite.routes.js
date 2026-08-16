const express = require('express');

const router = express.Router();

const favoriteController = require('../controllers/favorite.controller');
const { vertfyToken } = require('../middlewares/authenticate');

// 收藏功能全部綁定登入者身分，統一驗證 token
router.use(vertfyToken);

router.get(
  '/',
  /* #swagger.tags = ['Favorites']
     #swagger.summary = '取得我的收藏清單'
     #swagger.description = '取得目前登入者的收藏清單，依收藏時間由新到舊排序。itemType=prompt 時回傳 Prompt 資料，itemType=skill 時回傳 Agent Skill 資料；資料欄位維持目前 API 使用的 snake_case 命名。'
     #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['itemType'] = {
       in: 'query',
       description: '收藏項目類型；prompt（預設）代表 Prompt，skill 代表 Agent Skill。',
       required: false,
       '@schema': {
         type: 'string',
         enum: ['prompt', 'skill'],
         default: 'prompt',
         example: 'prompt'
       }
  } */
  /* #swagger.responses[200] = {
       description: '成功取得收藏清單',
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
                   oneOf: [
                     { $ref: '#/components/schemas/FavoritePromptItem' },
                     { $ref: '#/components/schemas/FavoriteSkillItem' }
                   ]
                 }
               }
             }
           }
         }
       }
  }
  #swagger.responses[400] = {
       description: 'itemType 不合法',
       content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
  }
  #swagger.responses[401] = {
       description: '未帶 token 或 token 失效',
       content: { "application/json": { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } }
  }
  #swagger.responses[500] = {
       description: '伺服器發生未預期的錯誤',
       content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
  } */
  favoriteController.getMyFavorites
);

router.delete(
  '/',
  /* #swagger.tags = ['Favorites']
     #swagger.summary = '清除我的所有收藏'
     #swagger.description = '移除目前登入者的所有收藏，並回傳清空後的收藏 ID 清單與受影響 Prompt 的 favorite count。此操作會刪除 Prompt 與 Agent Skill 兩種類型的收藏，但目前只重算受影響 Prompt 的收藏數。'
     #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.responses[200] = {
       description: '成功清除所有收藏',
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['status', 'data'],
             properties: {
               status: { type: 'string', example: 'success' },
               data: {
                 type: 'object',
                 required: ['favoriteIds', 'favoriteCounts'],
                 properties: {
                   favoriteIds: {
                     type: 'array',
                     items: { type: 'string', format: 'uuid' },
                     example: [],
                     description: '清除後的收藏 ID 清單，固定為空陣列。'
                   },
                   favoriteCounts: {
                     type: 'object',
                     additionalProperties: { type: 'integer' },
                     example: { '9fcf96a4-eb05-4d4a-b7e2-fdb4b2da87f6': 0 },
                     description: '受影響 Prompt 的收藏數，key 為 Prompt UUID。'
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
  #swagger.responses[404] = {
       description: '找不到登入者資料',
       content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
  }
  #swagger.responses[500] = {
       description: '伺服器發生未預期的錯誤',
       content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
  } */
  favoriteController.clearMyFavorites
);

router.get(
  '/:skillId/status',
  /* #swagger.tags = ['Favorites']
     #swagger.summary = '檢查收藏狀態'
     #swagger.description = '檢查目前登入者是否已收藏指定項目。路徑中的 skillId 會依 itemType 代表 Prompt UUID 或 Agent Skill UUID。'
     #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['skillId'] = {
       in: 'path',
       description: '收藏項目 ID；依 itemType 代表 Prompt 或 Agent Skill 的 UUID。',
       required: true,
       '@schema': {
         type: 'string',
         format: 'uuid',
         example: '9fcf96a4-eb05-4d4a-b7e2-fdb4b2da87f6'
       }
  }
  #swagger.parameters['itemType'] = {
       in: 'query',
       description: '收藏項目類型；prompt（預設）代表 Prompt，skill 代表 Agent Skill。',
       required: false,
       '@schema': {
         type: 'string',
         enum: ['prompt', 'skill'],
         default: 'prompt',
         example: 'prompt'
       }
  } */
  /* #swagger.responses[200] = {
       description: '成功取得收藏狀態',
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['status', 'data'],
             properties: {
               status: { type: 'string', example: 'success' },
               data: {
                 type: 'object',
                 required: ['isFavorited'],
                 properties: {
                   isFavorited: { type: 'boolean', example: true }
                 }
               }
             }
           }
         }
       }
  }
  #swagger.responses[400] = {
       description: 'itemType 或 ID 格式不合法',
       content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
  }
  #swagger.responses[401] = {
       description: '未帶 token 或 token 失效',
       content: { "application/json": { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } }
  }
  #swagger.responses[500] = {
       description: '伺服器發生未預期的錯誤',
       content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
  } */
  favoriteController.checkFavoriteStatus
);

router.post(
  '/:skillId/toggle',
  /* #swagger.tags = ['Favorites']
     #swagger.summary = '切換收藏狀態'
     #swagger.description = '切換指定項目的收藏狀態：未收藏時新增，已收藏時移除，並回傳切換後的狀態與該項目的收藏數。路徑中的 skillId 會依 itemType 代表 Prompt UUID 或 Agent Skill UUID。'
     #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['skillId'] = {
       in: 'path',
       description: '收藏項目 ID；依 itemType 代表 Prompt 或 Agent Skill 的 UUID。',
       required: true,
       '@schema': {
         type: 'string',
         format: 'uuid',
         example: '9fcf96a4-eb05-4d4a-b7e2-fdb4b2da87f6'
       }
  }
  #swagger.parameters['itemType'] = {
       in: 'query',
       description: '收藏項目類型；prompt（預設）代表 Prompt，skill 代表 Agent Skill。',
       required: false,
       '@schema': {
         type: 'string',
         enum: ['prompt', 'skill'],
         default: 'prompt',
         example: 'prompt'
       }
  } */
  /* #swagger.responses[200] = {
       description: '成功切換收藏狀態',
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['status', 'data'],
             properties: {
               status: { type: 'string', example: 'success' },
               data: {
                 type: 'object',
                 required: ['isFavorited', 'favoriteCount'],
                 properties: {
                   isFavorited: { type: 'boolean', example: true, description: '切換後的收藏狀態。' },
                   favoriteCount: { type: 'integer', example: 33, description: '該 Prompt 或 Agent Skill 重算後的收藏數。' }
                 }
               }
             }
           }
         }
       }
  }
  #swagger.responses[400] = {
       description: 'itemType 或 ID 格式不合法',
       content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
  }
  #swagger.responses[401] = {
       description: '未帶 token 或 token 失效',
       content: { "application/json": { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } }
  }
  #swagger.responses[404] = {
       description: '找不到指定的 Prompt 或 Agent Skill',
       content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
  }
  #swagger.responses[500] = {
       description: '伺服器發生未預期的錯誤',
       content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
  } */
  favoriteController.toggleFavorite
);

router.post(
  '/defaults',
  /* #swagger.tags = ['Favorites']
     #swagger.summary = '恢復預設收藏'
     #swagger.description = '清空目前登入者的所有收藏後，重新建立系統預設的 Prompt 收藏，並回傳恢復後的 Prompt ID 與受影響 Prompt 的收藏數。此操作目前只重算 Prompt 的收藏數。'
     #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.responses[200] = {
       description: '成功恢復預設收藏',
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['status', 'data'],
             properties: {
               status: { type: 'string', example: 'success' },
               data: {
                 type: 'object',
                 required: ['favoriteIds', 'favoriteCounts'],
                 properties: {
                   favoriteIds: {
                     type: 'array',
                     items: { type: 'string', format: 'uuid' },
                     example: ['9fcf96a4-eb05-4d4a-b7e2-fdb4b2da87f6'],
                     description: '恢復後的預設 Prompt UUID 清單。'
                   },
                   favoriteCounts: {
                     type: 'object',
                     additionalProperties: { type: 'integer' },
                     example: { '9fcf96a4-eb05-4d4a-b7e2-fdb4b2da87f6': 1 },
                     description: '受影響 Prompt 的收藏數，key 為 Prompt UUID。'
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
  #swagger.responses[404] = {
       description: '找不到登入者或預設 Prompt',
       content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
  }
  #swagger.responses[500] = {
       description: '伺服器發生未預期的錯誤',
       content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
  } */
  favoriteController.restoreDefaultFavorites
);

module.exports = router;
