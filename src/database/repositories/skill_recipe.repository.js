const db = require('../db');

function createNotFoundError(message) {
  const error = new Error(message);
  error.code = 'NOT_FOUND';
  return error;
}

class SkillRecipeRepository {
  /**
   * 取得某使用者的所有 Recipe
   */
  async findAllByUserId(userId, executor = db) {
    const result = await executor.query(
      `SELECT * FROM skill_recipe WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
    return result.rows;
  }

  /**
   * 取得單一 Recipe（限該使用者本人擁有，避免存取他人資料）
   */
  async findByIdForUser(id, userId, executor = db) {
    const result = await executor.query(
      `SELECT * FROM skill_recipe WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
    return result.rows[0] || null;
  }

  /**
   * 確認 Recipe 屬於該使用者，找不到就丟 NOT_FOUND（比照 favorite.repository 的 lockUser 慣例）
   */
  async assertOwnedByUser(id, userId, executor = db) {
    const recipe = await this.findByIdForUser(id, userId, executor);
    if (!recipe) throw createNotFoundError('找不到指定的 Recipe');
    return recipe;
  }

  async create(userId, name, executor = db) {
    const result = await executor.query(
      `INSERT INTO skill_recipe (user_id, name) VALUES ($1, $2) RETURNING *`,
      [userId, name],
    );
    return result.rows[0];
  }

  async rename(id, userId, name, executor = db) {
    const result = await executor.query(
      `UPDATE skill_recipe
       SET name = $3, updated_at = now()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId, name],
    );
    return result.rows[0] || null;
  }

  /**
   * 刪除 Recipe，底下的 skill_recipe_item 由 FK ON DELETE CASCADE 一併移除，
   * 不影響 favorite 收藏狀態本身。
   */
  async remove(id, userId, executor = db) {
    const result = await executor.query(
      `DELETE FROM skill_recipe WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId],
    );
    return !!result.rows[0];
  }
}

module.exports = new SkillRecipeRepository();
