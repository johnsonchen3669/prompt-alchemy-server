const db = require('../db');

class ParameterRepository {
  /**
   * 取得參數列表，可依參數類型篩選並依排序值排列。
   * @param {string|undefined} type 參數類型
   * @param {Object} executor 資料庫查詢執行器
   * @returns {Promise<Array>} 參數資料陣列
   */
  async findAll(type, executor = db) {
    let sql = 'SELECT * FROM parameters';
    const params = [];

    if (type) {
      sql += ' WHERE type = $1';
      params.push(type);
    }

    sql += ' ORDER BY sort_order ASC';
    const { rows } = await executor.query(sql, params);
    return rows;
  }

  /**
   * 依 UUID 取得單筆參數。
   * @param {string} id 參數 UUID
   * @param {Object} executor 資料庫查詢執行器
   * @returns {Promise<Object|null>} 參數資料或 null
   */
  async findById(id, executor = db) {
    const { rows } = await executor.query(
      'SELECT * FROM parameters WHERE id = $1',
      [id],
    );
    return rows[0] || null;
  }

  /**
   * 建立參數並回傳資料庫產生的完整資料。
   * @param {Object} data 參數資料庫欄位資料
   * @param {Object} executor 資料庫查詢執行器
   * @returns {Promise<Object|null>} 新建立的參數資料
   */
  async create(data, executor = db) {
    const { rows } = await executor.query(
      `INSERT INTO parameters (type, name, memo, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.type,
        data.name,
        data.memo || '',
        data.is_active ?? true,
        data.sort_order ?? 0,
      ],
    );
    return rows[0] || null;
  }

  /**
   * 依 UUID 部分更新參數資料。
   * @param {string} id 參數 UUID
   * @param {Object} data 要更新的參數資料庫欄位
   * @param {Object} executor 資料庫查詢執行器
   * @returns {Promise<Object|null>} 更新後的參數資料或 null
   */
  async update(id, data, executor = db) {
    const fields = [];
    const params = [];
    const allowedFields = ['name', 'memo', 'is_active', 'sort_order'];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        params.push(data[field]);
        fields.push(`${field} = $${params.length}`);
      }
    }

    if (fields.length === 0) {
      return this.findById(id, executor);
    }

    params.push(id);
    const { rows } = await executor.query(
      `UPDATE parameters
       SET ${fields.join(', ')}
       WHERE id = $${params.length}
       RETURNING *`,
      params,
    );
    return rows[0] || null;
  }
}

module.exports = new ParameterRepository();
