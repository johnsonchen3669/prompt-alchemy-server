const express = require('express');
const router = express.Router();
const parameterController = require('../../controllers/admin/parameter.controller');

const { vertfyToken, isAdmin } = require('../../middlewares/authenticate');

// 根據 API 規格：所有 /api/admin/* 都需驗證是否具備 admin 權限
router.use(vertfyToken, isAdmin);

router.get(
  '/',
  /* #swagger.tags = ['Admin Parameters']
     #swagger.summary = '取得參數列表'
     #swagger.description = '取得所有標籤與參數，可透過 type 進行過濾（例如 type=category）。' */
  /* #swagger.parameters['type'] = {
       in: 'query',
       description: '參數類型，允許的值：role, contentType, category, model, tag',
       required: false,
       type: 'string'
  } */
  /* #swagger.responses[200] = {
       description: '成功取得參數列表',
       content: {
         "application/json": {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               message: { type: 'string', example: '取得參數列表成功' },
               data: {
                 type: 'array',
                 items: {
                   type: 'object',
                   properties: {
                     id: { type: 'string', format: 'uuid', example: '755f3568-2333-4709-b916-582eae69e195' },
                     type: { type: 'string', example: 'category' },
                     name: { type: 'string', example: '前端開發' },
                     description: { type: 'string', example: 'React / Vue / CSS / UI 相關' },
                     isActive: { type: 'boolean', example: true },
                     sortOrder: { type: 'integer', example: 1 }
                   }
                 }
               }
             }
           }
         }
       }
  } */
  parameterController.getParameters
);

router.post(
  '/',
  /* #swagger.tags = ['Admin Parameters']
     #swagger.summary = '新增參數'
     #swagger.description = '在後台新增標籤或參數。' */
  /* #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['type', 'name'],
             properties: {
               type: { type: 'string', example: 'category', description: '參數類型' },
               name: { type: 'string', example: '新分類', description: '參數名稱' },
               description: { type: 'string', example: '分類說明', description: '詳細說明' },
               isActive: { type: 'boolean', example: true, description: '是否啟用' },
               sortOrder: { type: 'integer', example: 1, description: '排序權重' }
             }
           }
         }
       }
  } */
  /* #swagger.responses[201] = {
       description: '成功新增參數',
       content: {
         "application/json": {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               message: { type: 'string', example: '新增參數成功' },
               data: {
                 type: 'object',
                 properties: {
                   id: { type: 'string', format: 'uuid', example: '755f3568-2333-4709-b916-582eae69e195' },
                   type: { type: 'string', example: 'category' },
                   name: { type: 'string', example: '新分類' },
                   description: { type: 'string', example: '分類說明' },
                   isActive: { type: 'boolean', example: true },
                   sortOrder: { type: 'integer', example: 1 }
                 }
               }
             }
           }
         }
       }
    }
    #swagger.responses[400] = { description: '請求格式錯誤或必填欄位缺失' } */
  parameterController.createParameter
);

router.put(
  '/:id',
  /* #swagger.tags = ['Admin Parameters']
     #swagger.summary = '修改參數'
     #swagger.description = '修改現有參數的資料，支援部分更新（Partial Update）。' */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: '參數 ID (UUID)',
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
               name: { type: 'string', example: '修改後的名稱', description: '參數名稱' },
               description: { type: 'string', example: '修改後的說明', description: '詳細說明' },
               isActive: { type: 'boolean', example: false, description: '是否啟用' },
               sortOrder: { type: 'integer', example: 2, description: '排序權重' }
             }
           }
         }
       }
  } */
  /* #swagger.responses[200] = {
       description: '成功修改參數',
       content: {
         "application/json": {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               message: { type: 'string', example: '修改參數成功' },
               data: {
                 type: 'object',
                 properties: {
                   id: { type: 'string', format: 'uuid', example: '755f3568-2333-4709-b916-582eae69e195' },
                   type: { type: 'string', example: 'category' },
                   name: { type: 'string', example: '修改後的名稱' },
                   description: { type: 'string', example: '修改後的說明' },
                   isActive: { type: 'boolean', example: false },
                   sortOrder: { type: 'integer', example: 2 }
                 }
               }
             }
           }
         }
       }
    }
    #swagger.responses[404] = { description: '找不到參數' } */
  parameterController.updateParameter
);

router.delete(
  '/:id',
  /* #swagger.tags = ['Admin Parameters']
     #swagger.summary = '刪除參數 (軟刪除)'
     #swagger.description = '透過將參數設定為未啟用 (isActive: false) 來進行軟刪除。' */
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: '參數 ID (UUID)',
       required: true,
       type: 'string'
  } */
  /* #swagger.responses[200] = {
       description: '成功停用/軟刪除參數',
       content: {
         "application/json": {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'success' },
               message: { type: 'string', example: '參數已刪除/停用' },
               data: {
                 type: 'object',
                 properties: {
                   id: { type: 'string', format: 'uuid', example: '755f3568-2333-4709-b916-582eae69e195' },
                   isActive: { type: 'boolean', example: false }
                 }
               }
             }
           }
         }
       }
    }
    #swagger.responses[404] = { description: '找不到參數' } */
  parameterController.deleteParameter
);

module.exports = router;
