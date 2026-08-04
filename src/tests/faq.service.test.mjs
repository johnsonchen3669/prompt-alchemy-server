import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const faqRepository = require('../database/repositories/faq.repository');
const faqService = require('../services/faq.service');

function makeRow(overrides = {}) {
  return {
    id: 'faq-1',
    question: 'Q?',
    answer: 'A.',
    sort_order: 0,
    is_active: true,
    created_at: '2026-08-01T00:00:00.000Z',
    updated_at: '2026-08-02T00:00:00.000Z',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('FaqService.getActiveFaqs', () => {
  it('只回傳 id、question、answer 三個公開欄位', async () => {
    const spy = vi.spyOn(faqRepository, 'findActive').mockResolvedValue([
      makeRow({ id: 'faq-1', sort_order: 5, is_active: true }),
      makeRow({ id: 'faq-2', question: 'Q2?', answer: 'A2.' }),
    ]);

    const result = await faqService.getActiveFaqs();

    expect(spy).toHaveBeenCalledWith();
    expect(result).toEqual([
      { id: 'faq-1', question: 'Q?', answer: 'A.' },
      { id: 'faq-2', question: 'Q2?', answer: 'A2.' },
    ]);
    // 確認不會洩漏後台欄位
    expect(result[0]).not.toHaveProperty('sortOrder');
    expect(result[0]).not.toHaveProperty('isActive');
    expect(result[0]).not.toHaveProperty('createdAt');
  });

  it('沒有啟用中 FAQ 時回傳空陣列', async () => {
    vi.spyOn(faqRepository, 'findActive').mockResolvedValue([]);
    const result = await faqService.getActiveFaqs();
    expect(result).toEqual([]);
  });
});

describe('FaqService.getFaqsForAdmin', () => {
  it('將 snake_case 欄位轉為 camelCase 後台格式', async () => {
    vi.spyOn(faqRepository, 'findAllForAdmin').mockResolvedValue([makeRow()]);

    const result = await faqService.getFaqsForAdmin();

    expect(result).toEqual([{
      id: 'faq-1',
      question: 'Q?',
      answer: 'A.',
      sortOrder: 0,
      isActive: true,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-02T00:00:00.000Z',
    }]);
  });
});

describe('FaqService.getFaqByIdForAdmin', () => {
  it('找到時回傳後台格式', async () => {
    const spy = vi.spyOn(faqRepository, 'findByIdForAdmin').mockResolvedValue(makeRow());
    const result = await faqService.getFaqByIdForAdmin('faq-1');
    expect(spy).toHaveBeenCalledWith('faq-1');
    expect(result).toMatchObject({ id: 'faq-1', sortOrder: 0, isActive: true });
  });

  it('查無 FAQ 時拋出可轉換為 404 的錯誤', async () => {
    vi.spyOn(faqRepository, 'findByIdForAdmin').mockResolvedValue(null);
    await expect(faqService.getFaqByIdForAdmin('missing')).rejects.toThrow('找不到 FAQ');
  });
});

describe('FaqService.createFaq', () => {
  it('必填欄位齊全時以預設值建立 FAQ', async () => {
    const create = vi.spyOn(faqRepository, 'create').mockResolvedValue(makeRow({ sort_order: 0, is_active: true }));

    const result = await faqService.createFaq({ question: 'Q?', answer: 'A.' });

    expect(create).toHaveBeenCalledWith({
      question: 'Q?',
      answer: 'A.',
      sort_order: 0,
      is_active: true,
    });
    expect(result).toMatchObject({ id: 'faq-1', sortOrder: 0, isActive: true });
  });

  it('明確傳入 sortOrder 與 isActive 時照傳入值建立', async () => {
    const create = vi.spyOn(faqRepository, 'create').mockResolvedValue(makeRow({ sort_order: 3, is_active: false }));

    await faqService.createFaq({ question: 'Q?', answer: 'A.', sortOrder: 3, isActive: false });

    expect(create).toHaveBeenCalledWith({
      question: 'Q?',
      answer: 'A.',
      sort_order: 3,
      is_active: false,
    });
  });

  it('question 為空白字串時拋出錯誤', async () => {
    await expect(faqService.createFaq({ question: '   ', answer: 'A.' })).rejects.toThrow('question 為必填且不可為空白');
  });

  it('answer 為空白字串時拋出錯誤', async () => {
    await expect(faqService.createFaq({ question: 'Q?', answer: '' })).rejects.toThrow('answer 為必填且不可為空白');
  });

  it('question 不是字串時拋出錯誤', async () => {
    await expect(faqService.createFaq({ question: 123, answer: 'A.' })).rejects.toThrow('question 為必填且不可為空白');
  });

  it('sortOrder 為負數時拋出錯誤', async () => {
    await expect(
      faqService.createFaq({ question: 'Q?', answer: 'A.', sortOrder: -1 }),
    ).rejects.toThrow('sortOrder 必須是大於或等於 0 的整數');
  });

  it('sortOrder 為小數時拋出錯誤', async () => {
    await expect(
      faqService.createFaq({ question: 'Q?', answer: 'A.', sortOrder: 1.5 }),
    ).rejects.toThrow('sortOrder 必須是大於或等於 0 的整數');
  });

  it('isActive 非 boolean 時拋出錯誤', async () => {
    await expect(
      faqService.createFaq({ question: 'Q?', answer: 'A.', isActive: 'yes' }),
    ).rejects.toThrow('isActive 必須是 boolean');
  });

  it('data 非 object（陣列）時拋出格式錯誤', async () => {
    await expect(faqService.createFaq([])).rejects.toThrow('FAQ 資料格式錯誤');
  });

  it('data 為 null 時拋出格式錯誤', async () => {
    await expect(faqService.createFaq(null)).rejects.toThrow('FAQ 資料格式錯誤');
  });
});

describe('FaqService.updateFaq', () => {
  it('部分更新僅傳入 question 時只更新 question', async () => {
    vi.spyOn(faqRepository, 'findByIdForAdmin').mockResolvedValue(makeRow());
    const update = vi.spyOn(faqRepository, 'update').mockResolvedValue(makeRow({ question: '新 Q?' }));

    const result = await faqService.updateFaq('faq-1', { question: '新 Q?' });

    expect(update).toHaveBeenCalledWith('faq-1', { question: '新 Q?' });
    expect(result).toMatchObject({ question: '新 Q?' });
  });

  it('同時更新 question、answer、sortOrder、isActive 多欄位', async () => {
    vi.spyOn(faqRepository, 'findByIdForAdmin').mockResolvedValue(makeRow());
    const update = vi.spyOn(faqRepository, 'update').mockResolvedValue(makeRow());

    await faqService.updateFaq('faq-1', {
      question: 'Q2?',
      answer: 'A2.',
      sortOrder: 7,
      isActive: false,
    });

    expect(update).toHaveBeenCalledWith('faq-1', {
      question: 'Q2?',
      answer: 'A2.',
      sort_order: 7,
      is_active: false,
    });
  });

  it('查無既有 FAQ 時拋出 404 錯誤', async () => {
    vi.spyOn(faqRepository, 'findByIdForAdmin').mockResolvedValue(null);

    await expect(
      faqService.updateFaq('missing', { question: 'Q2?' }),
    ).rejects.toThrow('找不到 FAQ');
  });

  it('未帶任何可更新欄位時拋出錯誤', async () => {
    vi.spyOn(faqRepository, 'findByIdForAdmin').mockResolvedValue(makeRow());

    await expect(
      faqService.updateFaq('faq-1', {}),
    ).rejects.toThrow('沒有可更新的 FAQ 欄位');
  });

  it('部分更新時空白 question 仍拋出錯誤', async () => {
    vi.spyOn(faqRepository, 'findByIdForAdmin').mockResolvedValue(makeRow());

    await expect(
      faqService.updateFaq('faq-1', { question: '   ' }),
    ).rejects.toThrow('question 為必填且不可為空白');
  });
});

describe('FaqService.deleteFaq', () => {
  it('軟刪除成功時回傳後台格式', async () => {
    const spy = vi.spyOn(faqRepository, 'softDelete').mockResolvedValue(makeRow({ is_active: false }));

    const result = await faqService.deleteFaq('faq-1');

    expect(spy).toHaveBeenCalledWith('faq-1');
    expect(result).toMatchObject({ id: 'faq-1', isActive: false });
  });

  it('查無 FAQ 時拋出 404 錯誤', async () => {
    vi.spyOn(faqRepository, 'softDelete').mockResolvedValue(null);

    await expect(faqService.deleteFaq('missing')).rejects.toThrow('找不到 FAQ');
  });
});
