import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const db = require('../database/db');
const skillRecipeItemRepository = require('../database/repositories/skill_recipe_item.repository');

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SkillRecipeItemRepository.assertUsableFavorite', () => {
  it('找到該使用者的 skill 收藏時回傳該筆資料', async () => {
    vi.spyOn(db, 'query').mockResolvedValue({ rows: [{ id: 'f1' }] });

    const result = await skillRecipeItemRepository.assertUsableFavorite('f1', 'u1');

    expect(result).toEqual({ id: 'f1' });
  });

  it('找不到對應的 skill 收藏時拋出 NOT_FOUND 錯誤', async () => {
    vi.spyOn(db, 'query').mockResolvedValue({ rows: [] });

    await expect(
      skillRecipeItemRepository.assertUsableFavorite('f1', 'u1'),
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: '這個 Skill 尚未被收藏，無法加入 Recipe',
    });
  });
});

describe('SkillRecipeItemRepository.addItem', () => {
  it('以 INSERT ... ON CONFLICT DO NOTHING 加入項目', async () => {
    const querySpy = vi.spyOn(db, 'query').mockResolvedValue({ rows: [] });

    await skillRecipeItemRepository.addItem('r1', 'f1');

    const [sql, params] = querySpy.mock.calls[0];
    expect(sql).toContain('INSERT INTO skill_recipe_item');
    expect(sql).toContain('ON CONFLICT');
    expect(params).toEqual(['r1', 'f1']);
  });
});

describe('SkillRecipeItemRepository.removeItem', () => {
  it('依 recipe_id 與 favorite_skill_id 刪除項目', async () => {
    const querySpy = vi.spyOn(db, 'query').mockResolvedValue({ rows: [] });

    await skillRecipeItemRepository.removeItem('r1', 'f1');

    const [sql, params] = querySpy.mock.calls[0];
    expect(sql).toContain('DELETE FROM skill_recipe_item');
    expect(params).toEqual(['r1', 'f1']);
  });
});

describe('SkillRecipeItemRepository.findItemsByRecipeId', () => {
  it('join favorite 與 agent_skill 回傳該 Recipe 底下的 Skill 清單', async () => {
    const rows = [{ id: 'as1', favorite_id: 'f1' }];
    const querySpy = vi.spyOn(db, 'query').mockResolvedValue({ rows });

    const result = await skillRecipeItemRepository.findItemsByRecipeId('r1');

    const [sql, params] = querySpy.mock.calls[0];
    expect(sql).toContain('JOIN favorite');
    expect(sql).toContain('JOIN agent_skill');
    expect(params).toEqual(['r1']);
    expect(result).toBe(rows);
  });
});
