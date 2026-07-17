// 由 swagger-autogen 掃描 app.js 的路由自動產生，執行 `npm run swagger` 重新產生
const fs = require('fs');
const path = require('path');
const swaggerAutogen = require('swagger-autogen')({ openapi: '3.0.0' });
const { port } = require('./env');

// 不該出現在文件內容裡路由
const IGNORED_PATHS = ['/openapi.json'];

const doc = {
  info: {
    title: 'Prompt 鍊金坊 Prompt Alchemy API',
    description: 'Prompt 鍊金坊 Prompt Alchemy — Prompt/Skill 收藏庫後端 API 文件',
    version: '1.0.0',
  },
  servers: [{ url: `http://localhost:${port}` }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const outputFile = path.join(__dirname, '../../docs/openapi/swagger-output.json');
const endpointsFiles = [path.join(__dirname, '../../app.js')];

swaggerAutogen(outputFile, endpointsFiles, doc)

// .then(() => {
//   const generated = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
//   for (const ignoredPath of IGNORED_PATHS) {
//     delete generated.paths[ignoredPath];
//   }
//   fs.writeFileSync(outputFile, JSON.stringify(generated, null, 2));
// });

