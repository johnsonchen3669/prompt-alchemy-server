const express = require('express');
const router = express.Router();
const agentSkillController = require('../controllers/agentSkill.controller');

// 前台公開 Endpoint（無需 Token 即可存取，比照 prompt.routes.js 的權限模式）
router.get(
  '/',
  /* #swagger.tags = ['Agent Skills']
     #swagger.summary = '取得上架中的 Agent Skill 列表'
     #swagger.description = '前台會員與訪客瀏覽上架中的 Agent Skill，可搭配關鍵字或分類篩選。此端點不需要登入。'
     #swagger.security = [] */
  /* #swagger.parameters['keyword'] = {
       in: 'query',
       description: '關鍵字搜尋（名稱或簡介）',
       required: false,
       '@schema': {
         type: 'string',
         example: 'frontend'
       }
  }
  #swagger.parameters['categoryId'] = {
       in: 'query',
       description: '分類 ID (UUID)',
       required: false,
       '@schema': {
         type: 'string',
         format: 'uuid',
         example: '550e8400-e29b-41d4-a716-446655440000'
       }
  } */
  /* #swagger.responses[200] = {
       description: '成功取得 Agent Skill 列表',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             required: ['status', 'data'],
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
  agentSkillController.getAgentSkills
);

router.get(
  '/:id',
  /* #swagger.tags = ['Agent Skills']
     #swagger.summary = '取得單一 Agent Skill 詳細內容'
     #swagger.description = '前台會員與訪客取得指定上架 Agent Skill 的完整資訊。此端點不需要登入。'
     #swagger.security = [] */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: 'Agent Skill ID (UUID)',
       required: true,
       '@schema': {
         type: 'string',
         format: 'uuid',
         example: '550e8400-e29b-41d4-a716-446655440000'
       }
  } */
  /* #swagger.responses[200] = {
       description: '成功取得 Agent Skill 詳情',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             required: ['status', 'data'],
             properties: {
               status: { type: 'string', example: 'success' },
               data: { $ref: '#/components/schemas/AgentSkill' }
             }
           }
         }
       }
  }
  #swagger.responses[404] = {
       description: '找不到該 Agent Skill 或尚未上架',
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
  agentSkillController.getAgentSkillById
);

router.get(
  '/:id/install-command',
  /* #swagger.tags = ['Agent Skills']
     #swagger.summary = '依目標 agent 取得組合後的安裝指令'
     #swagger.description = '依 Agent Skill 的 installKind 與 supportedAgents 規則，組合可直接執行的安裝指令。支援 claude-code、codex 與 cursor。此端點不需要登入。'
     #swagger.security = [] */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: 'Agent Skill ID (UUID)',
       required: true,
       '@schema': {
         type: 'string',
         format: 'uuid',
         example: '550e8400-e29b-41d4-a716-446655440000'
       }
  }
  #swagger.parameters['agent'] = {
       in: 'query',
       description: '目標 agent',
       required: true,
       '@schema': {
         type: 'string',
         enum: ['claude-code', 'codex', 'cursor'],
         example: 'claude-code'
       }
  } */
  /* #swagger.responses[200] = {
       description: '成功組合安裝指令',
       content: {
         'application/json': {
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
                     items: { type: 'string', example: 'npx skills add anthropics/skills --skill frontend-design' }
                   }
                 }
               }
             }
           }
         }
       }
  }
  #swagger.responses[400] = {
       description: '不支援的目標 agent',
       content: {
         'application/json': {
           schema: { $ref: '#/components/schemas/ErrorResponse' }
         }
       }
  }
  #swagger.responses[404] = {
       description: '找不到該 Agent Skill 或尚未上架',
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
  agentSkillController.getInstallCommands
);

router.post(
  '/:id/copy',
  /* #swagger.tags = ['Agent Skills']
     #swagger.summary = '增加 Agent Skill 安裝指令複製次數'
     #swagger.description = '前台使用者複製 Agent Skill 安裝指令時，將該 Agent Skill 的 API 欄位 copyCount 增加 1。此端點不需要登入。'
     #swagger.security = [] */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: 'Agent Skill ID (UUID)',
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
       description: '找不到該 Agent Skill 或尚未上架',
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
  agentSkillController.incrementCopyCount
);

module.exports = router;
