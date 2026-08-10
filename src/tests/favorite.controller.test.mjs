import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const favoriteService = require('../services/favorite.service');
const {
  toggleFavorite, getMyFavorites, checkFavoriteStatus, clearMyFavorites, restoreDefaultFavorites,
} = require('../controllers/favorite.controller');

function createResponse() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('favoriteController', () => {
  it('toggleFavorite 未帶 itemType 時，預設以 prompt 呼叫 service 並回傳 200', async () => {
    const data = { isFavorited: true, favoriteCount: 1 };
    const spy = vi.spyOn(favoriteService, 'toggleFavorite').mockResolvedValue(data);
    const res = createResponse();
    await toggleFavorite({ user: { userId: 'u1' }, params: { skillId: 's1' }, query: {} }, res, vi.fn());
    expect(spy).toHaveBeenCalledWith('u1', 's1', 'prompt');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data });
  });

  it('toggleFavorite 帶 itemType=skill 時，以 skill 呼叫 service', async () => {
    const data = { isFavorited: true, favoriteCount: 1 };
    const spy = vi.spyOn(favoriteService, 'toggleFavorite').mockResolvedValue(data);
    const res = createResponse();
    await toggleFavorite(
      { user: { userId: 'u1' }, params: { skillId: 'as1' }, query: { itemType: 'skill' } },
      res,
      vi.fn(),
    );
    expect(spy).toHaveBeenCalledWith('u1', 'as1', 'skill');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('toggleFavorite 帶不合法的 itemType 時回傳 400，不呼叫 service', async () => {
    const spy = vi.spyOn(favoriteService, 'toggleFavorite');
    const res = createResponse();
    await toggleFavorite(
      { user: { userId: 'u1' }, params: { skillId: 's1' }, query: { itemType: 'bogus' } },
      res,
      vi.fn(),
    );
    expect(spy).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('getMyFavorites 未帶 itemType 時，預設以 prompt 呼叫 service 並回傳 200', async () => {
    const data = [{ id: 's1' }];
    const spy = vi.spyOn(favoriteService, 'getMyFavorites').mockResolvedValue(data);
    const res = createResponse();
    await getMyFavorites({ user: { userId: 'u1' }, query: {} }, res, vi.fn());
    expect(spy).toHaveBeenCalledWith('u1', 'prompt');
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data });
  });

  it('getMyFavorites 帶 itemType=skill 時，以 skill 呼叫 service', async () => {
    const data = [{ id: 'as1' }];
    const spy = vi.spyOn(favoriteService, 'getMyFavorites').mockResolvedValue(data);
    const res = createResponse();
    await getMyFavorites({ user: { userId: 'u1' }, query: { itemType: 'skill' } }, res, vi.fn());
    expect(spy).toHaveBeenCalledWith('u1', 'skill');
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data });
  });

  it('checkFavoriteStatus 未帶 itemType 時，預設以 prompt 呼叫 service 並回傳 200', async () => {
    const spy = vi.spyOn(favoriteService, 'isFavorited').mockResolvedValue(true);
    const res = createResponse();
    await checkFavoriteStatus(
      { user: { userId: 'u1' }, params: { skillId: 's1' }, query: {} },
      res,
      vi.fn(),
    );
    expect(spy).toHaveBeenCalledWith('u1', 's1', 'prompt');
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data: { isFavorited: true } });
  });

  it('checkFavoriteStatus 帶 itemType=skill 時，以 skill 呼叫 service', async () => {
    const spy = vi.spyOn(favoriteService, 'isFavorited').mockResolvedValue(false);
    const res = createResponse();
    await checkFavoriteStatus(
      { user: { userId: 'u1' }, params: { skillId: 'as1' }, query: { itemType: 'skill' } },
      res,
      vi.fn(),
    );
    expect(spy).toHaveBeenCalledWith('u1', 'as1', 'skill');
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data: { isFavorited: false } });
  });

  it('clearMyFavorites 回傳 200 與清除結果', async () => {
    const data = { favoriteIds: [], favoriteCounts: {} };
    vi.spyOn(favoriteService, 'clearMyFavorites').mockResolvedValue(data);
    const res = createResponse();
    await clearMyFavorites({ user: { userId: 'u1' } }, res, vi.fn());
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data });
  });

  it('restoreDefaultFavorites 回傳 200 與還原結果', async () => {
    const data = { favoriteIds: ['s1'], favoriteCounts: { s1: 1 } };
    vi.spyOn(favoriteService, 'restoreDefaultFavorites').mockResolvedValue(data);
    const res = createResponse();
    await restoreDefaultFavorites({ user: { userId: 'u1' } }, res, vi.fn());
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data });
  });

  it('service 拋出錯誤時交給 next', async () => {
    const error = new Error('找不到使用者');
    Object.assign(error, { code: 'NOT_FOUND' });
    vi.spyOn(favoriteService, 'toggleFavorite').mockRejectedValue(error);
    const res = createResponse();
    const next = vi.fn();
    await toggleFavorite({ user: { userId: 'u1' }, params: { skillId: 's1' }, query: {} }, res, next);
    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });
});