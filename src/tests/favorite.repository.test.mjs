import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const db = require('../database/db');
const favoriteRepository = require('../database/repositories/favorite.repository');

describe('FavoriteRepository.findByUserAndSkillId', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('會使用 userId 與 skillId 查詢單筆收藏', async () => {
    const favorite = {
      user_id: 'user-1',
      skill_item_id: 'skill-1',
    };
    const querySpy = vi.spyOn(db, 'query').mockResolvedValue({
      rows: [favorite],
    });

    const result = await favoriteRepository.findByUserAndSkillId('user-1', 'skill-1');

    expect(querySpy).toHaveBeenCalledWith(
      'SELECT * FROM favorite WHERE user_id = $1 AND skill_item_id = $2',
      ['user-1', 'skill-1'],
    );
    expect(result).toEqual(favorite);
  });

  it('找不到收藏時回傳 null', async () => {
    vi.spyOn(db, 'query').mockResolvedValue({ rows: [] });

    const result = await favoriteRepository.findByUserAndSkillId('user-1', 'skill-1');

    expect(result).toBeNull();
  });

  it('資料庫發生錯誤時會拋出錯誤', async () => {
    vi.spyOn(db, 'query').mockRejectedValue(new Error('database error'));

    await expect(
      favoriteRepository.findByUserAndSkillId('user-1', 'skill-1'),
    ).rejects.toThrow('database error');
  });
});

describe('FavoriteRepository.lockUser', () => {
  afterEach(() => vi.restoreAllMocks());

  it('使用者存在時完成鎖定', async () => {
    const executor = { query: vi.fn().mockResolvedValue({ rows: [{ id: 'u1' }] }) };
    await expect(favoriteRepository.lockUser('u1', executor)).resolves.toBeUndefined();
    expect(executor.query).toHaveBeenCalledWith(
      'SELECT id FROM users WHERE id = $1 FOR UPDATE',
      ['u1'],
    );
  });

  it('使用者不存在時拋出 NOT_FOUND 錯誤', async () => {
    const executor = { query: vi.fn().mockResolvedValue({ rows: [] }) };
    await expect(favoriteRepository.lockUser('u1', executor)).rejects.toMatchObject({
      message: '找不到使用者', code: 'NOT_FOUND',
    });
  });
});

describe('FavoriteRepository.lockSkills', () => {
  afterEach(() => vi.restoreAllMocks());

  it('空陣列時直接回傳空陣列不查詢', async () => {
    const executor = { query: vi.fn() };
    const result = await favoriteRepository.lockSkills([], executor);
    expect(executor.query).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('去重並排序後以 uuid[] 鎖定技能', async () => {
    const executor = { query: vi.fn().mockResolvedValue({ rows: [{ id: 's1' }, { id: 's2' }] }) };
    const result = await favoriteRepository.lockSkills(['s2', 's1', 's2'], executor);
    expect(executor.query).toHaveBeenCalledWith(
      'SELECT id FROM skill_item WHERE id = ANY($1::uuid[]) ORDER BY id FOR UPDATE',
      [['s1', 's2']],
    );
    expect(result).toEqual(['s1', 's2']);
  });

  it('鎖定數量與傳入不符時拋出 NOT_FOUND 錯誤', async () => {
    const executor = { query: vi.fn().mockResolvedValue({ rows: [{ id: 's1' }] }) };
    await expect(favoriteRepository.lockSkills(['s1', 's2'], executor)).rejects.toMatchObject({
      message: '找不到指定的技能', code: 'NOT_FOUND',
    });
  });
});

describe('FavoriteRepository.findByUserId', () => {
  afterEach(() => vi.restoreAllMocks());

  it('以 JOIN 查詢使用者收藏並依建立時間遞減排序', async () => {
    const executor = { query: vi.fn().mockResolvedValue({ rows: [{ id: 's1' }] }) };
    const result = await favoriteRepository.findByUserId('u1', executor);
    const [sql, params] = executor.query.mock.calls[0];
    expect(sql).toContain('JOIN skill_item s');
    expect(sql).toContain('ORDER BY f.created_at DESC');
    expect(params).toEqual(['u1']);
    expect(result).toEqual([{ id: 's1' }]);
  });
});

describe('FavoriteRepository.findSkillIdsByUserId', () => {
  afterEach(() => vi.restoreAllMocks());

  it('回傳 skill_item_id 陣列', async () => {
    const executor = {
      query: vi.fn().mockResolvedValue({ rows: [{ skill_item_id: 's2' }, { skill_item_id: 's1' }] }),
    };
    const result = await favoriteRepository.findSkillIdsByUserId('u1', executor);
    expect(executor.query).toHaveBeenCalledWith(
      'SELECT skill_item_id FROM favorite WHERE user_id = $1 ORDER BY skill_item_id',
      ['u1'],
    );
    expect(result).toEqual(['s2', 's1']);
  });
});

describe('FavoriteRepository.addFavorite / removeFavorite / removeAllByUserId', () => {
  afterEach(() => vi.restoreAllMocks());

  it('addFavorite 以 ON CONFLICT DO NOTHING 新增收藏', async () => {
    const executor = { query: vi.fn().mockResolvedValue({ rows: [] }) };
    await favoriteRepository.addFavorite('u1', 's1', executor);
    expect(executor.query).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT (user_id, skill_item_id) DO NOTHING'),
      ['u1', 's1'],
    );
  });

  it('removeFavorite 移除指定使用者與技能的收藏', async () => {
    const executor = { query: vi.fn().mockResolvedValue({ rows: [] }) };
    await favoriteRepository.removeFavorite('u1', 's1', executor);
    expect(executor.query).toHaveBeenCalledWith(
      'DELETE FROM favorite WHERE user_id = $1 AND skill_item_id = $2',
      ['u1', 's1'],
    );
  });

  it('removeAllByUserId 移除指定使用者的全部收藏', async () => {
    const executor = { query: vi.fn().mockResolvedValue({ rows: [] }) };
    await favoriteRepository.removeAllByUserId('u1', executor);
    expect(executor.query).toHaveBeenCalledWith(
      'DELETE FROM favorite WHERE user_id = $1',
      ['u1'],
    );
  });
});

describe('FavoriteRepository.recalculateFavoriteCounts', () => {
  afterEach(() => vi.restoreAllMocks());

  it('對每個技能執行 UPDATE 並回傳 UUID→收藏數 Map，重複技能只計算一次', async () => {
    const executor = {
      query: vi.fn().mockImplementation(async (_sql, params) => ({
        rows: [{ favorite_count: params[0] === 's1' ? 5 : 2 }],
      })),
    };
    const result = await favoriteRepository.recalculateFavoriteCounts(['s1', 's2', 's1'], executor);
    expect(executor.query).toHaveBeenCalledTimes(2);
    expect(result.get('s1')).toBe(5);
    expect(result.get('s2')).toBe(2);
    expect(result).toBeInstanceOf(Map);
  });

  it('空陣列時回傳空 Map 且不查詢', async () => {
    const executor = { query: vi.fn() };
    const result = await favoriteRepository.recalculateFavoriteCounts([], executor);
    expect(executor.query).not.toHaveBeenCalled();
    expect(result.size).toBe(0);
  });
});
