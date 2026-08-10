const faqRepository = require('../database/repositories/faq.repository');

class FaqService {
  /**
   * 取得前台公開 FAQ。
   */
  async getActiveFaqs() {
    const rows = await faqRepository.findActive();
    return rows.map((row) => this._mapToPublicFormat(row));
  }

  /**
   * 取得後台 FAQ 清單。
   */
  async getFaqsForAdmin() {
    const rows = await faqRepository.findAllForAdmin();
    return rows.map((row) => this._mapToAdminFormat(row));
  }

  /**
   * 取得後台單筆 FAQ。
   * @param {string} id FAQ UUID
   */
  async getFaqByIdForAdmin(id) {
    const row = await faqRepository.findByIdForAdmin(id);
    if (!row) {
      throw new Error('找不到 FAQ');
    }
    return this._mapToAdminFormat(row);
  }

  /**
   * 建立 FAQ。
   * @param {Object} data API request body
   */
  async createFaq(data) {
    const dbData = this._validateAndMapData(data, false);
    const row = await faqRepository.create(dbData);
    return this._mapToAdminFormat(row);
  }

  /**
   * 部分更新 FAQ。
   * @param {string} id FAQ UUID
   * @param {Object} data API request body
   */
  async updateFaq(id, data) {
    const existing = await faqRepository.findByIdForAdmin(id);
    if (!existing) {
      throw new Error('找不到 FAQ');
    }

    const dbData = this._validateAndMapData(data, true);
    if (Object.keys(dbData).length === 0) {
      throw new Error('沒有可更新的 FAQ 欄位');
    }

    const row = await faqRepository.update(id, dbData);
    return this._mapToAdminFormat(row);
  }

  /**
   * 軟刪除 FAQ。
   * @param {string} id FAQ UUID
   */
  async deleteFaq(id) {
    const row = await faqRepository.softDelete(id);
    if (!row) {
      throw new Error('找不到 FAQ');
    }
    return this._mapToAdminFormat(row);
  }

  /**
   * 驗證 API 欄位並轉換為 repository 使用的欄位。
   */
  _validateAndMapData(data, partial) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('FAQ 資料格式錯誤');
    }

    const dbData = {};
    for (const field of ['question', 'answer']) {
      if (!partial || data[field] !== undefined) {
        if (typeof data[field] !== 'string' || data[field].trim() === '') {
          throw new Error(`${field} 為必填且不可為空白`);
        }
        dbData[field] = data[field].trim();
      }
    }

    if (data.sortOrder !== undefined) {
      if (!Number.isInteger(data.sortOrder) || data.sortOrder < 0) {
        throw new Error('sortOrder 必須是大於或等於 0 的整數');
      }
      dbData.sort_order = data.sortOrder;
    } else if (!partial) {
      dbData.sort_order = 0;
    }

    if (data.isActive !== undefined && typeof data.isActive !== 'boolean') {
      throw new Error('isActive 必須是 boolean');
    }
    if (data.isActive !== undefined) {
      dbData.is_active = data.isActive;
    } else if (!partial) {
      dbData.is_active = true;
    }

    return dbData;
  }

  /**
   * 將資料庫欄位映射成前台格式。
   */
  _mapToPublicFormat(row) {
    return {
      id: row.id,
      question: row.question,
      answer: row.answer
    };
  }

  /**
   * 將資料庫欄位映射成後台格式。
   */
  _mapToAdminFormat(row) {
    return {
      id: row.id,
      question: row.question,
      answer: row.answer,
      sortOrder: row.sort_order,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

module.exports = new FaqService();
