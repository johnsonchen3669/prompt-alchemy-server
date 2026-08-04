import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const promptRepository = require('../database/repositories/prompt.repository');

function executorReturning(rows) {
  return { query: vi.fn().mockResolvedValue({ rows }) };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PromptRepository.findActivePrompts', () => {
  it('不帶篩選時只查啟用中 Prompt', async () => {
    const executor = executorReturning([{ id: 'p1' }]);
    await promptRepository.findActivePrompts({}, executor);
    const [sql, params] = executor.query.mock.calls[0];
    expect(sql).toContain('WHERE s.is_active = true');
    expect(sql).toContain('ORDER BY s.created_at DESC');
    expect(params).toEqual([]);
  });

  it('帶 category 時加入 category 範圍條件', async () => {
    const executor = executorReturning([]);
    await promptRepository.findActivePrompts({ category: 'cat-1' }, executor);
    const [sql, params] = executor.query.mock.calls[0];
    expect(sql).toContain('AND s.category_id = $1');
    expect(params).toEqual(['cat-1']);
  });

  it('帶 tag 時加入 EXISTS 子查詢', async () => {
    const executor = executorReturning([]);
    await promptRepository.findActivePrompts({ tag: 'tag-1' }, executor);
    const [sql, params] = executor.query.mock.calls[0];
    expect(sql).toContain('EXISTS (');
    expect(sql).toContain('t.tag_id = $1');
    expect(params).toEqual(['tag-1']);
  });

  it('帶 search 時以 ILIKE 搜尋 title/intro/prompt_content', async () => {
    const executor = executorReturning([]);
    await promptRepository.findActivePrompts({ search: 'kw' }, executor);
    const [sql, params] = executor.query.mock.calls[0];
    expect(sql).toContain('s.title ILIKE $1');
    expect(params).toEqual(['%kw%']);
  });

  it('同時帶 category、tag、search 時參數索引遞增', async () => {
    const executor = executorReturning([]);
    await promptRepository.findActivePrompts(
      { category: 'cat', tag: 'tag', search: 'kw' },
      executor,
    );
    const [sql, params] = executor.query.mock.calls[0];
    expect(sql).toContain('s.category_id = $1');
    expect(sql).toContain('t.tag_id = $2');
    expect(sql).toContain('ILIKE $3');
    expect(params).toEqual(['cat', 'tag', '%kw%']);
  });
});

describe('PromptRepository.findActiveById', () => {
  it('以 ID 查詢啟用中 Prompt', async () => {
    const executor = executorReturning([{ id: 'p1' }]);
    const result = await promptRepository.findActiveById('p1', executor);
    const [sql, params] = executor.query.mock.calls[0];
    expect(sql).toContain('WHERE s.id = $1 AND s.is_active = true');
    expect(params).toEqual(['p1']);
    expect(result.id).toBe('p1');
  });

  it('查無時回傳 null', async () => {
    const executor = executorReturning([]);
    expect(await promptRepository.findActiveById('x', executor)).toBeNull();
  });
});

describe('PromptRepository.incrementCopyCount', () => {
  it('累加啟用中 Prompt 的複製次數', async () => {
    const executor = executorReturning([{ id: 'p1', copy_count: 5 }]);
    const result = await promptRepository.incrementCopyCount('p1', executor);
    const [sql, params] = executor.query.mock.calls[0];
    expect(sql).toContain('SET copy_count = copy_count + 1');
    expect(sql).toContain('WHERE id = $1 AND is_active = true');
    expect(params).toEqual(['p1']);
    expect(result).toEqual({ id: 'p1', copy_count: 5 });
  });

  it('查無或未上架時回傳 null', async () => {
    const executor = executorReturning([]);
    expect(await promptRepository.incrementCopyCount('x', executor)).toBeNull();
  });
});

describe('PromptRepository.findAllForAdmin', () => {
  it('不帶篩選時查全部', async () => {
    const executor = executorReturning([{ id: 'p1' }]);
    await promptRepository.findAllForAdmin({}, executor);
    const [sql, params] = executor.query.mock.calls[0];
    expect(sql).toContain('WHERE 1=1');
    expect(sql).toContain('ORDER BY s.updated_at DESC');
    expect(params).toEqual([]);
  });

  it('帶 keyword 時以 ILIKE 搜尋 title/intro', async () => {
    const executor = executorReturning([]);
    await promptRepository.findAllForAdmin({ keyword: 'kw' }, executor);
    const [sql, params] = executor.query.mock.calls[0];
    expect(sql).toContain('s.title ILIKE $1 OR s.intro ILIKE $1');
    expect(params).toEqual(['%kw%']);
  });

  it('active=active 時加入 is_active=true（不增加參數）', async () => {
    const executor = executorReturning([]);
    await promptRepository.findAllForAdmin({ active: 'active' }, executor);
    const [sql] = executor.query.mock.calls[0];
    expect(sql).toContain('AND s.is_active = true');
  });

  it('active=inactive 時加入 is_active=false', async () => {
    const executor = executorReturning([]);
    await promptRepository.findAllForAdmin({ active: 'inactive' }, executor);
    const [sql] = executor.query.mock.calls[0];
    expect(sql).toContain('AND s.is_active = false');
  });

  it('同時帶 keyword、contentTypeId、categoryId 時參數索引遞增', async () => {
    const executor = executorReturning([]);
    await promptRepository.findAllForAdmin(
      { keyword: 'kw', contentTypeId: 'ct', categoryId: 'cat' },
      executor,
    );
    const [sql, params] = executor.query.mock.calls[0];
    expect(sql).toContain('ILIKE $1');
    expect(sql).toContain('s.content_type_id = $2');
    expect(sql).toContain('s.category_id = $3');
    expect(params).toEqual(['%kw%', 'ct', 'cat']);
  });
});

describe('PromptRepository.findByIdForAdmin', () => {
  it('以 ID 查詢（含未啟用）', async () => {
    const executor = executorReturning([{ id: 'p1', is_active: false }]);
    const result = await promptRepository.findByIdForAdmin('p1', executor);
    const [sql, params] = executor.query.mock.calls[0];
    expect(sql).toContain('WHERE s.id = $1');
    expect(sql).not.toContain('is_active = true');
    expect(params).toEqual(['p1']);
    expect(result.id).toBe('p1');
  });

  it('查無時回傳 null', async () => {
    const executor = executorReturning([]);
    expect(await promptRepository.findByIdForAdmin('x', executor)).toBeNull();
  });
});

describe('PromptRepository.createSkill', () => {
  it('以 14 個參數 INSERT，modelType/tags/exampleOutput 經 JSON.stringify，並重新查回完整資料', async () => {
    const newRow = { id: 'new-1' };
    const fetched = { id: 'new-1', title: '標題', is_active: true };
    const executor = {
      query: vi
        .fn()
        .mockResolvedValueOnce({ rows: [newRow] }) // INSERT RETURNING *
        .mockResolvedValueOnce({ rows: [fetched] }), // findByIdForAdmin 重新查回
    };

    const data = {
      title: '標題', slug: 's', intro: 'i', contentTypeId: 'ct', categoryId: 'cat',
      modelType: ['gpt'], tags: ['t1'], promptContent: 'c', useCase: 'u',
      exampleInput: 'ei', exampleOutput: [{ type: 'text' }], userId: 'admin-1',
      sourceUrl: 'http://x', isActive: true,
    };

    const result = await promptRepository.createSkill(data, executor);

    const [insertSql, insertParams] = executor.query.mock.calls[0];
    expect(insertSql).toContain('INSERT INTO skill_item');
    expect(insertParams).toEqual([
      '標題', 's', 'i', 'ct', 'cat',
      JSON.stringify(['gpt']), JSON.stringify(['t1']),
      'c', 'u', 'ei', JSON.stringify([{ type: 'text' }]),
      'admin-1', 'http://x', true,
    ]);
    // 第二次呼叫為 findByIdForAdmin 的 SELECT
    expect(executor.query.mock.calls[1][1]).toEqual(['new-1']);
    expect(result).toEqual(fetched);
  });

  it('INSERT 未回傳資料時回傳 null', async () => {
    const executor = { query: vi.fn().mockResolvedValue({ rows: [] }) };
    expect(await promptRepository.createSkill({ title: 'x' }, executor)).toBeNull();
  });

  it('缺漏欄位時使用安全預設值', async () => {
    const executor = {
      query: vi
        .fn()
        .mockResolvedValueOnce({ rows: [{ id: 'new-1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'new-1' }] }),
    };
    await promptRepository.createSkill({}, executor);
    const params = executor.query.mock.calls[0][1];
    expect(params).toEqual([
      '', null, '', null, null,
      JSON.stringify([]), JSON.stringify([]),
      '', '', '', JSON.stringify([]),
      null, '', true,
    ]);
  });
});

describe('PromptRepository.updateSkill', () => {
  it('未帶任何可更新欄位時退回 findByIdForAdmin', async () => {
    const executor = executorReturning([{ id: 'p1' }]);
    const result = await promptRepository.updateSkill('p1', {}, executor);
    expect(executor.query).toHaveBeenCalledWith(expect.stringContaining('WHERE s.id = $1'), ['p1']);
    expect(result.id).toBe('p1');
  });

  it('僅更新 title 時產生單一 SET 並重新查回', async () => {
    const executor = {
      query: vi
        .fn()
        .mockResolvedValueOnce({ rows: [{ id: 'p1' }] }) // UPDATE RETURNING *
        .mockResolvedValueOnce({ rows: [{ id: 'p1', title: '新標題' }] }), // findByIdForAdmin
    };
    const result = await promptRepository.updateSkill('p1', { title: '新標題' }, executor);
    const [sql, params] = executor.query.mock.calls[0];
    expect(sql).toContain('title = $1');
    expect(sql).toContain('updated_at = now()');
    expect(sql).toContain('WHERE id = $2');
    expect(params).toEqual(['新標題', 'p1']);
    expect(result).toEqual({ id: 'p1', title: '新標題' });
  });

  it('modelType/tags/exampleOutput 欄位會 JSON.stringify', async () => {
    const executor = {
      query: vi
        .fn()
        .mockResolvedValueOnce({ rows: [{ id: 'p1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'p1' }] }),
    };
    await promptRepository.updateSkill(
      'p1',
      { modelType: ['gpt'], tags: ['t1'], exampleOutput: [{ type: 'image' }] },
      executor,
    );
    const params = executor.query.mock.calls[0][1];
    expect(params).toEqual([
      JSON.stringify(['gpt']),
      JSON.stringify(['t1']),
      JSON.stringify([{ type: 'image' }]),
      'p1',
    ]);
  });

  it('UPDATE 未回傳資料時回傳 null', async () => {
    const executor = { query: vi.fn().mockResolvedValue({ rows: [] }) };
    expect(await promptRepository.updateSkill('p1', { title: '新' }, executor)).toBeNull();
  });
});