const express = require('express');

const router = express.Router();

const skillRecipeController = require('../controllers/skillRecipe.controller');
const { vertfyToken } = require('../middlewares/authenticate');

// Recipe 功能全部綁定登入者身分，統一驗證 token
router.use(vertfyToken);

router.get(
  '/',
  /* #swagger.tags = ['Recipes']
     #swagger.summary = '取得我的 Recipe 清單'
     #swagger.description = '取得目前登入者擁有的所有 Recipe，依建立時間由新到舊排序。'
     #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.responses[200] = {
       description: '成功取得 Recipe 清單',
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['status', 'data'],
             properties: {
               status: { type: 'string', example: 'success' },
               data: {
                 type: 'array',
                 items: { $ref: '#/components/schemas/Recipe' }
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
  skillRecipeController.listMyRecipes
);

router.post(
  '/',
  /* #swagger.tags = ['Recipes']
     #swagger.summary = '建立 Recipe'
     #swagger.description = '為目前登入者建立一個 Recipe。name 會先去除前後空白，不能是空字串。'
     #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['name'],
             properties: {
               name: { type: 'string', minLength: 1, example: '我的部署工具集', description: 'Recipe 名稱。' }
             }
           }
         }
       }
  } */
  /* #swagger.responses[201] = {
       description: '成功建立 Recipe',
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['status', 'data'],
             properties: {
               status: { type: 'string', example: 'success' },
               data: { $ref: '#/components/schemas/Recipe' }
             }
           }
         }
       }
  }
  #swagger.responses[400] = {
       description: 'Recipe 名稱缺失或為空白',
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
  skillRecipeController.createRecipe
);

router.get(
  '/:id',
  /* #swagger.tags = ['Recipes']
     #swagger.summary = '取得 Recipe 詳情'
     #swagger.description = '取得目前登入者指定 Recipe 的資料，並附上其中已加入的 Agent Skill 項目。'
     #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: 'Recipe UUID。',
       required: true,
       '@schema': {
         type: 'string',
         format: 'uuid',
         example: '5c6f0f6c-1ab8-4b35-8b4c-5f438b0a7a9e'
       }
  } */
  /* #swagger.responses[200] = {
       description: '成功取得 Recipe 詳情',
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['status', 'data'],
             properties: {
               status: { type: 'string', example: 'success' },
               data: {
                 allOf: [
                   { $ref: '#/components/schemas/Recipe' },
                   {
                     type: 'object',
                     required: ['items'],
                     properties: {
                       items: {
                         type: 'array',
                         items: { $ref: '#/components/schemas/RecipeItem' }
                       }
                     }
                   }
                 ]
               }
             }
           }
         }
       }
  }
  #swagger.responses[400] = {
       description: 'Recipe ID 格式錯誤',
       content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
  }
  #swagger.responses[401] = {
       description: '未帶 token 或 token 失效',
       content: { "application/json": { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } }
  }
  #swagger.responses[404] = {
       description: '找不到指定的 Recipe，或該 Recipe 不屬於目前登入者',
       content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
  }
  #swagger.responses[500] = {
       description: '伺服器發生未預期的錯誤',
       content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
  } */
  skillRecipeController.getRecipeDetail
);

router.patch(
  '/:id',
  /* #swagger.tags = ['Recipes']
     #swagger.summary = '重新命名 Recipe'
     #swagger.description = '更新目前登入者指定 Recipe 的名稱。name 會先去除前後空白，不能是空字串。'
     #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: 'Recipe UUID。',
       required: true,
       '@schema': {
         type: 'string',
         format: 'uuid',
         example: '5c6f0f6c-1ab8-4b35-8b4c-5f438b0a7a9e'
       }
  }
  #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['name'],
             properties: {
               name: { type: 'string', minLength: 1, example: '更新後的工具集', description: 'Recipe 新名稱。' }
             }
           }
         }
       }
  } */
  /* #swagger.responses[200] = {
       description: '成功重新命名 Recipe',
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['status', 'data'],
             properties: {
               status: { type: 'string', example: 'success' },
               data: { $ref: '#/components/schemas/Recipe' }
             }
           }
         }
       }
  }
  #swagger.responses[400] = {
       description: 'Recipe 名稱缺失或為空白',
       content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
  }
  #swagger.responses[401] = {
       description: '未帶 token 或 token 失效',
       content: { "application/json": { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } }
  }
  #swagger.responses[404] = {
       description: '找不到指定的 Recipe，或該 Recipe 不屬於目前登入者',
       content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
  }
  #swagger.responses[500] = {
       description: '伺服器發生未預期的錯誤',
       content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
  } */
  skillRecipeController.renameRecipe
);

router.patch(
  '/:id/last-selected-agent',
  /* #swagger.tags = ['Recipes']
     #swagger.summary = '更新 Recipe 的預設 Agent'
     #swagger.description = '記錄目前登入者在指定 Recipe 的安裝指令頁選用的目標 Agent，供之後讀取 Recipe 時作為上次選擇。'
     #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: 'Recipe UUID。',
       required: true,
       '@schema': {
         type: 'string',
         format: 'uuid',
         example: '5c6f0f6c-1ab8-4b35-8b4c-5f438b0a7a9e'
       }
  }
  #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['agent'],
             properties: {
               agent: {
                 type: 'string',
                 enum: ['claude-code', 'codex', 'cursor'],
                 example: 'claude-code',
                 description: '目標 Agent。'
               }
             }
           }
         }
       }
  } */
  /* #swagger.responses[200] = {
       description: '成功更新 Recipe 的預設 Agent',
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['status', 'data'],
             properties: {
               status: { type: 'string', example: 'success' },
               data: { $ref: '#/components/schemas/Recipe' }
             }
           }
         }
       }
  }
  #swagger.responses[400] = {
       description: '不支援的 Agent 或請求格式錯誤',
       content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
  }
  #swagger.responses[401] = {
       description: '未帶 token 或 token 失效',
       content: { "application/json": { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } }
  }
  #swagger.responses[404] = {
       description: '找不到指定的 Recipe，或該 Recipe 不屬於目前登入者',
       content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
  }
  #swagger.responses[500] = {
       description: '伺服器發生未預期的錯誤',
       content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
  } */
  skillRecipeController.updateLastSelectedAgent
);

router.delete(
  '/:id',
  /* #swagger.tags = ['Recipes']
     #swagger.summary = '刪除 Recipe'
     #swagger.description = '刪除目前登入者指定的 Recipe；其 Recipe 項目關聯會一併移除，但不會刪除原本的收藏。'
     #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: 'Recipe UUID。',
       required: true,
       '@schema': {
         type: 'string',
         format: 'uuid',
         example: '5c6f0f6c-1ab8-4b35-8b4c-5f438b0a7a9e'
       }
  } */
  /* #swagger.responses[200] = {
       description: '成功刪除 Recipe',
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['status', 'data'],
             properties: {
               status: { type: 'string', example: 'success' },
               data: {
                 type: 'object',
                 required: ['id', 'deleted'],
                 properties: {
                   id: { type: 'string', format: 'uuid', example: '5c6f0f6c-1ab8-4b35-8b4c-5f438b0a7a9e' },
                   deleted: { type: 'boolean', example: true }
                 }
               }
             }
           }
         }
       }
  }
  #swagger.responses[400] = {
       description: 'Recipe ID 格式錯誤',
       content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
  }
  #swagger.responses[401] = {
       description: '未帶 token 或 token 失效',
       content: { "application/json": { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } }
  }
  #swagger.responses[404] = {
       description: '找不到指定的 Recipe，或該 Recipe 不屬於目前登入者',
       content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
  }
  #swagger.responses[500] = {
       description: '伺服器發生未預期的錯誤',
       content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
  } */
  skillRecipeController.deleteRecipe
);

router.get(
  '/:id/install-command',
  /* #swagger.tags = ['Recipes']
     #swagger.summary = '取得 Recipe 的安裝指令'
     #swagger.description = '依指定目標 Agent 將 Recipe 內的 Agent Skill 組合成可執行的安裝指令清單；沒有符合條件的項目時回傳空陣列。'
     #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: 'Recipe UUID。',
       required: true,
       '@schema': {
         type: 'string',
         format: 'uuid',
         example: '5c6f0f6c-1ab8-4b35-8b4c-5f438b0a7a9e'
       }
  }
  #swagger.parameters['agent'] = {
       in: 'query',
       description: '安裝指令的目標 Agent。',
       required: true,
       '@schema': {
         type: 'string',
         enum: ['claude-code', 'codex', 'cursor'],
         example: 'claude-code'
       }
  } */
  /* #swagger.responses[200] = {
       description: '成功取得安裝指令',
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['status', 'data'],
             properties: {
               status: { type: 'string', example: 'success' },
               data: {
                 type: 'object',
                 required: ['commands'],
                 properties: {
                   commands: {
                     type: 'array',
                     items: { type: 'string' },
                     example: ['npx skills add acme/example-skill --skill review -a claude-code']
                   }
                 }
               }
             }
           }
         }
       }
  }
  #swagger.responses[400] = {
       description: '不支援的 Agent 或請求格式錯誤',
       content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
  }
  #swagger.responses[401] = {
       description: '未帶 token 或 token 失效',
       content: { "application/json": { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } }
  }
  #swagger.responses[404] = {
       description: '找不到指定的 Recipe，或該 Recipe 不屬於目前登入者',
       content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
  }
  #swagger.responses[500] = {
       description: '伺服器發生未預期的錯誤',
       content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
  } */
  skillRecipeController.getInstallCommands
);

router.post(
  '/:id/items',
  /* #swagger.tags = ['Recipes']
     #swagger.summary = '將收藏的 Agent Skill 加入 Recipe'
     #swagger.description = '將目前登入者已收藏的 Agent Skill 加入指定 Recipe；若 favoriteId 不屬於目前登入者的 Agent Skill 收藏，則回傳找不到資料。'
     #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: 'Recipe UUID。',
       required: true,
       '@schema': {
         type: 'string',
         format: 'uuid',
         example: '5c6f0f6c-1ab8-4b35-8b4c-5f438b0a7a9e'
       }
  }
  #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['favoriteId'],
             properties: {
               favoriteId: {
                 description: '目前登入者的 Agent Skill favorite ID；可使用 int64 number 或十進位字串。',
                 oneOf: [
                   { type: 'integer', format: 'int64', example: 42 },
                   { type: 'string', pattern: '^[0-9]+$', example: '42' }
                 ]
               }
             }
           }
         }
       }
  } */
  /* #swagger.responses[201] = {
       description: '成功將收藏的 Agent Skill 加入 Recipe',
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['status', 'data'],
             properties: {
               status: { type: 'string', example: 'success' },
               data: {
                 type: 'array',
                 items: { $ref: '#/components/schemas/RecipeItem' }
               }
             }
           }
         }
       }
  }
  #swagger.responses[400] = {
       description: 'favoriteId 格式錯誤或請求格式錯誤',
       content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
  }
  #swagger.responses[401] = {
       description: '未帶 token 或 token 失效',
       content: { "application/json": { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } }
  }
  #swagger.responses[404] = {
       description: '找不到指定的 Recipe、Recipe 不屬於目前登入者，或收藏不存在',
       content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
  }
  #swagger.responses[500] = {
       description: '伺服器發生未預期的錯誤',
       content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
  } */
  skillRecipeController.addItem
);

router.delete(
  '/:id/items/:favoriteId',
  /* #swagger.tags = ['Recipes']
     #swagger.summary = '從 Recipe 移除項目'
     #swagger.description = '從目前登入者指定的 Recipe 移除一個收藏項目；此操作只移除 Recipe 關聯，不會取消原本的收藏。'
     #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: 'Recipe UUID。',
       required: true,
       '@schema': {
         type: 'string',
         format: 'uuid',
         example: '5c6f0f6c-1ab8-4b35-8b4c-5f438b0a7a9e'
       }
  }
  #swagger.parameters['favoriteId'] = {
       in: 'path',
       description: '收藏項目 ID。',
       required: true,
       '@schema': {
         type: 'string',
         pattern: '^[0-9]+$',
         example: '42',
         description: '收藏 ID 的十進位字串。'
       }
  } */
  /* #swagger.responses[200] = {
       description: '成功從 Recipe 移除項目',
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['status', 'data'],
             properties: {
               status: { type: 'string', example: 'success' },
               data: {
                 type: 'array',
                 items: { $ref: '#/components/schemas/RecipeItem' }
               }
             }
           }
         }
       }
  }
  #swagger.responses[400] = {
       description: 'favoriteId 或 Recipe ID 格式錯誤',
       content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
  }
  #swagger.responses[401] = {
       description: '未帶 token 或 token 失效',
       content: { "application/json": { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } }
  }
  #swagger.responses[404] = {
       description: '找不到指定的 Recipe，或該 Recipe 不屬於目前登入者',
       content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
  }
  #swagger.responses[500] = {
       description: '伺服器發生未預期的錯誤',
       content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
  } */
  skillRecipeController.removeItem
);

module.exports = router;
