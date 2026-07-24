const db = require('../db');

/**
 * 重組使用者資訊
 * @param {{id: string, name: string, email: string, password_hash: string, role: string, is_active: boolean, created_at: string}} row
 * @returns {{id: string, name: string, email: string, passwordHash: string, role: string, isActive: boolean, createdAt: string} | null}
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
  }
}

/**
 * 創建使用者
 * @param {{name:string,email:string,passwordHash:string,role?:string}} params 
 * @returns 
 */
async function createUser({ name, email, passwordHash, role = "member" }, executor = db) {
  const { rows } = await executor.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name, email, passwordHash, role]
  );
  return mapRow(rows[0])
}

/**
 * 透過 email 找尋使用者
 * @param {string} email 
 * @returns 
 */
async function findUserByEmail(email, executor = db) {
  const { rows } = await executor.query('SELECT * FROM users WHERE email = $1', [email])
  return mapRow(rows[0])
}

/**
 * 透過 id 找尋使用者
 * @param {string} id 
 * @returns 
 */
async function findUserById(id, executor = db) {
  const { rows } = await executor.query('SELECT * FROM users WHERE id = $1', [id])
  return mapRow(rows[0])
}

/**
 * 取得使用者列表
 * @param {string} [role] 
 * @returns 
 */
async function getUsers(role, executor = db) {
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
 * 更新使用者資訊
 * @param {string} id 
 * @param {{name?: string, role?: string, isActive?: boolean}} data 
 * @returns 
 */
async function updateUser(id, { name, role, isActive }, executor = db) {
  const updates = [];
  const params = [];
  let paramIndex = 1;

  if (name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    params.push(name);
  }
  if (role !== undefined) {
    updates.push(`role = $${paramIndex++}`);
    params.push(role);
  }
  if (isActive !== undefined) {
    updates.push(`is_active = $${paramIndex++}`);
    params.push(isActive);
  }

  if (updates.length === 0) return await findUserById(id, executor);

  params.push(id);
  const sql = `
    UPDATE users 
    SET ${updates.join(', ')} 
    WHERE id = $${paramIndex} 
    RETURNING *
  `;
  const { rows } = await executor.query(sql, params);
  return mapRow(rows[0]);
}

module.exports = { createUser, findUserByEmail, findUserById, getUsers, updateUser };
