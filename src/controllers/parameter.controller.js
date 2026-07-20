const parameterService = require('../services/parameter.service');

class ParameterController {
  /**
   * 取得參數列表
   * GET /admin/parameters?type=category
   */
  async getParameters(req, res, next) {
    try {
      /* 
        #swagger.tags = ['Admin Parameters']
        #swagger.summary = '取得參數列表'
        #swagger.description = '取得所有標籤與參數，可透過 type 進行過濾（例如 type=category）。'
        #swagger.parameters['type'] = {
            in: 'query',
            description: '參數類型，允許的值：role, contentType, category, model, tag',
            required: false,
            type: 'string'
        }
        #swagger.responses[200] = {
            description: '成功取得參數列表',
            content: {
                "application/json": {
                    schema: {
                        type: 'object',
                        properties: {
                            status: { type: 'string', example: 'success' },
                            message: { type: 'string', example: '取得參數列表成功' },
                            data: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string', format: 'uuid', example: '755f3568-2333-4709-b916-582eae69e195' },
                                        type: { type: 'string', example: 'category' },
                                        name: { type: 'string', example: '前端開發' },
                                        description: { type: 'string', example: 'React / Vue / CSS / UI 相關' },
                                        isActive: { type: 'boolean', example: true },
                                        sortOrder: { type: 'integer', example: 1 }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
      */
      const { type } = req.query;
      const data = await parameterService.getParameters(type);
      
      res.status(200).json({
        status: 'success',
        message: '取得參數列表成功',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 新增參數
   * POST /admin/parameters
   */
  async createParameter(req, res, next) {
    try {
      /* 
        #swagger.tags = ['Admin Parameters']
        #swagger.summary = '新增參數'
        #swagger.description = '在後台新增標籤或參數。'
        #swagger.requestBody = {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        type: 'object',
                        required: ['type', 'name'],
                        properties: {
                            type: { type: 'string', example: 'category', description: '參數類型' },
                            name: { type: 'string', example: '新分類', description: '參數名稱' },
                            description: { type: 'string', example: '分類說明', description: '詳細說明' },
                            isActive: { type: 'boolean', example: true, description: '是否啟用' },
                            sortOrder: { type: 'integer', example: 1, description: '排序權重' }
                        }
                    }
                }
            }
        }
        #swagger.responses[201] = {
            description: '成功新增參數',
            content: {
                "application/json": {
                    schema: {
                        type: 'object',
                        properties: {
                            status: { type: 'string', example: 'success' },
                            message: { type: 'string', example: '新增參數成功' },
                            data: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string', format: 'uuid', example: '755f3568-2333-4709-b916-582eae69e195' },
                                    type: { type: 'string', example: 'category' },
                                    name: { type: 'string', example: '新分類' },
                                    description: { type: 'string', example: '分類說明' },
                                    isActive: { type: 'boolean', example: true },
                                    sortOrder: { type: 'integer', example: 1 }
                                }
                            }
                        }
                    }
                }
            }
        }
        #swagger.responses[400] = { description: '請求格式錯誤或必填欄位缺失' }
      */
      const data = await parameterService.createParameter(req.body);
      
      res.status(201).json({
        status: 'success',
        message: '新增參數成功',
        data
      });
    } catch (error) {
      if (error.message.includes('無效的參數類型') || error.message.includes('必填')) {
        return res.status(400).json({
          status: 'error',
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * 更新參數
   * PUT /admin/parameters/:id
   */
  async updateParameter(req, res, next) {
    try {
      /* 
        #swagger.tags = ['Admin Parameters']
        #swagger.summary = '修改參數'
        #swagger.description = '修改現有參數的資料，支援部分更新（Partial Update）。'
        #swagger.parameters['id'] = {
            in: 'path',
            description: '參數 ID (UUID)',
            required: true,
            type: 'string'
        }
        #swagger.requestBody = {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        type: 'object',
                        properties: {
                            name: { type: 'string', example: '修改後的名稱', description: '參數名稱' },
                            description: { type: 'string', example: '修改後的說明', description: '詳細說明' },
                            isActive: { type: 'boolean', example: false, description: '是否啟用' },
                            sortOrder: { type: 'integer', example: 2, description: '排序權重' }
                        }
                    }
                }
            }
        }
        #swagger.responses[200] = {
            description: '成功修改參數',
            content: {
                "application/json": {
                    schema: {
                        type: 'object',
                        properties: {
                            status: { type: 'string', example: 'success' },
                            message: { type: 'string', example: '修改參數成功' },
                            data: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string', format: 'uuid', example: '755f3568-2333-4709-b916-582eae69e195' },
                                    type: { type: 'string', example: 'category' },
                                    name: { type: 'string', example: '修改後的名稱' },
                                    description: { type: 'string', example: '修改後的說明' },
                                    isActive: { type: 'boolean', example: false },
                                    sortOrder: { type: 'integer', example: 2 }
                                }
                            }
                        }
                    }
                }
            }
        }
        #swagger.responses[404] = { description: '找不到參數' }
      */
      const { id } = req.params;
      const data = await parameterService.updateParameter(id, req.body);
      
      res.status(200).json({
        status: 'success',
        message: '修改參數成功',
        data
      });
    } catch (error) {
      if (error.message === '找不到參數') {
        return res.status(404).json({
          status: 'error',
          message: error.message
        });
      }
      next(error);
    }
  }
}

module.exports = new ParameterController();
