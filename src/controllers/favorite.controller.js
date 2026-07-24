// TODO: favorite controller（add、remove、listMine）
const favoriteService = require('../services/favorite.service');

async function toggleFavorite(req, res, next) {
    try {
        const userId = req.user.userId;
        const { skillId } = req.params;
        const result = await favoriteService.toggleFavorite(userId, skillId);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        next(error);
    }
}

async function getMyFavorites(req, res, next) {
    try {
        const userId = req.user.userId;
        const data = await favoriteService.getMyFavorites(userId);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        next(error);
    }
}

async function checkFavoriteStatus(req, res, next) {
    try {
        const userId = req.user.userId;
        const { skillId } = req.params;
        const isFavorited = await favoriteService.isFavorited(userId, skillId);
        res.status(200).json({ status: 'success', data: { isFavorited } });
    } catch (error) {
        next(error);
    }
}

module.exports = { toggleFavorite, getMyFavorites, checkFavoriteStatus };
