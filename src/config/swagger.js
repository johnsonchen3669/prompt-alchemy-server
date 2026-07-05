const swaggerJsdoc = require('swagger-jsdoc');
const { port } = require('./env');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Prompt/Skill 收藏庫 API',
      version: '1.0.0',
      description: 'Prompt/Skill 收藏庫後端 API 文件',
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
