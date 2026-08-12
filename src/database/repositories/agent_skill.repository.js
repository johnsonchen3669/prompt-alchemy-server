const db = require('../db');

class AgentSkillRepository {
  /**
   * 前台取得上架中的 Agent Skill 列表，支援關鍵字與分類過濾
   * @param {Object} options
   * @param {string} [options.keyword]
   * @param {string} [options.categoryId]
   */
  async findActive({ keyword, categoryId } = {}) {
    let sql = `
      SELECT
        ${this._selectColumns()},
        cp.name AS category_name
      FROM agent_skill s
      LEFT JOIN parameters cp
        ON cp.id = s.category_id AND cp.type = 'category'
      WHERE s.is_active = true
    `;
    const params = [];
    let paramIndex = 1;

    if (keyword) {
      sql += ` AND (s.name ILIKE $${paramIndex} OR s.intro ILIKE $${paramIndex})`;
      params.push(`%${keyword}%`);
      paramIndex++;
    }
    if (categoryId) {
      sql += ` AND s.category_id = $${paramIndex++}`;
      params.push(categoryId);
    }

    // 熱門／排序一律以 GitHub star 數為準，不用 copy_count（那只是純統計數字，不代表品質）
    sql += ' ORDER BY s.stargazers_count DESC';

    const result = await db.query(sql, params);
    return result.rows;
  }


  // 根據 ID 取得單一上架中的 Agent Skill

  async findActiveById(id) {
    const sql = `
      SELECT
        ${this._selectColumns()},
        cp.name AS category_name
      FROM agent_skill s
      LEFT JOIN parameters cp
        ON cp.id = s.category_id AND cp.type = 'category'
      WHERE s.id = $1 AND s.is_active = true
    `;
    const result = await db.query(sql, [id]);
    return result.rows[0] || null;
  }

  // agent_skill 的欄位清單，
  
  _selectColumns() {
    return `
      s.id, s.name, s.description, s.intro, s.repo_owner, s.repo_name, s.skill_slug,
      s.creator_name, s.creator_avatar_url, s.creator_profile_url, s.license,
      s.category_id, s.user_id, s.stargazers_count, s.copy_count, s.is_active,
      s.install_kind, s.supported_agents, s.doc_url,
      s.created_at, s.updated_at,
      (
        SELECT COUNT(*)::integer FROM favorite f
        WHERE f.skill_id = s.id AND f.item_type = 'skill'
      ) AS favorite_count
    `;
  }

  // 增加 Agent Skill 的安裝指令複製次數

  async incrementCopyCount(id) {
    const sql = `
      UPDATE agent_skill
      SET copy_count = copy_count + 1
      WHERE id = $1 AND is_active = true
      RETURNING id, copy_count
    `;
    const result = await db.query(sql, [id]);
    return result.rows[0] || null;
  }

  // --- Admin API Methods ---

  // 後台取得所有 Agent Skill（不限上架狀態）

  async findAllForAdmin({ keyword, categoryId, active } = {}) {
    let sql = `
      SELECT
        ${this._selectColumns()},
        cp.name AS category_name
      FROM agent_skill s
      LEFT JOIN parameters cp
        ON cp.id = s.category_id AND cp.type = 'category'
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (keyword) {
      sql += ` AND (s.name ILIKE $${paramIndex} OR s.intro ILIKE $${paramIndex})`;
      params.push(`%${keyword}%`);
      paramIndex++;
    }
    if (categoryId) {
      sql += ` AND s.category_id = $${paramIndex++}`;
      params.push(categoryId);
    }
    if (active === 'active') {
      sql += ' AND s.is_active = true';
    } else if (active === 'inactive') {
      sql += ' AND s.is_active = false';
    }

    sql += ' ORDER BY s.updated_at DESC';
    const result = await db.query(sql, params);
    return result.rows;
  }

  // 後台取得單筆 Agent Skill
  async findByIdForAdmin(id) {
    const sql = `
      SELECT
        ${this._selectColumns()},
        cp.name AS category_name
      FROM agent_skill s
      LEFT JOIN parameters cp
        ON cp.id = s.category_id AND cp.type = 'category'
      WHERE s.id = $1
    `;
    const result = await db.query(sql, [id]);
    return result.rows[0] || null;
  }

  // 後台新增 Agent Skill
  async create(data) {
    const sql = `
      INSERT INTO agent_skill (
        name, description, intro, repo_owner, repo_name, skill_slug,
        creator_name, creator_avatar_url, creator_profile_url, license,
        category_id, user_id, stargazers_count, is_active,
        install_kind, supported_agents, doc_url
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17
      ) RETURNING *
    `;
    const params = [
      data.name,
      data.description || null,
      data.intro || null,
      data.repoOwner,
      data.repoName,
      data.skillSlug,
      data.creatorName || null,
      data.creatorAvatarUrl || null,
      data.creatorProfileUrl || null,
      data.license || null,
      data.categoryId,
      data.userId,
      data.stargazersCount || 0,
      data.isActive ?? true,
      data.installKind,
      data.supportedAgents || [],
      data.docUrl || null,
    ];
    const result = await db.query(sql, params);
    const newRow = result.rows[0];
    return newRow ? this.findByIdForAdmin(newRow.id) : null;
  }

  // 後台修改 Agent Skill（部分更新）
  async update(id, data) {
    const fields = {
      name: 'name',
      description: 'description',
      intro: 'intro',
      repoOwner: 'repo_owner',
      repoName: 'repo_name',
      skillSlug: 'skill_slug',
      creatorName: 'creator_name',
      creatorAvatarUrl: 'creator_avatar_url',
      creatorProfileUrl: 'creator_profile_url',
      license: 'license',
      categoryId: 'category_id',
      stargazersCount: 'stargazers_count',
      installKind: 'install_kind',
      supportedAgents: 'supported_agents',
      docUrl: 'doc_url',
    };

    const updates = [];
    const params = [];
    let paramIndex = 1;

    for (const [key, dbCol] of Object.entries(fields)) {
      if (data[key] !== undefined) {
        updates.push(`${dbCol} = $${paramIndex++}`);
        params.push(data[key]);
      }
    }

    if (updates.length === 0) return this.findByIdForAdmin(id);

    updates.push('updated_at = now()');
    params.push(id);

    const sql = `
      UPDATE agent_skill
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id
    `;
    const result = await db.query(sql, params);
    return result.rows[0] ? this.findByIdForAdmin(id) : null;
  }

   // 停用 / 啟用（不做硬刪除，is_active 切換皆可逆）

  async setActive(id, isActive) {
    const sql = `
      UPDATE agent_skill
      SET is_active = $2, updated_at = now()
      WHERE id = $1
      RETURNING *
    `;
    const result = await db.query(sql, [id, isActive]);
    return result.rows[0] || null;
  }
}

module.exports = new AgentSkillRepository();
