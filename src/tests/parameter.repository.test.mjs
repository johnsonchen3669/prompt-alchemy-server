import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const parameterRepository = require('../database/repositories/parameter.repository');

function executorReturning(rows) {
  return { query: vi.fn().mockResolvedValue({ rows }) };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ParameterRepository.findAll', () => {
  it('不帶 type 時查全部並依 sort_order 排序', async () => {
    const executor = executorReturning([{ id: 'p1' }]);
    await parameterRepository.findAll(undefined, executor);
    expect(executor.query).toHaveBeenCalledWith(
      'SELECT * FROM parameters ORDER BY sort_order ASC',
      [],
    );
  });

  it('帶 type 時加入 WHERE 條件', async () => {
    const executor = executorReturning([]);
    await parameterRepository.findAll('tag', executor);
    expect(executor.query).toHaveBeenCalledWith(
      'SELECT * FROM parameters WHERE type = $1 ORDER BY sort_order ASC',
      ['tag'],
    );
  });
});

describe('ParameterRepository.findById', () => {
  it('以參數化 ID 查詢', async () => {
    const executor = executorReturning([{ id: 'p1', type: 'tag', name: 'X' }]);
    const result = await parameterRepository.findById('p1', executor);
    expect(executor.query).toHaveBeenCalledWith('SELECT * FROM parameters WHERE id = $1', ['p1']);
    expect(result.id).toBe('p1');
  });

  it('查無資料時回傳 null', async () => {
    const executor = executorReturning([]);
    expect(await parameterRepository.findById('missing', executor)).toBeNull();
  });
});

describe('ParameterRepository.create', () => {
  it('完整欄位時以傳入值 INSERT', async () => {
    const executor = executorReturning([{ id: 'p1' }]);
    await parameterRepository.create(
      { type: 'tag', name: '推薦', memo: '精選', is_active: false, sort_order: 3 },
      executor,
    );
    expect(executor.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO parameters (type, name, memo, is_active, sort_order)'),
      ['tag', '推薦', '精選', false, 3],
    );
  });

  it('memo/is_active/sort_order 缺漏時使用預設值', async () => {
    const executor = executorReturning([{ id: 'p1' }]);
    await parameterRepository.create({ type: 'tag', name: '推薦' }, executor);
    expect(executor.query).toHaveBeenCalledWith(
      expect.any(String),
      ['tag', '推薦', '', true, 0],
    );
  });

  it('查無回傳資料時回傳 null', async () => {
    const executor = executorReturning([]);
    expect(await parameterRepository.create({ type: 'tag', name: 'X' }, executor)).toBeNull();
  });
});

describe('ParameterRepository.update', () => {
  it('僅更新傳入的白名單欄位並以 id 為最後參數', async () => {
    const executor = executorReturning([{ id: 'p1' }]);
    await parameterRepository.update('p1', { name: '新名', is_active: false }, executor);
    const [sql, params] = executor.query.mock.calls[0];
    expect(sql).toContain('name = $1');
    expect(sql).toContain('is_active = $2');
    expect(sql).toContain('WHERE id = $3');
    expect(params).toEqual(['新名', false, 'p1']);
  });

  it('含 memo 與 sort_order 時一并更新', async () => {
    const executor = executorReturning([{ id: 'p1' }]);
    await parameterRepository.update('p1', { memo: '備註', sort_order: 9 }, executor);
    const [sql, params] = executor.query.mock.calls[0];
    expect(sql).toContain('memo = $1');
    expect(sql).toContain('sort_order = $2');
    expect(params).toEqual(['備註', 9, 'p1']);
  });

  it('未帶任何可更新欄位時退回 findById', async () => {
    const executor = executorReturning([{ id: 'p1' }]);
    const result = await parameterRepository.update('p1', {}, executor);
    expect(executor.query).toHaveBeenCalledWith('SELECT * FROM parameters WHERE id = $1', ['p1']);
    expect(result.id).toBe('p1');
  });

  it('更新回傳空時回傳 null', async () => {
    const executor = executorReturning([]);
    expect(await parameterRepository.update('p1', { name: '新' }, executor)).toBeNull();
  });
});