import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// env.js 於載入時會 require('dotenv').config(...) 讀取 .env.<NODE_ENV>。
// 為了讓測試可控，注入假的 dotenv（config 為 no-op），並直接控制 process.env，
// 再以全新方式載入 env.js。vi.mock 無法攔截 CJS 內部 require，故改用 require.cache 注入。

const dotenvPath = require.resolve('dotenv');
const envPath = require.resolve('../config/env');

const saved = {};

function saveEnv() {
  for (const key of [
    'NODE_ENV', 'JWT_SECRET', 'PORT', 'DATABASE_URL',
    'GCP_PROJECT_ID', 'GCP_CLIENT_EMAIL', 'GCP_PRIVATE_KEY', 'GCP_BUCKET_NAME',
  ]) {
    saved[key] = process.env[key];
  }
}

function restoreEnv() {
  for (const key of Object.keys(saved)) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
}

const fakeDotenv = { config: vi.fn(() => ({ parsed: {} })) };

beforeEach(() => {
  saveEnv();
  // 注入假的 dotenv 並清除 env 快取
  require.cache[dotenvPath] = { exports: fakeDotenv, loaded: true };
  delete require.cache[envPath];
  fakeDotenv.config.mockClear();
});

afterEach(() => {
  restoreEnv();
  delete require.cache[dotenvPath];
  delete require.cache[envPath];
});

function loadEnv() {
  delete require.cache[envPath];
  return require('../config/env');
}

describe('env config — 預設與映射', () => {
  it('NODE_ENV 未設定時預設為 development', () => {
    delete process.env.NODE_ENV;
    const env = loadEnv();
    expect(env.nodeEnv).toBe('development');
  });

  it('匯出 nodeEnv、JWT_SECRET、databaseUrl 與 gcp 區塊', () => {
    process.env.NODE_ENV = 'development';
    process.env.JWT_SECRET = 'dev-secret';
    process.env.DATABASE_URL = 'postgres://localhost/db';
    process.env.GCP_PROJECT_ID = 'p';
    process.env.GCP_CLIENT_EMAIL = 'e@g.com';
    process.env.GCP_PRIVATE_KEY = 'k';
    process.env.GCP_BUCKET_NAME = 'b';
    const env = loadEnv();
    expect(env.nodeEnv).toBe('development');
    expect(env.JWT_SECRET).toBe('dev-secret');
    expect(env.databaseUrl).toBe('postgres://localhost/db');
    expect(env.gcp).toEqual({
      projectId: 'p', clientEmail: 'e@g.com', privateKey: 'k', bucketName: 'b',
    });
  });

  it('PORT 為數字，未設定時預設 3000', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.PORT;
    expect(loadEnv().port).toBe(3000);

    process.env.PORT = '4000';
    expect(loadEnv().port).toBe(4000);
    expect(typeof loadEnv().port).toBe('number');
  });

  it('GCP 環境變數未設定時 gcp 各欄位為 undefined', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.GCP_PROJECT_ID;
    delete process.env.GCP_CLIENT_EMAIL;
    delete process.env.GCP_PRIVATE_KEY;
    delete process.env.GCP_BUCKET_NAME;
    const env = loadEnv();
    expect(env.gcp).toEqual({
      projectId: undefined, clientEmail: undefined, privateKey: undefined, bucketName: undefined,
    });
  });

  it('以 NODE_ENV 決定 dotenv 載入的檔案路徑', () => {
    process.env.NODE_ENV = 'staging';
    loadEnv();
    expect(fakeDotenv.config).toHaveBeenCalledWith({
      path: expect.stringContaining('.env.staging'),
    });
  });
});

describe('env config — production 必要變數檢查', () => {
  it('production 缺少 JWT_SECRET 與 DATABASE_URL 時拋出錯誤', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    delete process.env.DATABASE_URL;
    expect(() => loadEnv()).toThrow(/production 環境缺少必要環境變數：JWT_SECRET, DATABASE_URL/);
  });

  it('production 僅缺少 JWT_SECRET 時錯誤訊息只列該變數', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    process.env.DATABASE_URL = 'postgres://localhost/db';
    expect(() => loadEnv()).toThrow(/缺少必要環境變數：JWT_SECRET/);
    expect(() => loadEnv()).not.toThrow(/DATABASE_URL/);
  });

  it('production 必要變數齊全時不拋錯', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'prod-secret';
    process.env.DATABASE_URL = 'postgres://localhost/db';
    const env = loadEnv();
    expect(env.JWT_SECRET).toBe('prod-secret');
  });
});