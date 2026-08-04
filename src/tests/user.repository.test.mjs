import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const userRepository = require('../database/repositories/user.repository');

describe('UserRepository', () => {
  it('以 class instance 形式匯出 User repository', () => {
    expect(userRepository.constructor.name).toBe('UserRepository');
    expect(typeof userRepository.createUser).toBe('function');
    expect(typeof userRepository.findUserByEmail).toBe('function');
  });

  it('findUserByEmail 使用傳入的 executor 並映射 camelCase 欄位', async () => {
    const executor = {
      query: vi.fn().mockResolvedValue({
        rows: [{
          id: 'user-1',
          name: '測試會員',
          email: 'member@example.com',
          password_hash: 'hashed-password',
          role: 'member',
          is_active: true,
          created_at: '2026-08-03T00:00:00.000Z',
        }],
      }),
    };

    const result = await userRepository.findUserByEmail('member@example.com', executor);

    expect(executor.query).toHaveBeenCalledWith(
      'SELECT * FROM users WHERE email = $1',
      ['member@example.com'],
    );
    expect(result).toEqual({
      id: 'user-1',
      name: '測試會員',
      email: 'member@example.com',
      passwordHash: 'hashed-password',
      role: 'member',
      isActive: true,
      createdAt: '2026-08-03T00:00:00.000Z',
    });
  });

  it('updateUser 沒有更新欄位時沿用同一個 executor 查詢原資料', async () => {
    const executor = {
      query: vi.fn().mockResolvedValue({
        rows: [{
          id: 'user-1',
          name: '測試會員',
          email: 'member@example.com',
          password_hash: 'hashed-password',
          role: 'member',
          is_active: true,
          created_at: '2026-08-03T00:00:00.000Z',
        }],
      }),
    };

    const result = await userRepository.updateUser('user-1', {}, executor);

    expect(executor.query).toHaveBeenCalledWith(
      'SELECT * FROM users WHERE id = $1',
      ['user-1'],
    );
    expect(result.id).toBe('user-1');
  });
});

describe('UserRepository.createUser', () => {
  afterEach(() => vi.restoreAllMocks());

  it('以預設 role=member 建立使用者並回傳 camelCase 映射', async () => {
    const executor = {
      query: vi.fn().mockResolvedValue({
        rows: [{
          id: 'user-1', name: '小明', email: 'a@b.com', password_hash: 'h',
          role: 'member', is_active: true, created_at: '2026-08-03T00:00:00.000Z',
        }],
      }),
    };
    const result = await userRepository.createUser(
      { name: '小明', email: 'a@b.com', passwordHash: 'h' },
      executor,
    );
    expect(executor.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO users (name, email, password_hash, role)'),
      ['小明', 'a@b.com', 'h', 'member'],
    );
    expect(result).toEqual({
      id: 'user-1', name: '小明', email: 'a@b.com', passwordHash: 'h',
      role: 'member', isActive: true, createdAt: '2026-08-03T00:00:00.000Z',
    });
  });

  it('明確傳入 role 時以傳入值建立', async () => {
    const executor = {
      query: vi.fn().mockResolvedValue({
        rows: [{
          id: 'user-2', name: '管理員', email: 'admin@b.com', password_hash: 'h',
          role: 'admin', is_active: true, created_at: 't',
        }],
      }),
    };
    await userRepository.createUser(
      { name: '管理員', email: 'admin@b.com', passwordHash: 'h', role: 'admin' },
      executor,
    );
    expect(executor.query).toHaveBeenCalledWith(expect.any(String), ['管理員', 'admin@b.com', 'h', 'admin']);
  });

  it('INSERT 未回傳資料時回傳 null', async () => {
    const executor = { query: vi.fn().mockResolvedValue({ rows: [] }) };
    expect(await userRepository.createUser({ name: 'x', email: 'y', passwordHash: 'h' }, executor)).toBeNull();
  });
});

describe('UserRepository.findUserById', () => {
  afterEach(() => vi.restoreAllMocks());

  it('以參數化 ID 查詢並映射 camelCase', async () => {
    const executor = {
      query: vi.fn().mockResolvedValue({
        rows: [{
          id: 'user-1', name: '小明', email: 'a@b.com', password_hash: 'h',
          role: 'member', is_active: true, created_at: 't',
        }],
      }),
    };
    const result = await userRepository.findUserById('user-1', executor);
    expect(executor.query).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', ['user-1']);
    expect(result.passwordHash).toBe('h');
  });

  it('查無使用者時回傳 null', async () => {
    const executor = { query: vi.fn().mockResolvedValue({ rows: [] }) };
    expect(await userRepository.findUserById('missing', executor)).toBeNull();
  });
});

describe('UserRepository.getUsers', () => {
  afterEach(() => vi.restoreAllMocks());

  it('不帶 role 時查全部並依 created_at 遞減排序', async () => {
    const executor = {
      query: vi.fn().mockResolvedValue({ rows: [
        { id: 'u1', name: 'a', email: 'a@b.com', password_hash: 'h', role: 'member', is_active: true, created_at: 't1' },
      ] }),
    };
    await userRepository.getUsers(undefined, executor);
    expect(executor.query).toHaveBeenCalledWith(
      'SELECT * FROM users ORDER BY created_at DESC',
      [],
    );
  });

  it('帶 role 時加入 WHERE 條件', async () => {
    const executor = { query: vi.fn().mockResolvedValue({ rows: [] }) };
    await userRepository.getUsers('admin', executor);
    expect(executor.query).toHaveBeenCalledWith(
      'SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC',
      ['admin'],
    );
  });

  it('將每筆 row 映射為 camelCase', async () => {
    const executor = {
      query: vi.fn().mockResolvedValue({ rows: [
        { id: 'u1', name: 'a', email: 'a@b.com', password_hash: 'h', role: 'member', is_active: true, created_at: 't1' },
      ] }),
    };
    const result = await userRepository.getUsers(undefined, executor);
    expect(result[0]).toMatchObject({ id: 'u1', passwordHash: 'h', isActive: true });
  });
});

describe('UserRepository.updateUser — 更新欄位', () => {
  afterEach(() => vi.restoreAllMocks());

  it('更新 name/role/isActive 時產生對應 SET 並以 id 為最後參數', async () => {
    const executor = {
      query: vi.fn().mockResolvedValue({
        rows: [{
          id: 'user-1', name: '新名', email: 'a@b.com', password_hash: 'h',
          role: 'admin', is_active: false, created_at: 't',
        }],
      }),
    };
    const result = await userRepository.updateUser(
      'user-1',
      { name: '新名', role: 'admin', isActive: false },
      executor,
    );
    const [sql, params] = executor.query.mock.calls[0];
    expect(sql).toContain('name = $1');
    expect(sql).toContain('role = $2');
    expect(sql).toContain('is_active = $3');
    expect(sql).toContain('WHERE id = $4');
    expect(params).toEqual(['新名', 'admin', false, 'user-1']);
    expect(result.role).toBe('admin');
  });

  it('僅更新 name 時只產生 name 的 SET', async () => {
    const executor = {
      query: vi.fn().mockResolvedValue({
        rows: [{
          id: 'user-1', name: '新名', email: 'a@b.com', password_hash: 'h',
          role: 'member', is_active: true, created_at: 't',
        }],
      }),
    };
    await userRepository.updateUser('user-1', { name: '新名' }, executor);
    const [sql, params] = executor.query.mock.calls[0];
    expect(sql).toContain('name = $1');
    expect(sql).toContain('WHERE id = $2');
    expect(params).toEqual(['新名', 'user-1']);
  });

  it('UPDATE 未回傳資料時回傳 null', async () => {
    const executor = { query: vi.fn().mockResolvedValue({ rows: [] }) };
    expect(await userRepository.updateUser('user-1', { name: '新' }, executor)).toBeNull();
  });
});
