import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const multer = require('multer');
const errorHandler = require('../middlewares/errorHandler');

function createResponse({ headersSent = false } = {}) {
  return {
    headersSent,
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis()
  };
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('errorHandler', () => {
  it('已送出 headers 時將錯誤傳給 Express', () => {
    const error = new Error('錯誤');
    const res = createResponse({ headersSent: true });
    const next = vi.fn();

    errorHandler(error, {}, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('錯誤 JSON 回傳 400', () => {
    const error = Object.assign(new SyntaxError('Unexpected token'), {
      type: 'entity.parse.failed',
      status: 400
    });
    const res = createResponse();

    errorHandler(error, {}, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'JSON 格式錯誤'
    });
  });

  it('NOT_FOUND 回傳 404', () => {
    const error = Object.assign(new Error('找不到指定的技能'), {
      code: 'NOT_FOUND'
    });
    const res = createResponse();

    errorHandler(error, {}, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: '找不到指定的技能'
    });
  });

  it('PostgreSQL CHECK constraint 錯誤回傳 400', () => {
    const error = Object.assign(new Error('constraint violation'), {
      code: '23514'
    });
    const res = createResponse();

    errorHandler(error, {}, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: '欄位值不符合資料庫限制'
    });
  });

  it('檔案超過限制時回傳 413', () => {
    const error = new multer.MulterError('LIMIT_FILE_SIZE');
    const res = createResponse();

    errorHandler(error, {}, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: '上傳檔案超過大小限制'
    });
  });

  it('其他 Multer 錯誤回傳 400', () => {
    const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE');
    const res = createResponse();

    errorHandler(error, {}, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('使用錯誤物件的 HTTP status', () => {
    const error = Object.assign(new Error('無效的處理狀態'), {
      status: 400
    });
    const res = createResponse();

    errorHandler(error, {}, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: '無效的處理狀態'
    });
  });

  it('未預期錯誤不暴露內部訊息並回傳 500', () => {
    const res = createResponse();

    errorHandler(new Error('敏感的資料庫錯誤'), {}, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: '伺服器發生未預期的錯誤'
    });
  });
});
