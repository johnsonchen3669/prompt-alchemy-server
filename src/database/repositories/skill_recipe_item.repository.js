const db = require('../db');

function createNotFoundError(message) {
  const error = new Error(message);
  error.code = 'NOT_FOUND';
  return error;
}

class SkillRecipeItemRepository {

  async assertUsableFavorite(favoriteId, userId, executor = db) {
    const result = await executor.query(
      `SELECT id FROM favorite
       WHERE id = $1 AND user_id = $2 AND item_type = 'skill'`,
      [favoriteId, userId],
    );
    if (!result.rows[0]) {
      throw createNotFoundError('這個 Skill 尚未被收藏，無法加入 Recipe');
    }
    return result.rows[0];
  }

   // 把一筆已收藏的 Skill 加進 Recipe（複合 PK 保證同一組合不會重複加入）

  async addItem(recipeId, favoriteId, executor = db) {
    await executor.query(
      `INSERT INTO skill_recipe_item (recipe_id, favorite_skill_id)
       VALUES ($1, $2)
       ON CONFLICT (recipe_id, favorite_skill_id) DO NOTHING`,
      [recipeId, favoriteId],
    );
  }

  // 從 Recipe 移除一個項目（不影響 favorite 收藏狀態本身）
  async removeItem(recipeId, favoriteId, executor = db) {
    await executor.query(
      `DELETE FROM skill_recipe_item
       WHERE recipe_id = $1 AND favorite_skill_id = $2`,
      [recipeId, favoriteId],
    );
  }

  // 一次撈出該使用者名下所有 Recipe 的 recipe_id／favorite_id 配對

  async findAllByUserId(userId, executor = db) {
    const result = await executor.query(
      `SELECT ri.recipe_id, ri.favorite_skill_id AS favorite_id
       FROM skill_recipe_item ri
       JOIN skill_recipe r ON r.id = ri.recipe_id
       WHERE r.user_id = $1`,
      [userId],
    );
    return result.rows;
  }

  // 查看某個 Recipe 底下有哪些 Agent Skill（透過 favorite 找到對應的 agent_skill）
  async findItemsByRecipeId(recipeId, executor = db) {
    const result = await executor.query(
      `SELECT
         a.*,
         f.id AS favorite_id,
         ri.created_at AS added_at
       FROM skill_recipe_item ri
       JOIN favorite f ON f.id = ri.favorite_skill_id
       JOIN agent_skill a ON a.id = f.skill_id
       WHERE ri.recipe_id = $1
       ORDER BY ri.created_at DESC`,
      [recipeId],
    );
    return result.rows;
  }
}

module.exports = new SkillRecipeItemRepository();
