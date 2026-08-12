import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const skillRecipeService = require('../services/skillRecipe.service');
const {
  listMyRecipes, listMyRecipeItems, getRecipeDetail, createRecipe, renameRecipe, deleteRecipe,
  addItem, removeItem, getInstallCommands,
} = require('../controllers/skillRecipe.controller');

function createResponse() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('skillRecipeController.listMyRecipes', () => {
  it('回傳 200 與清單資料', async () => {
    const data = [{ id: 'r1' }];
    vi.spyOn(skillRecipeService, 'listMyRecipes').mockResolvedValue(data);
    const res = createResponse();

    await listMyRecipes({ user: { userId: 'u1' } }, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data });
  });
});

describe('skillRecipeController.listMyRecipeItems', () => {
  it('回傳 200 與 recipeId／favoriteId 配對清單', async () => {
    const data = [{ recipe_id: 'r1', favorite_id: 'f1' }];
    vi.spyOn(skillRecipeService, 'listMyRecipeItems').mockResolvedValue(data);
    const res = createResponse();

    await listMyRecipeItems({ user: { userId: 'u1' } }, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data });
  });
});

describe('skillRecipeController.getRecipeDetail', () => {
  it('以 params.id 呼叫 service 並回傳 200', async () => {
    const data = { id: 'r1', items: [] };
    const spy = vi.spyOn(skillRecipeService, 'getRecipeDetail').mockResolvedValue(data);
    const res = createResponse();

    await getRecipeDetail({ user: { userId: 'u1' }, params: { id: 'r1' } }, res, vi.fn());

    expect(spy).toHaveBeenCalledWith('u1', 'r1');
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data });
  });
});

describe('skillRecipeController.createRecipe', () => {
  it('以 body.name 呼叫 service 並回傳 201', async () => {
    const data = { id: 'r1', name: '常用' };
    const spy = vi.spyOn(skillRecipeService, 'createRecipe').mockResolvedValue(data);
    const res = createResponse();

    await createRecipe({ user: { userId: 'u1' }, body: { name: '常用' } }, res, vi.fn());

    expect(spy).toHaveBeenCalledWith('u1', '常用');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data });
  });

  it('service 拋出錯誤時交給 next', async () => {
    const error = Object.assign(new Error('請輸入 Recipe 名稱'), { status: 400 });
    vi.spyOn(skillRecipeService, 'createRecipe').mockRejectedValue(error);
    const res = createResponse();
    const next = vi.fn();

    await createRecipe({ user: { userId: 'u1' }, body: {} }, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('skillRecipeController.renameRecipe', () => {
  it('以 params.id 與 body.name 呼叫 service 並回傳 200', async () => {
    const data = { id: 'r1', name: '新名稱' };
    const spy = vi.spyOn(skillRecipeService, 'renameRecipe').mockResolvedValue(data);
    const res = createResponse();

    await renameRecipe(
      { user: { userId: 'u1' }, params: { id: 'r1' }, body: { name: '新名稱' } },
      res,
      vi.fn(),
    );

    expect(spy).toHaveBeenCalledWith('u1', 'r1', '新名稱');
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data });
  });
});

describe('skillRecipeController.deleteRecipe', () => {
  it('以 params.id 呼叫 service 並回傳 200', async () => {
    const data = { id: 'r1', deleted: true };
    const spy = vi.spyOn(skillRecipeService, 'deleteRecipe').mockResolvedValue(data);
    const res = createResponse();

    await deleteRecipe({ user: { userId: 'u1' }, params: { id: 'r1' } }, res, vi.fn());

    expect(spy).toHaveBeenCalledWith('u1', 'r1');
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data });
  });
});

describe('skillRecipeController.addItem', () => {
  it('以 params.id 與 body.favoriteId 呼叫 service 並回傳 201', async () => {
    const data = [{ id: 'as1' }];
    const spy = vi.spyOn(skillRecipeService, 'addItem').mockResolvedValue(data);
    const res = createResponse();

    await addItem(
      { user: { userId: 'u1' }, params: { id: 'r1' }, body: { favoriteId: 'f1' } },
      res,
      vi.fn(),
    );

    expect(spy).toHaveBeenCalledWith('u1', 'r1', 'f1');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data });
  });

  it('未收藏時 service 拋出的 NOT_FOUND 錯誤交給 next', async () => {
    const error = Object.assign(new Error('這個 Skill 尚未被收藏，無法加入 Recipe'), { code: 'NOT_FOUND' });
    vi.spyOn(skillRecipeService, 'addItem').mockRejectedValue(error);
    const res = createResponse();
    const next = vi.fn();

    await addItem(
      { user: { userId: 'u1' }, params: { id: 'r1' }, body: { favoriteId: 'f1' } },
      res,
      next,
    );

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe('skillRecipeController.getInstallCommands', () => {
  it('以 params.id 與 query.agent 呼叫 service 並回傳 200 與 commands 陣列', async () => {
    const commands = ['claude plugin install mattpocock-skills'];
    const spy = vi.spyOn(skillRecipeService, 'getInstallCommands').mockResolvedValue(commands);
    const res = createResponse();

    await getInstallCommands(
      { user: { userId: 'u1' }, params: { id: 'r1' }, query: { agent: 'claude-code' } },
      res,
      vi.fn(),
    );

    expect(spy).toHaveBeenCalledWith('u1', 'r1', 'claude-code');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data: { commands } });
  });

  it('Recipe 不存在時回傳 404', async () => {
    const error = Object.assign(new Error('找不到指定的 Recipe'), { code: 'NOT_FOUND' });
    vi.spyOn(skillRecipeService, 'getInstallCommands').mockRejectedValue(error);
    const res = createResponse();

    await getInstallCommands(
      { user: { userId: 'u1' }, params: { id: 'r1' }, query: { agent: 'claude-code' } },
      res,
      vi.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ status: 'error', message: error.message });
  });

  it('不支援的 agent 回傳 400', async () => {
    const error = new Error('不支援的目標 Agent：cursor');
    vi.spyOn(skillRecipeService, 'getInstallCommands').mockRejectedValue(error);
    const res = createResponse();

    await getInstallCommands(
      { user: { userId: 'u1' }, params: { id: 'r1' }, query: { agent: 'cursor' } },
      res,
      vi.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ status: 'error', message: error.message });
  });

  it('其他未預期錯誤交給 next', async () => {
    const error = new Error('db down');
    vi.spyOn(skillRecipeService, 'getInstallCommands').mockRejectedValue(error);
    const res = createResponse();
    const next = vi.fn();

    await getInstallCommands(
      { user: { userId: 'u1' }, params: { id: 'r1' }, query: { agent: 'claude-code' } },
      res,
      next,
    );

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe('skillRecipeController.removeItem', () => {
  it('以 params.id 與 params.favoriteId 呼叫 service 並回傳 200', async () => {
    const data = [];
    const spy = vi.spyOn(skillRecipeService, 'removeItem').mockResolvedValue(data);
    const res = createResponse();

    await removeItem(
      { user: { userId: 'u1' }, params: { id: 'r1', favoriteId: 'f1' } },
      res,
      vi.fn(),
    );

    expect(spy).toHaveBeenCalledWith('u1', 'r1', 'f1');
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data });
  });
});
