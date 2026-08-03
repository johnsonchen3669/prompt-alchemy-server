const parameterRepository = require('../database/repositories/parameter.repository');

function createHttpError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

class ParameterService {
  /**
   * 允許的參數類型白名單
   */
  static get ALLOWED_TYPES() {
    return ['role', 'contentType', 'category', 'model', 'tag'];
  }

  /**
   * 取得參數列表
   */
  async getParameters(type) {
    if (type && !ParameterService.ALLOWED_TYPES.includes(type)) {
      throw createHttpError(`無效的參數類型: ${type}`, 400);
    }

    const rows = await parameterRepository.findAll(type);
    return rows.map(this._mapToApiFormat);
  }

  /**
   * 取得單一參數
   */
  async getParameterById(id) {
    const row = await parameterRepository.findById(id);
    if (!row) {
      throw createHttpError('找不到參數', 404);
    }
    return this._mapToApiFormat(row);
  }

  /**
   * 新增參數
   */
  async createParameter(data) {
    if (!ParameterService.ALLOWED_TYPES.includes(data.type)) {
      throw createHttpError(`無效的參數類型: ${data.type}`, 400);
    }
    if (!data.name) {
      throw createHttpError('參數名稱為必填', 400);
    }

    // 將 API 欄位轉換為資料庫欄位
    const dbData = {
      type: data.type,
      name: data.name,
      memo: data.description || '',
      is_active: data.isActive !== undefined ? data.isActive : true,
      sort_order: data.sortOrder || 0
    };

    const row = await parameterRepository.create(dbData);
    return this._mapToApiFormat(row);
  }

  /**
   * 更新參數
   */
  async updateParameter(id, data) {
    // 先確認是否存在
    const existing = await parameterRepository.findById(id);
    if (!existing) {
      throw createHttpError('找不到參數', 404);
    }

    // 將 API 欄位轉換為資料庫欄位
    const dbData = {};
    if (data.name !== undefined) dbData.name = data.name;
    if (data.description !== undefined) dbData.memo = data.description;
    if (data.isActive !== undefined) dbData.is_active = data.isActive;
    if (data.sortOrder !== undefined) dbData.sort_order = data.sortOrder;

    const row = await parameterRepository.update(id, dbData);
    return this._mapToApiFormat(row);
  }

  /**
   * 私有方法：將 DB 欄位映射回 API 預期的格式
   */
  _mapToApiFormat(row) {
    return {
      id: row.id,
      type: row.type,
      name: row.name,
      description: row.memo || '',
      isActive: row.is_active,
      sortOrder: row.sort_order
      // 注意：沒有回傳 createdAt，讓前端顯示預設的「—」
    };
  }
}

module.exports = new ParameterService();
