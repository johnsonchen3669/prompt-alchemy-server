const swaggerJsdoc = require('swagger-jsdoc');
const { port } = require('./env');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Prompt 鍊金坊 Prompt Alchemy API',
      version: '1.0.0',
      description: 'Prompt 鍊金坊 Prompt Alchemy — Prompt/Skill 收藏庫後端 API 文件',
    },
    servers: [{ url: `http://localhost:${port}` }],
    security: [{ bearerAuth: [] }],
  },
  apis: [
    './docs/openapi/*.yaml',
    './src/routes/**/*.js',
  ],
};

module.exports = swaggerJsdoc(options);
