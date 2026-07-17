const { port } = require('./src/config/env')
const app = require('./app')

const server = app.listen(port, () => {
  console.log(`Server 啟動在 http://localhost:${port}`);
  console.log(`Swagger UI：http://localhost:${port}/docs`);
  console.log(`Scalar UI：http://localhost:${port}/scalar`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[Server] 啟動失敗：port ${port} 已被其他程式佔用，請關閉該程式或改用其他 PORT 再重新啟動`);
  } else {
    console.error('[Server] 啟動失敗', err);
  }
  process.exit(1);
});
