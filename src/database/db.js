const fs = require('fs')
const path = require('path')
const { databaseUrl, nodeEnv } = require("../config/env");
const { Pool } = require('pg');

// 快取：第一次呼叫 query()/exec() 時才決定要用哪個後端、建立連線，
// 之後的呼叫都重複用同一個，不會每次都重新判斷、重新連線。
let backendPromise

function createBackend() {
  const { PGlite } = require('@electric-sql/pglite');
  const dataDir = path.resolve(__dirname, '../../.pglite-data', nodeEnv);
  // PGlite 不會自動連父目錄一起建立，第一次啟動時 .pglite-data 資料夾還不存在會直接報錯，
  // 所以要在 new PGlite() 之前手動確保資料夾存在。
  fs.mkdirSync(dataDir, { recursive: true });
  const pglite = new PGlite(dataDir)
  console.log(`[DB] NODE_ENV=${nodeEnv} → 本地內嵌 PGlite（資料目錄 ${dataDir}）`);
  return {
    query: (text, params) => pglite.query(text, params),
    exec: (sql) => pglite.exec(sql)
  }
}

function getBackend() {
  if (!backendPromise)
    backendPromise = createBackend();
  return backendPromise
}

/**
 * 給 repository 用的單一條參數化查詢（SELECT/INSERT/UPDATE/DELETE，$1,$2... 佔位符）。
 */
async function query(text, params) {
  const backend = await getBackend()
  return backend.query(text, params)
}

/**
 * 給 migrate.js 用的多條 SQL 執行（例如一次套用整份 schema.sql）。
 * exec() 才支援一次執行多條、用分號隔開、不帶參數的 SQL。
 */
async function exec(sql) {
  const backend = await getBackend()
  return backend.exec(sql)
}

module.exports = { query, exec }