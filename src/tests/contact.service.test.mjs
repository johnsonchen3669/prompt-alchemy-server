import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const contactRepository = require('../database/repositories/contact.repository');
const contactService = require('../services/contact.service');

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ContactService.createContact', () => {
  it('必填齊全且 email 合法時建立聯絡訊息，並 trim 欄位', async () => {
    const created = { id: 'c-1', name: '小明', email: 'a@b.com', message: '嗨', status: 'pending' };
    const create = vi.spyOn(contactRepository, 'create').mockResolvedValue(created);

    const result = await contactService.createContact({
      name: '  小明  ',
      email: '  a@b.com  ',
      message: '  嗨  ',
    });

    expect(create).toHaveBeenCalledWith({ name: '小明', email: 'a@b.com', message: '嗨' });
    expect(result).toBe(created);
  });

  it.each([
    ['name', { name: '', email: 'a@b.com', message: '嗨' }, '請輸入名稱'],
    ['name 為空白', { name: '   ', email: 'a@b.com', message: '嗨' }, '請輸入名稱'],
    ['email', { name: '小明', email: '', message: '嗨' }, '請輸入 Email'],
    ['message', { name: '小明', email: 'a@b.com', message: '' }, '請輸入聯絡內容'],
    ['message 為空白', { name: '小明', email: 'a@b.com', message: '   ' }, '請輸入聯絡內容'],
  ])('缺少 %s 時拋出 400 錯誤', async (_label, input, expectedMessage) => {
    await expect(contactService.createContact(input)).rejects.toMatchObject({
      message: expectedMessage,
      status: 400,
    });
  });

  it.each([
    'plainaddress',
    'missing@dot',
    'a b@c.com',
  ])('email 格式不正確 (%s) 時拋出 400', async (email) => {
    await expect(
      contactService.createContact({ name: '小明', email, message: '嗨' }),
    ).rejects.toMatchObject({ message: '請輸入有效的 Email 格式', status: 400 });
  });
});

describe('ContactService.getAdminContacts', () => {
  it('將篩選條件透傳給 repository', async () => {
    const rows = [{ id: 'c-1' }];
    const spy = vi.spyOn(contactRepository, 'findAllForAdmin').mockResolvedValue(rows);

    const result = await contactService.getAdminContacts({ status: 'pending', keyword: '嗨' });

    expect(spy).toHaveBeenCalledWith({ status: 'pending', keyword: '嗨' });
    expect(result).toBe(rows);
  });

  it('不帶篩選條件時使用預設空物件', async () => {
    const spy = vi.spyOn(contactRepository, 'findAllForAdmin').mockResolvedValue([]);
    await contactService.getAdminContacts();
    expect(spy).toHaveBeenCalledWith({});
  });
});

describe('ContactService.updateContactStatus', () => {
  it('無效狀態時拋出 400', async () => {
    await expect(contactService.updateContactStatus('c-1', 'done')).rejects.toMatchObject({
      message: '無效的處理狀態',
      status: 400,
    });
  });

  it('查無紀錄時拋出 404', async () => {
    const findById = vi.spyOn(contactRepository, 'findById').mockResolvedValue(null);
    await expect(contactService.updateContactStatus('c-1', 'resolved')).rejects.toMatchObject({
      message: '找不到該聯絡紀錄',
      status: 404,
    });
    expect(findById).toHaveBeenCalledWith('c-1');
  });

  it.each(['pending', 'resolved'])('合法狀態 %s 且紀錄存在時更新狀態', async (status) => {
    vi.spyOn(contactRepository, 'findById').mockResolvedValue({ id: 'c-1' });
    const updateStatus = vi.spyOn(contactRepository, 'updateStatus').mockResolvedValue({
      id: 'c-1',
      status,
    });

    const result = await contactService.updateContactStatus('c-1', status);

    expect(updateStatus).toHaveBeenCalledWith('c-1', status);
    expect(result).toMatchObject({ id: 'c-1', status });
  });
});

describe('ContactService.deleteContact', () => {
  it('查無紀錄時拋出 404', async () => {
    vi.spyOn(contactRepository, 'findById').mockResolvedValue(null);
    await expect(contactService.deleteContact('c-1')).rejects.toMatchObject({
      message: '找不到該聯絡紀錄',
      status: 404,
    });
  });

  it('紀錄存在時執行刪除並回傳結果', async () => {
    vi.spyOn(contactRepository, 'findById').mockResolvedValue({ id: 'c-1' });
    const del = vi.spyOn(contactRepository, 'delete').mockResolvedValue({ id: 'c-1' });

    const result = await contactService.deleteContact('c-1');

    expect(del).toHaveBeenCalledWith('c-1');
    expect(result).toMatchObject({ id: 'c-1' });
  });
});