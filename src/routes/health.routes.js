const express = require('express');
const { getHealth } = require('../controllers/health.controller');

const router = express.Router();

router.get(
  '/',
  /* #swagger.tags = ['Health']
     #swagger.summary = '確認服務存活狀態'
     #swagger.description = '確認服務正常運作' */
  /* #swagger.responses[200] = {
       description: '服務正常運作',
       schema: {
         status: 'ok',
         timestamp: '2026-07-17T12:00:00.000Z'
       }
  } */
  getHealth
);

module.exports = router;