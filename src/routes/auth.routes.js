const express = require('express');
const { register, login, logout, getUser } = require('../controllers/auth.controller');
const { vertfyToken } = require('../middlewares/authenticate');

const router = express.Router();

router.post(
  '/register',
  /* #swagger.tags = ['Auth']
     #swagger.summary = '會員註冊'
     #swagger.description = '使用 email、name 與 password 建立新的會員帳號。此端點不需要登入。'
     #swagger.security = [] */
  /* #swagger.requestBody = {
       required: true,
       content: {
         'application/json': {
           schema: {
             type: 'object',
             required: ['email', 'name', 'password'],
             properties: {
               email: { type: 'string', format: 'email', example: 'member@example.com' },
               name: { type: 'string', example: 'member' },
               password: { type: 'string', format: 'password', example: 'Member1234' }
             }
           }
         }
       }
  } */
  /* #swagger.responses[201] = {
       description: '註冊成功',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             required: ['status', 'message', 'data'],
             properties: {
               status: { type: 'string', example: 'success' },
               message: { type: 'string', example: '註冊成功' },
               data: {
                 type: 'object',
                 required: ['id', 'email', 'name'],
                 properties: {
                   id: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
                   email: { type: 'string', format: 'email', example: 'member@example.com' },
                   name: { type: 'string', example: 'member' }
                 }
               }
             }
           }
         }
       }
  }
  #swagger.responses[400] = {
       description: '欄位缺漏或 email 已被使用',
       content: {
         'application/json': {
           schema: { $ref: '#/components/schemas/AuthErrorResponse' }
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
  register
);

router.post(
  '/login',
  /* #swagger.tags = ['Auth']
     #swagger.summary = '會員或管理者登入'
     #swagger.description = '驗證 email 與 password，登入成功後回傳有效期七天的 JWT token。此端點不需要登入。'
     #swagger.security = [] */
  /* #swagger.requestBody = {
       required: true,
       content: {
         'application/json': {
           schema: {
             type: 'object',
             required: ['email', 'password'],
             properties: {
               email: { type: 'string', format: 'email', example: 'member@example.com' },
               password: { type: 'string', format: 'password', example: 'Member1234' }
             }
           }
         }
       }
  } */
  /* #swagger.responses[200] = {
       description: '登入成功',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             required: ['status', 'token'],
             properties: {
               status: { type: 'string', example: 'success' },
               token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
             }
           }
         }
       }
  }
  #swagger.responses[401] = {
       description: 'email 或密碼錯誤',
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
  login
);

router.post(
  '/logout',
  /* #swagger.tags = ['Auth']
     #swagger.summary = '登出'
     #swagger.description = '驗證目前登入狀態並回傳登出成功訊息；JWT 為無狀態 token，伺服器不會撤銷既有 token。'
     #swagger.security = [{ bearerAuth: [] }] */
  /* #swagger.responses[200] = {
       description: '登出成功',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             required: ['status', 'message'],
             properties: {
               status: { type: 'string', example: 'success' },
               message: { type: 'string', example: '已登出' }
             }
           }
         }
       }
  }
  #swagger.responses[401] = {
       description: '未帶 token 或 token 失效',
       content: {
         'application/json': {
           schema: { $ref: '#/components/schemas/AuthErrorResponse' }
         }
       }
  } */
  vertfyToken,
  logout
);

router.get(
  '/me',
  /* #swagger.tags = ['Auth']
     #swagger.summary = '取得目前登入者資訊'
     #swagger.description = '依據 JWT token 解析出的使用者 ID，回傳目前登入者的非敏感基本資料。'
     #swagger.security = [{ bearerAuth: [] }] */
  /* #swagger.responses[200] = {
       description: '取得成功',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             required: ['status', 'user'],
             properties: {
               status: { type: 'string', example: 'success' },
               user: {
                 type: 'object',
                 required: ['id', 'email', 'name', 'role', 'isActive', 'createdAt'],
                 properties: {
                   id: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
                   email: { type: 'string', format: 'email', example: 'member@example.com' },
                   name: { type: 'string', example: 'member' },
                   role: { type: 'string', enum: ['member', 'admin'], example: 'member' },
                   isActive: { type: 'boolean', example: true },
                   createdAt: { type: 'string', format: 'date-time', example: '2026-08-16T12:00:00.000Z' }
                 }
               }
             }
           }
         }
       }
  }
  #swagger.responses[401] = {
       description: '未帶 token 或 token 失效',
       content: {
         'application/json': {
           schema: { $ref: '#/components/schemas/AuthErrorResponse' }
         }
       }
  }
  #swagger.responses[404] = {
       description: '找不到使用者',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             required: ['status', 'message'],
             properties: {
               status: { type: 'boolean', example: false },
               message: { type: 'string', example: '未找到符合的使用者' }
             }
           }
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
  vertfyToken,
  getUser
);

module.exports = router;
