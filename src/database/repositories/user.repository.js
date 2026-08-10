const db = require('../db');

/**
 * 將 users 資料表欄位轉換為應用程式使用的 camelCase 格式。
 * @param {Object|undefined} row 資料庫查詢結果
 * @returns {Object|null} 轉換後的使用者資料或 null
 */
function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

class UserRepository {
  /**
   * 建立使用者並回傳轉換後的使用者資料。
   * @param {{name: string, email: string, passwordHash: string, role?: string}} data 使用者資料
   * @param {Object} executor 資料庫查詢執行器
   * @returns {Promise<Object|null>} 新建立的使用者資料
   */
  async createUser({ name, email, passwordHash, role = 'member' }, executor = db) {
    const { rows } = await executor.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, email, passwordHash, role],
    );
    return mapRow(rows[0]);
  }

  /**
   * 依 email 取得使用者。
   * @param {string} email 使用者 email
   * @param {Object} executor 資料庫查詢執行器
   * @returns {Promise<Object|null>} 使用者資料或 null
   */
  async findUserByEmail(email, executor = db) {
    const { rows } = await executor.query(
      'SELECT * FROM users WHERE email = $1',
      [email],
    );
    return mapRow(rows[0]);
  }

  /**
   * 依 UUID 取得使用者。
   * @param {string} id 使用者 UUID
   * @param {Object} executor 資料庫查詢執行器
   * @returns {Promise<Object|null>} 使用者資料或 null
   */
  async findUserById(id, executor = db) {
    const { rows } = await executor.query(
      'SELECT * FROM users WHERE id = $1',
      [id],
    );
    return mapRow(rows[0]);
  }

  /**
   * 取得使用者列表，可依角色篩選。
   * @param {string|undefined} role 使用者角色
   * @param {Object} executor 資料庫查詢執行器
   * @returns {Promise<Array>} 使用者資料陣列
   */
  async getUsers(role, executor = db) {
    let sql = 'SELECT * FROM users';
    const params = [];

    if (role) {
      sql += ' WHERE role = $1';
      params.push(role);
    }

    sql += ' ORDER BY created_at DESC';
    const { rows } = await executor.query(sql, params);
    return rows.map(mapRow);
  }

  /**
   * 依 UUID 部分更新使用者資料。
   * @param {string} id 使用者 UUID
   * @param {{name?: string, role?: string, isActive?: boolean}} data 要更新的使用者欄位
   * @param {Object} executor 資料庫查詢執行器
   * @returns {Promise<Object|null>} 更新後的使用者資料或 null
   */
  async updateUser(id, { name, role, isActive }, executor = db) {
    const updates = [];
    const params = [];

    if (name !== undefined) {
      params.push(name);
      updates.push(`name = $${params.length}`);
    }
    if (role !== undefined) {
      params.push(role);
      updates.push(`role = $${params.length}`);
    }
    if (isActive !== undefined) {
      params.push(isActive);
      updates.push(`is_active = $${params.length}`);
    }

    if (updates.length === 0) {
      return this.findUserById(id, executor);
    }

    params.push(id);
    const { rows } = await executor.query(
      `UPDATE users
       SET ${updates.join(', ')}
       WHERE id = $${params.length}
       RETURNING *`,
      params,
    );
    return mapRow(rows[0]);
  }
}

module.exports = new UserRepository();
