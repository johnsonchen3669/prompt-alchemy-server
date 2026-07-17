const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('../config/env')

/**
 * JWT 守門員：驗 Authorization header 的 Bearer token
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const vertfyToken = function (req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'false', message: '請先登入' });
  }

  try {
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded;
    next()
  } catch (error) {
    res.status(401).json({ status: 'false', message: 'Token 無效或已過期' });
  }
}

module.exports = { vertfyToken }