const favoriteService = require('../services/favorite.service');

// item_type 白名單驗證（CWE-20）：只接受這兩個值，其餘一律視為不合法請求。
const VALID_ITEM_TYPES = ['prompt', 'skill'];


 // 解析並驗證 req.query.itemType，省略時預設為 'prompt'（既有 Prompt 收藏行為）。
 // 不合法時直接回 400 並回傳 null，呼叫端需檢查回傳值是否為 null 並提早 return。

function resolveItemType(req, res) {
    const itemType = req.query.itemType || 'prompt';
    if (!VALID_ITEM_TYPES.includes(itemType)) {
        res.status(400).json({ status: 'error', message: 'itemType 必須是 prompt 或 skill' });
        return null;
    }
    return itemType;
}

async function toggleFavorite(req, res, next) {
    try {
        const userId = req.user.userId;
        const { skillId } = req.params;
        const itemType = resolveItemType(req, res);
        if (!itemType) return;
        const result = await favoriteService.toggleFavorite(userId, skillId, itemType);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        next(error);
    }
}

async function getMyFavorites(req, res, next) {
    try {
        const userId = req.user.userId;
        const itemType = resolveItemType(req, res);
        if (!itemType) return;
        const data = await favoriteService.getMyFavorites(userId, itemType);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        next(error);
    }
}

async function checkFavoriteStatus(req, res, next) {
    try {
        const userId = req.user.userId;
        const { skillId } = req.params;
        const itemType = resolveItemType(req, res);
        if (!itemType) return;
        const isFavorited = await favoriteService.isFavorited(userId, skillId, itemType);
        res.status(200).json({ status: 'success', data: { isFavorited } });
    } catch (error) {
        next(error);
    }
}

async function clearMyFavorites(req, res, next) {
    try {
        const userId = req.user.userId;
        const data = await favoriteService.clearMyFavorites(userId);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        next(error);
    }
}

async function restoreDefaultFavorites(req, res, next) {
    try {
        const userId = req.user.userId;
        const data = await favoriteService.restoreDefaultFavorites(userId);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    toggleFavorite,
    getMyFavorites,
    checkFavoriteStatus,
    clearMyFavorites,
    restoreDefaultFavorites,
};
