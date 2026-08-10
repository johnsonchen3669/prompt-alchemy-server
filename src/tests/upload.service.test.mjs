import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// upload.service 在模組載入時就會根據 env.gcp 條件 `new Storage()` 並建立 bucket，
// 且 bucket/storage 並未匯出，無法事後 spyOn。vi.mock 無法攔截 CJS 內部的 require，
// 因此這裡直接在 Node 的 require.cache 注入假的 @google-cloud/storage 與 env 模組，
// 再以全新方式載入 upload.service，使其 bucket 指向我們可控的 mock。

const storagePath = require.resolve('@google-cloud/storage');
const envPath = require.resolve('../config/env');
const uploadServicePath = require.resolve('../services/upload.service');

const handlers = {};
const blobStream = {
  on: vi.fn((event, cb) => {
    handlers[event] = cb;
    return blobStream;
  }),
  end: vi.fn(),
};
const blob = {
  name: '',
  createWriteStream: vi.fn(() => blobStream),
};
const bucket = {
  name: 'test-bucket',
  file: vi.fn((filename) => {
    blob.name = filename;
    return blob;
  }),
};
const fakeStorageInstance = { bucket: vi.fn(() => bucket) };
// 必須用一般 function（非箭頭函式）才能以 `new` 呼叫。
const Storage = vi.fn(function () {
  return fakeStorageInstance;
});
const fakeStorageModule = { Storage };

const fakeEnv = {
  gcp: {
    projectId: 'p',
    clientEmail: 'e',
    privateKey: 'k',
    bucketName: 'test-bucket',
  },
};

function installFakes() {
  require.cache[storagePath] = { exports: fakeStorageModule, loaded: true };
  require.cache[envPath] = { exports: fakeEnv, loaded: true };
  delete require.cache[uploadServicePath];
}

function loadUploadService() {
  installFakes();
  return require('../services/upload.service');
}

beforeEach(() => {
  vi.clearAllMocks();
  handlers.error = undefined;
  handlers.finish = undefined;
  fakeEnv.gcp.projectId = 'p';
  fakeEnv.gcp.clientEmail = 'e';
  fakeEnv.gcp.privateKey = 'k';
  fakeEnv.gcp.bucketName = 'test-bucket';
});

afterEach(() => {
  vi.restoreAllMocks();
  delete require.cache[storagePath];
  delete require.cache[envPath];
  delete require.cache[uploadServicePath];
});

describe('uploadService.uploadFileToBucket', () => {
  it('bucket 未設定時拋出設定錯誤', async () => {
    fakeEnv.gcp.projectId = undefined;
    fakeEnv.gcp.clientEmail = undefined;
    fakeEnv.gcp.privateKey = undefined;
    fakeEnv.gcp.bucketName = undefined;
    const { uploadFileToBucket } = loadUploadService();
    await expect(
      uploadFileToBucket({ originalname: 'a.png', mimetype: 'image/png', buffer: Buffer.from('') }),
    ).rejects.toThrow('GCP Storage 尚未設定，請檢查環境變數');
    expect(Storage).not.toHaveBeenCalled();
  });

  it('未提供檔案時拋出錯誤', async () => {
    const { uploadFileToBucket } = loadUploadService();
    await expect(uploadFileToBucket()).rejects.toThrow('未提供檔案');
  });

  it('載入時以 env 憑證初始化 Storage 並建立 bucket', () => {
    loadUploadService();
    expect(Storage).toHaveBeenCalledWith({
      projectId: 'p',
      credentials: { client_email: 'e', private_key: 'k' },
    });
    expect(fakeStorageInstance.bucket).toHaveBeenCalledWith('test-bucket');
  });

  it('成功上傳時回傳含 bucket 名稱與副檔名的公開 URL', async () => {
    const { uploadFileToBucket } = loadUploadService();
    const file = {
      originalname: 'photo.PNG',
      mimetype: 'image/png',
      buffer: Buffer.from('binary-data'),
    };

    const promise = uploadFileToBucket(file);

    expect(blob.createWriteStream).toHaveBeenCalledWith({
      resumable: false,
      contentType: 'image/png',
    });
    expect(blobStream.end).toHaveBeenCalledWith(file.buffer);

    handlers.finish();
    const url = await promise;

    expect(url).toBe(`https://storage.googleapis.com/test-bucket/${blob.name}`);
    expect(url).toMatch(/\.PNG$/);
  });

  it('stream 發生錯誤時以包裝訊息 reject', async () => {
    const { uploadFileToBucket } = loadUploadService();
    const file = { originalname: 'a.txt', mimetype: 'text/plain', buffer: Buffer.from('x') };

    const promise = uploadFileToBucket(file);
    handlers.error(new Error('network down'));

    await expect(promise).rejects.toThrow('檔案上傳失敗: network down');
  });
});