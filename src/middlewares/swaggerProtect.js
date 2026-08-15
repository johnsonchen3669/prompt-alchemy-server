const { swagger } = require('../config/env')

/**
 * Swagger 文件保護：HTTP Basic Auth
 * 瀏覽器會跳出原生的帳號密碼輸入框，輸入正確才能存取 /docs、/scalar、/openapi.json
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
module.exports = function swaggerProtect(req, res, next) {
  const { basicAuthUser, basicAuthPass } = swagger

  // 未設定帳密時不啟用 Basic Auth（開發環境直接放行）
  if (!basicAuthUser || !basicAuthPass) {
    return next()
  }

  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Swagger"')
    return res.status(401).json({ status: 'error', message: '需要帳號密碼才能存取' })
  }

  const decoded = Buffer.from(authHeader.split(' ')[1], 'base64').toString('utf-8')
  const [user, pass] = decoded.split(':')

  if (user === basicAuthUser && pass === basicAuthPass) {
    return next()
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="Swagger"')
  return res.status(401).json({ status: 'error', message: '帳號或密碼錯誤' })
}