const express = require('express')
const cors = require('cors')
const swaggerUi = require('swagger-ui-express');
const { apiReference } = require('@scalar/express-api-reference');
const swaggerDocument = require("./docs/openapi/swagger-output.json")
const router = require("./src/routes/index")
const errorHandler = require("./src/middlewares/errorHandler")

const app = express();

app.use(cors())
app.use(express.json())
app.use(router)

app.get('/openapi.json', (req, res) =>　/* #swagger.ignore = true */ res.json(swaggerDocument));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/scalar', apiReference({ url: '/openapi.json', }),
)

app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: '找不到請求的 API 路由'
  })
})

app.use(errorHandler)

module.exports = app;
