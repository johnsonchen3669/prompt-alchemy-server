const skillRecipeService = require('../services/skillRecipe.service');

async function listMyRecipes(req, res, next) {
  try {
    const userId = req.user.userId;
    const data = await skillRecipeService.listMyRecipes(userId);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
}

async function listMyRecipeItems(req, res, next) {
  try {
    const userId = req.user.userId;
    const data = await skillRecipeService.listMyRecipeItems(userId);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
}

async function getRecipeDetail(req, res, next) {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const data = await skillRecipeService.getRecipeDetail(userId, id);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
}

async function createRecipe(req, res, next) {
  try {
    const userId = req.user.userId;
    const { name } = req.body;
    const data = await skillRecipeService.createRecipe(userId, name);
    res.status(201).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
}

async function renameRecipe(req, res, next) {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { name } = req.body;
    const data = await skillRecipeService.renameRecipe(userId, id, name);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
}

async function deleteRecipe(req, res, next) {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const data = await skillRecipeService.deleteRecipe(userId, id);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
}

async function addItem(req, res, next) {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { favoriteId } = req.body;
    const data = await skillRecipeService.addItem(userId, id, favoriteId);
    res.status(201).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
}

async function removeItem(req, res, next) {
  try {
    const userId = req.user.userId;
    const { id, favoriteId } = req.params;
    const data = await skillRecipeService.removeItem(userId, id, favoriteId);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listMyRecipes,
  listMyRecipeItems,
  getRecipeDetail,
  createRecipe,
  renameRecipe,
  deleteRecipe,
  addItem,
  removeItem,
};
