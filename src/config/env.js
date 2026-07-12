require('dotenv').config();

module.exports = {
  nodeEnv: 'development',
  JWT_SECRET: process.env.JWT_SECRET,
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,
}