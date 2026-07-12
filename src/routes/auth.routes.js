const express = require('express');
const { login } = require('../controllers/auth.controller');

const router = express.Router();

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
// router.post('/logout', logOut)
// router.get('/me', getUser)

module.exports = router;


// POST	/auth/login	公開	會員 / 管理者登入
// POST	/auth/logout	已登入	登出
// GET	/auth/me	已登入	取得目前登入者資訊