import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const faqService = require('../services/faq.service');
const controller = require('../controllers/admin/faq.controller');

function createResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis()
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AdminFaqController', () => {
  it('取得 FAQ 清單時回傳 200', async () => {
    const data = [{ id: 'faq-1' }];
    vi.spyOn(faqService, 'getFaqsForAdmin').mockResolvedValue(data);
    const res = createResponse();
    const next = vi.fn();

    await controller.getFaqs({}, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data });
    expect(next).not.toHaveBeenCalled();
  });

  it('取得單筆 FAQ 時會傳入 id', async () => {
    const data = { id: 'faq-1' };
    vi.spyOn(faqService, 'getFaqByIdForAdmin').mockResolvedValue(data);
    const res = createResponse();

    await controller.getFaqById(
      { params: { id: 'faq-1' } },
      res,
      vi.fn()
    );

    expect(faqService.getFaqByIdForAdmin).toHaveBeenCalledWith('faq-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data });
  });

  it('建立 FAQ 成功時回傳 201', async () => {
    const body = { question: '問題', answer: '答案' };
    const data = { id: 'faq-1', ...body };
    vi.spyOn(faqService, 'createFaq').mockResolvedValue(data);
    const res = createResponse();

    await controller.createFaq({ body }, res, vi.fn());

    expect(faqService.createFaq).toHaveBeenCalledWith(body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      message: '建立 FAQ 成功',
      data
    });
  });

  it('驗證錯誤時回傳 400', async () => {
    const error = new Error('question 為必填且不可為空白');
    vi.spyOn(faqService, 'createFaq').mockRejectedValue(error);
    const res = createResponse();
    const next = vi.fn();

    await controller.createFaq({ body: {} }, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: error.message
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('更新時會傳入 id 與 request body', async () => {
    const body = { sortOrder: 2 };
    const data = { id: 'faq-1', sortOrder: 2 };
    vi.spyOn(faqService, 'updateFaq').mockResolvedValue(data);
    const res = createResponse();

    await controller.updateFaq(
      { params: { id: 'faq-1' }, body },
      res,
      vi.fn()
    );

    expect(faqService.updateFaq).toHaveBeenCalledWith('faq-1', body);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('查無 FAQ 時回傳 404', async () => {
    vi.spyOn(faqService, 'getFaqByIdForAdmin').mockRejectedValue(
      new Error('找不到 FAQ')
    );
    const res = createResponse();
    const next = vi.fn();

    await controller.getFaqById({ params: { id: 'missing' } }, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: '找不到 FAQ'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('刪除 FAQ 成功時回傳 200', async () => {
    const data = { id: 'faq-1', isActive: false };
    vi.spyOn(faqService, 'deleteFaq').mockResolvedValue(data);
    const res = createResponse();

    await controller.deleteFaq(
      { params: { id: 'faq-1' } },
      res,
      vi.fn()
    );

    expect(faqService.deleteFaq).toHaveBeenCalledWith('faq-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      message: '刪除 FAQ 成功',
      data
    });
  });

  it('非預期錯誤會交給 next', async () => {
    const error = new Error('資料庫錯誤');
    vi.spyOn(faqService, 'getFaqsForAdmin').mockRejectedValue(error);
    const res = createResponse();
    const next = vi.fn();

    await controller.getFaqs({}, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });
});
