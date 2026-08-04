import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const promptRepository = require('../database/repositories/prompt.repository');
const promptService = require('../services/prompt.service');

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function makeRow(overrides = {}) {
  return {
    id: 'p1',
    title: '標題',
    slug: 'slug',
    intro: '簡介',
    content_type_id: 'ct1',
    model_type: ['gpt'],
    prompt_content: '內容',
    use_case: '用途',
    example_input: '輸入',
    example_output: [],
    category_id: 'cat1',
    category_name: '寫作',
    memo: '備註',
    tags: [{ id: 't1', name: '標籤' }],
    source_url: 'http://x',
    copy_count: 0,
    favorite_count: 0,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-02T00:00:00.000Z',
    ...overrides,
  };
}

describe('PromptService.getPrompts', () => {
  it('將 category/tag/search 透傳給 repository 並映射結果', async () => {
    const spy = vi.spyOn(promptRepository, 'findActivePrompts').mockResolvedValue([makeRow()]);
    const result = await promptService.getPrompts({ category: 'c', tag: 't', search: 'kw' });
    expect(spy).toHaveBeenCalledWith({ category: 'c', tag: 't', search: 'kw' });
    expect(result[0]).toMatchObject({ id: 'p1', title: '標題', category: '寫作' });
  });

  it('不帶 query 時傳入空物件', async () => {
    const spy = vi.spyOn(promptRepository, 'findActivePrompts').mockResolvedValue([]);
    await promptService.getPrompts();
    expect(spy).toHaveBeenCalledWith({ category: undefined, tag: undefined, search: undefined });
  });
});

describe('PromptService.getPromptById', () => {
  it('找到時回傳映射後資料', async () => {
    vi.spyOn(promptRepository, 'findActiveById').mockResolvedValue(makeRow());
    const result = await promptService.getPromptById('p1');
    expect(result.id).toBe('p1');
  });

  it('查無時拋出錯誤', async () => {
    vi.spyOn(promptRepository, 'findActiveById').mockResolvedValue(null);
    await expect(promptService.getPromptById('missing')).rejects.toThrow('找不到該 Prompt');
  });
});

describe('PromptService.incrementCopyCount', () => {
  it('成功累加時回傳 id 與 copyCount', async () => {
    vi.spyOn(promptRepository, 'incrementCopyCount').mockResolvedValue({ id: 'p1', copy_count: 7 });
    const result = await promptService.incrementCopyCount('p1');
    expect(result).toEqual({ id: 'p1', copyCount: 7 });
  });

  it('查無或未上架時拋出錯誤', async () => {
    vi.spyOn(promptRepository, 'incrementCopyCount').mockResolvedValue(null);
    await expect(promptService.incrementCopyCount('missing')).rejects.toThrow(
      '找不到該 Prompt 或未上架',
    );
  });
});

describe('PromptService._mapToApiFormat — exampleOutput', () => {
  it('example_output 為陣列時直接沿用', () => {
    const blocks = [{ type: 'text', data: { context: 'x' }, seq: 0 }];
    const mapped = promptService._mapToApiFormat(makeRow({ example_output: blocks }));
    expect(mapped.exampleOutput).toBe(blocks);
  });

  it('example_output 為舊式 object 時轉為 Block Array，含 text 與 image 區塊', () => {
    const row = makeRow({
      example_output: {
        outputText: '文字結果',
        outputImages: [
          { url: 'http://img/1', alt: '圖一', caption: '說明一' },
          { url: 'http://img/2' },
        ],
      },
    });
    const mapped = promptService._mapToApiFormat(row);
    expect(mapped.exampleOutput).toEqual([
      { type: 'text', data: { context: '文字結果' }, seq: 0 },
      { type: 'image', data: { context: 'http://img/1', alt: '圖一', caption: '說明一' }, seq: 1 },
      { type: 'image', data: { context: 'http://img/2', alt: '', caption: '' }, seq: 2 },
    ]);
  });

  it('舊式 object 只含 outputImages，無 url 的圖片會被略過', () => {
    const row = makeRow({
      example_output: { outputImages: [{ alt: '無網址' }, { url: 'http://img/9' }] },
    });
    const mapped = promptService._mapToApiFormat(row);
    expect(mapped.exampleOutput).toEqual([
      { type: 'image', data: { context: 'http://img/9', alt: '', caption: '' }, seq: 0 },
    ]);
  });

  it('example_output 為 null 時回傳空陣列', () => {
    const mapped = promptService._mapToApiFormat(makeRow({ example_output: null }));
    expect(mapped.exampleOutput).toEqual([]);
  });
});

describe('PromptService._mapToApiFormat — isNew 與 isHot', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-04T00:00:00Z'));
  });

  it('created_at 在 30 天內時 isNew 為 true', () => {
    const row = makeRow({ created_at: '2026-07-20T00:00:00.000Z' });
    expect(promptService._mapToApiFormat(row).isNew).toBe(true);
  });

  it('created_at 超過 30 天時 isNew 為 false', () => {
    const row = makeRow({ created_at: '2026-06-01T00:00:00.000Z' });
    expect(promptService._mapToApiFormat(row).isNew).toBe(false);
  });

  it('created_at 恰好等於 30 天邊界時 isNew 為 false（嚴格大於）', () => {
    // 30 天前的那一瞬間：now - 30*24*60*60*1000 = 2026-07-05T00:00:00Z
    const row = makeRow({ created_at: '2026-07-05T00:00:00.000Z' });
    expect(promptService._mapToApiFormat(row).isNew).toBe(false);
  });

  it('created_at 為 null 時 isNew 為 false', () => {
    const row = makeRow({ created_at: null });
    expect(promptService._mapToApiFormat(row).isNew).toBe(false);
  });

  it.each([
    ['copy_count 達 50', { copy_count: 50, favorite_count: 0 }],
    ['favorite_count 達 20', { copy_count: 0, favorite_count: 20 }],
    ['copy_count 超過 50', { copy_count: 99, favorite_count: 0 }],
  ])('isHot 為 true（%s）', (_label, counts) => {
    expect(promptService._mapToApiFormat(makeRow(counts)).isHot).toBe(true);
  });

  it('copy_count 與 favorite_count 皆未達門檻時 isHot 為 false', () => {
    expect(promptService._mapToApiFormat(makeRow({ copy_count: 49, favorite_count: 19 })).isHot).toBe(false);
  });
});

describe('PromptService._mapToApiFormat — 預設值與欄位缺漏', () => {
  it('欄位缺失時使用安全預設值', () => {
    const mapped = promptService._mapToApiFormat({});
    expect(mapped).toMatchObject({
      title: '',
      slug: '',
      intro: '',
      contentTypeId: '',
      modelType: [],
      promptContent: '',
      tags: [],
      copyCount: 0,
      favoriteCount: 0,
      isActive: true,
    });
    expect(mapped.exampleOutput).toEqual([]);
  });

  it('is_active 明確為 false 時 isActive 為 false', () => {
    expect(promptService._mapToApiFormat(makeRow({ is_active: false })).isActive).toBe(false);
  });
});