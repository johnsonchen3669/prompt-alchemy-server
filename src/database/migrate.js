const fs = require('fs')
const path = require('path')
const { exec } = require('./db')

async function migrate() {
  const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  // 包成 BEGIN;...COMMIT; 用同一次 exec() 呼叫執行：schema.sql 裡不管有幾條 CREATE TABLE，
  // 只要其中一條失敗，這次呼叫就會丟出例外、整個交易不會被 COMMIT，等同自動 ROLLBACK。
  await exec(`BEGIN;\n${schemaSql}\nCOMMIT;`);
  console.log('[migrate] 完成');
  process.exit(0); // 明確結束行程，避免底層連線（例如 pg.Pool）讓 node 行程掛著不退出
}

migrate().catch((err) => {
  console.error('[migrate] 失敗', err);
  process.exit(1);
});