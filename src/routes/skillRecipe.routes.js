const express = require('express');

const router = express.Router();

const skillRecipeController = require('../controllers/skillRecipe.controller');
const { vertfyToken } = require('../middlewares/authenticate');

// Recipe 功能全部綁定登入者身分，統一驗證 token
router.use(vertfyToken);

router.get(
  '/',
  /* #swagger.tags = ['Recipes']
     #swagger.summary = '取得我的 Recipe 清單'
     #swagger.security = [{ "bearerAuth": [] }] */
  skillRecipeController.listMyRecipes
);

router.post(
  '/',
  /* #swagger.tags = ['Recipes']
     #swagger.summary = '建立 Recipe'
     #swagger.security = [{ "bearerAuth": [] }] */
  skillRecipeController.createRecipe
);

router.get(
  '/:id',
  /* #swagger.tags = ['Recipes']
     #swagger.summary = '取得單一 Recipe 內容（含底下的 Skill 清單）'
     #swagger.security = [{ "bearerAuth": [] }] */
  skillRecipeController.getRecipeDetail
);

router.patch(
  '/:id',
  /* #swagger.tags = ['Recipes']
     #swagger.summary = '重新命名 Recipe'
     #swagger.security = [{ "bearerAuth": [] }] */
  skillRecipeController.renameRecipe
);

router.patch(
  '/:id/last-selected-agent',
  /* #swagger.tags = ['Recipes']
     #swagger.summary = '記住這個 Recipe 上次選過的目標 agent（10 號票），下次打開時當預設選項'
     #swagger.security = [{ "bearerAuth": [] }] */
  skillRecipeController.updateLastSelectedAgent
);

router.delete(
  '/:id',
  /* #swagger.tags = ['Recipes']
     #swagger.summary = '刪除 Recipe（連帶清除 skill_recipe_item 關聯，不影響收藏狀態）'
     #swagger.security = [{ "bearerAuth": [] }] */
  skillRecipeController.deleteRecipe
);

router.get(
  '/:id/install-command',
  /* #swagger.tags = ['Recipes']
     #swagger.summary = '把整個 Recipe 底下的 Skill 一次組成批次安裝指令（06 號票，重用 03 號票的指令組合純函式）'
     #swagger.security = [{ "bearerAuth": [] }] */
  skillRecipeController.getInstallCommands
);

router.post(
  '/:id/items',
  /* #swagger.tags = ['Recipes']
     #swagger.summary = '把已收藏的 Skill 加入 Recipe（未收藏會回傳明確錯誤）'
     #swagger.security = [{ "bearerAuth": [] }] */
  skillRecipeController.addItem
);

router.delete(
  '/:id/items/:favoriteId',
  /* #swagger.tags = ['Recipes']
     #swagger.summary = '從 Recipe 移除項目（不影響收藏狀態）'
     #swagger.security = [{ "bearerAuth": [] }] */
  skillRecipeController.removeItem
);

module.exports = router;
