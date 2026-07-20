const db = require('../db');

class PromptRepository {
  /**
   * 取得上架中的 Prompt 列表，支援關鍵字、分類與標籤過濾
   * @param {Object} options 
   * @param {string} [options.category] 分類 ID
   * @param {string} [options.tag] 標籤 ID
   * @param {string} [options.search] 關鍵字
   */
  async findActivePrompts({ category, tag, search } = {}) {
    let sql = 'SELECT * FROM skill_item WHERE is_active = true';
    const params = [];
    let paramIndex = 1;

    if (category) {
      sql += ` AND category_id = $${paramIndex++}`;
      params.push(category);
    }

    if (tag) {
      sql += ` AND tags::text ILIKE $${paramIndex++}`;
      params.push(`%${tag}%`);
    }

    if (search) {
      sql += ` AND (title ILIKE $${paramIndex} OR intro ILIKE $${paramIndex} OR prompt_content ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    sql += ' ORDER BY created_at DESC';

    const result = await db.query(sql, params);
    return result.rows;
  }

  /**
   * 根據 ID 取得單一上架中的 Prompt
   * @param {string} id UUID
   */
  async findActiveById(id) {
    const sql = 'SELECT * FROM skill_item WHERE id = $1 AND is_active = true';
    const result = await db.query(sql, [id]);
    return result.rows[0] || null;
  }

  /**
   * 增加 Prompt 複製使用次數
   * @param {string} id UUID
   */
  async incrementCopyCount(id) {
    const sql = `
      UPDATE skill_item 
      SET copy_count = copy_count + 1 
      WHERE id = $1 AND is_active = true 
      RETURNING id, copy_count
    `;
    const result = await db.query(sql, [id]);
    return result.rows[0] || null;
  }
}

module.exports = new PromptRepository();
