const path = require('path')
const NODE_ENV = process.env.NODE_ENV || 'development';

require('dotenv').config({
  path: path.resolve(__dirname, '../../', `.env.${NODE_ENV}`),
});

if (NODE_ENV === 'production') {
  const missingKeys = ['JWT_SECRET', 'DATABASE_URL'].filter((key) => !process.env[key]);
  if (missingKeys.length > 0) {
    throw new Error(`production 環境缺少必要環境變數：${missingKeys.join(', ')}（請確認 .env.production 是否存在）`);
  }
}

module.exports = {
  nodeEnv: NODE_ENV,
  JWT_SECRET: process.env.JWT_SECRET,
  port: Number(process.env.PORT) || 3000,
<<<<<<< HEAD
  gcp: {
    projectId: process.env.GCP_PROJECT_ID,
    clientEmail: process.env.GCP_CLIENT_EMAIL,
    privateKey: process.env.GCP_PRIVATE_KEY,
    bucketName: process.env.GCP_BUCKET_NAME,
  }
=======
  databaseUrl: process.env.DATABASE_URL,
>>>>>>> 36a7dce84610946da9b13f55ca02d012b59297b1
}