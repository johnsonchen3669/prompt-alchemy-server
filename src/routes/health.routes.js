const express = require('express');
const { getHealth } = require('../controllers/health.controller');

const router = express.Router();

router.get(
  '/',
  /* #swagger.tags = ['Health']
     #swagger.description = '確認服務正常運作' */
  getHealth
);

module.exports = router;