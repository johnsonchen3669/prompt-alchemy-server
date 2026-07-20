const express = require('express');
const router = express.Router();
const adminUserController = require('../../controllers/admin/user.controller');
const { vertfyToken, isAdmin } = require('../../middlewares/authenticate');

router.use(vertfyToken, isAdmin);

router.get(
  '/',
  /* #swagger.tags = ['Admin Users']
     #swagger.summary = '取得會員清單'
     #swagger.description = '後台管理者取得會員清單，可依角色篩選。' */
  /* #swagger.parameters['role'] = {
       in: 'query',
       description: '角色篩選，允許的值：member、admin',
       required: false,
       type: 'string'
  } */
  /* #swagger.responses[200] = {
       description: '成功取得會員清單',
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
                     id: { type: 'string', format: 'uuid', example: 'user-uuid-0001' },
                     name: { type: 'string', example: '張小明' },
                     email: { type: 'string', format: 'email', example: 'user@example.com' },
                     role: { type: 'string', example: 'member' },
                     isActive: { type: 'boolean', example: true },
                     createdAt: { type: 'string', format: 'date-time' }
                   }
                 }
               }
             }
           }
         }
       }
  } */
  adminUserController.getUsers
);

// 根據 API 設計文件，目前我們只需要實作更新會員，註冊則是共用前台，或是可以另外加
router.put(
  '/:id',
  /* #swagger.tags = ['Admin Users']
     #swagger.summary = '修改會員資訊'
     #swagger.description = '後台管理者修改會員的 name、role、isActive 等資料。' */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: '會員 ID (UUID)',
       required: true,
       type: 'string'
  } */
  /* #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             properties: {
               name: { type: 'string', example: '修改後的名稱' },
               role: { type: 'string', example: 'member' },
               isActive: { type: 'boolean', example: true }
             }
           }
         }
       }
  } */
  /* #swagger.responses[200] = {
       description: '成功修改會員資訊',
       content: {
         "application/json": {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               data: {
                 type: 'object',
                 properties: {
                   id: { type: 'string', format: 'uuid', example: 'user-uuid-0001' },
                   name: { type: 'string', example: '修改後的名稱' },
                   email: { type: 'string', format: 'email', example: 'user@example.com' },
                   role: { type: 'string', example: 'member' },
                   isActive: { type: 'boolean', example: true }
                 }
               }
             }
           }
         }
       }
    }
    #swagger.responses[404] = { description: '找不到會員' } */
  adminUserController.updateUser
);

module.exports = router;
