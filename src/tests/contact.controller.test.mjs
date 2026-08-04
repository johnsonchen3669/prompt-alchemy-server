import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const contactService = require('../services/contact.service');
const controller = require('../controllers/contact.controller');

function createResponse() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ContactController.createContact', () => {
  it('成功時回傳 201 與成功訊息', async () => {
    const data = { id: 'c1', name: '小明', email: 'a@b.com', message: '嗨' };
    vi.spyOn(contactService, 'createContact').mockResolvedValue(data);
    const res = createResponse();
    await controller.createContact({ body: { name: '小明', email: 'a@b.com', message: '嗨' } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success', message: '聯絡表單已成功送出', data,
    });
  });

  it('驗證錯誤（含「請輸入」）時回傳 400', async () => {
    vi.spyOn(contactService, 'createContact').mockRejectedValue(
      Object.assign(new Error('請輸入名稱'), { status: 400 }),
    );
    const res = createResponse();
    const next = vi.fn();
    await controller.createContact({ body: {} }, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ status: 'error', message: '請輸入名稱' });
    expect(next).not.toHaveBeenCalled();
  });

  it('非驗證類錯誤交給 next', async () => {
    const error = new Error('資料庫錯誤');
    vi.spyOn(contactService, 'createContact').mockRejectedValue(error);
    const res = createResponse();
    const next = vi.fn();
    await controller.createContact({ body: {} }, res, next);
    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });
});