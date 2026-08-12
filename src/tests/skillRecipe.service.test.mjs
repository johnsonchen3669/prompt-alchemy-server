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

describe('skillRecipeService.listMyRecipeItems', () => {
  it('透傳給 repository.findAllByUserId', async () => {
    const rows = [{ recipe_id: 'r1', favorite_id: 'f1' }];
    const spy = vi.spyOn(skillRecipeItemRepository, 'findAllByUserId').mockResolvedValue(rows);

    const result = await skillRecipeService.listMyRecipeItems('u1');

    expect(spy).toHaveBeenCalledWith('u1');
    expect(result).toBe(rows);
  });
});

describe('skillRecipeService.getInstallCommands', () => {
  function makeItemRow(overrides = {}) {
    return {
      id: 'as1',
      repo_owner: 'mattpocock',
      repo_name: 'skills',
      skill_slug: 'tdd',
      claude_install_method: true,
      codex_install_method: true,
      claude_plugin_name: 'mattpocock-skills',
      claude_marketplace_name: null,
      git_clone_method: false,
      favorite_id: 1,
      ...overrides,
    };
  }

  it('確認擁有權後，把 Recipe 底下同一個 plugin 的多筆 Skill 合併成一組安裝指令', async () => {
    vi.spyOn(skillRecipeRepository, 'assertOwnedByUser').mockResolvedValue({ id: 'r1' });
    vi.spyOn(skillRecipeItemRepository, 'findItemsByRecipeId').mockResolvedValue([
      makeItemRow({ skill_slug: 'tdd' }),
      makeItemRow({ skill_slug: 'code-review' }),
    ]);

    const result = await skillRecipeService.getInstallCommands('u1', 'r1', 'claude-code');

    expect(result).toEqual(['claude plugin install mattpocock-skills']);
  });

  it('codex 目標把跨 repo 的多筆 Skill 各自分成一行', async () => {
    vi.spyOn(skillRecipeRepository, 'assertOwnedByUser').mockResolvedValue({ id: 'r1' });
    vi.spyOn(skillRecipeItemRepository, 'findItemsByRecipeId').mockResolvedValue([
      makeItemRow({ skill_slug: 'tdd' }),
      makeItemRow({
        repo_owner: 'anthropics', repo_name: 'skills', skill_slug: 'frontend-design',
        claude_plugin_name: null, claude_marketplace_name: null,
      }),
    ]);

    const result = await skillRecipeService.getInstallCommands('u1', 'r1', 'codex');

    expect(result).toEqual([
      'npx skills add mattpocock/skills --skill tdd -a codex',
      'npx skills add anthropics/skills --skill frontend-design -a codex',
    ]);
  });

  it('空 Recipe（沒有任何項目）回傳空陣列', async () => {
    vi.spyOn(skillRecipeRepository, 'assertOwnedByUser').mockResolvedValue({ id: 'r1' });
    vi.spyOn(skillRecipeItemRepository, 'findItemsByRecipeId').mockResolvedValue([]);

    const result = await skillRecipeService.getInstallCommands('u1', 'r1', 'claude-code');

    expect(result).toEqual([]);
  });

  it('Recipe 不屬於該使用者時拋出 NOT_FOUND，不查詢項目', async () => {
    const error = Object.assign(new Error('找不到指定的 Recipe'), { code: 'NOT_FOUND' });
    vi.spyOn(skillRecipeRepository, 'assertOwnedByUser').mockRejectedValue(error);
    const findItems = vi.spyOn(skillRecipeItemRepository, 'findItemsByRecipeId');

    await expect(skillRecipeService.getInstallCommands('u1', 'r1', 'claude-code')).rejects.toBe(error);
    expect(findItems).not.toHaveBeenCalled();
  });

  it('不支援的 agent 拋出錯誤', async () => {
    vi.spyOn(skillRecipeRepository, 'assertOwnedByUser').mockResolvedValue({ id: 'r1' });
    vi.spyOn(skillRecipeItemRepository, 'findItemsByRecipeId').mockResolvedValue([makeItemRow()]);

    await expect(skillRecipeService.getInstallCommands('u1', 'r1', 'cursor')).rejects.toThrow(
      '不支援的目標 Agent',
    );
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
