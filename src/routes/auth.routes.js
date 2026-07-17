const express = require('express');
const { register, login, logout, getUser } = require('../controllers/auth.controller');
const { vertfyToken } = require('../middlewares/authenticate');

const router = express.Router();

router.post(
  '/register',
  /* #swagger.tags = ['Auth']
     #swagger.description = '會員註冊' */
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
  register
)

router.post(
  '/login',
  /* #swagger.tags = ['Auth']
     #swagger.description = '會員 / 管理者登入' */
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
  login
)
router.post('/logout',
  /* #swagger.tags = ['Auth']
     #swagger.description = '登出'
     #swagger.security = [{ "bearerAuth": [] }]*/
  vertfyToken,
  logout)

router.get('/me',
  /* #swagger.tags = ['Auth']
     #swagger.description = '取得目前登入者資訊'
     #swagger.security = [{ "bearerAuth": [] }]*/
  vertfyToken,
  getUser)

module.exports = router;