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
    let sql = `
        SELECT
      s.*,
      cp.name AS category_name,
      cp.memo AS memo,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id', p.id,
              'name', p.name
            )
            ORDER BY p.sort_order
          )
          FROM json_array_elements_text(
            COALESCE(s.tags, '[]'::json)
          ) AS t(tag_id)
          JOIN parameters p
            ON p.id = t.tag_id::uuid
          WHERE p.type = 'tag'
        ),
        '[]'::json
      ) AS tags
    FROM skill_item s
    LEFT JOIN parameters cp
      ON cp.id = s.category_id
      AND cp.type = 'category'
    WHERE s.is_active = true
  `;
    const params = [];
    let paramIndex = 1;

    if (category) {
      sql += ` AND s.category_id = $${paramIndex++}`;
      params.push(category);
    }

    if (tag) {
      sql += `
    AND EXISTS (
      SELECT 1
      FROM json_array_elements_text(s.tags) AS t(tag_id)
      WHERE t.tag_id = $${paramIndex++}
    )
 `;
      params.push(tag);
    }

    if (search) {
      sql += ` AND (s.title ILIKE $${paramIndex} OR s.intro ILIKE $${paramIndex} OR s.prompt_content ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    sql += ' ORDER BY s.created_at DESC';

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

  // --- Admin API Methods ---

  /**
   * 後台取得所有技能 (不限上架狀態)
   */
  async findAllForAdmin({ keyword, contentTypeId, categoryId, active } = {}) {
    let sql = 'SELECT * FROM skill_item WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (keyword) {
      sql += ` AND (title ILIKE $${paramIndex} OR intro ILIKE $${paramIndex})`;
      params.push(`%${keyword}%`);
      paramIndex++;
    }
    if (contentTypeId) {
      sql += ` AND content_type_id = $${paramIndex++}`;
      params.push(contentTypeId);
    }
    if (categoryId) {
      sql += ` AND category_id = $${paramIndex++}`;
      params.push(categoryId);
    }
    if (active === 'active') {
      sql += ` AND is_active = true`;
    } else if (active === 'inactive') {
      sql += ` AND is_active = false`;
    }

    sql += ' ORDER BY updated_at DESC';
    const result = await db.query(sql, params);
    return result.rows;
  }

  /**
   * 後台取得單筆技能
   */
  async findByIdForAdmin(id) {
    const sql = 'SELECT * FROM skill_item WHERE id = $1';
    const result = await db.query(sql, [id]);
    return result.rows[0] || null;
  }

  /**
   * 後台新增技能
   */
  async createSkill(data) {
    const {
      title, slug, intro, contentTypeId, categoryId, modelType, tags,
      promptContent, useCase, exampleInput, exampleOutput, userId, sourceUrl, isActive
    } = data;

    const sql = `
      INSERT INTO skill_item (
        title, slug, intro, content_type_id, category_id, model_type, tags,
        prompt_content, use_case, example_input, example_output, user_id, source_url, is_active
      ) VALUES (
        $1, $2, $3, $4, $5, $6::json, $7::json,
        $8, $9, $10, $11::json, $12, $13, $14
      ) RETURNING *
    `;

    const params = [
      title || '', slug || null, intro || '', contentTypeId || null, categoryId || null,
      JSON.stringify(modelType || []), JSON.stringify(tags || []),
      promptContent || '', useCase || '', exampleInput || '',
      JSON.stringify(exampleOutput || []), userId || null, sourceUrl || '',
      isActive ?? true
    ];

    const result = await db.query(sql, params);
    return result.rows[0];
  }

  /**
   * 後台修改技能
   */
  async updateSkill(id, data) {
    const updates = [];
    const params = [];
    let paramIndex = 1;

    const fields = {
      title: 'title',
      slug: 'slug',
      intro: 'intro',
      contentTypeId: 'content_type_id',
      categoryId: 'category_id',
      modelType: 'model_type',
      tags: 'tags',
      promptContent: 'prompt_content',
      useCase: 'use_case',
      exampleInput: 'example_input',
      exampleOutput: 'example_output',
      isActive: 'is_active',
      sourceUrl: 'source_url'
    };

    for (const [key, dbCol] of Object.entries(fields)) {
      if (data[key] !== undefined) {
        updates.push(`${dbCol} = $${paramIndex++}`);
        if (key === 'modelType' || key === 'tags' || key === 'exampleOutput') {
          params.push(JSON.stringify(data[key]));
        } else {
          params.push(data[key]);
        }
      }
    }

    if (updates.length === 0) return await this.findByIdForAdmin(id);

    updates.push(`updated_at = now()`);
    params.push(id);

    const sql = `
      UPDATE skill_item 
      SET ${updates.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;
    const result = await db.query(sql, params);
    return result.rows[0];
  }
}

module.exports = new PromptRepository();
