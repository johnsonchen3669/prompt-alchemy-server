import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const db = require('../database/db');
const favoriteRepository = require(
    '../database/repositories/favorite.repository'
);

describe('FavoriteRepository.findFavoritesFromMe', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('會使用 userId 查詢收藏', async () => {
        const fakeFavorite = {
            id: 'favorite-1',
            user_id: 'user-1',
            skill_item_id: 'skill-1',
        };

        const querySpy = vi
            .spyOn(db, 'query')
            .mockResolvedValue({
                rows: [fakeFavorite],
            });

        const result =
            await favoriteRepository.findFavoritesFromMe('user-1');

        expect(querySpy).toHaveBeenCalledWith(
            'SELECT * FROM favorite WHERE user_id = $1',
            ['user-1']
        );

        expect(result).toEqual([fakeFavorite]);
    });

    it('找不到收藏時回傳 null', async () => {
        vi.spyOn(db, 'query').mockResolvedValue({
            rows: [],
        });

        const result =
            await favoriteRepository.findFavoritesFromMe('user-1');

        expect(result).toBeNull();
    });

    it('資料庫發生錯誤時會拋出錯誤', async () => {
        vi.spyOn(db, 'query').mockRejectedValue(
            new Error('database error')
        );

        await expect(
            favoriteRepository.findFavoritesFromMe('user-1')
        ).rejects.toThrow('database error');
    });
});