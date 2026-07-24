const bcrypt = require('bcrypt');
const db = require('../database/db');
const { createUser, findUserByEmail } = require('../database/repositories/user.repository');
const { createDefaultFavoritesForNewUser } = require('./favorite.service');

function createEmailTakenError() {
  const error = new Error('email 已被使用');
  error.code = 'EMAIL_TAKEN';
  return error;
}

async function register({ email, name, password }) {
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    return await db.withTransaction(async (transaction) => {
      const foundUser = await findUserByEmail(email, transaction);
      if (foundUser) throw createEmailTakenError();

      const createdUser = await createUser({ email, name, passwordHash }, transaction);
      await createDefaultFavoritesForNewUser(createdUser.id, transaction);
      return createdUser;
    });
  } catch (error) {
    // 兩個相同 email 的註冊請求同時進來時，由資料庫唯一索引作最後防線。
    if (error.code === '23505') throw createEmailTakenError();
    throw error;
  }
}

module.exports = { register };
