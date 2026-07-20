const express = require('express');
const { register, login, logout, getUser } = require('../controllers/auth.controller');
const { vertfyToken } = require('../middlewares/authenticate');

const router = express.Router();

router.post(
  '/register',
  /* #swagger.tags = ['Auth']
     #swagger.summary = '會員註冊'
     #swagger.description = '使用 email、name 與 password 建立新的會員帳號。' */
  /* #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: "object",
             required: ["email","name", "password"],
             properties: {
               email: { type: "string", format: "email", example: "member@example.com" },
               name: { type: "string", format: "text", example: "member" },
               password: { type: "string", format: "password", example: "Member1234" }
             }
           }
         }
       }
  } */
  /* #swagger.responses[201] = {
       description: '註冊成功',
       schema: {
         status: 'success',
         message: '註冊成功',
         data: { id: 1, email: 'member@example.com', name: 'member' }
       }
  } */
  /* #swagger.responses[400] = {
       description: '欄位缺漏或 email 已被使用',
       schema: { status: 'false', message: '請填寫 email、name 與 password' }
  } */
  register
)

router.post(
  '/login',
  /* #swagger.tags = ['Auth']
     #swagger.summary = '會員 / 管理者登入'
     #swagger.description = '驗證 email 與 password，登入成功後回傳 JWT token。' */
  /* #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: "object",
             required: ["email", "password"],
             properties: {
               email: { type: "string", format: "email", example: "member@example.com" },
               password: { type: "string", format: "password", example: "Member1234" }
             }
           }
         }
       }
  } */
  /* #swagger.responses[200] = {
       description: '登入成功',
       schema: { status: 'success', token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
  } */
  /* #swagger.responses[401] = {
       description: 'email 或密碼錯誤',
       schema: { status: 'error', message: 'email 或密碼錯誤' }
  } */
  login
)
router.post('/logout',
  /* #swagger.tags = ['Auth']
     #swagger.summary = '登出'
     #swagger.description = '登出目前已登入的使用者。'
     #swagger.security = [{ "bearerAuth": [] }]*/
  /* #swagger.responses[200] = {
       description: '登出成功',
       schema: { status: 'success', message: '已登出' }
  } */
  /* #swagger.responses[401] = {
       description: '未帶 token 或 token 失效',
       schema: { status: 'false', message: '請先登入' }
  } */
  vertfyToken,
  logout)

router.get('/me',
  /* #swagger.tags = ['Auth']
     #swagger.summary = '取得目前登入者資訊'
     #swagger.description = '依據 token 解析出的使用者 ID，回傳目前登入者的基本資料。'
     #swagger.security = [{ "bearerAuth": [] }]*/
  /* #swagger.responses[200] = {
       description: '取得成功',
       schema: { status: 'success', user: { id: 1, email: 'member@example.com', name: 'member' } }
  } */
  /* #swagger.responses[401] = {
       description: '未帶 token 或 token 失效',
       schema: { status: 'false', message: '請先登入' }
  } */
  /* #swagger.responses[404] = {
       description: '找不到使用者',
       schema: { status: false, message: '未找到符合的使用者' }
  } */
  vertfyToken,
  getUser)

module.exports = router;