const db = require('../db');

function uniqueIds(ids) {
  return [...new Set(ids)];
}

/**
 * 建立 repository 使用的資料不存在錯誤。
 * @param {string} message 錯誤訊息
 * @returns {Error} code 為 NOT_FOUND 的錯誤
 */
function createNotFoundError(message) {
  const error = new Error(message);
  error.code = 'NOT_FOUND';
  return error;
}

class FavoriteRepository {
  /**
   * 鎖定指定使用者資料，避免收藏交易期間發生競態條件。
   * @param {string} userId 使用者 UUID
   * @param {Object} executor 資料庫查詢執行器
   * @returns {Promise<void>}
   */
  async lockUser(userId, executor = db) {
    const result = await executor.query(
      'SELECT id FROM users WHERE id = $1 FOR UPDATE',
      [userId],
    );
    if (!result.rows[0]) throw createNotFoundError('找不到使用者');
  }

  /**
   * 去重並鎖定指定技能資料，確保技能存在且鎖定順序固定。
   * @param {string[]} skillIds 技能 UUID 陣列
   * @param {Object} executor 資料庫查詢執行器
   * @returns {Promise<string[]>} 去重並排序後的技能 UUID 陣列
   */
  async lockSkills(skillIds, executor = db) {
    const ids = uniqueIds(skillIds).sort();
    if (ids.length === 0) return [];

    const result = await executor.query(
      'SELECT id FROM skill_item WHERE id = ANY($1::uuid[]) ORDER BY id FOR UPDATE',
      [ids],
    );
    if (result.rows.length !== ids.length) {
      throw createNotFoundError('找不到指定的技能');
    }
    return ids;
  }

  // === Prompt 收藏（item_type='prompt'，走 skill_item_id）===
  // 既有方法明確加上 item_type='prompt' 篩選／目標，避免未來 item_type='skill'
  // 的收藏資料混進來，也讓 ON CONFLICT 對應到 partial unique index。

  /**
   * 取得指定使用者與技能的收藏關聯。
   * @param {string} userId 使用者 UUID
   * @param {string} skillId 技能 UUID
   * @param {Object} executor 資料庫查詢執行器
   * @returns {Promise<Object|null>} 收藏資料或 null
   */
  async findByUserAndSkillId(userId, skillId, executor = db) {
    const result = await executor.query(
      `SELECT * FROM favorite
       WHERE user_id = $1 AND skill_item_id = $2 AND item_type = 'prompt'`,
      [userId, skillId],
    );
    return result.rows[0] || null;
  }

  /**
   * 取得指定使用者的完整收藏技能列表。
   * @param {string} userId 使用者 UUID
   * @param {Object} executor 資料庫查詢執行器
   * @returns {Promise<Array>} 收藏技能資料陣列
   */
  async findByUserId(userId, executor = db) {
    const result = await executor.query(
      `SELECT
         s.*,
         f.created_at AS favorited_at,
         f.sort_order,
         cp.name AS category_name
       FROM favorite f
       JOIN skill_item s ON s.id = f.skill_item_id
       LEFT JOIN parameters cp ON cp.id = s.category_id AND cp.type = 'category'
       WHERE f.user_id = $1 AND f.item_type = 'prompt'
       ORDER BY f.created_at DESC`,
      [userId],
    );
    return result.rows;
  }

  /**
   * 取得指定使用者收藏的技能 UUID。
   * @param {string} userId 使用者 UUID
   * @param {Object} executor 資料庫查詢執行器
   * @returns {Promise<string[]>} 技能 UUID 陣列
   */
  async findSkillIdsByUserId(userId, executor = db) {
    const result = await executor.query(
      `SELECT skill_item_id FROM favorite
       WHERE user_id = $1 AND item_type = 'prompt'
       ORDER BY skill_item_id`,
      [userId],
    );
    return result.rows.map((row) => row.skill_item_id);
  }

  /**
   * 新增收藏；已存在相同收藏時不重複寫入。
   * @param {string} userId 使用者 UUID
   * @param {string} skillId 技能 UUID
   * @param {Object} executor 資料庫查詢執行器
   * @returns {Promise<void>}
   */
  async addFavorite(userId, skillId, executor = db) {
    await executor.query(
      `INSERT INTO favorite (user_id, item_type, skill_item_id)
       VALUES ($1, 'prompt', $2)
       ON CONFLICT (user_id, skill_item_id) WHERE item_type = 'prompt' DO NOTHING`,
      [userId, skillId],
    );
  }

  /**
   * 移除指定使用者與技能的收藏關聯。
   * @param {string} userId 使用者 UUID
   * @param {string} skillId 技能 UUID
   * @param {Object} executor 資料庫查詢執行器
   * @returns {Promise<void>}
   */
  async removeFavorite(userId, skillId, executor = db) {
    await executor.query(
      `DELETE FROM favorite
       WHERE user_id = $1 AND skill_item_id = $2 AND item_type = 'prompt'`,
      [userId, skillId],
    );
  }

  /**
   * 移除指定使用者的全部收藏。
   * @param {string} userId 使用者 UUID
   * @param {Object} executor 資料庫查詢執行器
   * @returns {Promise<void>}
   */
  async removeAllByUserId(userId, executor = db) {
    // 注意：目前刪除該使用者「所有」收藏，不分 Prompt / Agent Skill。
    // 若之後 Skills 頁需要「只清空 Skill 收藏」的獨立操作，
    // 請改用下方的 removeAllByUserIdAndType，不要直接修改這個方法的既有行為
    // （現有的清空收藏／恢復預設收藏 service 呼叫的正是這個全類型版本）。
    await executor.query('DELETE FROM favorite WHERE user_id = $1', [userId]);
  }

  /**
   * 重新計算指定技能的收藏總數。
   * @param {string[]} skillIds 技能 UUID 陣列
   * @param {Object} executor 資料庫查詢執行器
   * @returns {Promise<Map<string, number>>} 技能 UUID 與收藏總數對照表
   */
  async recalculateFavoriteCounts(skillIds, executor = db) {
    const counts = new Map();
    for (const skillId of uniqueIds(skillIds)) {
      const result = await executor.query(
        `UPDATE skill_item
         SET favorite_count = (
           SELECT COUNT(*)::integer FROM favorite
           WHERE skill_item_id = $1 AND item_type = 'prompt'
         )
         WHERE id = $1
         RETURNING favorite_count`,
        [skillId],
      );
      counts.set(skillId, Number(result.rows[0].favorite_count));
    }
    return counts;
  }

  // === Agent Skill 收藏（item_type='skill'，走 skill_id）===
  // 目前尚無 service/controller 呼叫這些方法；先備妥 repository 層，
  // 供之後獨立的 Skills 列表頁串接，對外 API 尚未變動。

  async lockAgentSkills(agentSkillIds, executor = db) {
    const ids = uniqueIds(agentSkillIds).sort();
    if (ids.length === 0) return [];

    const result = await executor.query(
      'SELECT id FROM agent_skill WHERE id = ANY($1::uuid[]) ORDER BY id FOR UPDATE',
      [ids],
    );
    if (result.rows.length !== ids.length) {
      throw createNotFoundError('找不到指定的 Agent Skill');
    }
    return ids;
  }

  async findByUserAndAgentSkillId(userId, agentSkillId, executor = db) {
    const result = await executor.query(
      `SELECT * FROM favorite
       WHERE user_id = $1 AND skill_id = $2 AND item_type = 'skill'`,
      [userId, agentSkillId],
    );
    return result.rows[0] || null;
  }

  async findAgentSkillIdsByUserId(userId, executor = db) {
    const result = await executor.query(
      `SELECT skill_id FROM favorite
       WHERE user_id = $1 AND item_type = 'skill'
       ORDER BY skill_id`,
      [userId],
    );
    return result.rows.map((row) => row.skill_id);
  }

  async addSkillFavorite(userId, agentSkillId, executor = db) {
    await executor.query(
      `INSERT INTO favorite (user_id, item_type, skill_id)
       VALUES ($1, 'skill', $2)
       ON CONFLICT (user_id, skill_id) WHERE item_type = 'skill' DO NOTHING`,
      [userId, agentSkillId],
    );
  }

  async removeSkillFavorite(userId, agentSkillId, executor = db) {
    await executor.query(
      `DELETE FROM favorite
       WHERE user_id = $1 AND skill_id = $2 AND item_type = 'skill'`,
      [userId, agentSkillId],
    );
  }

  /**
   * 取得指定使用者收藏的 Agent Skill 完整清單。
   * @param {string} userId 使用者 UUID
   * @param {Object} executor 資料庫查詢執行器
   * @returns {Promise<Array>} 收藏 Agent Skill 資料陣列
   */
  async findAgentSkillsByUserId(userId, executor = db) {
    const result = await executor.query(
      `SELECT
         s.*,
         f.id AS favorite_id,
         f.created_at AS favorited_at,
         f.sort_order,
         cp.name AS category_name
       FROM favorite f
       JOIN agent_skill s ON s.id = f.skill_id
       LEFT JOIN parameters cp ON cp.id = s.category_id AND cp.type = 'category'
       WHERE f.user_id = $1 AND f.item_type = 'skill'
       ORDER BY f.created_at DESC`,
      [userId],
    );
    return result.rows;
  }

  async removeAllByUserIdAndType(userId, itemType, executor = db) {
    await executor.query(
      'DELETE FROM favorite WHERE user_id = $1 AND item_type = $2',
      [userId, itemType],
    );
  }

  async recalculateAgentSkillFavoriteCounts(agentSkillIds, executor = db) {
    const counts = new Map();
    for (const agentSkillId of uniqueIds(agentSkillIds)) {
      const result = await executor.query(
        `UPDATE agent_skill
         SET favorite_count = (
           SELECT COUNT(*)::integer FROM favorite
           WHERE skill_id = $1 AND item_type = 'skill'
         )
         WHERE id = $1
         RETURNING favorite_count`,
        [agentSkillId],
      );
      counts.set(agentSkillId, Number(result.rows[0].favorite_count));
    }
    return counts;
  }
}

module.exports = new FavoriteRepository();
