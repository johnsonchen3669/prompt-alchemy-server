import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../database/repositories/user.repository');
const authService = require('../services/auth.service');
const { JWT_SECRET } = require('../config/env');
const { register, login, logout, getUser } = require('../controllers/auth.controller');

function createResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('authController.register', () => {
  it('缺少欄位時回傳 400', async () => {
    const res = createResponse();
    await register({ body: { email: '', name: '小明' } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'false',
      message: '請填寫 email、name 與 password',
    });
  });

  it('EMAIL_TAKEN 時回傳 400', async () => {
    const error = new Error('email 已被使用');
    error.code = 'EMAIL_TAKEN';
    vi.spyOn(authService, 'register').mockRejectedValue(error);
    const res = createResponse();
    await register({ body: { email: 'a@b.com', name: '小明', password: 'x' } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ status: 'false', message: 'email 已被使用' });
  });

  it('註冊成功時回傳 201 與使用者基本資料', async () => {
    vi.spyOn(authService, 'register').mockResolvedValue({
      id: 'u1', email: 'a@b.com', name: '小明', passwordHash: 'h',
    });
    const res = createResponse();
    await register({ body: { email: 'a@b.com', name: '小明', password: 'x' } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      message: '註冊成功',
      data: { id: 'u1', email: 'a@b.com', name: '小明' },
    });
  });

  it('非預期錯誤交給 next', async () => {
    const error = new Error('db down');
    vi.spyOn(authService, 'register').mockRejectedValue(error);
    const res = createResponse();
    const next = vi.fn();
    await register({ body: { email: 'a@b.com', name: '小明', password: 'x' } }, res, next);
    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('authController.login', () => {
  it('使用者不存在時回傳 401', async () => {
    vi.spyOn(userRepository, 'findUserByEmail').mockResolvedValue(null);
    const res = createResponse();
    await login({ body: { email: 'a@b.com', password: 'x' } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ status: 'error', message: 'email 或密碼錯誤' });
  });

  it('密碼錯誤時回傳 401', async () => {
    vi.spyOn(userRepository, 'findUserByEmail').mockResolvedValue({
      id: 'u1', email: 'a@b.com', passwordHash: 'h', role: 'member',
    });
    vi.spyOn(bcrypt, 'compare').mockResolvedValue(false);
    const res = createResponse();
    await login({ body: { email: 'a@b.com', password: 'wrong' } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('憑證正確時簽發 JWT 並回傳 200', async () => {
    vi.spyOn(userRepository, 'findUserByEmail').mockResolvedValue({
      id: 'u1', email: 'a@b.com', passwordHash: 'h', role: 'admin',
    });
    vi.spyOn(bcrypt, 'compare').mockResolvedValue(true);
    const sign = vi.spyOn(jwt, 'sign').mockReturnValue('signed-token');
    const res = createResponse();
    await login({ body: { email: 'a@b.com', password: 'right' } }, res, vi.fn());

    expect(sign).toHaveBeenCalledWith(
      { userId: 'u1', email: 'a@b.com', role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' },
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'success', token: 'signed-token' });
  });

  it('過程中拋出例外時交給 next', async () => {
    vi.spyOn(userRepository, 'findUserByEmail').mockRejectedValue(new Error('db error'));
    const res = createResponse();
    const next = vi.fn();
    await login({ body: { email: 'a@b.com', password: 'x' } }, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'db error' }));
  });
});

describe('authController.logout', () => {
  it('回傳 200 與登出訊息', () => {
    const res = createResponse();
    logout({}, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'success', message: '已登出' });
  });
});

describe('authController.getUser', () => {
  it('找不到使用者時回傳 404', async () => {
    vi.spyOn(userRepository, 'findUserById').mockResolvedValue(null);
    const res = createResponse();
    await getUser({ user: { userId: 'u1' } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ status: false, message: '未找到符合的使用者' });
  });

  it('找到時回傳 200 並剔除 passwordHash', async () => {
    vi.spyOn(userRepository, 'findUserById').mockResolvedValue({
      id: 'u1', email: 'a@b.com', name: '小明', passwordHash: 'secret', role: 'member', isActive: true, createdAt: 't',
    });
    const res = createResponse();
    await getUser({ user: { userId: 'u1' } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.user).not.toHaveProperty('passwordHash');
    expect(payload.user).toMatchObject({ id: 'u1', email: 'a@b.com' });
  });

  it('拋出例外時交給 next', async () => {
    vi.spyOn(userRepository, 'findUserById').mockRejectedValue(new Error('db error'));
    const res = createResponse();
    const next = vi.fn();
    await getUser({ user: { userId: 'u1' } }, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'db error' }));
  });
});