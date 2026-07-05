const { port } = require('./src/config/env')
const app = require('./app')

app.listen(port, () => {
  console.log(`Server 啟動在 http://localhost:${port}`);
  console.log(`Swagger UI：http://localhost:${port}/docs`);
  console.log(`Scalar UI：http://localhost:${port}/scalar`);
});
