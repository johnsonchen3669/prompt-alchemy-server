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
     #swagger.description = '取得目前登入者的收藏 Prompt/Skill 完整資料，依收藏時間新到舊排序。回傳欄位為資料庫原始 snake_case 命名，並額外帶出 favorited_at、sort_order、category_name。'
     #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['itemType'] = {
       in: 'query',
       description: '收藏項目類型，允許的值：prompt（預設）、skill。skill 時回傳收藏的 Agent Skill 完整資料，不是 Prompt。',
       required: false,
       type: 'string'
  } */
  /* #swagger.responses[200] = {
       description: '成功取得收藏清單',
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
                     id: { type: 'string', format: 'uuid', example: '9fcf96a4-eb05-4d4a-b7e2-fdb4b2da87f6' },
                     title: { type: 'string', example: '後端 API 審查' },
                     slug: { type: 'string', example: 'backend-api-review' },
                     intro: { type: 'string', example: '檢查 Express / Next.js API 的錯誤處理、安全性與回傳結構。' },
                     content_type_id: { type: 'string', format: 'uuid', example: '62891464-fb7e-4295-b544-a3b78936722b' },
                     model_type: { type: 'array', items: { type: 'string' } },
                     prompt_content: { type: 'string', example: '請你扮演資深後端工程師...' },
                     use_case: { type: 'string', example: '程式碼審查' },
                     example_input: { type: 'string', example: 'router.post("/login", ...)' },
                     example_output: { type: 'array', items: { type: 'object' } },
                     category_id: { type: 'string', format: 'uuid', example: '5f40e0ac-86d0-4b9c-9573-351e9da96775' },
                     tags: { type: 'array', items: { type: 'string' } },
                     source_url: { type: 'string', example: 'https://example.com' },
                     copy_count: { type: 'integer', example: 125 },
                     favorite_count: { type: 'integer', example: 32 },
                     is_active: { type: 'boolean', example: true },
                     created_at: { type: 'string', format: 'date-time' },
                     updated_at: { type: 'string', format: 'date-time' },
                     favorited_at: { type: 'string', format: 'date-time', description: '加入收藏的時間' },
                     sort_order: { type: 'integer', example: 0, description: '收藏排序權重' },
                     category_name: { type: 'string', example: '後端開發', description: '分類名稱（JOIN parameters 取得）' }
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
       schema: { status: 'false', message: '請先登入' }
    } */
  favoriteController.getMyFavorites
);

router.delete(
  '/',
  /* #swagger.tags = ['Favorites']
     #swagger.summary = '清除我的所有收藏'
     #swagger.description = '一次移除目前登入者的所有收藏，並重新計算受影響 Prompt/Skill 的 favorite_count。'
     #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.responses[200] = {
       description: '成功清除所有收藏',
       content: {
         "application/json": {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               data: {
                 type: 'object',
                 properties: {
                   favoriteIds: {
                     type: 'array',
                     items: { type: 'string', format: 'uuid' },
                     description: '清除後的收藏 ID 清單，必為空陣列',
                     example: []
                   },
                   favoriteCounts: {
                     type: 'object',
                     description: '受影響 Prompt/Skill 重算後的收藏數，key 為 skillId',
                     additionalProperties: { type: 'integer' },
                     example: { '9fcf96a4-eb05-4d4a-b7e2-fdb4b2da87f6': 31 }
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
       schema: { status: 'false', message: '請先登入' }
    } */
  favoriteController.clearMyFavorites
);

router.get(
  '/:skillId/status',
  /* #swagger.tags = ['Favorites']
     #swagger.summary = '檢查單一 Skill 是否已收藏'
     #swagger.description = '前台進入 Prompt 詳情頁時，確認目前登入者是否已收藏該筆資料。'
     #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['skillId'] = {
       in: 'path',
       description: 'Prompt ID，或 itemType=skill 時的 Agent Skill ID (UUID)',
       required: true,
       type: 'string'
  } */
  /* #swagger.parameters['itemType'] = {
       in: 'query',
       description: '收藏項目類型，允許的值：prompt（預設）、skill。',
       required: false,
       type: 'string'
  } */
  /* #swagger.responses[200] = {
       description: '成功取得收藏狀態',
       content: {
         "application/json": {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               data: {
                 type: 'object',
                 properties: {
                   isFavorited: { type: 'boolean', example: true }
                 }
               }
             }
           }
         }
       }
    }
    #swagger.responses[401] = {
       description: '未帶 token 或 token 失效',
       schema: { status: 'false', message: '請先登入' }
    } */
  favoriteController.checkFavoriteStatus
);

router.post(
  '/:skillId/toggle',
  /* #swagger.tags = ['Favorites']
     #swagger.summary = '切換收藏狀態（新增/取消）'
     #swagger.description = '同一支端點切換收藏：原本未收藏則新增、已收藏則取消，並回傳切換後的狀態與該筆資料重算後的收藏數。'
     #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['skillId'] = {
       in: 'path',
       description: 'Prompt ID，或 itemType=skill 時的 Agent Skill ID (UUID)',
       required: true,
       type: 'string'
  } */
  /* #swagger.parameters['itemType'] = {
       in: 'query',
       description: '收藏項目類型，允許的值：prompt（預設）、skill。skill 時同步反映 agent_skill.favorite_count，不影響 Prompt 的 favorite_count。',
       required: false,
       type: 'string'
  } */
  /* #swagger.responses[200] = {
       description: '成功切換收藏狀態',
       content: {
         "application/json": {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               data: {
                 type: 'object',
                 properties: {
                   isFavorited: { type: 'boolean', example: true, description: '切換後的收藏狀態' },
                   favoriteCount: { type: 'integer', example: 33, description: '該筆資料重算後的收藏數' }
                 }
               }
             }
           }
         }
       }
    }
    #swagger.responses[401] = {
       description: '未帶 token 或 token 失效',
       schema: { status: 'false', message: '請先登入' }
    } */
  favoriteController.toggleFavorite
);

router.post(
  '/defaults',
  /* #swagger.tags = ['Favorites']
     #swagger.summary = '恢復預設收藏'
     #swagger.description = '清空目前登入者的收藏後，重新寫入 src/config/favorite.config.js 定義的 DEFAULT_FAVORITE_SKILL_IDS 預設收藏。'
     #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.responses[200] = {
       description: '成功恢復預設收藏',
       content: {
         "application/json": {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               data: {
                 type: 'object',
                 properties: {
                   favoriteIds: {
                     type: 'array',
                     items: { type: 'string', format: 'uuid' },
                     description: '恢復後的預設收藏 ID 清單',
                     example: ['9fcf96a4-eb05-4d4a-b7e2-fdb4b2da87f6', '6d56531f-a28f-4ebe-977f-5d6222cab34e']
                   },
                   favoriteCounts: {
                     type: 'object',
                     description: '受影響 Prompt/Skill 重算後的收藏數，key 為 skillId',
                     additionalProperties: { type: 'integer' },
                     example: { '9fcf96a4-eb05-4d4a-b7e2-fdb4b2da87f6': 32 }
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
       schema: { status: 'false', message: '請先登入' }
    } */
  favoriteController.restoreDefaultFavorites
);

module.exports = router;
