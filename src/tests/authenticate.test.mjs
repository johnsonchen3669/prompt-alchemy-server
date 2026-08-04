import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const { vertfyToken, isAdmin } = require('../middlewares/authenticate');

function createResponse() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('authenticate.vertfyToken', () => {
  it('缺少 Authorization header 時回傳 401 請先登入', () => {
    const res = createResponse();
    const next = vi.fn();
    vertfyToken({ headers: {} }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ status: 'false', message: '請先登入' });
    expect(next).not.toHaveBeenCalled();
  });

  it('非 Bearer 前綴時回傳 401 請先登入', () => {
    const res = createResponse();
    const next = vi.fn();
    vertfyToken({ headers: { authorization: 'Basic abc' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ status: 'false', message: '請先登入' });
  });

  it('合法 token 時將 decoded 寫入 req.user 並呼叫 next', () => {
    const decoded = { userId: 'u1', role: 'member' };
    const verify = vi.spyOn(jwt, 'verify').mockReturnValue(decoded);
    const req = { headers: { authorization: 'Bearer valid-token' } };
    const res = createResponse();
    const next = vi.fn();

    vertfyToken(req, res, next);

    expect(verify).toHaveBeenCalledWith('valid-token', JWT_SECRET);
    expect(req.user).toBe(decoded);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('jwt.verify 拋出錯誤時回傳 401 Token 無效或已過期', () => {
    vi.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('jwt expired');
    });
    const res = createResponse();
    const next = vi.fn();
    vertfyToken({ headers: { authorization: 'Bearer bad' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ status: 'false', message: 'Token 無效或已過期' });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('authenticate.isAdmin', () => {
  it('role 為 admin 時呼叫 next', () => {
    const next = vi.fn();
    const res = createResponse();
    isAdmin({ user: { role: 'admin' } }, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('role 非 admin 時回傳 403', () => {
    const next = vi.fn();
    const res = createResponse();
    isAdmin({ user: { role: 'member' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ status: 'false', message: '權限不足，拒絕存取' });
    expect(next).not.toHaveBeenCalled();
  });

  it('req.user 不存在時回傳 403', () => {
    const next = vi.fn();
    const res = createResponse();
    isAdmin({}, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});