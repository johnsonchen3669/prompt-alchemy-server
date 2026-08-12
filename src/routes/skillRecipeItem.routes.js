const express = require('express');

const router = express.Router();

const skillRecipeController = require('../controllers/skillRecipe.controller');
const { vertfyToken } = require('../middlewares/authenticate');

router.use(vertfyToken);

router.get(
  '/',
  /* #swagger.tags = ['Recipes']
     #swagger.summary = '一次取得我名下所有 Recipe 的 recipeId／favoriteId 配對，供收藏清單頁一次性標示 Recipe 標籤，取代逐一打 GET /me/recipes/:id'
     #swagger.security = [{ "bearerAuth": [] }] */
  skillRecipeController.listMyRecipeItems
);

module.exports = router;
