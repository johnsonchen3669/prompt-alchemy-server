const userRepository = require('../database/repositories/user.repository');

class AdminUserController {
  /**
   * 取得會員列表
   */
  async getUsers(req, res, next) {
    try {
      const { role } = req.query;
      const users = await userRepository.getUsers(role);
      
      // 不回傳 passwordHash 給前端
      const safeUsers = users.map(user => {
        const { passwordHash, ...safeUser } = user;
        return safeUser;
      });

      res.status(200).json({
        status: 'success',
        data: safeUsers
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新會員資訊
   */
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { name, role, isActive } = req.body;

      const user = await userRepository.findUserById(id);
      if (!user) {
        return res.status(404).json({ status: 'error', message: '找不到會員' });
      }

      const updatedUser = await userRepository.updateUser(id, { name, role, isActive });
      
      const { passwordHash, ...safeUser } = updatedUser;
      res.status(200).json({
        status: 'success',
        data: safeUser
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminUserController();
