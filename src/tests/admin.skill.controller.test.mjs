import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const promptRepository = require('../database/repositories/prompt.repository');
const promptService = require('../services/prompt.service');
const controller = require('../controllers/admin/skill.controller');

function createResponse() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
}

function makeRow(overrides = {}) {
  return {
    id: 'p1', title: '標題', slug: 's', intro: 'i', content_type_id: 'ct',
    model_type: [], prompt_content: 'c', use_case: 'u', example_input: 'ei',
    example_output: [], category_id: 'cat', category_name: '寫作', memo: '',
    tags: [], source_url: '', copy_count: 0, favorite_count: 0,
    is_active: true, created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-02T00:00:00.000Z',
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AdminSkillController.getSkills', () => {
  it('將篩選條件透傳給 repository 並映射後回傳 200', async () => {
    const spy = vi.spyOn(promptRepository, 'findAllForAdmin').mockResolvedValue([makeRow()]);
    const mapSpy = vi.spyOn(promptService, '_mapToApiFormat');
    const res = createResponse();
    await controller.getSkills(
      { query: { keyword: 'k', contentTypeId: 'ct', categoryId: 'cat', active: 'active' } },
      res,
      vi.fn(),
    );
    expect(spy).toHaveBeenCalledWith({ keyword: 'k', contentTypeId: 'ct', categoryId: 'cat', active: 'active' });
    expect(mapSpy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('repository 拋出錯誤時交給 next', async () => {
    const error = new Error('db error');
    vi.spyOn(promptRepository, 'findAllForAdmin').mockRejectedValue(error);
    const res = createResponse();
    const next = vi.fn();
    await controller.getSkills({ query: {} }, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });
});

describe('AdminSkillController.getSkillById', () => {
  it('找到時回傳 200 與映射資料', async () => {
    vi.spyOn(promptRepository, 'findByIdForAdmin').mockResolvedValue(makeRow());
    const res = createResponse();
    await controller.getSkillById({ params: { id: 'p1' } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].data.id).toBe('p1');
  });

  it('找不到時回傳 404', async () => {
    vi.spyOn(promptRepository, 'findByIdForAdmin').mockResolvedValue(null);
    const res = createResponse();
    const next = vi.fn();
    await controller.getSkillById({ params: { id: 'x' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ status: 'error', message: '找不到資料' });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('AdminSkillController.createSkill', () => {
  it('將當前 admin userId 寫入 body 並建立技能，回傳 201', async () => {
    const createSpy = vi.spyOn(promptRepository, 'createSkill').mockResolvedValue(makeRow({ id: 'new' }));
    const res = createResponse();
    await controller.createSkill(
      { user: { userId: 'admin-1' }, body: { title: '新技能' } },
      res,
      vi.fn(),
    );
    expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({ title: '新技能', userId: 'admin-1' }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('repository 拋出錯誤時交給 next', async () => {
    vi.spyOn(promptRepository, 'createSkill').mockRejectedValue(new Error('db error'));
    const res = createResponse();
    const next = vi.fn();
    await controller.createSkill({ user: { userId: 'admin-1' }, body: {} }, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'db error' }));
  });
});

describe('AdminSkillController.updateSkill', () => {
  it('找不到既有技能時回傳 404，不呼叫 updateSkill', async () => {
    const findSpy = vi.spyOn(promptRepository, 'findByIdForAdmin').mockResolvedValue(null);
    const updateSpy = vi.spyOn(promptRepository, 'updateSkill');
    const res = createResponse();
    const next = vi.fn();
    await controller.updateSkill({ params: { id: 'x' }, body: { title: '新' } }, res, next);
    expect(findSpy).toHaveBeenCalledWith('x');
    expect(updateSpy).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('找到時呼叫 updateSkill 並回傳 200', async () => {
    vi.spyOn(promptRepository, 'findByIdForAdmin').mockResolvedValue(makeRow());
    const updateSpy = vi.spyOn(promptRepository, 'updateSkill').mockResolvedValue(makeRow({ title: '新' }));
    const res = createResponse();
    await controller.updateSkill({ params: { id: 'p1' }, body: { title: '新' } }, res, vi.fn());
    expect(updateSpy).toHaveBeenCalledWith('p1', { title: '新' });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});