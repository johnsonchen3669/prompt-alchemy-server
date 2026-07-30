const contactRepository = require('../database/repositories/contact.repository');

class ContactService {
  async createContact({ name, email, message }) {
    if (!name || !name.trim()) {
      throw new Error('請輸入名稱');
    }
    if (!email || !email.trim()) {
      throw new Error('請輸入 Email');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error('請輸入有效的 Email 格式');
    }
    if (!message || !message.trim()) {
      throw new Error('請輸入聯絡內容');
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
      throw new Error('無效的處理狀態');
    }
    const existing = await contactRepository.findById(id);
    if (!existing) {
      throw new Error('找不到該聯絡紀錄');
    }
    return await contactRepository.updateStatus(id, status);
  }

  async deleteContact(id) {
    const existing = await contactRepository.findById(id);
    if (!existing) {
      throw new Error('找不到該聯絡紀錄');
    }
    return await contactRepository.delete(id);
  }
}

module.exports = new ContactService();
