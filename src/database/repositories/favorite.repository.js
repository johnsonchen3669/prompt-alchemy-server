const db = require('../db');

function uniqueSkillIds(skillIds) {
  return [...new Set(skillIds)];
}

function createNotFoundError(message) {
  const error = new Error(message);
  error.code = 'NOT_FOUND';
  return error;
}

class FavoriteRepository {
  async lockUser(userId, executor = db) {
    const result = await executor.query(
      'SELECT id FROM users WHERE id = $1 FOR UPDATE',
      [userId],
    );
    if (!result.rows[0]) throw createNotFoundError('找不到使用者');
  }

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

  async findByUserAndSkillId(userId, skillId, executor = db) {
    const result = await executor.query(
      'SELECT * FROM favorite WHERE user_id = $1 AND skill_item_id = $2',
      [userId, skillId],
    );
    return result.rows[0] || null;
  }

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

  async findSkillIdsByUserId(userId, executor = db) {
    const result = await executor.query(
      'SELECT skill_item_id FROM favorite WHERE user_id = $1 ORDER BY skill_item_id',
      [userId],
    );
    return result.rows.map((row) => row.skill_item_id);
  }

  async addFavorite(userId, skillId, executor = db) {
    await executor.query(
      `INSERT INTO favorite (user_id, skill_item_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, skill_item_id) DO NOTHING`,
      [userId, skillId],
    );
  }

  async removeFavorite(userId, skillId, executor = db) {
    await executor.query(
      'DELETE FROM favorite WHERE user_id = $1 AND skill_item_id = $2',
      [userId, skillId],
    );
  }

  async removeAllByUserId(userId, executor = db) {
    await executor.query('DELETE FROM favorite WHERE user_id = $1', [userId]);
  }

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
