import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const contactService = require('../services/contact.service');
const controller = require('../controllers/admin/contact.controller');

function createResponse() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AdminContactController.getContacts', () => {
  it('將 status 與 keyword 透傳給 service 並回傳 200', async () => {
    const data = [{ id: 'c1' }];
    const spy = vi.spyOn(contactService, 'getAdminContacts').mockResolvedValue(data);
    const res = createResponse();
    await controller.getContacts({ query: { status: 'pending', keyword: '嗨' } }, res, vi.fn());
    expect(spy).toHaveBeenCalledWith({ status: 'pending', keyword: '嗨' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success', message: '取得聯絡表單清單成功', data,
    });
  });

  it('service 拋出錯誤時交給 next', async () => {
    const error = new Error('資料庫錯誤');
    vi.spyOn(contactService, 'getAdminContacts').mockRejectedValue(error);
    const res = createResponse();
    const next = vi.fn();
    await controller.getContacts({ query: {} }, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });
});

describe('AdminContactController.updateContactStatus', () => {
  it('成功時回傳 200', async () => {
    vi.spyOn(contactService, 'updateContactStatus').mockResolvedValue({ id: 'c1', status: 'resolved' });
    const res = createResponse();
    await controller.updateContactStatus({ params: { id: 'c1' }, body: { status: 'resolved' } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success', message: '狀態更新成功', data: { id: 'c1', status: 'resolved' },
    });
  });

  it('找不到紀錄時回傳 404', async () => {
    vi.spyOn(contactService, 'updateContactStatus').mockRejectedValue(
      Object.assign(new Error('找不到該聯絡紀錄'), { status: 404 }),
    );
    const res = createResponse();
    const next = vi.fn();
    await controller.updateContactStatus({ params: { id: 'x' }, body: { status: 'resolved' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();
  });

  it('無效狀態等其他錯誤交給 next', async () => {
    const error = Object.assign(new Error('無效的處理狀態'), { status: 400 });
    vi.spyOn(contactService, 'updateContactStatus').mockRejectedValue(error);
    const res = createResponse();
    const next = vi.fn();
    await controller.updateContactStatus({ params: { id: 'c1' }, body: { status: 'bad' } }, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });
});

describe('AdminContactController.deleteContact', () => {
  it('成功時回傳 200', async () => {
    vi.spyOn(contactService, 'deleteContact').mockResolvedValue({ id: 'c1' });
    const res = createResponse();
    await controller.deleteContact({ params: { id: 'c1' } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success', message: '刪除成功', data: { id: 'c1' },
    });
  });

  it('找不到紀錄時回傳 404', async () => {
    vi.spyOn(contactService, 'deleteContact').mockRejectedValue(
      Object.assign(new Error('找不到該聯絡紀錄'), { status: 404 }),
    );
    const res = createResponse();
    const next = vi.fn();
    await controller.deleteContact({ params: { id: 'x' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});