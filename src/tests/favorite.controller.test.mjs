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
  it('toggleFavorite 以 userId 與 skillId 呼叫 service 並回傳 200', async () => {
    const data = { isFavorited: true, favoriteCount: 1 };
    const spy = vi.spyOn(favoriteService, 'toggleFavorite').mockResolvedValue(data);
    const res = createResponse();
    await toggleFavorite({ user: { userId: 'u1' }, params: { skillId: 's1' } }, res, vi.fn());
    expect(spy).toHaveBeenCalledWith('u1', 's1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data });
  });

  it('getMyFavorites 回傳 200 與收藏清單', async () => {
    const data = [{ id: 's1' }];
    vi.spyOn(favoriteService, 'getMyFavorites').mockResolvedValue(data);
    const res = createResponse();
    await getMyFavorites({ user: { userId: 'u1' } }, res, vi.fn());
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data });
  });

  it('checkFavoriteStatus 回傳 200 與 isFavorited', async () => {
    vi.spyOn(favoriteService, 'isFavorited').mockResolvedValue(true);
    const res = createResponse();
    await checkFavoriteStatus({ user: { userId: 'u1' }, params: { skillId: 's1' } }, res, vi.fn());
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data: { isFavorited: true } });
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
    await toggleFavorite({ user: { userId: 'u1' }, params: { skillId: 's1' } }, res, next);
    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });
});