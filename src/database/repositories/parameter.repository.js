const db = require('../db');

class ParameterRepository {
  /**
   * 取得所有參數，可透過 type 過濾
   * 依據 sort_order 遞增排序
   */
  async findAll(type) {
    let sql = 'SELECT * FROM parameters';
    const params = [];

    if (type) {
      sql += ' WHERE type = $1';
      params.push(type);
    }

    sql += ' ORDER BY sort_order ASC';

    const result = await db.query(sql, params);
    return result.rows;
  }

  /**
   * 根據 ID 取得單一參數
   */
  async findById(id) {
    const sql = 'SELECT * FROM parameters WHERE id = $1';
    const result = await db.query(sql, [id]);
    return result.rows[0] || null;
  }

  /**
   * 新增參數
   */
  async create(data) {
    const sql = `
      INSERT INTO parameters (type, name, memo, is_active, sort_order)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const params = [
      data.type,
      data.name,
      data.memo || '',
      data.is_active !== undefined ? data.is_active : true,
      data.sort_order || 0
    ];
    const result = await db.query(sql, params);
    return result.rows[0];
  }

  /**
   * 更新參數 (部分更新)
   */
  async update(id, data) {
    // 建立動態 SET 子句
    const fields = [];
    const params = [id];
    let paramIndex = 2;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      params.push(data.name);
    }
    if (data.memo !== undefined) {
      fields.push(`memo = $${paramIndex++}`);
      params.push(data.memo);
    }
    if (data.is_active !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      params.push(data.is_active);
    }
    if (data.sort_order !== undefined) {
      fields.push(`sort_order = $${paramIndex++}`);
      params.push(data.sort_order);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    const sql = `
      UPDATE parameters
      SET ${fields.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(sql, params);
    return result.rows[0];
  }
}

module.exports = new ParameterRepository();
