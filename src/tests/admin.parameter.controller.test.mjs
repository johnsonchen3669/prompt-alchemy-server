import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const parameterService = require('../services/parameter.service');
const controller = require('../controllers/admin/parameter.controller');

function createResponse() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AdminParameterController.getParameters', () => {
  it('將 type 透傳給 service 並回傳 200', async () => {
    const data = [{ id: 'p1' }];
    const spy = vi.spyOn(parameterService, 'getParameters').mockResolvedValue(data);
    const res = createResponse();
    await controller.getParameters({ query: { type: 'category' } }, res, vi.fn());
    expect(spy).toHaveBeenCalledWith('category');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success', message: '取得參數列表成功', data,
    });
  });

  it('非法 type 拋出錯誤交給 next', async () => {
    const error = Object.assign(new Error('無效的參數類型: bad'), { status: 400 });
    vi.spyOn(parameterService, 'getParameters').mockRejectedValue(error);
    const res = createResponse();
    const next = vi.fn();
    await controller.getParameters({ query: { type: 'bad' } }, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });
});

describe('AdminParameterController.createParameter', () => {
  it('成功時回傳 201', async () => {
    const data = { id: 'p1', type: 'tag', name: '推薦' };
    vi.spyOn(parameterService, 'createParameter').mockResolvedValue(data);
    const res = createResponse();
    await controller.createParameter({ body: { type: 'tag', name: '推薦' } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success', message: '新增參數成功', data,
    });
  });

  it('無效類型時回傳 400', async () => {
    vi.spyOn(parameterService, 'createParameter').mockRejectedValue(
      Object.assign(new Error('無效的參數類型: bad'), { status: 400 }),
    );
    const res = createResponse();
    const next = vi.fn();
    await controller.createParameter({ body: { type: 'bad', name: 'x' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('缺少名稱時回傳 400', async () => {
    vi.spyOn(parameterService, 'createParameter').mockRejectedValue(
      Object.assign(new Error('參數名稱為必填'), { status: 400 }),
    );
    const res = createResponse();
    await controller.createParameter({ body: { type: 'tag' } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('AdminParameterController.updateParameter', () => {
  it('成功時回傳 200', async () => {
    vi.spyOn(parameterService, 'updateParameter').mockResolvedValue({ id: 'p1', name: '新名' });
    const res = createResponse();
    await controller.updateParameter({ params: { id: 'p1' }, body: { name: '新名' } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success', message: '修改參數成功', data: { id: 'p1', name: '新名' },
    });
  });

  it('找不到參數時回傳 404', async () => {
    vi.spyOn(parameterService, 'updateParameter').mockRejectedValue(
      Object.assign(new Error('找不到參數'), { status: 404 }),
    );
    const res = createResponse();
    const next = vi.fn();
    await controller.updateParameter({ params: { id: 'x' }, body: { name: 'y' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('AdminParameterController.deleteParameter', () => {
  it('成功（軟刪除）時回傳 200 並以 isActive:false 呼叫 updateParameter', async () => {
    const spy = vi.spyOn(parameterService, 'updateParameter').mockResolvedValue({
      id: 'p1', isActive: false,
    });
    const res = createResponse();
    await controller.deleteParameter({ params: { id: 'p1' } }, res, vi.fn());
    expect(spy).toHaveBeenCalledWith('p1', { isActive: false });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success', message: '參數已刪除/停用', data: { id: 'p1', isActive: false },
    });
  });

  it('找不到參數時回傳 404', async () => {
    vi.spyOn(parameterService, 'updateParameter').mockRejectedValue(
      Object.assign(new Error('找不到參數'), { status: 404 }),
    );
    const res = createResponse();
    const next = vi.fn();
    await controller.deleteParameter({ params: { id: 'x' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});