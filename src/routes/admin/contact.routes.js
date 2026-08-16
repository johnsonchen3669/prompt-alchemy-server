const express = require('express');
const router = express.Router();
const adminContactController = require('../../controllers/admin/contact.controller');
const { vertfyToken, isAdmin } = require('../../middlewares/authenticate');

router.use(vertfyToken, isAdmin);

router.get(
  '/',
  /* #swagger.tags = ['Admin Contacts']
     #swagger.summary = '取得聯絡表單清單'
     #swagger.description = '取得後台聯絡表單清單，可依處理狀態與關鍵字篩選，結果依建立時間由新到舊排列。'
     #swagger.security = [{ bearerAuth: [] }] */
  /* #swagger.parameters['status'] = {
       in: 'query',
       description: '處理狀態篩選',
       required: false,
       '@schema': {
         type: 'string',
         enum: ['pending', 'resolved']
       }
  }
  #swagger.parameters['keyword'] = {
       in: 'query',
       description: '搜尋姓名、Email 或聯絡內容',
       required: false,
       '@schema': { type: 'string' }
  } */
  /* #swagger.responses[200] = {
       description: '成功取得聯絡表單清單',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               message: { type: 'string', example: '取得聯絡表單清單成功' },
               data: {
                 type: 'array',
                 items: { $ref: '#/components/schemas/Contact' }
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
  adminContactController.getContacts
);

router.patch(
  '/:id/status',
  /* #swagger.tags = ['Admin Contacts']
     #swagger.summary = '更新聯絡表單狀態'
     #swagger.description = '更新指定聯絡表單的處理狀態，支援 pending 與 resolved。'
     #swagger.security = [{ bearerAuth: [] }] */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: '聯絡紀錄 ID (UUID)',
       required: true,
       '@schema': {
         type: 'string',
         format: 'uuid',
         example: '80000000-0000-4000-a000-000000000001'
       }
  } */
  /* #swagger.requestBody = {
       required: true,
       content: {
         'application/json': {
           schema: {
             type: 'object',
             required: ['status'],
             properties: {
               status: { type: 'string', enum: ['pending', 'resolved'], example: 'resolved' }
             }
           }
         }
       }
  } */
  /* #swagger.responses[200] = {
       description: '成功更新聯絡表單狀態',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               message: { type: 'string', example: '狀態更新成功' },
               data: { $ref: '#/components/schemas/Contact' }
             }
           }
         }
       }
  }
  #swagger.responses[400] = { description: '處理狀態無效', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  #swagger.responses[401] = { description: '未登入或 Token 無效', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[403] = { description: '權限不足', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[404] = { description: '找不到聯絡紀錄', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  #swagger.responses[500] = { description: '伺服器發生未預期的錯誤', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } } */
  adminContactController.updateContactStatus
);

router.put(
  '/:id/status',
  /* #swagger.tags = ['Admin Contacts']
     #swagger.summary = '更新聯絡表單狀態（PUT）'
     #swagger.description = '以 PUT 方式更新指定聯絡表單的處理狀態，支援 pending 與 resolved。此路由與 PATCH 使用相同 controller。'
     #swagger.security = [{ bearerAuth: [] }] */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: '聯絡紀錄 ID (UUID)',
       required: true,
       '@schema': {
         type: 'string',
         format: 'uuid',
         example: '80000000-0000-4000-a000-000000000001'
       }
  } */
  /* #swagger.requestBody = {
       required: true,
       content: {
         'application/json': {
           schema: {
             type: 'object',
             required: ['status'],
             properties: {
               status: { type: 'string', enum: ['pending', 'resolved'], example: 'resolved' }
             }
           }
         }
       }
  } */
  /* #swagger.responses[200] = {
       description: '成功更新聯絡表單狀態',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               message: { type: 'string', example: '狀態更新成功' },
               data: { $ref: '#/components/schemas/Contact' }
             }
           }
         }
       }
  }
  #swagger.responses[400] = { description: '處理狀態無效', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  #swagger.responses[401] = { description: '未登入或 Token 無效', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[403] = { description: '權限不足', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[404] = { description: '找不到聯絡紀錄', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  #swagger.responses[500] = { description: '伺服器發生未預期的錯誤', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } } */
  adminContactController.updateContactStatus
);

router.delete(
  '/:id',
  /* #swagger.tags = ['Admin Contacts']
     #swagger.summary = '刪除聯絡表單'
     #swagger.description = '永久刪除指定聯絡表單紀錄，成功時回傳被刪除的資料。'
     #swagger.security = [{ bearerAuth: [] }] */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: '聯絡紀錄 ID (UUID)',
       required: true,
       '@schema': {
         type: 'string',
         format: 'uuid',
         example: '80000000-0000-4000-a000-000000000001'
       }
  } */
  /* #swagger.responses[200] = {
       description: '成功刪除聯絡表單',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               message: { type: 'string', example: '刪除成功' },
               data: { $ref: '#/components/schemas/Contact' }
             }
           }
         }
       }
  }
  #swagger.responses[400] = { description: '聯絡紀錄 ID 格式錯誤', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  #swagger.responses[401] = { description: '未登入或 Token 無效', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[403] = { description: '權限不足', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[404] = { description: '找不到聯絡紀錄', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  #swagger.responses[500] = { description: '伺服器發生未預期的錯誤', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } } */
  adminContactController.deleteContact
);

module.exports = router;
