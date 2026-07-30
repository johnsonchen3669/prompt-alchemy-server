const contactService = require('../../services/contact.service');

class AdminContactController {
  async getContacts(req, res, next) {
    try {
      const { status, keyword } = req.query;
      const data = await contactService.getAdminContacts({ status, keyword });
      res.status(200).json({
        status: 'success',
        message: '取得聯絡表單清單成功',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateContactStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const data = await contactService.updateContactStatus(id, status);
      res.status(200).json({
        status: 'success',
        message: '狀態更新成功',
        data,
      });
    } catch (error) {
      if (error.message === '找不到該聯絡紀錄') {
        return res.status(404).json({ status: 'error', message: error.message });
      }
      next(error);
    }
  }

  async deleteContact(req, res, next) {
    try {
      const { id } = req.params;
      const data = await contactService.deleteContact(id);
      res.status(200).json({
        status: 'success',
        message: '刪除成功',
        data,
      });
    } catch (error) {
      if (error.message === '找不到該聯絡紀錄') {
        return res.status(404).json({ status: 'error', message: error.message });
      }
      next(error);
    }
  }
}

module.exports = new AdminContactController();
