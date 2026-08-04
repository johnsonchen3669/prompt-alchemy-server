import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const userRepository = require('../database/repositories/user.repository');
const controller = require('../controllers/admin/user.controller');

function createResponse() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
}

function makeUser(overrides = {}) {
  return {
    id: 'u1', name: '小明', email: 'a@b.com', passwordHash: 'secret',
    role: 'member', isActive: true, createdAt: 't',
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AdminUserController.getUsers', () => {
  it('將 role 透傳給 repository 並剔除 passwordHash 後回傳 200', async () => {
    const spy = vi.spyOn(userRepository, 'getUsers').mockResolvedValue([makeUser(), makeUser({ id: 'u2' })]);
    const res = createResponse();
    await controller.getUsers({ query: { role: 'member' } }, res, vi.fn());
    expect(spy).toHaveBeenCalledWith('member');
    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.data).toHaveLength(2);
    for (const user of payload.data) {
      expect(user).not.toHaveProperty('passwordHash');
    }
  });

  it('repository 拋出錯誤時交給 next', async () => {
    const error = new Error('db error');
    vi.spyOn(userRepository, 'getUsers').mockRejectedValue(error);
    const res = createResponse();
    const next = vi.fn();
    await controller.getUsers({ query: {} }, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });
});

describe('AdminUserController.updateUser', () => {
  it('找不到會員時回傳 404，不呼叫 updateUser', async () => {
    const findSpy = vi.spyOn(userRepository, 'findUserById').mockResolvedValue(null);
    const updateSpy = vi.spyOn(userRepository, 'updateUser');
    const res = createResponse();
    const next = vi.fn();
    await controller.updateUser({ params: { id: 'x' }, body: { name: '新' } }, res, next);
    expect(findSpy).toHaveBeenCalledWith('x');
    expect(updateSpy).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ status: 'error', message: '找不到會員' });
  });

  it('找到時以 name/role/isActive 呼叫 updateUser 並剔除 passwordHash 回傳 200', async () => {
    vi.spyOn(userRepository, 'findUserById').mockResolvedValue(makeUser());
    const updateSpy = vi.spyOn(userRepository, 'updateUser').mockResolvedValue(
      makeUser({ name: '新名', role: 'admin', isActive: false }),
    );
    const res = createResponse();
    await controller.updateUser(
      { params: { id: 'u1' }, body: { name: '新名', role: 'admin', isActive: false } },
      res,
      vi.fn(),
    );
    expect(updateSpy).toHaveBeenCalledWith('u1', { name: '新名', role: 'admin', isActive: false });
    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.data).not.toHaveProperty('passwordHash');
    expect(payload.data).toMatchObject({ name: '新名', role: 'admin', isActive: false });
  });

  it('repository 拋出錯誤時交給 next', async () => {
    vi.spyOn(userRepository, 'findUserById').mockRejectedValue(new Error('db error'));
    const res = createResponse();
    const next = vi.fn();
    await controller.updateUser({ params: { id: 'u1' }, body: {} }, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'db error' }));
  });
});