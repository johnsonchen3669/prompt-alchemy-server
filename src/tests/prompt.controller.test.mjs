import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const promptService = require('../services/prompt.service');
const controller = require('../controllers/prompt.controller');

function createResponse() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PromptController.getPrompts', () => {
  it('將 query 透傳給 service 並回傳 200', async () => {
    const data = [{ id: 'p1' }];
    const spy = vi.spyOn(promptService, 'getPrompts').mockResolvedValue(data);
    const res = createResponse();
    await controller.getPrompts({ query: { category: 'c', tag: 't', search: 'k' } }, res, vi.fn());
    expect(spy).toHaveBeenCalledWith({ category: 'c', tag: 't', search: 'k' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data });
  });

  it('service 拋出非找不到錯誤時交給 next', async () => {
    const error = new Error('資料庫錯誤');
    vi.spyOn(promptService, 'getPrompts').mockRejectedValue(error);
    const res = createResponse();
    const next = vi.fn();
    await controller.getPrompts({ query: {} }, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });
});

describe('PromptController.getPromptById', () => {
  it('找到時回傳 200', async () => {
    vi.spyOn(promptService, 'getPromptById').mockResolvedValue({ id: 'p1' });
    const res = createResponse();
    await controller.getPromptById({ params: { id: 'p1' } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('找不到時回傳 404', async () => {
    vi.spyOn(promptService, 'getPromptById').mockRejectedValue(new Error('找不到該 Prompt'));
    const res = createResponse();
    const next = vi.fn();
    await controller.getPromptById({ params: { id: 'x' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('PromptController.incrementCopyCount', () => {
  it('成功時回傳 200 與累加訊息', async () => {
    vi.spyOn(promptService, 'incrementCopyCount').mockResolvedValue({ id: 'p1', copyCount: 3 });
    const res = createResponse();
    await controller.incrementCopyCount({ params: { id: 'p1' } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success', message: '複製次數已累加', data: { id: 'p1', copyCount: 3 },
    });
  });

  it('找不到時回傳 404', async () => {
    vi.spyOn(promptService, 'incrementCopyCount').mockRejectedValue(
      new Error('找不到該 Prompt 或未上架'),
    );
    const res = createResponse();
    const next = vi.fn();
    await controller.incrementCopyCount({ params: { id: 'x' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();
  });

  it('非找不到錯誤交給 next', async () => {
    const error = new Error('連線錯誤');
    vi.spyOn(promptService, 'incrementCopyCount').mockRejectedValue(error);
    const res = createResponse();
    const next = vi.fn();
    await controller.incrementCopyCount({ params: { id: 'p1' } }, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });
});