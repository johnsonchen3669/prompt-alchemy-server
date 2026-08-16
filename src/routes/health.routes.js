const express = require('express');
const { getHealth } = require('../controllers/health.controller');

const router = express.Router();

router.get(
  '/',
  /* #swagger.tags = ['Health']
     #swagger.summary = '確認服務存活狀態'
     #swagger.description = '確認 API 服務正常運作，並回傳目前伺服器時間。'
     #swagger.security = [] */
  /* #swagger.responses[200] = {
       description: '服務正常運作',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             required: ['status', 'timestamp'],
             properties: {
               status: { type: 'string', example: 'ok' },
               timestamp: { type: 'string', format: 'date-time', example: '2026-08-16T12:00:00.000Z' }
             }
           }
         }
       }
  } */
  getHealth
);

module.exports = router;
