const db = require('../db');

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
  async create({ name, email, message }, executor = db) {
    const { rows } = await executor.query(
      `INSERT INTO contacts (name, email, message, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [name, email, message]
    );
    return mapRow(rows[0]);
  }

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

  async findById(id, executor = db) {
    const { rows } = await executor.query('SELECT * FROM contacts WHERE id = $1', [id]);
    return mapRow(rows[0]);
  }

  async updateStatus(id, status, executor = db) {
    const { rows } = await executor.query(
      `UPDATE contacts
       SET status = $1, updated_at = now()
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    return mapRow(rows[0]);
  }

  async delete(id, executor = db) {
    const { rows } = await executor.query(
      `DELETE FROM contacts WHERE id = $1 RETURNING *`,
      [id]
    );
    return mapRow(rows[0]);
  }
}

module.exports = new ContactRepository();
