const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require("crypto");
const { createUser, findUserByEmail, findUserById } = require("../database/repositories/user.repository")
const { JWT_SECRET } = require('../config/env')

/**
 * 註冊使用者
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next 
 * @returns 
 */
async function register(req, res, next) {
  try {
    const { email, name, password } = req.body;

    // 資料傳入缺少欄位
    if (!email || !name || !password) {
      return res
        .status(400)
        .json({ status: 'false', message: '請填寫 email、name 與 password' });
    }

    // 阻止重複 email 註冊
    const foundUser = await findUserByEmail(email)

    if (foundUser) {
      return res.status(400).json({ status: 'false', message: 'email 已被使用' });
    }

    // 密碼雜湊
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      email,
      name,
      passwordHash: hashedPassword,
    };
    const createdUser = await createUser(newUser)
    res.status(201).json({
      status: 'success',
      message: '註冊成功',
      data: { id: createdUser.id, email: createdUser.email, name: createdUser.name },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 使用者登入
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next 
 * @returns 
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email)

    // 輸入錯誤資訊
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res
        .status(401)
        .json({ status: 'error', message: 'email 或密碼錯誤' });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: '7d' },
    );
    res.status(200).json({ status: 'success', token });
  } catch (error) {
    next(error);
  }
}

/**
 * 使用者登出
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next 
 */
function logout(req, res, next) {
  try {
    res.status(200).json({ status: 'success', message: '已登出' })
  } catch (error) {
    next(error)
  }
}

/**
 * 取得使用者資訊
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next 
 */
async function getUser(req, res, next) {
  try {
    const userId = req.user.userId;
    const user = await findUserById(userId)
    if (!user) {
      return res.status(404).json({ status: false, message: '未找到符合的使用者' })
    }
    const { passwordHash, ...safeUser } = user
    res.status(200).json({ status: 'success', user: safeUser })
  } catch (error) {
    next(error)
  }
}

module.exports = { register, login, logout, getUser }