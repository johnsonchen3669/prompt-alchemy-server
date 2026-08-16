const express = require('express');
const router = express.Router();
const agentSkillController = require('../../controllers/admin/agentSkill.controller');
const { vertfyToken, isAdmin } = require('../../middlewares/authenticate');

// 後台管理所有 Agent Skills 都需要驗證是否為 admin
router.use(vertfyToken, isAdmin);

router.get(
  '/',
  /* #swagger.tags = ['Admin Agent Skills']
     #swagger.summary = '取得後台 Agent Skill 列表'
     #swagger.description = '取得所有 Agent Skill，包含啟用與停用資料，可依關鍵字、分類或啟用狀態篩選。'
     #swagger.security = [{ bearerAuth: [] }] */
  /* #swagger.parameters['keyword'] = {
       in: 'query',
       description: '依名稱或簡介搜尋關鍵字',
       required: false,
       '@schema': { type: 'string' }
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
       description: '成功取得 Agent Skill 列表',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               data: {
                 type: 'array',
                 items: { $ref: '#/components/schemas/AgentSkill' }
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
  agentSkillController.getAgentSkills
);

router.get(
  '/:id',
  /* #swagger.tags = ['Admin Agent Skills']
     #swagger.summary = '取得單筆後台 Agent Skill'
     #swagger.description = '依 UUID 取得單一 Agent Skill 的完整管理資料，包含停用資料。'
     #swagger.security = [{ bearerAuth: [] }] */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: 'Agent Skill ID (UUID)',
       required: true,
       '@schema': {
         type: 'string',
         format: 'uuid',
         example: '70000000-0000-4000-a000-000000000001'
       }
  } */
  /* #swagger.responses[200] = {
       description: '成功取得 Agent Skill 詳情',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               data: { $ref: '#/components/schemas/AgentSkill' }
             }
           }
         }
       }
  }
  #swagger.responses[400] = { description: 'Agent Skill ID 格式錯誤', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  #swagger.responses[401] = { description: '未登入或 Token 無效', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[403] = { description: '權限不足', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[404] = { description: '找不到 Agent Skill', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  #swagger.responses[500] = { description: '伺服器發生未預期的錯誤', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } } */
  agentSkillController.getAgentSkillById
);

router.post(
  '/',
  /* #swagger.tags = ['Admin Agent Skills']
     #swagger.summary = '新增 Agent Skill'
     #swagger.description = '建立 Agent Skill。userId 由目前登入的 admin 自動設定；git_clone 的 supportedAgents 必須為空陣列，single_kit／full_package 必須至少指定一個 Agent，且 full_package 的 skillSlug 必須為 *。'
     #swagger.security = [{ bearerAuth: [] }] */
  /* #swagger.requestBody = {
       required: true,
       content: {
         'application/json': {
           schema: {
             type: 'object',
             required: ['name', 'repoOwner', 'repoName', 'skillSlug', 'categoryId', 'installKind'],
             properties: {
               name: { type: 'string', example: 'GitHub PR Reviewer' },
               description: { type: 'string', example: '協助審查 GitHub Pull Request。' },
               intro: { type: 'string', example: '自動分析程式碼變更並提出建議。' },
               repoOwner: { type: 'string', example: 'example-org' },
               repoName: { type: 'string', example: 'pr-reviewer' },
               skillSlug: { type: 'string', example: 'pr-reviewer' },
               creatorName: { type: 'string', example: 'Example Org' },
               creatorAvatarUrl: { type: 'string', format: 'uri', example: 'https://example.com/avatar.png' },
               creatorProfileUrl: { type: 'string', format: 'uri', example: 'https://github.com/example-org' },
               license: { type: 'string', example: 'MIT' },
               categoryId: { type: 'string', format: 'uuid', example: '30000000-0000-4000-a000-000000000001' },
               stargazersCount: { type: 'integer', minimum: 0, default: 0, example: 1250 },
               isActive: { type: 'boolean', default: true, example: true },
               installKind: { type: 'string', enum: ['full_package', 'single_kit', 'git_clone'], example: 'single_kit' },
               supportedAgents: {
                 type: 'array',
                 items: { type: 'string', enum: ['claude-code', 'codex', 'cursor'] },
                 example: ['claude-code', 'codex']
               },
               docUrl: { type: 'string', format: 'uri', example: 'https://github.com/example-org/pr-reviewer' }
             },
             oneOf: [
               {
                 title: 'git_clone',
                 properties: {
                   installKind: { type: 'string', enum: ['git_clone'] },
                   supportedAgents: { type: 'array', maxItems: 0 }
                 }
               },
               {
                 title: 'single_kit',
                 required: ['supportedAgents'],
                 properties: {
                   installKind: { type: 'string', enum: ['single_kit'] },
                   supportedAgents: { type: 'array', minItems: 1 }
                 }
               },
               {
                 title: 'full_package',
                 required: ['supportedAgents'],
                 properties: {
                   installKind: { type: 'string', enum: ['full_package'] },
                   skillSlug: { type: 'string', enum: ['*'] },
                   supportedAgents: { type: 'array', minItems: 1 }
                 }
               }
             ]
           }
         }
       }
  } */
  /* #swagger.responses[201] = {
       description: '成功新增 Agent Skill',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               data: { $ref: '#/components/schemas/AgentSkill' }
             }
           }
         }
       }
  }
  #swagger.responses[400] = { description: '請求格式錯誤或資料庫約束不符', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  #swagger.responses[401] = { description: '未登入或 Token 無效', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[403] = { description: '權限不足', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[500] = { description: '伺服器發生未預期的錯誤', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } } */
  agentSkillController.createAgentSkill
);

router.put(
  '/:id',
  /* #swagger.tags = ['Admin Agent Skills']
     #swagger.summary = '修改 Agent Skill'
     #swagger.description = '部分更新 Agent Skill 的基本資料與安裝設定；啟用狀態請使用專用 active endpoint。若變更 installKind，應在同一請求提供符合該模式的 supportedAgents；full_package 亦須同時將 skillSlug 設為 *。若只修改 skillSlug 或 supportedAgents，新值仍須符合資料中既有 installKind 的約束，否則回傳 400。'
     #swagger.security = [{ bearerAuth: [] }] */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: 'Agent Skill ID (UUID)',
       required: true,
       '@schema': {
         type: 'string',
         format: 'uuid',
         example: '70000000-0000-4000-a000-000000000001'
       }
  } */
  /* #swagger.requestBody = {
       required: true,
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               name: { type: 'string', example: '更新後的 Agent Skill' },
               description: { type: 'string', example: '更新後的描述。' },
               intro: { type: 'string', example: '更新後的簡介。' },
               repoOwner: { type: 'string', example: 'example-org' },
               repoName: { type: 'string', example: 'updated-skill' },
               skillSlug: { type: 'string', example: 'updated-skill', description: '有效 installKind 為 full_package 時必須是 *。' },
               creatorName: { type: 'string', example: 'Example Org' },
               creatorAvatarUrl: { type: 'string', format: 'uri' },
               creatorProfileUrl: { type: 'string', format: 'uri' },
               license: { type: 'string', example: 'MIT' },
               categoryId: { type: 'string', format: 'uuid', example: '30000000-0000-4000-a000-000000000001' },
               stargazersCount: { type: 'integer', minimum: 0, example: 1300 },
               installKind: { type: 'string', enum: ['full_package', 'single_kit', 'git_clone'] },
               supportedAgents: {
                 type: 'array',
                 items: { type: 'string', enum: ['claude-code', 'codex', 'cursor'] },
                 description: '有效 installKind 為 git_clone 時必須為空陣列，其餘模式至少需要一個 Agent。'
               },
               docUrl: { type: 'string', format: 'uri' }
             },
             oneOf: [
               {
                 title: '不變更 installKind',
                 not: { required: ['installKind'] }
               },
               {
                 title: '切換為 git_clone',
                 required: ['installKind', 'supportedAgents'],
                 properties: {
                   installKind: { type: 'string', enum: ['git_clone'] },
                   supportedAgents: { type: 'array', maxItems: 0 }
                 }
               },
               {
                 title: '切換為 single_kit',
                 required: ['installKind', 'supportedAgents'],
                 properties: {
                   installKind: { type: 'string', enum: ['single_kit'] },
                   supportedAgents: { type: 'array', minItems: 1 }
                 }
               },
               {
                 title: '切換為 full_package',
                 required: ['installKind', 'skillSlug', 'supportedAgents'],
                 properties: {
                   installKind: { type: 'string', enum: ['full_package'] },
                   skillSlug: { type: 'string', enum: ['*'] },
                   supportedAgents: { type: 'array', minItems: 1 }
                 }
               }
             ]
           }
         }
       }
  } */
  /* #swagger.responses[200] = {
       description: '成功修改 Agent Skill',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               data: { $ref: '#/components/schemas/AgentSkill' }
             }
           }
         }
       }
  }
  #swagger.responses[400] = { description: '請求格式錯誤或資料庫約束不符', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  #swagger.responses[401] = { description: '未登入或 Token 無效', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[403] = { description: '權限不足', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[404] = { description: '找不到 Agent Skill', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  #swagger.responses[500] = { description: '伺服器發生未預期的錯誤', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } } */
  agentSkillController.updateAgentSkill
);

router.patch(
  '/:id/active',
  /* #swagger.tags = ['Admin Agent Skills']
     #swagger.summary = '切換 Agent Skill 啟用狀態'
     #swagger.description = '啟用或停用指定 Agent Skill；isActive 必須是布林值。'
     #swagger.security = [{ bearerAuth: [] }] */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: 'Agent Skill ID (UUID)',
       required: true,
       '@schema': {
         type: 'string',
         format: 'uuid',
         example: '70000000-0000-4000-a000-000000000001'
       }
  } */
  /* #swagger.requestBody = {
       required: true,
       content: {
         'application/json': {
           schema: {
             type: 'object',
             required: ['isActive'],
             properties: {
               isActive: { type: 'boolean', example: false }
             }
           }
         }
       }
  } */
  /* #swagger.responses[200] = {
       description: '成功切換 Agent Skill 啟用狀態',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               data: { $ref: '#/components/schemas/AgentSkill' }
             }
           }
         }
       }
  }
  #swagger.responses[400] = { description: 'isActive 必須是布林值', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  #swagger.responses[401] = { description: '未登入或 Token 無效', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[403] = { description: '權限不足', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[404] = { description: '找不到 Agent Skill', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  #swagger.responses[500] = { description: '伺服器發生未預期的錯誤', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } } */
  agentSkillController.toggleActive
);

module.exports = router;
