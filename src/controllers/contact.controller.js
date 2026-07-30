const contactService = require('../services/contact.service');

class ContactController {
  async createContact(req, res, next) {
    try {
      const data = await contactService.createContact(req.body);
      res.status(201).json({
        status: 'success',
        message: '聯絡表單已成功送出',
        data,
      });
    } catch (error) {
      if (error.message && error.message.includes('請輸入')) {
        return res.status(400).json({ status: 'error', message: error.message });
      }
      next(error);
    }
  }
}

module.exports = new ContactController();
