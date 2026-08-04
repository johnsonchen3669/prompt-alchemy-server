const db = require('../db');

/**
 * 移除重複的技能 UUID，避免同一筆技能被重複處理。
 * @param {string[]} skillIds 技能 UUID 陣列
 * @returns {string[]} 去重後的技能 UUID 陣列
 */
function uniqueSkillIds(skillIds) {
  return [...new Set(skillIds)];
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
    const ids = uniqueSkillIds(skillIds).sort();
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

  /**
   * 取得指定使用者與技能的收藏關聯。
   * @param {string} userId 使用者 UUID
   * @param {string} skillId 技能 UUID
   * @param {Object} executor 資料庫查詢執行器
   * @returns {Promise<Object|null>} 收藏資料或 null
   */
  async findByUserAndSkillId(userId, skillId, executor = db) {
    const result = await executor.query(
      'SELECT * FROM favorite WHERE user_id = $1 AND skill_item_id = $2',
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
       WHERE f.user_id = $1
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
      'SELECT skill_item_id FROM favorite WHERE user_id = $1 ORDER BY skill_item_id',
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
      `INSERT INTO favorite (user_id, skill_item_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, skill_item_id) DO NOTHING`,
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
      'DELETE FROM favorite WHERE user_id = $1 AND skill_item_id = $2',
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
    for (const skillId of uniqueSkillIds(skillIds)) {
      const result = await executor.query(
        `UPDATE skill_item
         SET favorite_count = (
           SELECT COUNT(*)::integer FROM favorite WHERE skill_item_id = $1
         )
         WHERE id = $1
         RETURNING favorite_count`,
        [skillId],
      );
      counts.set(skillId, Number(result.rows[0].favorite_count));
    }
    return counts;
  }
}

module.exports = new FavoriteRepository();
