import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const db = require('../database/db');
const skillRecipeRepository = require('../database/repositories/skill_recipe.repository');

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SkillRecipeRepository.findAllByUserId', () => {
  it('依 created_at 新到舊查詢該使用者的所有 Recipe', async () => {
    const rows = [{ id: 'r1' }];
    const querySpy = vi.spyOn(db, 'query').mockResolvedValue({ rows });

    const result = await skillRecipeRepository.findAllByUserId('u1');

    const [sql, params] = querySpy.mock.calls[0];
    expect(sql).toContain('WHERE user_id = $1');
    expect(sql).toContain('ORDER BY created_at DESC');
    expect(params).toEqual(['u1']);
    expect(result).toBe(rows);
  });
});

describe('SkillRecipeRepository.findByIdForUser', () => {
  it('找到時回傳該筆 Recipe', async () => {
    const recipe = { id: 'r1', user_id: 'u1' };
    vi.spyOn(db, 'query').mockResolvedValue({ rows: [recipe] });

    const result = await skillRecipeRepository.findByIdForUser('r1', 'u1');

    expect(result).toEqual(recipe);
  });

  it('找不到時回傳 null', async () => {
    vi.spyOn(db, 'query').mockResolvedValue({ rows: [] });

    const result = await skillRecipeRepository.findByIdForUser('r1', 'u1');

    expect(result).toBeNull();
  });
});

describe('SkillRecipeRepository.assertOwnedByUser', () => {
  it('找到時回傳該筆 Recipe', async () => {
    const recipe = { id: 'r1', user_id: 'u1' };
    vi.spyOn(db, 'query').mockResolvedValue({ rows: [recipe] });

    const result = await skillRecipeRepository.assertOwnedByUser('r1', 'u1');

    expect(result).toEqual(recipe);
  });

  it('找不到時拋出 NOT_FOUND 錯誤', async () => {
    vi.spyOn(db, 'query').mockResolvedValue({ rows: [] });

    await expect(skillRecipeRepository.assertOwnedByUser('r1', 'u1')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: '找不到指定的 Recipe',
    });
  });
});

describe('SkillRecipeRepository.create', () => {
  it('新增一筆 Recipe 並回傳', async () => {
    const recipe = { id: 'r1', user_id: 'u1', name: '我的常用' };
    const querySpy = vi.spyOn(db, 'query').mockResolvedValue({ rows: [recipe] });

    const result = await skillRecipeRepository.create('u1', '我的常用');

    const [sql, params] = querySpy.mock.calls[0];
    expect(sql).toContain('INSERT INTO skill_recipe');
    expect(params).toEqual(['u1', '我的常用']);
    expect(result).toEqual(recipe);
  });
});

describe('SkillRecipeRepository.rename', () => {
  it('更新成功時回傳更新後的 Recipe', async () => {
    const recipe = { id: 'r1', user_id: 'u1', name: '新名稱' };
    const querySpy = vi.spyOn(db, 'query').mockResolvedValue({ rows: [recipe] });

    const result = await skillRecipeRepository.rename('r1', 'u1', '新名稱');

    const [sql, params] = querySpy.mock.calls[0];
    expect(sql).toContain('UPDATE skill_recipe');
    expect(params).toEqual(['r1', 'u1', '新名稱']);
    expect(result).toEqual(recipe);
  });

  it('找不到符合的 Recipe 時回傳 null', async () => {
    vi.spyOn(db, 'query').mockResolvedValue({ rows: [] });

    const result = await skillRecipeRepository.rename('r1', 'u1', '新名稱');

    expect(result).toBeNull();
  });
});

describe('SkillRecipeRepository.remove', () => {
  it('刪除成功時回傳 true', async () => {
    vi.spyOn(db, 'query').mockResolvedValue({ rows: [{ id: 'r1' }] });

    const result = await skillRecipeRepository.remove('r1', 'u1');

    expect(result).toBe(true);
  });

  it('找不到符合的 Recipe 時回傳 false', async () => {
    vi.spyOn(db, 'query').mockResolvedValue({ rows: [] });

    const result = await skillRecipeRepository.remove('r1', 'u1');

    expect(result).toBe(false);
  });
});
