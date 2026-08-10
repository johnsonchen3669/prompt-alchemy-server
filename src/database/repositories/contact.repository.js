const db = require('../db');

/**
 * 將 contacts 資料表欄位轉換為應用程式使用的 camelCase 格式。
 * @param {Object|undefined} row 資料庫查詢結果
 * @returns {Object|null} 轉換後的聯絡資料或 null
 */
function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

class ContactRepository {
  /**
   * 建立聯絡訊息並將初始狀態設為 pending。
   * @param {{name: string, email: string, message: string}} data 聯絡訊息資料
   * @param {Object} executor 資料庫查詢執行器
   * @returns {Promise<Object|null>} 新建立的聯絡資料
   */
  async create({ name, email, message }, executor = db) {
    const { rows } = await executor.query(
      `INSERT INTO contacts (name, email, message, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [name, email, message],
    );
    return mapRow(rows[0]);
  }

  /**
   * 取得後台聯絡訊息列表，可依狀態及關鍵字篩選。
   * @param {{status?: string, keyword?: string}} filters 篩選條件
   * @param {Object} executor 資料庫查詢執行器
   * @returns {Promise<Array>} 聯絡資料陣列
   */
  async findAllForAdmin({ status, keyword } = {}, executor = db) {
    let sql = 'SELECT * FROM contacts WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (status && status !== 'all') {
      sql += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    if (keyword && keyword.trim() !== '') {
      const kw = `%${keyword.trim()}%`;
      sql += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR message ILIKE $${paramIndex})`;
      params.push(kw);
      paramIndex++;
    }

    sql += ' ORDER BY created_at DESC';
    const { rows } = await executor.query(sql, params);
    return rows.map(mapRow);
  }

  /**
   * 依 UUID 取得單筆聯絡訊息。
   * @param {string} id 聯絡訊息 UUID
   * @param {Object} executor 資料庫查詢執行器
   * @returns {Promise<Object|null>} 聯絡資料或 null
   */
  async findById(id, executor = db) {
    const { rows } = await executor.query(
      'SELECT * FROM contacts WHERE id = $1',
      [id],
    );
    return mapRow(rows[0]);
  }

  /**
   * 更新聯絡訊息的處理狀態。
   * @param {string} id 聯絡訊息 UUID
   * @param {string} status 新狀態
   * @param {Object} executor 資料庫查詢執行器
   * @returns {Promise<Object|null>} 更新後的聯絡資料或 null
   */
  async updateStatus(id, status, executor = db) {
    const { rows } = await executor.query(
      `UPDATE contacts
       SET status = $1, updated_at = now()
       WHERE id = $2
       RETURNING *`,
      [status, id],
    );
    return mapRow(rows[0]);
  }

  /**
   * 依 UUID 實體刪除聯絡訊息。
   * @param {string} id 聯絡訊息 UUID
   * @param {Object} executor 資料庫查詢執行器
   * @returns {Promise<Object|null>} 被刪除的聯絡資料或 null
   */
  async delete(id, executor = db) {
    const { rows } = await executor.query(
      'DELETE FROM contacts WHERE id = $1 RETURNING *',
      [id],
    );
    return mapRow(rows[0]);
  }
}

module.exports = new ContactRepository();
