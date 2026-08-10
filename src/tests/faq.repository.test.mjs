import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const faqRepository = require('../database/repositories/faq.repository');

function executorReturning(rows) {
  return { query: vi.fn().mockResolvedValue({ rows }) };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('FaqRepository', () => {
  it('以 class instance 形式匯出 FAQ repository', () => {
    expect(faqRepository).toBeDefined();
    expect(faqRepository.constructor.name).toBe('FaqRepository');
  });

  it('findActive 只查詢已啟用 FAQ，並依 sort_order、created_at、id 穩定排序', async () => {
    const executor = executorReturning([{ id: 'faq-1' }]);
    const result = await faqRepository.findActive(executor);
    expect(executor.query).toHaveBeenCalledWith(
      'SELECT * FROM faqs WHERE is_active = true ORDER BY sort_order ASC, created_at ASC, id ASC',
    );
    expect(result).toEqual([{ id: 'faq-1' }]);
  });

  it('findActive 不傳 executor 時使用預設 db', async () => {
    const db = require('../database/db');
    const spy = vi.spyOn(db, 'query').mockResolvedValue({ rows: [] });
    await faqRepository.findActive();
    expect(spy).toHaveBeenCalled();
  });

  it('findAllForAdmin 會包含啟用與已軟刪除 FAQ，啟用者優先', async () => {
    const executor = executorReturning([{ id: 'faq-1' }, { id: 'faq-2' }]);
    const result = await faqRepository.findAllForAdmin(executor);
    expect(executor.query).toHaveBeenCalledWith(
      'SELECT * FROM faqs ORDER BY is_active DESC, sort_order ASC, created_at ASC, id ASC',
    );
    expect(result).toHaveLength(2);
  });

  it('findByIdForAdmin 使用參數化 ID 查詢，找不到回傳 null', async () => {
    const executor = executorReturning([]);
    const result = await faqRepository.findByIdForAdmin('missing', executor);
    expect(executor.query).toHaveBeenCalledWith('SELECT * FROM faqs WHERE id = $1', ['missing']);
    expect(result).toBeNull();
  });

  it('create 使用參數化 INSERT 並回傳新資料，is_active 預設為 true', async () => {
    const executor = executorReturning([{ id: 'faq-1', is_active: true }]);
    const result = await faqRepository.create(
      { question: 'Q', answer: 'A', sort_order: 0 },
      executor,
    );
    expect(executor.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO faqs (question, answer, sort_order, is_active)'),
      ['Q', 'A', 0, true],
    );
    expect(result.id).toBe('faq-1');
  });

  it('create 明確傳入 is_active 時照傳入值', async () => {
    const executor = executorReturning([{ id: 'faq-1', is_active: false }]);
    await faqRepository.create(
      { question: 'Q', answer: 'A', sort_order: 2, is_active: false },
      executor,
    );
    expect(executor.query).toHaveBeenCalledWith(expect.any(String), ['Q', 'A', 2, false]);
  });

  it('update 只更新白名單欄位並同步 updated_at，以 id 為最後參數', async () => {
    const executor = executorReturning([{ id: 'faq-1' }]);
    await faqRepository.update('faq-1', { question: '新 Q', is_active: false }, executor);
    const [sql, params] = executor.query.mock.calls[0];
    expect(sql).toContain('question = $1');
    expect(sql).toContain('is_active = $2');
    expect(sql).toContain('updated_at = now()');
    expect(sql).toContain('WHERE id = $3');
    expect(params).toEqual(['新 Q', false, 'faq-1']);
  });

  it('update 未帶任何白名單欄位時退回 findByIdForAdmin', async () => {
    const executor = executorReturning([{ id: 'faq-1' }]);
    const result = await faqRepository.update('faq-1', { unknown: 'x' }, executor);
    expect(executor.query).toHaveBeenCalledWith('SELECT * FROM faqs WHERE id = $1', ['faq-1']);
    expect(result.id).toBe('faq-1');
  });

  it('update 回傳空時回傳 null', async () => {
    const executor = executorReturning([]);
    expect(await faqRepository.update('faq-1', { question: 'Q' }, executor)).toBeNull();
  });

  it('softDelete 將 FAQ 設為停用並更新 updated_at', async () => {
    const executor = executorReturning([{ id: 'faq-1', is_active: false }]);
    const result = await faqRepository.softDelete('faq-1', executor);
    expect(executor.query).toHaveBeenCalledWith(
      expect.stringContaining('SET is_active = false, updated_at = now()'),
      ['faq-1'],
    );
    expect(result.is_active).toBe(false);
  });

  it('softDelete 查無資料時回傳 null', async () => {
    const executor = executorReturning([]);
    expect(await faqRepository.softDelete('missing', executor)).toBeNull();
  });
});
