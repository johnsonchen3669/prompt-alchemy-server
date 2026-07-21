const promptRepository = require('../database/repositories/prompt.repository');

class PromptService {
  /**
   * 取得上架中的 Prompt 列表
   * @param {Object} query 
   * @param {string} [query.category]
   * @param {string} [query.tag]
   * @param {string} [query.search]
   */
  async getPrompts(query = {}) {
    const rows = await promptRepository.findActivePrompts({
      category: query.category,
      tag: query.tag,
      search: query.search
    });

    return rows.map(row => this._mapToApiFormat(row));
  }

  /**
   * 根據 ID 取得單一 Prompt 詳細內容
   * @param {string} id UUID
   */
  async getPromptById(id) {
    const row = await promptRepository.findActiveById(id);
    if (!row) {
      throw new Error('找不到該 Prompt');
    }
    return this._mapToApiFormat(row);
  }

  /**
   * 增加 Prompt 複製使用次數
   * @param {string} id UUID
   */
  async incrementCopyCount(id) {
    const updated = await promptRepository.incrementCopyCount(id);
    if (!updated) {
      throw new Error('找不到該 Prompt 或未上架');
    }
    return {
      id: updated.id,
      copyCount: updated.copy_count
    };
  }

  /**
   * 私有方法：將 DB 資料欄位映射回前端 API 規格格式 (camelCase)
   */
  _mapToApiFormat(row) {
    // 處理 exampleOutput 格式相容性 (若為舊式 object 結構則轉換為新式 Block Array 結構)
    let formattedExampleOutput = [];
    if (Array.isArray(row.example_output)) {
      formattedExampleOutput = row.example_output;
    } else if (row.example_output && typeof row.example_output === 'object') {
      let seq = 0;
      if (row.example_output.outputText) {
        formattedExampleOutput.push({
          type: 'text',
          data: { context: row.example_output.outputText },
          seq: seq++
        });
      }
      if (Array.isArray(row.example_output.outputImages)) {
        row.example_output.outputImages.forEach(img => {
          if (img.url) {
            formattedExampleOutput.push({
              type: 'image',
              data: {
                context: img.url,
                alt: img.alt || '',
                caption: img.caption || ''
              },
              seq: seq++
            });
          }
        });
      }
    }

    const createdTime = row.created_at ? new Date(row.created_at).getTime() : 0;
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const isNew = createdTime > thirtyDaysAgo;
    const isHot = (row.copy_count || 0) >= 50 || (row.favorite_count || 0) >= 20;

    return {
      id: row.id,
      title: row.title || '',
      slug: row.slug || '',
      intro: row.intro || '',
      contentTypeId: row.content_type_id || '',
      modelType: row.model_type || [],
      promptContent: row.prompt_content || '',
      useCase: row.use_case || '',
      exampleInput: row.example_input || '',
      exampleOutput: formattedExampleOutput,
      categoryId: row.category_id || '',
      category: row.category_name || '',
      memo: row.memo || '',
      tags: row.tags || [],
      sourceUrl: row.source_url || '',
      copyCount: row.copy_count || 0,
      favoriteCount: row.favorite_count || 0,
      isNew,
      isHot,
      isActive: row.is_active ?? true,
      createdAt: row.created_at || null,
      updatedAt: row.updated_at || null
    };
  }
}

module.exports = new PromptService();
