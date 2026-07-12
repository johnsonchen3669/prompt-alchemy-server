const express = require('express')
const cors = require('cors')
const swaggerUi = require('swagger-ui-express');
const { apiReference } = require('@scalar/express-api-reference');
const swaggerDocument = require("./docs/openapi/swagger-output.json")

const app = express();
const healthRouter = require('./src/routes/health.routes')
const authRouter = require('./src/routes/auth.routes');

app.use(cors())
app.use(express.json())

app.use('/health', healthRouter)
app.use('/auth', authRouter)

app.get('/openapi.json', (req, res) =>　/* #swagger.ignore = true */ res.json(swaggerDocument));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/scalar', apiReference({ url: '/openapi.json', }),
)


module.exports = app;