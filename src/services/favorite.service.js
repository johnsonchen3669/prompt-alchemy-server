const favoriteRepository = require('../database/repositories/favorite.repository');
async function isFavorited(userId, skillId) {
    const existing = await favoriteRepository.findByUserAndSkillId(userId, skillId);
    return !!existing;
}
async function getMyFavorites(userId) {
    return favoriteRepository.findByUserId(userId);
}
async function toggleFavorite(userId, skillId) {
    const existing = await favoriteRepository.findByUserAndSkillId(userId, skillId);

    if (existing) {
        const result = await favoriteRepository.removeFavoriteAndDecrement(userId, skillId);
        return { isFavorited: false, favoriteCount: result?.favorite_count ?? null };
    }

    const result = await favoriteRepository.addFavoriteAndIncrement(userId, skillId);
    return { isFavorited: true, favoriteCount: result?.favorite_count ?? null };
}

module.exports = {
    toggleFavorite, isFavorited, getMyFavorites,
};
