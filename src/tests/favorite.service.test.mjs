import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const db = require('../database/db');
const favoriteRepository = require('../database/repositories/favorite.repository');
const { DEFAULT_FAVORITE_SKILL_IDS } = require('../config/favorite.config');
const favoriteService = require('../services/favorite.service');

const transaction = { query: vi.fn() };

function mockTransaction() {
  vi.spyOn(db, 'withTransaction').mockImplementation(async (callback) => callback(transaction));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('favoriteService.isFavorited', () => {
  it('已收藏時回傳 true', async () => {
    vi.spyOn(favoriteRepository, 'findByUserAndSkillId').mockResolvedValue({ user_id: 'u1' });
    const result = await favoriteService.isFavorited('u1', 's1');
    expect(result).toBe(true);
  });

  it('未收藏時回傳 false', async () => {
    vi.spyOn(favoriteRepository, 'findByUserAndSkillId').mockResolvedValue(null);
    const result = await favoriteService.isFavorited('u1', 's1');
    expect(result).toBe(false);
  });
});

describe('favoriteService.getMyFavorites', () => {
  it('透傳給 repository.findByUserId', async () => {
    const rows = [{ id: 's1' }];
    const spy = vi.spyOn(favoriteRepository, 'findByUserId').mockResolvedValue(rows);
    const result = await favoriteService.getMyFavorites('u1');
    expect(spy).toHaveBeenCalledWith('u1');
    expect(result).toBe(rows);
  });
});

describe('favoriteService.toggleFavorite', () => {
  it('已存在時移除收藏，回傳 isFavorited=false 與最新收藏數', async () => {
    mockTransaction();
    vi.spyOn(favoriteRepository, 'lockUser').mockResolvedValue();
    vi.spyOn(favoriteRepository, 'lockSkills').mockResolvedValue(['s1']);
    vi.spyOn(favoriteRepository, 'findByUserAndSkillId').mockResolvedValue({ user_id: 'u1' });
    const remove = vi.spyOn(favoriteRepository, 'removeFavorite').mockResolvedValue();
    const recalc = vi.spyOn(favoriteRepository, 'recalculateFavoriteCounts').mockResolvedValue(
      new Map([['s1', 4]]),
    );

    const result = await favoriteService.toggleFavorite('u1', 's1');

    expect(remove).toHaveBeenCalledWith('u1', 's1', transaction);
    expect(recalc).toHaveBeenCalledWith(['s1'], transaction);
    expect(result).toEqual({ isFavorited: false, favoriteCount: 4 });
  });

  it('不存在時新增收藏，回傳 isFavorited=true 與最新收藏數', async () => {
    mockTransaction();
    vi.spyOn(favoriteRepository, 'lockUser').mockResolvedValue();
    vi.spyOn(favoriteRepository, 'lockSkills').mockResolvedValue(['s1']);
    vi.spyOn(favoriteRepository, 'findByUserAndSkillId').mockResolvedValue(null);
    const add = vi.spyOn(favoriteRepository, 'addFavorite').mockResolvedValue();
    vi.spyOn(favoriteRepository, 'recalculateFavoriteCounts').mockResolvedValue(
      new Map([['s1', 1]]),
    );

    const result = await favoriteService.toggleFavorite('u1', 's1');

    expect(add).toHaveBeenCalledWith('u1', 's1', transaction);
    expect(result).toEqual({ isFavorited: true, favoriteCount: 1 });
  });
});

describe('favoriteService.clearMyFavorites', () => {
  it('清除全部收藏並回傳空 favoriteIds 與收藏數物件', async () => {
    mockTransaction();
    vi.spyOn(favoriteRepository, 'lockUser').mockResolvedValue();
    vi.spyOn(favoriteRepository, 'findSkillIdsByUserId').mockResolvedValue(['s1', 's2']);
    vi.spyOn(favoriteRepository, 'lockSkills').mockResolvedValue(['s1', 's2']);
    const removeAll = vi.spyOn(favoriteRepository, 'removeAllByUserId').mockResolvedValue();
    const recalc = vi.spyOn(favoriteRepository, 'recalculateFavoriteCounts').mockResolvedValue(
      new Map([
        ['s1', 0],
        ['s2', 0],
      ]),
    );

    const result = await favoriteService.clearMyFavorites('u1');

    expect(removeAll).toHaveBeenCalledWith('u1', transaction);
    expect(recalc).toHaveBeenCalledWith(['s1', 's2'], transaction);
    expect(result).toEqual({
      favoriteIds: [],
      favoriteCounts: { s1: 0, s2: 0 },
    });
  });
});

describe('favoriteService.createDefaultFavoritesForNewUser', () => {
  it('鎖定使用者與預設技能，逐一新增收藏並重算收藏數', async () => {
    const lockUser = vi.spyOn(favoriteRepository, 'lockUser').mockResolvedValue();
    const lockSkills = vi.spyOn(favoriteRepository, 'lockSkills').mockResolvedValue();
    const add = vi.spyOn(favoriteRepository, 'addFavorite').mockResolvedValue();
    const recalc = vi.spyOn(favoriteRepository, 'recalculateFavoriteCounts').mockResolvedValue(new Map());

    await favoriteService.createDefaultFavoritesForNewUser('u1', transaction);

    expect(lockUser).toHaveBeenCalledWith('u1', transaction);
    expect(lockSkills).toHaveBeenCalledWith(DEFAULT_FAVORITE_SKILL_IDS, transaction);
    expect(add).toHaveBeenCalledTimes(DEFAULT_FAVORITE_SKILL_IDS.length);
    for (const skillId of DEFAULT_FAVORITE_SKILL_IDS) {
      expect(add).toHaveBeenCalledWith('u1', skillId, transaction);
    }
    expect(recalc).toHaveBeenCalledWith(DEFAULT_FAVORITE_SKILL_IDS, transaction);
  });
});

describe('favoriteService.restoreDefaultFavorites', () => {
  it('先清除既有收藏再重建預設收藏，affectedSkillIds 含既有與預設的聯集', async () => {
    mockTransaction();
    vi.spyOn(favoriteRepository, 'lockUser').mockResolvedValue();
    // 既有收藏包含一個與預設清單重複的技能，藉此驗證聯集會去重
    vi.spyOn(favoriteRepository, 'findSkillIdsByUserId').mockResolvedValue([
      's-old',
      DEFAULT_FAVORITE_SKILL_IDS[0],
    ]);
    // affectedSkillIds = unique(['s-old', DEFAULT[0], ...DEFAULT])
    const lockSkills = vi.spyOn(favoriteRepository, 'lockSkills').mockResolvedValue();
    const removeAll = vi.spyOn(favoriteRepository, 'removeAllByUserId').mockResolvedValue();
    const add = vi.spyOn(favoriteRepository, 'addFavorite').mockResolvedValue();
    const recalc = vi.spyOn(favoriteRepository, 'recalculateFavoriteCounts').mockResolvedValue(
      new Map([['s-old', 0]]),
    );

    const result = await favoriteService.restoreDefaultFavorites('u1');

    expect(removeAll).toHaveBeenCalledWith('u1', transaction);
    const expectedAffected = [...new Set(['s-old', DEFAULT_FAVORITE_SKILL_IDS[0], ...DEFAULT_FAVORITE_SKILL_IDS])];
    expect(lockSkills).toHaveBeenCalledWith(expectedAffected, transaction);
    expect(recalc).toHaveBeenCalledWith(expectedAffected, transaction);
    expect(add).toHaveBeenCalledTimes(DEFAULT_FAVORITE_SKILL_IDS.length);
    expect(result).toEqual({
      favoriteIds: [...DEFAULT_FAVORITE_SKILL_IDS],
      favoriteCounts: { 's-old': 0 },
    });
  });
});