const bcrypt = require('bcrypt');
const { createUser, findUserByEmail } = require('./repositories/user.repository');

const ADMIN_NAME = '管理者';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'Admin1234';

async function seed() {
  const existing = await findUserByEmail(ADMIN_EMAIL);
  if (existing) {
    console.log('[seed] 管理者帳號已存在，略過');
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await createUser({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    passwordHash,
    role: 'admin',
  });

  console.log('[seed] 管理者帳號建立完成');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[seed] 失敗', err);
  process.exit(1);
});
