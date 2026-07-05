const express = require('express');
const { getHealth } = require('../controllers/health.controller');

const router = express.Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: 確認服務正常
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: 服務正常運作
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/', getHealth);

module.exports = router;