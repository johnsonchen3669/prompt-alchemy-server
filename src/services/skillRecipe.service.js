const skillRecipeRepository = require('../database/repositories/skill_recipe.repository');
const skillRecipeItemRepository = require('../database/repositories/skill_recipe_item.repository');
const { buildInstallCommands, SUPPORTED_AGENTS } = require('./skillInstallCommand.service');

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


 // 一次撈出這個使用者名下所有 Recipe 的 recipe_id／favorite_id 

async function listMyRecipeItems(userId) {
  return skillRecipeItemRepository.findAllByUserId(userId);
}


function toInstallCommandSkill(row) {
  return {
    repoOwner: row.repo_owner,
    repoName: row.repo_name,
    skillSlug: row.skill_slug,
    installKind: row.install_kind,
    supportedAgents: row.supported_agents,
  };
}

 // 把整個 Recipe 底下的 Skill 一次組成批次安裝指令

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


 // 記住使用者上次在這個 Recipe 的批次安裝畫面選過的agent

async function updateLastSelectedAgent(userId, recipeId, agent) {
  if (!SUPPORTED_AGENTS.includes(agent)) {
    throw createHttpError(`不支援的目標 Agent：${agent}`, 400);
  }
  await skillRecipeRepository.assertOwnedByUser(recipeId, userId);
  return skillRecipeRepository.updateLastSelectedAgent(recipeId, userId, agent);
}

async function deleteRecipe(userId, recipeId) {
  await skillRecipeRepository.assertOwnedByUser(recipeId, userId);
  await skillRecipeRepository.remove(recipeId, userId);
  return { id: recipeId, deleted: true };
}


async function addItem(userId, recipeId, favoriteId) {
  await skillRecipeRepository.assertOwnedByUser(recipeId, userId);
  await skillRecipeItemRepository.assertUsableFavorite(favoriteId, userId);
  await skillRecipeItemRepository.addItem(recipeId, favoriteId);
  return skillRecipeItemRepository.findItemsByRecipeId(recipeId);
}


 // 從 Recipe 移除項目，不影響 favorite 收藏狀態本身

async function removeItem(userId, recipeId, favoriteId) {
  await skillRecipeRepository.assertOwnedByUser(recipeId, userId);
  await skillRecipeItemRepository.removeItem(recipeId, favoriteId);
  return skillRecipeItemRepository.findItemsByRecipeId(recipeId);
}


 // 新會員註冊時自動建立一個名為 Default、內容為空的 Recipe。

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
  updateLastSelectedAgent,
  deleteRecipe,
  addItem,
  removeItem,
  createDefaultRecipeForNewUser,
};
