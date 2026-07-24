const express = require('express');

const router = express.Router();

const favoriteController = require('../controllers/favorite.controller');
const { vertfyToken } = require('../middlewares/authenticate');

router.use(vertfyToken);

router.get('/', favoriteController.getMyFavorites);
router.get('/:skillId/status', favoriteController.checkFavoriteStatus);
router.post('/:skillId/toggle', favoriteController.toggleFavorite);

// TODO: 掛載 favorite 路由

module.exports = router;
