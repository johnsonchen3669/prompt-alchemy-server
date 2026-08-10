const contactRepository = require('../database/repositories/contact.repository');

function createHttpError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

class ContactService {
  async createContact({ name, email, message }) {
    if (!name || !name.trim()) {
      throw createHttpError('請輸入名稱', 400);
    }
    if (!email || !email.trim()) {
      throw createHttpError('請輸入 Email', 400);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw createHttpError('請輸入有效的 Email 格式', 400);
    }
    if (!message || !message.trim()) {
      throw createHttpError('請輸入聯絡內容', 400);
    }

    return await contactRepository.create({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    });
  }

  async getAdminContacts(filters = {}) {
    return await contactRepository.findAllForAdmin(filters);
  }

  async updateContactStatus(id, status) {
    if (!['pending', 'resolved'].includes(status)) {
      throw createHttpError('無效的處理狀態', 400);
    }
    const existing = await contactRepository.findById(id);
    if (!existing) {
      throw createHttpError('找不到該聯絡紀錄', 404);
    }
    return await contactRepository.updateStatus(id, status);
  }

  async deleteContact(id) {
    const existing = await contactRepository.findById(id);
    if (!existing) {
      throw createHttpError('找不到該聯絡紀錄', 404);
    }
    return await contactRepository.delete(id);
  }
}

module.exports = new ContactService();
