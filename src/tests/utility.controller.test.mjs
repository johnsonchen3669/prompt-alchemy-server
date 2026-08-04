import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const uploadService = require('../services/upload.service');
const { uploadFile } = require('../controllers/utility.controller');

function createResponse() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('utilityController.uploadFile', () => {
  it('未收到檔案時回傳 400', async () => {
    const res = createResponse();
    await uploadFile({ file: undefined }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: '未接收到上傳的檔案 (請確認欄位名稱為 file)',
    });
  });

  it('上傳成功時回傳 200 與檔案 URL', async () => {
    vi.spyOn(uploadService, 'uploadFileToBucket').mockResolvedValue('http://bucket/file.png');
    const res = createResponse();
    await uploadFile({ file: { originalname: 'f.png' } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success', message: '檔案上傳成功', data: { url: 'http://bucket/file.png' },
    });
  });

  it('上傳服務拋出錯誤時交給 next', async () => {
    const error = new Error('GCP Storage 尚未設定，請檢查環境變數');
    vi.spyOn(uploadService, 'uploadFileToBucket').mockRejectedValue(error);
    const res = createResponse();
    const next = vi.fn();
    await uploadFile({ file: { originalname: 'f.png' } }, res, next);
    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });
});