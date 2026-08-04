import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const contactRepository = require('../database/repositories/contact.repository');

function executorReturning(rows) {
  return { query: vi.fn().mockResolvedValue({ rows }) };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ContactRepository.create', () => {
  it('以 pending 狀態 INSERT 並回傳 camelCase 映射結果', async () => {
    const executor = executorReturning([{
      id: 'c1', name: '小明', email: 'a@b.com', message: '嗨',
      status: 'pending', created_at: 't1', updated_at: 't2',
    }]);

    const result = await contactRepository.create(
      { name: '小明', email: 'a@b.com', message: '嗨' },
      executor,
    );

    expect(executor.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO contacts (name, email, message, status)'),
      ['小明', 'a@b.com', '嗨'],
    );
    expect(executor.query).toHaveBeenCalledWith(
      expect.stringContaining("'pending'"),
      ['小明', 'a@b.com', '嗨'],
    );
    expect(result).toEqual({
      id: 'c1', name: '小明', email: 'a@b.com', message: '嗨',
      status: 'pending', createdAt: 't1', updatedAt: 't2',
    });
  });
});

describe('ContactRepository.findAllForAdmin', () => {
  it('不帶篩選時只查全部並依建立時間遞減排序', async () => {
    const executor = executorReturning([{ id: 'c1' }]);
    await contactRepository.findAllForAdmin({}, executor);
    const [sql, params] = executor.query.mock.calls[0];
    expect(sql).toBe('SELECT * FROM contacts WHERE 1=1 ORDER BY created_at DESC');
    expect(params).toEqual([]);
  });

  it('status 非 all 時加入 status 篩選條件', async () => {
    const executor = executorReturning([]);
    await contactRepository.findAllForAdmin({ status: 'pending' }, executor);
    expect(executor.query).toHaveBeenCalledWith(
      expect.stringContaining('AND status = $1'),
      ['pending'],
    );
  });

  it('status 為 all 時不加 status 篩選', async () => {
    const executor = executorReturning([]);
    await contactRepository.findAllForAdmin({ status: 'all' }, executor);
    const [sql] = executor.query.mock.calls[0];
    expect(sql).not.toContain('AND status = $1');
  });

  it('keyword 會以 ILIKE 搜尋 name/email/message 並 trim 空白', async () => {
    const executor = executorReturning([]);
    await contactRepository.findAllForAdmin({ keyword: '  嗨  ' }, executor);
    expect(executor.query).toHaveBeenCalledWith(
      expect.stringContaining('(name ILIKE $1 OR email ILIKE $1 OR message ILIKE $1)'),
      ['%嗨%'],
    );
  });

  it('同時帶 status 與 keyword 時參數索引遞增', async () => {
    const executor = executorReturning([]);
    await contactRepository.findAllForAdmin({ status: 'resolved', keyword: '嗨' }, executor);
    const [sql, params] = executor.query.mock.calls[0];
    expect(sql).toContain('AND status = $1');
    expect(sql).toContain('(name ILIKE $2 OR email ILIKE $2 OR message ILIKE $2)');
    expect(params).toEqual(['resolved', '%嗨%']);
  });

  it('將每筆 row 映射為 camelCase', async () => {
    const executor = executorReturning([{
      id: 'c1', name: '小明', email: 'a@b.com', message: '嗨',
      status: 'pending', created_at: 't1', updated_at: 't2',
    }]);
    const result = await contactRepository.findAllForAdmin({}, executor);
    expect(result[0]).toMatchObject({ id: 'c1', createdAt: 't1', updatedAt: 't2' });
  });
});

describe('ContactRepository.findById', () => {
  it('以參數化 ID 查詢並回傳映射結果', async () => {
    const executor = executorReturning([{
      id: 'c1', name: '小明', email: 'a@b.com', message: '嗨',
      status: 'pending', created_at: 't1', updated_at: 't2',
    }]);
    const result = await contactRepository.findById('c1', executor);
    expect(executor.query).toHaveBeenCalledWith('SELECT * FROM contacts WHERE id = $1', ['c1']);
    expect(result.id).toBe('c1');
  });

  it('查無資料時回傳 null', async () => {
    const executor = executorReturning([]);
    const result = await contactRepository.findById('missing', executor);
    expect(result).toBeNull();
  });
});

describe('ContactRepository.updateStatus', () => {
  it('更新狀態與 updated_at 並回傳映射結果', async () => {
    const executor = executorReturning([{
      id: 'c1', name: '小明', email: 'a@b.com', message: '嗨',
      status: 'resolved', created_at: 't1', updated_at: 't2',
    }]);
    const result = await contactRepository.updateStatus('c1', 'resolved', executor);
    expect(executor.query).toHaveBeenCalledWith(
      expect.stringContaining('SET status = $1, updated_at = now()'),
      ['resolved', 'c1'],
    );
    expect(result.status).toBe('resolved');
  });
});

describe('ContactRepository.delete', () => {
  it('實體刪除並回傳被刪除的映射資料', async () => {
    const executor = executorReturning([{
      id: 'c1', name: '小明', email: 'a@b.com', message: '嗨',
      status: 'pending', created_at: 't1', updated_at: 't2',
    }]);
    const result = await contactRepository.delete('c1', executor);
    expect(executor.query).toHaveBeenCalledWith(
      'DELETE FROM contacts WHERE id = $1 RETURNING *',
      ['c1'],
    );
    expect(result.id).toBe('c1');
  });

  it('查無資料時回傳 null', async () => {
    const executor = executorReturning([]);
    expect(await contactRepository.delete('missing', executor)).toBeNull();
  });
});