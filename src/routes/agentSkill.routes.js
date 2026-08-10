const express = require('express');
const router = express.Router();
const agentSkillController = require('../controllers/agentSkill.controller');

// 前台公開 Endpoint（無需 Token 即可存取，比照 prompt.routes.js 的權限模式）
router.get(
  '/',
  /* #swagger.tags = ['Agent Skills']
     #swagger.summary = '取得上架中的 Agent Skill 列表'
     #swagger.description = '前台會員與訪客瀏覽上架中 (isActive = true) 的 Agent Skill 列表，可搭配關鍵字搜尋或分類篩選。' */
  /* #swagger.parameters['keyword'] = {
       in: 'query',
       description: '關鍵字搜尋（名稱、簡介）',
       required: false,
       type: 'string'
  } */
  /* #swagger.parameters['categoryId'] = {
       in: 'query',
       description: '分類 ID',
       required: false,
       type: 'string'
  } */
  /* #swagger.responses[200] = {
       description: '成功取得 Agent Skill 列表',
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
                     id: { type: 'string', format: 'uuid' },
                     name: { type: 'string', example: 'frontend-design' },
                     description: { type: 'string' },
                     intro: { type: 'string' },
                     repoOwner: { type: 'string', example: 'anthropics' },
                     repoName: { type: 'string', example: 'skills' },
                     skillSlug: { type: 'string', example: 'frontend-design' },
                     creatorName: { type: 'string' },
                     creatorAvatarUrl: { type: 'string' },
                     creatorProfileUrl: { type: 'string' },
                     license: { type: 'string' },
                     categoryId: { type: 'string', format: 'uuid' },
                     category: { type: 'string', example: '前端開發' },
                     stargazersCount: { type: 'integer', example: 167174 },
                     copyCount: { type: 'integer', example: 0 },
                     favoriteCount: { type: 'integer', example: 0 },
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
  agentSkillController.getAgentSkills
);

router.get(
  '/:id',
  /* #swagger.tags = ['Agent Skills']
     #swagger.summary = '取得單一 Agent Skill 詳細內容'
     #swagger.description = '前台會員與訪客點擊進入 Agent Skill 詳情頁時調用。' */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: 'Agent Skill ID (UUID)',
       required: true,
       type: 'string'
  } */
  /* #swagger.responses[404] = { description: '找不到該 Agent Skill' } */
  agentSkillController.getAgentSkillById
);

router.post(
  '/:id/copy',
  /* #swagger.tags = ['Agent Skills']
     #swagger.summary = '增加 Agent Skill 安裝指令複製次數'
     #swagger.description = '前台使用者複製安裝指令（npx skills add ...）時觸發，自動在資料庫內將 copy_count 累加 1。' */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: 'Agent Skill ID (UUID)',
       required: true,
       type: 'string'
  } */
  /* #swagger.responses[404] = { description: '找不到該 Agent Skill 或未上架' } */
  agentSkillController.incrementCopyCount
);

module.exports = router;
