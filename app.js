const express = require('express')
const cors = require('cors')
const swaggerUi = require('swagger-ui-express');
const { apiReference } = require('@scalar/express-api-reference');
const swaggerDocument = require("./docs/openapi/swagger-output.json")
const router = require("./src/routes/index")
const errorHandler = require("./src/middlewares/errorHandler")
const { swagger } = require("./src/config/env")
const swaggerProtect = require("./src/middlewares/swaggerProtect")

const app = express();

// 信任反向代理（Render 等 PaaS），讓 req.protocol 正確回傳 https
app.set('trust proxy', true)

app.use(cors())
app.use(express.json())
app.use(router)

// 正式環境預設關閉 Swagger；開啟時用 Basic Auth 保護
// servers URL 依請求的 host 動態產生，不需手動設定環境變數
if (swagger.enabled) {
  app.get('/openapi.json', swaggerProtect, (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`
    res.json({ ...swaggerDocument, servers: [{ url: baseUrl }] })
  });
  app.use('/docs', swaggerProtect, swaggerUi.serve, (req, res, next) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`
    const dynamicDoc = { ...swaggerDocument, servers: [{ url: baseUrl }] }
    swaggerUi.setup(dynamicDoc)(req, res, next)
  });
  app.use('/scalar', swaggerProtect, apiReference({ url: '/openapi.json' }))
}

app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: '找不到請求的 API 路由'
  })
})

app.use(errorHandler)

module.exports = app;
