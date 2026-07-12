const { query } = require('../db');

/**
 * 重組使用者資訊
 * @param {{id: string, name: string, email: string, password_hash: string, role: string, created_at: string}} row
 * @returns {{id: string, name: string, email: string, passwordHash: string, role: string, createdAt: string} | null}
 */
function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at,
  }
}

/**
 * 創建使用者
 * @param {{name:string,email:string,passwordHash:string,role?:string}} params 
 * @returns 
 */
async function createUser({ name, email, passwordHash, role = "member" }) {
  const { rows } = await query(
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
async function findUserByEmail(email) {
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email])
  return mapRow(rows[0])
}

/**
 * 透過 id 找尋使用者
 * @param {string} id 
 * @returns 
 */
async function findUserById(id) {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [id])
  return mapRow(rows[0])
}

module.exports = { createUser, findUserByEmail, findUserById };