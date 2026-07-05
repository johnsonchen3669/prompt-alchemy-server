const express = require('express')
const cors = require('cors')
const swaggerUi = require('swagger-ui-express');
const { apiReference } = require('@scalar/express-api-reference');
const swaggerSpec = require('./src/config/swagger');

const app = express();
const healthRouter = require('./src/routes/health.routes')

app.use(cors())
app.use(express.json())


app.use('/health', healthRouter)

app.get('/openapi.json', (req, res) => res.json(swaggerSpec));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/scalar', apiReference({ spec: { url: '/openapi.json' } }));


module.exports = app;