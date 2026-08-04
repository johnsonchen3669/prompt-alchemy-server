import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const faqService = require('../services/faq.service');
const controller = require('../controllers/faq.controller');

function createResponse() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('FaqController.getFaqs', () => {
  it('回傳 200 與啟用中 FAQ 清單', async () => {
    const data = [{ id: 'faq-1', question: 'Q', answer: 'A' }];
    const spy = vi.spyOn(faqService, 'getActiveFaqs').mockResolvedValue(data);
    const res = createResponse();
    await controller.getFaqs({}, res, vi.fn());
    expect(spy).toHaveBeenCalledWith();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data });
  });

  it('service 拋出錯誤時交給 next', async () => {
    const error = new Error('資料庫錯誤');
    vi.spyOn(faqService, 'getActiveFaqs').mockRejectedValue(error);
    const res = createResponse();
    const next = vi.fn();
    await controller.getFaqs({}, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });
});