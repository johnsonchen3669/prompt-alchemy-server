const skillRecipeRepository = require('../database/repositories/skill_recipe.repository');
const skillRecipeItemRepository = require('../database/repositories/skill_recipe_item.repository');
const { buildInstallCommands } = require('./skillInstallCommand.service');

const DEFAULT_RECIPE_NAME = 'Default';

function createHttpError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizeName(name) {
  if (!name || !name.trim()) {
    throw createHttpError('請輸入 Recipe 名稱', 400);
  }
  return name.trim();
}

async function listMyRecipes(userId) {
  return skillRecipeRepository.findAllByUserId(userId);
}

/**
 * 一次撈出這個使用者名下所有 Recipe 的 recipe_id／favorite_id 配對，
 * 供收藏清單頁一次性標示 Recipe 標籤，取代逐一打 getRecipeDetail 的 N+1。
 */
async function listMyRecipeItems(userId) {
  return skillRecipeItemRepository.findAllByUserId(userId);
}

/**
 * 依 skill_recipe_item.repository 回傳的 snake_case 欄位，轉成
 * skillInstallCommand.service.buildInstallCommands 需要的 camelCase 輸入形狀
 * （見 06 號票：重用 03 號票的指令組合純函式）。
 */
function toInstallCommandSkill(row) {
  return {
    repoOwner: row.repo_owner,
    repoName: row.repo_name,
    skillSlug: row.skill_slug,
    claudeInstallMethod: row.claude_install_method,
    codexInstallMethod: row.codex_install_method,
    claudePluginName: row.claude_plugin_name,
    claudeMarketplaceName: row.claude_marketplace_name,
    gitCloneMethod: row.git_clone_method,
  };
}

/**
 * 把整個 Recipe 底下的 Skill 一次組成批次安裝指令（06 號票）。
 */
async function getInstallCommands(userId, recipeId, agent) {
  await skillRecipeRepository.assertOwnedByUser(recipeId, userId);
  const items = await skillRecipeItemRepository.findItemsByRecipeId(recipeId);
  return buildInstallCommands(items.map(toInstallCommandSkill), agent);
}

async function getRecipeDetail(userId, recipeId) {
  const recipe = await skillRecipeRepository.assertOwnedByUser(recipeId, userId);
  const items = await skillRecipeItemRepository.findItemsByRecipeId(recipeId);
  return { ...recipe, items };
}

async function createRecipe(userId, name) {
  return skillRecipeRepository.create(userId, normalizeName(name));
}

async function renameRecipe(userId, recipeId, name) {
  await skillRecipeRepository.assertOwnedByUser(recipeId, userId);
  return skillRecipeRepository.rename(recipeId, userId, normalizeName(name));
}

async function deleteRecipe(userId, recipeId) {
  await skillRecipeRepository.assertOwnedByUser(recipeId, userId);
  await skillRecipeRepository.remove(recipeId, userId);
  return { id: recipeId, deleted: true };
}

/**
 * 加入 Recipe 前必須已存在該 Skill 的收藏記錄（item_type='skill'），
 * 未收藏則由 assertUsableFavorite 丟出 NOT_FOUND，交由 errorHandler 回傳明確錯誤。
 */
async function addItem(userId, recipeId, favoriteId) {
  await skillRecipeRepository.assertOwnedByUser(recipeId, userId);
  await skillRecipeItemRepository.assertUsableFavorite(favoriteId, userId);
  await skillRecipeItemRepository.addItem(recipeId, favoriteId);
  return skillRecipeItemRepository.findItemsByRecipeId(recipeId);
}

/**
 * 從 Recipe 移除項目，不影響 favorite 收藏狀態本身。
 */
async function removeItem(userId, recipeId, favoriteId) {
  await skillRecipeRepository.assertOwnedByUser(recipeId, userId);
  await skillRecipeItemRepository.removeItem(recipeId, favoriteId);
  return skillRecipeItemRepository.findItemsByRecipeId(recipeId);
}

/**
 * 此函式由 authService 的既有 transaction 呼叫，不自行 commit/rollback。
 * 新會員註冊時自動建立一個名為 Default、內容為空的 Recipe。
 */
async function createDefaultRecipeForNewUser(userId, transaction) {
  await skillRecipeRepository.create(userId, DEFAULT_RECIPE_NAME, transaction);
}

module.exports = {
  listMyRecipes,
  listMyRecipeItems,
  getInstallCommands,
  getRecipeDetail,
  createRecipe,
  renameRecipe,
  deleteRecipe,
  addItem,
  removeItem,
  createDefaultRecipeForNewUser,
};
