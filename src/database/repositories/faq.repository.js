const db = require('../db');

class FaqRepository {
  /**
   * 取得前台可顯示的啟用中 FAQ，並依顯示順序穩定排序。
   * @param {Object} executor 資料庫查詢執行器
   * @returns {Promise<Array>} FAQ 資料陣列
   */
  async findActive(executor = db) {
    const { rows } = await executor.query(
      'SELECT * FROM faqs WHERE is_active = true ORDER BY sort_order ASC, created_at ASC, id ASC',
    );
    return rows;
  }

  /**
   * 取得後台 FAQ 清單，包含啟用及已軟刪除的資料。
   * @param {Object} executor 資料庫查詢執行器
   * @returns {Promise<Array>} FAQ 資料陣列
   */
  async findAllForAdmin(executor = db) {
    const { rows } = await executor.query(
      'SELECT * FROM faqs ORDER BY is_active DESC, sort_order ASC, created_at ASC, id ASC',
    );
    return rows;
  }

  /**
   * 依 UUID 取得後台單筆 FAQ，包含已軟刪除的資料。
   * @param {string} id FAQ UUID
   * @param {Object} executor 資料庫查詢執行器
   * @returns {Promise<Object|null>} FAQ 資料或 null
   */
  async findByIdForAdmin(id, executor = db) {
    const { rows } = await executor.query(
      'SELECT * FROM faqs WHERE id = $1',
      [id],
    );
    return rows[0] || null;
  }

  /**
   * 建立 FAQ 並回傳資料庫產生的完整資料。
   * @param {Object} data FAQ 資料庫欄位資料
   * @param {Object} executor 資料庫查詢執行器
   * @returns {Promise<Object>} 新建立的 FAQ
   */
  async create(data, executor = db) {
    const { question, answer, sort_order, is_active } = data;
    const { rows } = await executor.query(
      `INSERT INTO faqs (question, answer, sort_order, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [question, answer, sort_order, is_active ?? true],
    );
    return rows[0];
  }

  /**
   * 依 UUID 部分更新 FAQ，並同步更新修改時間。
   * @param {string} id FAQ UUID
   * @param {Object} data 要更新的 FAQ 資料庫欄位
   * @param {Object} executor 資料庫查詢執行器
   * @returns {Promise<Object|null>} 更新後的 FAQ 或 null
   */
  async update(id, data, executor = db) {
    const allowedFields = {
      question: 'question',
      answer: 'answer',
      sort_order: 'sort_order',
      is_active: 'is_active',
    };
    const updates = [];
    const params = [];

    for (const [key, column] of Object.entries(allowedFields)) {
      if (data[key] !== undefined) {
        params.push(data[key]);
        updates.push(`${column} = $${params.length}`);
      }
    }

    if (updates.length === 0) {
      return this.findByIdForAdmin(id, executor);
    }

    updates.push('updated_at = now()');
    params.push(id);

    const { rows } = await executor.query(
      `UPDATE faqs
       SET ${updates.join(', ')}
       WHERE id = $${params.length}
       RETURNING *`,
      params,
    );
    return rows[0] || null;
  }

  /**
   * 依 UUID 軟刪除 FAQ，保留資料並將啟用狀態設為 false。
   * @param {string} id FAQ UUID
   * @param {Object} executor 資料庫查詢執行器
   * @returns {Promise<Object|null>} 軟刪除後的 FAQ 或 null
   */
  async softDelete(id, executor = db) {
    const { rows } = await executor.query(
      `UPDATE faqs
       SET is_active = false, updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [id],
    );
    return rows[0] || null;
  }
}

module.exports = new FaqRepository();
