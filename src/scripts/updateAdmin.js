const bcrypt = require('bcrypt');
const { query } = require('../database/db');

async function updateAdmin() {
  try {
    const email = 'admin@promptalchemy.com';
    const password = 'admin123';
    const passwordHash = await bcrypt.hash(password, 10);
    const role = 'admin';

    // 確認使用者是否存在
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (rows.length > 0) {
      // 若存在則更新密碼與角色
      await query('UPDATE users SET password_hash = $1, role = $2 WHERE email = $3', [passwordHash, role, email]);
      console.log('✅ 成功更新 admin 密碼與權限。');
    } else {
      // 若不存在則直接新增
      await query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)`,
        ['Admin', email, passwordHash, role]
      );
      console.log('✅ 成功建立 admin 帳號。');
    }
  } catch (err) {
    console.error('❌ 更新失敗:', err);
  } finally {
    process.exit(0);
  }
}

updateAdmin();
