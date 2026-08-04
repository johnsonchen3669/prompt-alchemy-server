import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const parameterRepository = require('../database/repositories/parameter.repository');
const parameterService = require('../services/parameter.service');

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ParameterService.ALLOWED_TYPES', () => {
  it('允許的參數類型白名單固定為五種', () => {
    expect(parameterService.constructor.ALLOWED_TYPES).toEqual([
      'role', 'contentType', 'category', 'model', 'tag',
    ]);
  });
});

describe('ParameterService.getParameters', () => {
  it('不帶 type 時回傳全部參數並映射為 API 格式', async () => {
    vi.spyOn(parameterRepository, 'findAll').mockResolvedValue([
      { id: 'p1', type: 'category', name: '寫作', memo: '備註', is_active: true, sort_order: 0 },
    ]);

    const result = await parameterService.getParameters();

    expect(result).toEqual([{
      id: 'p1', type: 'category', name: '寫作', description: '備註',
      isActive: true, sortOrder: 0,
    }]);
  });

  it('帶合法 type 時透傳給 repository', async () => {
    const spy = vi.spyOn(parameterRepository, 'findAll').mockResolvedValue([]);
    await parameterService.getParameters('model');
    expect(spy).toHaveBeenCalledWith('model');
  });

  it('帶非法 type 時拋出 400', async () => {
    await expect(parameterService.getParameters('unknown')).rejects.toMatchObject({
      message: '無效的參數類型: unknown', status: 400,
    });
  });
});

describe('ParameterService.getParameterById', () => {
  it('找到時回傳 API 格式', async () => {
    vi.spyOn(parameterRepository, 'findById').mockResolvedValue({
      id: 'p1', type: 'tag', name: 'GPT', memo: null, is_active: false, sort_order: 5,
    });
    const result = await parameterService.getParameterById('p1');
    expect(result).toEqual({
      id: 'p1', type: 'tag', name: 'GPT', description: '',
      isActive: false, sortOrder: 5,
    });
  });

  it('查無參數時拋出 404', async () => {
    vi.spyOn(parameterRepository, 'findById').mockResolvedValue(null);
    await expect(parameterService.getParameterById('missing')).rejects.toMatchObject({
      message: '找不到參數', status: 404,
    });
  });
});

describe('ParameterService.createParameter', () => {
  it('合法資料且未帶選項時使用預設值建立', async () => {
    const create = vi.spyOn(parameterRepository, 'create').mockResolvedValue({
      id: 'p1', type: 'model', name: 'GPT-4', memo: '', is_active: true, sort_order: 0,
    });

    const result = await parameterService.createParameter({ type: 'model', name: 'GPT-4' });

    expect(create).toHaveBeenCalledWith({
      type: 'model', name: 'GPT-4', memo: '', is_active: true, sort_order: 0,
    });
    expect(result).toMatchObject({ id: 'p1', name: 'GPT-4', isActive: true });
  });

  it('明確帶入 description、isActive、sortOrder 時轉為資料庫欄位', async () => {
    const create = vi.spyOn(parameterRepository, 'create').mockResolvedValue({
      id: 'p2', type: 'tag', name: '推薦', memo: '精選', is_active: false, sort_order: 3,
    });

    await parameterService.createParameter({
      type: 'tag', name: '推薦', description: '精選', isActive: false, sortOrder: 3,
    });

    expect(create).toHaveBeenCalledWith({
      type: 'tag', name: '推薦', memo: '精選', is_active: false, sort_order: 3,
    });
  });

  it('非法 type 時拋出 400', async () => {
    await expect(
      parameterService.createParameter({ type: 'bad', name: 'X' }),
    ).rejects.toMatchObject({ message: '無效的參數類型: bad', status: 400 });
  });

  it('未帶 name 時拋出 400', async () => {
    await expect(
      parameterService.createParameter({ type: 'tag' }),
    ).rejects.toMatchObject({ message: '參數名稱為必填', status: 400 });
  });
});

describe('ParameterService.updateParameter', () => {
  it('參數不存在時拋出 404', async () => {
    vi.spyOn(parameterRepository, 'findById').mockResolvedValue(null);
    await expect(parameterService.updateParameter('missing', { name: 'X' })).rejects.toMatchObject({
      message: '找不到參數', status: 404,
    });
  });

  it('僅更新傳入的欄位，其餘不帶入 dbData', async () => {
    vi.spyOn(parameterRepository, 'findById').mockResolvedValue({ id: 'p1' });
    const update = vi.spyOn(parameterRepository, 'update').mockResolvedValue({
      id: 'p1', type: 'tag', name: '新名', memo: '舊備註', is_active: true, sort_order: 2,
    });

    await parameterService.updateParameter('p1', { name: '新名', isActive: false });

    expect(update).toHaveBeenCalledWith('p1', { name: '新名', is_active: false });
  });

  it('description 與 sortOrder 也可更新', async () => {
    vi.spyOn(parameterRepository, 'findById').mockResolvedValue({ id: 'p1' });
    const update = vi.spyOn(parameterRepository, 'update').mockResolvedValue({
      id: 'p1', type: 'tag', name: 'N', memo: '新備註', is_active: true, sort_order: 9,
    });

    await parameterService.updateParameter('p1', { description: '新備註', sortOrder: 9 });

    expect(update).toHaveBeenCalledWith('p1', { memo: '新備註', sort_order: 9 });
  });
});

describe('ParameterService._mapToApiFormat', () => {
  it('memo 為 null 時 description 回傳空字串', () => {
    const mapped = parameterService._mapToApiFormat({
      id: 'p1', type: 'role', name: 'admin', memo: null, is_active: true, sort_order: 0,
    });
    expect(mapped.description).toBe('');
    // 不回傳 createdAt
    expect(mapped).not.toHaveProperty('createdAt');
  });
});