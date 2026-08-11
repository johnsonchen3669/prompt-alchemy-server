import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// auth.service 在載入時就會解構 favorite.service／skillRecipe.service 的函式到局部常數，
// 之後再 spyOn 已無法攔截。必須在 require auth.service 之前直接替換模組匯出屬性。
const favoriteService = require('../services/favorite.service');
const createDefaultFavoritesForNewUser = vi.fn();
favoriteService.createDefaultFavoritesForNewUser = createDefaultFavoritesForNewUser;

const skillRecipeService = require('../services/skillRecipe.service');
const createDefaultRecipeForNewUser = vi.fn();
skillRecipeService.createDefaultRecipeForNewUser = createDefaultRecipeForNewUser;

const userRepository = require('../database/repositories/user.repository');
const db = require('../database/db');
const bcrypt = require('bcrypt');

// 此時 require auth.service，它解構到的都是上面替換過的 mock。
const { register } = require('../services/auth.service');

// 注入測試用的 transaction；auth.service 只會將它傳給 repository 與 favorite.service。
const transaction = { query: vi.fn() };

let hash, withTransaction, findUserByEmail, createUser;

beforeEach(() => {
  hash = vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password');
  // withTransaction 把 callback 注入一個 transaction executor；測試中直接驅動 callback。
  withTransaction = vi.spyOn(db, 'withTransaction').mockImplementation(async (callback) => {
    return callback(transaction);
  });
  findUserByEmail = vi.spyOn(userRepository, 'findUserByEmail');
  createUser = vi.spyOn(userRepository, 'createUser');
  createDefaultFavoritesForNewUser.mockReset();
  createDefaultFavoritesForNewUser.mockResolvedValue();
  createDefaultRecipeForNewUser.mockReset();
  createDefaultRecipeForNewUser.mockResolvedValue();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('authService.register', () => {
  it('新註冊成功時回傳建立的使用者，並以 bcrypt 雜湊密碼', async () => {
    const createdUser = { id: 'user-1', email: 'new@example.com', name: '新人' };
    findUserByEmail.mockResolvedValue(null);
    createUser.mockResolvedValue(createdUser);

    const result = await register({ email: 'new@example.com', name: '新人', password: 'secret' });

    expect(hash).toHaveBeenCalledWith('secret', 10);
    expect(withTransaction).toHaveBeenCalledOnce();
    expect(findUserByEmail).toHaveBeenCalledWith('new@example.com', transaction);
    expect(createUser).toHaveBeenCalledWith(
      { email: 'new@example.com', name: '新人', passwordHash: 'hashed-password' },
      transaction,
    );
    expect(createDefaultFavoritesForNewUser).toHaveBeenCalledWith('user-1', transaction);
    expect(createDefaultRecipeForNewUser).toHaveBeenCalledWith('user-1', transaction);
    expect(result).toBe(createdUser);
  });

  it('email 已存在時拋出 EMAIL_TAKEN 錯誤，且不建立使用者、預設收藏或預設 Recipe', async () => {
    findUserByEmail.mockResolvedValue({ id: 'user-existing', email: 'taken@example.com' });

    await expect(
      register({ email: 'taken@example.com', name: '新人', password: 'secret' }),
    ).rejects.toMatchObject({ message: 'email 已被使用', code: 'EMAIL_TAKEN' });

    expect(createUser).not.toHaveBeenCalled();
    expect(createDefaultFavoritesForNewUser).not.toHaveBeenCalled();
    expect(createDefaultRecipeForNewUser).not.toHaveBeenCalled();
  });

  it('資料庫唯一索引衝突（code 23505）轉為 EMAIL_TAKEN 錯誤', async () => {
    findUserByEmail.mockResolvedValue(null);
    const pgError = new Error('duplicate key');
    pgError.code = '23505';
    createUser.mockRejectedValue(pgError);

    await expect(
      register({ email: 'race@example.com', name: '新人', password: 'secret' }),
    ).rejects.toMatchObject({ message: 'email 已被使用', code: 'EMAIL_TAKEN' });
  });

  it('非唯一索引的其他資料庫錯誤原樣重新拋出', async () => {
    findUserByEmail.mockResolvedValue(null);
    const otherError = new Error('connection lost');
    otherError.code = '08006';
    createUser.mockRejectedValue(otherError);

    await expect(
      register({ email: 'new@example.com', name: '新人', password: 'secret' }),
    ).rejects.toThrow('connection lost');
  });

  it('建立預設收藏失敗時會讓 withTransaction 重新拋出原始錯誤', async () => {
    findUserByEmail.mockResolvedValue(null);
    createUser.mockResolvedValue({ id: 'user-1', email: 'new@example.com', name: '新人' });
    const favError = new Error('預設收藏建立失敗');
    createDefaultFavoritesForNewUser.mockRejectedValueOnce(favError);

    await expect(
      register({ email: 'new@example.com', name: '新人', password: 'secret' }),
    ).rejects.toThrow('預設收藏建立失敗');
  });

  it('建立預設 Recipe 失敗時會讓 withTransaction 重新拋出原始錯誤', async () => {
    findUserByEmail.mockResolvedValue(null);
    createUser.mockResolvedValue({ id: 'user-1', email: 'new@example.com', name: '新人' });
    const recipeError = new Error('預設 Recipe 建立失敗');
    createDefaultRecipeForNewUser.mockRejectedValueOnce(recipeError);

    await expect(
      register({ email: 'new@example.com', name: '新人', password: 'secret' }),
    ).rejects.toThrow('預設 Recipe 建立失敗');
  });
});