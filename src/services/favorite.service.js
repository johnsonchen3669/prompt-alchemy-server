const db = require('../database/db');
const favoriteRepository = require('../database/repositories/favorite.repository');
const { DEFAULT_FAVORITE_SKILL_IDS } = require('../config/favorite.config');

function toFavoriteCountsObject(counts) {
  return Object.fromEntries(counts);
}

async function isFavorited(userId, skillId, itemType = 'prompt') {
  if (itemType === 'skill') {
    const existing = await favoriteRepository.findByUserAndAgentSkillId(userId, skillId);
    return !!existing;
  }
  const existing = await favoriteRepository.findByUserAndSkillId(userId, skillId);
  return !!existing;
}

async function getMyFavorites(userId, itemType = 'prompt') {
  if (itemType === 'skill') {
    return favoriteRepository.findAgentSkillsByUserId(userId);
  }
  return favoriteRepository.findByUserId(userId);
}

/**
 * item_type='skill' 收藏切換：對應 Agent Skill 的鎖定／查詢／新增或移除／
 * 重算 favorite_count，走 favoriteRepository 的 *AgentSkill* 系列方法，
 * 完全不觸碰 Prompt 收藏（item_type='prompt'）用的方法與資料列。
 */
async function toggleSkillFavorite(userId, agentSkillId, transaction) {
  await favoriteRepository.lockUser(userId, transaction);
  await favoriteRepository.lockAgentSkills([agentSkillId], transaction);

  const existing = await favoriteRepository.findByUserAndAgentSkillId(
    userId,
    agentSkillId,
    transaction,
  );

  if (existing) {
    await favoriteRepository.removeSkillFavorite(userId, agentSkillId, transaction);
  } else {
    await favoriteRepository.addSkillFavorite(userId, agentSkillId, transaction);
  }

  const favoriteCount = (await favoriteRepository.recalculateAgentSkillFavoriteCounts(
    [agentSkillId],
    transaction,
  )).get(agentSkillId);

  return { isFavorited: !existing, favoriteCount };
}

async function togglePromptFavorite(userId, skillId, transaction) {
  await favoriteRepository.lockUser(userId, transaction);
  await favoriteRepository.lockSkills([skillId], transaction);

  const existing = await favoriteRepository.findByUserAndSkillId(
    userId,
    skillId,
    transaction,
  );

  if (existing) {
    await favoriteRepository.removeFavorite(userId, skillId, transaction);
  } else {
    await favoriteRepository.addFavorite(userId, skillId, transaction);
  }

  const favoriteCount = (await favoriteRepository.recalculateFavoriteCounts(
    [skillId],
    transaction,
  )).get(skillId);

  return { isFavorited: !existing, favoriteCount };
}

async function toggleFavorite(userId, skillId, itemType = 'prompt') {
  return db.withTransaction((transaction) => (
    itemType === 'skill'
      ? toggleSkillFavorite(userId, skillId, transaction)
      : togglePromptFavorite(userId, skillId, transaction)
  ));
}

async function clearMyFavorites(userId) {
  return db.withTransaction(async (transaction) => {
    await favoriteRepository.lockUser(userId, transaction);
    const affectedSkillIds = await favoriteRepository.findSkillIdsByUserId(userId, transaction);
    await favoriteRepository.lockSkills(affectedSkillIds, transaction);

    await favoriteRepository.removeAllByUserId(userId, transaction);
    const favoriteCounts = await favoriteRepository.recalculateFavoriteCounts(
      affectedSkillIds,
      transaction,
    );

    return {
      favoriteIds: [],
      favoriteCounts: toFavoriteCountsObject(favoriteCounts),
    };
  });
}

/**
 * 此函式由 authService 的既有 transaction 呼叫，不自行 commit/rollback。
 */
async function createDefaultFavoritesForNewUser(userId, transaction) {
  await favoriteRepository.lockUser(userId, transaction);
  await favoriteRepository.lockSkills(DEFAULT_FAVORITE_SKILL_IDS, transaction);

  for (const skillId of DEFAULT_FAVORITE_SKILL_IDS) {
    await favoriteRepository.addFavorite(userId, skillId, transaction);
  }
  await favoriteRepository.recalculateFavoriteCounts(DEFAULT_FAVORITE_SKILL_IDS, transaction);
}

async function restoreDefaultFavorites(userId) {
  return db.withTransaction(async (transaction) => {
    await favoriteRepository.lockUser(userId, transaction);
    const existingSkillIds = await favoriteRepository.findSkillIdsByUserId(userId, transaction);
    const affectedSkillIds = [...new Set([
      ...existingSkillIds,
      ...DEFAULT_FAVORITE_SKILL_IDS,
    ])];
    await favoriteRepository.lockSkills(affectedSkillIds, transaction);

    await favoriteRepository.removeAllByUserId(userId, transaction);
    for (const skillId of DEFAULT_FAVORITE_SKILL_IDS) {
      await favoriteRepository.addFavorite(userId, skillId, transaction);
    }
    const favoriteCounts = await favoriteRepository.recalculateFavoriteCounts(
      affectedSkillIds,
      transaction,
    );

    return {
      favoriteIds: [...DEFAULT_FAVORITE_SKILL_IDS],
      favoriteCounts: toFavoriteCountsObject(favoriteCounts),
    };
  });
}

module.exports = {
  toggleFavorite,
  isFavorited,
  getMyFavorites,
  clearMyFavorites,
  restoreDefaultFavorites,
  createDefaultFavoritesForNewUser,
};
