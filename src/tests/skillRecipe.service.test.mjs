import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const skillRecipeRepository = require('../database/repositories/skill_recipe.repository');
const skillRecipeItemRepository = require('../database/repositories/skill_recipe_item.repository');
const skillRecipeService = require('../services/skillRecipe.service');

afterEach(() => {
  vi.restoreAllMocks();
});

describe('skillRecipeService.listMyRecipes', () => {
  it('透傳給 repository.findAllByUserId', async () => {
    const rows = [{ id: 'r1' }];
    const spy = vi.spyOn(skillRecipeRepository, 'findAllByUserId').mockResolvedValue(rows);

    const result = await skillRecipeService.listMyRecipes('u1');

    expect(spy).toHaveBeenCalledWith('u1');
    expect(result).toBe(rows);
  });
});

describe('skillRecipeService.getRecipeDetail', () => {
  it('回傳 Recipe 資料合併底下的 Skill 清單', async () => {
    vi.spyOn(skillRecipeRepository, 'assertOwnedByUser').mockResolvedValue({ id: 'r1', name: '常用' });
    const items = [{ id: 'as1' }];
    vi.spyOn(skillRecipeItemRepository, 'findItemsByRecipeId').mockResolvedValue(items);

    const result = await skillRecipeService.getRecipeDetail('u1', 'r1');

    expect(result).toEqual({ id: 'r1', name: '常用', items });
  });

  it('Recipe 不存在時拋出 NOT_FOUND', async () => {
    const error = Object.assign(new Error('找不到指定的 Recipe'), { code: 'NOT_FOUND' });
    vi.spyOn(skillRecipeRepository, 'assertOwnedByUser').mockRejectedValue(error);

    await expect(skillRecipeService.getRecipeDetail('u1', 'r1')).rejects.toBe(error);
  });
});

describe('skillRecipeService.createRecipe', () => {
  it('去除前後空白後呼叫 repository.create', async () => {
    const spy = vi.spyOn(skillRecipeRepository, 'create').mockResolvedValue({ id: 'r1' });

    await skillRecipeService.createRecipe('u1', '  我的常用  ');

    expect(spy).toHaveBeenCalledWith('u1', '我的常用');
  });

  it('名稱為空時拋出 400 錯誤，不呼叫 repository', async () => {
    const spy = vi.spyOn(skillRecipeRepository, 'create');

    await expect(skillRecipeService.createRecipe('u1', '   ')).rejects.toMatchObject({
      status: 400,
      message: '請輸入 Recipe 名稱',
    });
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('skillRecipeService.renameRecipe', () => {
  it('確認擁有權後呼叫 repository.rename', async () => {
    vi.spyOn(skillRecipeRepository, 'assertOwnedByUser').mockResolvedValue({ id: 'r1' });
    const spy = vi.spyOn(skillRecipeRepository, 'rename').mockResolvedValue({ id: 'r1', name: '新名稱' });

    const result = await skillRecipeService.renameRecipe('u1', 'r1', '新名稱');

    expect(spy).toHaveBeenCalledWith('r1', 'u1', '新名稱');
    expect(result).toEqual({ id: 'r1', name: '新名稱' });
  });

  it('名稱為空時拋出 400 錯誤，不呼叫 repository.rename', async () => {
    vi.spyOn(skillRecipeRepository, 'assertOwnedByUser').mockResolvedValue({ id: 'r1' });
    const spy = vi.spyOn(skillRecipeRepository, 'rename');

    await expect(skillRecipeService.renameRecipe('u1', 'r1', '')).rejects.toMatchObject({ status: 400 });
    expect(spy).not.toHaveBeenCalled();
  });

  it('Recipe 不屬於該使用者時拋出 NOT_FOUND', async () => {
    const error = Object.assign(new Error('找不到指定的 Recipe'), { code: 'NOT_FOUND' });
    vi.spyOn(skillRecipeRepository, 'assertOwnedByUser').mockRejectedValue(error);

    await expect(skillRecipeService.renameRecipe('u1', 'r1', '新名稱')).rejects.toBe(error);
  });
});

describe('skillRecipeService.deleteRecipe', () => {
  it('確認擁有權後呼叫 repository.remove 並回傳結果', async () => {
    vi.spyOn(skillRecipeRepository, 'assertOwnedByUser').mockResolvedValue({ id: 'r1' });
    const spy = vi.spyOn(skillRecipeRepository, 'remove').mockResolvedValue(true);

    const result = await skillRecipeService.deleteRecipe('u1', 'r1');

    expect(spy).toHaveBeenCalledWith('r1', 'u1');
    expect(result).toEqual({ id: 'r1', deleted: true });
  });
});

describe('skillRecipeService.addItem', () => {
  it('確認 Recipe 擁有權與收藏狀態後加入項目，回傳最新項目清單', async () => {
    vi.spyOn(skillRecipeRepository, 'assertOwnedByUser').mockResolvedValue({ id: 'r1' });
    const assertUsable = vi.spyOn(skillRecipeItemRepository, 'assertUsableFavorite').mockResolvedValue({ id: 'f1' });
    const addItem = vi.spyOn(skillRecipeItemRepository, 'addItem').mockResolvedValue();
    const items = [{ id: 'as1' }];
    vi.spyOn(skillRecipeItemRepository, 'findItemsByRecipeId').mockResolvedValue(items);

    const result = await skillRecipeService.addItem('u1', 'r1', 'f1');

    expect(assertUsable).toHaveBeenCalledWith('f1', 'u1');
    expect(addItem).toHaveBeenCalledWith('r1', 'f1');
    expect(result).toBe(items);
  });

  it('該 Skill 尚未收藏時拋出 NOT_FOUND，不加入項目', async () => {
    vi.spyOn(skillRecipeRepository, 'assertOwnedByUser').mockResolvedValue({ id: 'r1' });
    const error = Object.assign(new Error('這個 Skill 尚未被收藏，無法加入 Recipe'), { code: 'NOT_FOUND' });
    vi.spyOn(skillRecipeItemRepository, 'assertUsableFavorite').mockRejectedValue(error);
    const addItem = vi.spyOn(skillRecipeItemRepository, 'addItem');

    await expect(skillRecipeService.addItem('u1', 'r1', 'f1')).rejects.toBe(error);
    expect(addItem).not.toHaveBeenCalled();
  });
});

describe('skillRecipeService.createDefaultRecipeForNewUser', () => {
  it('以傳入的 transaction 建立一個名為 Default 的 Recipe', async () => {
    const spy = vi.spyOn(skillRecipeRepository, 'create').mockResolvedValue({ id: 'r1', name: 'Default' });
    const transaction = { query: vi.fn() };

    await skillRecipeService.createDefaultRecipeForNewUser('u1', transaction);

    expect(spy).toHaveBeenCalledWith('u1', 'Default', transaction);
  });
});

describe('skillRecipeService.removeItem', () => {
  it('確認擁有權後移除項目，回傳最新項目清單，不影響收藏狀態', async () => {
    vi.spyOn(skillRecipeRepository, 'assertOwnedByUser').mockResolvedValue({ id: 'r1' });
    const removeItem = vi.spyOn(skillRecipeItemRepository, 'removeItem').mockResolvedValue();
    const items = [];
    vi.spyOn(skillRecipeItemRepository, 'findItemsByRecipeId').mockResolvedValue(items);

    const result = await skillRecipeService.removeItem('u1', 'r1', 'f1');

    expect(removeItem).toHaveBeenCalledWith('r1', 'f1');
    expect(result).toBe(items);
  });
});
