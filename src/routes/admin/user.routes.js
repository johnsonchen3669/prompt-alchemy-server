const express = require('express');
const router = express.Router();
const adminUserController = require('../../controllers/admin/user.controller');
const { vertfyToken, isAdmin } = require('../../middlewares/authenticate');

router.use(vertfyToken, isAdmin);

router.get(
  '/',
  /* #swagger.tags = ['Admin Users']
     #swagger.summary = '取得會員清單'
     #swagger.description = '後台管理者取得會員清單，可依角色篩選；回應不包含 passwordHash。'
     #swagger.security = [{ bearerAuth: [] }] */
  /* #swagger.parameters['role'] = {
       in: 'query',
       description: '角色篩選',
       required: false,
       '@schema': {
         type: 'string',
         enum: ['member', 'admin']
       }
  } */
  /* #swagger.responses[200] = {
       description: '成功取得會員清單',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               data: {
                 type: 'array',
                 items: { $ref: '#/components/schemas/User' }
               }
             }
           }
         }
       }
  }
  #swagger.responses[400] = { description: '角色篩選格式錯誤', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  #swagger.responses[401] = { description: '未登入或 Token 無效', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[403] = { description: '權限不足', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[500] = { description: '伺服器發生未預期的錯誤', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } } */
  adminUserController.getUsers
);

router.put(
  '/:id',
  /* #swagger.tags = ['Admin Users']
     #swagger.summary = '修改會員資訊'
     #swagger.description = '後台管理者修改會員的 name、role 或 isActive；未提供的欄位會由現有 repository 行為處理。'
     #swagger.security = [{ bearerAuth: [] }] */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: '會員 ID (UUID)',
       required: true,
       '@schema': {
         type: 'string',
         format: 'uuid',
         example: '10000000-0000-4000-a000-000000000001'
       }
  } */
  /* #swagger.requestBody = {
       required: true,
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               name: { type: 'string', example: '修改後的名稱' },
               role: { type: 'string', enum: ['member', 'admin'], example: 'member' },
               isActive: { type: 'boolean', example: true }
             }
           }
         }
       }
  } */
  /* #swagger.responses[200] = {
       description: '成功修改會員資訊',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               data: { $ref: '#/components/schemas/User' }
             }
           }
         }
       }
  }
  #swagger.responses[400] = { description: '請求格式錯誤', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  #swagger.responses[401] = { description: '未登入或 Token 無效', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[403] = { description: '權限不足', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[404] = { description: '找不到會員', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  #swagger.responses[500] = { description: '伺服器發生未預期的錯誤', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } } */
  adminUserController.updateUser
);

module.exports = router;
