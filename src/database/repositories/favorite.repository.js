const db = require('../db');

class FavoriteRepository {
    // 查找對應的收藏紀錄
    async findByUserAndSkillId(userId, skillId) {
        const sql = 'SELECT * FROM favorite WHERE user_id = $1 AND skill_item_id = $2';
        const result = await db.query(sql, [userId, skillId]);
        return result.rows[0] || null;
    }
    // 查找使用者的所有收藏紀錄
    async findByUserId(userId) {
        const sql = `
        SELECT
            s.*,  
            f.created_at AS favorited_at,
            f.sort_order,
            cp.name AS category_name
        FROM favorite f
        JOIN skill_item s ON s.id = f.skill_item_id
        LEFT JOIN parameters cp ON cp.id = s.category_id AND cp.type = 'category'
        WHERE f.user_id = $1
        ORDER BY f.created_at DESC
        `;
        const result = await db.query(sql, [userId]);
        return result.rows;
    }

    // 增加收藏記錄計數
    async addFavoriteAndIncrement(userId, skillId) {
        const sql = `
    WITH ins AS (
      INSERT INTO favorite (user_id, skill_item_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, skill_item_id) DO NOTHING
      RETURNING skill_item_id
    )
    UPDATE skill_item
    SET favorite_count = favorite_count + 1
    WHERE id = $2 AND EXISTS (SELECT 1 FROM ins)
    RETURNING favorite_count;
  `;
        const result = await db.query(sql, [userId, skillId]);
        return result.rows[0] || null;
    }
    // 減少收藏計數
    async removeFavoriteAndDecrement(userId, skillId) {
        const sql = `
    WITH del AS (
      DELETE FROM favorite
      WHERE user_id = $1 AND skill_item_id = $2
      RETURNING skill_item_id
    )
    UPDATE skill_item
    SET favorite_count = GREATEST(favorite_count - 1, 0)
    WHERE id = $2 AND EXISTS (SELECT 1 FROM del)
    RETURNING favorite_count;
  `;
        const result = await db.query(sql, [userId, skillId]);
        return result.rows[0] || null;
    }

}
module.exports = new FavoriteRepository();