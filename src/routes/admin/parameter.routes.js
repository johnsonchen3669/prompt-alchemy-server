const express = require('express');
const router = express.Router();
const parameterController = require('../../controllers/admin/parameter.controller');

const { vertfyToken, isAdmin } = require('../../middlewares/authenticate');

router.use(vertfyToken, isAdmin);

router.get(
  '/',
  /* #swagger.tags = ['Admin Parameters']
     #swagger.summary = '取得參數列表'
     #swagger.description = '取得所有標籤與參數，可透過 type 進行過濾。'
     #swagger.security = [{ bearerAuth: [] }] */
  /* #swagger.parameters['type'] = {
       in: 'query',
       description: '參數類型',
       required: false,
       '@schema': {
         type: 'string',
         enum: ['role', 'contentType', 'category', 'model', 'tag']
       }
  } */
  /* #swagger.responses[200] = {
       description: '成功取得參數列表',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               message: { type: 'string', example: '取得參數列表成功' },
               data: {
                 type: 'array',
                 items: { $ref: '#/components/schemas/Parameter' }
               }
             }
           }
         }
       }
  }
  #swagger.responses[400] = { description: '參數類型無效', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  #swagger.responses[401] = { description: '未登入或 Token 無效', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[403] = { description: '權限不足', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[500] = { description: '伺服器發生未預期的錯誤', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } } */
  parameterController.getParameters
);

router.post(
  '/',
  /* #swagger.tags = ['Admin Parameters']
     #swagger.summary = '新增參數'
     #swagger.description = '在後台新增標籤或參數。type 與 name 為必要欄位，其餘欄位會使用服務層預設值。'
     #swagger.security = [{ bearerAuth: [] }] */
  /* #swagger.requestBody = {
       required: true,
       content: {
         'application/json': {
           schema: {
             type: 'object',
             required: ['type', 'name'],
             properties: {
               type: {
                 type: 'string',
                 enum: ['role', 'contentType', 'category', 'model', 'tag'],
                 example: 'category'
               },
               name: { type: 'string', example: '新分類' },
               description: { type: 'string', example: '分類說明' },
               isActive: { type: 'boolean', default: true, example: true },
               sortOrder: { type: 'integer', default: 0, example: 1 }
             }
           }
         }
       }
  } */
  /* #swagger.responses[201] = {
       description: '成功新增參數',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               message: { type: 'string', example: '新增參數成功' },
               data: { $ref: '#/components/schemas/Parameter' }
             }
           }
         }
       }
  }
  #swagger.responses[400] = { description: '參數類型無效或缺少參數名稱', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  #swagger.responses[401] = { description: '未登入或 Token 無效', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[403] = { description: '權限不足', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[500] = { description: '伺服器發生未預期的錯誤', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } } */
  parameterController.createParameter
);

router.put(
  '/:id',
  /* #swagger.tags = ['Admin Parameters']
     #swagger.summary = '修改參數'
     #swagger.description = '修改現有參數的名稱、說明、啟用狀態或排序；未提供的欄位會維持原值。'
     #swagger.security = [{ bearerAuth: [] }] */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: '參數 ID (UUID)',
       required: true,
       '@schema': {
         type: 'string',
         format: 'uuid',
         example: '755f3568-2333-4709-b916-582eae69e195'
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
               description: { type: 'string', example: '修改後的說明' },
               isActive: { type: 'boolean', example: false },
               sortOrder: { type: 'integer', example: 2 }
             }
           }
         }
       }
  } */
  /* #swagger.responses[200] = {
       description: '成功修改參數',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               message: { type: 'string', example: '修改參數成功' },
               data: { $ref: '#/components/schemas/Parameter' }
             }
           }
         }
       }
  }
  #swagger.responses[400] = { description: '請求格式錯誤', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  #swagger.responses[401] = { description: '未登入或 Token 無效', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[403] = { description: '權限不足', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[404] = { description: '找不到參數', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  #swagger.responses[500] = { description: '伺服器發生未預期的錯誤', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } } */
  parameterController.updateParameter
);

router.delete(
  '/:id',
  /* #swagger.tags = ['Admin Parameters']
     #swagger.summary = '停用參數'
     #swagger.description = '透過將參數設定為未啟用 (isActive: false) 來進行軟刪除。'
     #swagger.security = [{ bearerAuth: [] }] */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: '參數 ID (UUID)',
       required: true,
       '@schema': {
         type: 'string',
         format: 'uuid',
         example: '755f3568-2333-4709-b916-582eae69e195'
       }
  } */
  /* #swagger.responses[200] = {
       description: '成功停用參數',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               message: { type: 'string', example: '參數已刪除/停用' },
               data: { $ref: '#/components/schemas/Parameter' }
             }
           }
         }
       }
  }
  #swagger.responses[401] = { description: '未登入或 Token 無效', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[403] = { description: '權限不足', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthErrorResponse' } } } }
  #swagger.responses[404] = { description: '找不到參數', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  #swagger.responses[500] = { description: '伺服器發生未預期的錯誤', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } } */
  parameterController.deleteParameter
);

module.exports = router;
