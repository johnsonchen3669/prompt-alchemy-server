const agentSkillRepository = require('../database/repositories/agent_skill.repository');
const { buildInstallCommands } = require('./skillInstallCommand.service');

class AgentSkillService {
  /**
   * 取得上架中的 Agent Skill 列表
   * @param {Object} query
   * @param {string} [query.keyword]
   * @param {string} [query.categoryId]
   */
  async getAgentSkills(query = {}) {
    const rows = await agentSkillRepository.findActive({
      keyword: query.keyword,
      categoryId: query.categoryId,
    });
    return rows.map((row) => this._mapToApiFormat(row));
  }

  /**
   * 根據 ID 取得單一上架中的 Agent Skill
   */
  async getAgentSkillById(id) {
    const row = await agentSkillRepository.findActiveById(id);
    if (!row) {
      throw new Error('找不到該 Agent Skill');
    }
    return this._mapToApiFormat(row);
  }

  /**
   * 依目標 agent 組出這筆 Agent Skill 的安裝指令
   * @param {string} id
   * @param {'claude-code'|'codex'} agent
   */
  async getInstallCommands(id, agent) {
    const skill = await this.getAgentSkillById(id);
    return buildInstallCommands([skill], agent);
  }

  /**
   * 增加 Agent Skill 的安裝指令複製次數
   */
  async incrementCopyCount(id) {
    const updated = await agentSkillRepository.incrementCopyCount(id);
    if (!updated) {
      throw new Error('找不到該 Agent Skill 或未上架');
    }
    return {
      id: updated.id,
      copyCount: updated.copy_count,
    };
  }

  /**
   * 私有方法：將 DB 資料欄位映射回前端 API 規格格式（camelCase）
   */
  _mapToApiFormat(row) {
    // 熱門判斷用 GitHub star 數，不用 copy_count（複製安裝指令只是操作記錄，
    // 不代表這個 Skill 的品質或受歡迎程度；star 數才是外部世界的真實訊號）。
    const isHot = (row.stargazers_count || 0) >= 1000;

    return {
      id: row.id,
      name: row.name || '',
      description: row.description || '',
      intro: row.intro || '',
      repoOwner: row.repo_owner || '',
      repoName: row.repo_name || '',
      skillSlug: row.skill_slug || '',
      creatorName: row.creator_name || '',
      creatorAvatarUrl: row.creator_avatar_url || '',
      creatorProfileUrl: row.creator_profile_url || '',
      license: row.license || '',
      categoryId: row.category_id || '',
      category: row.category_name || '',
      stargazersCount: row.stargazers_count || 0,
      copyCount: row.copy_count || 0,
      favoriteCount: row.favorite_count || 0,
      isHot,
      isActive: row.is_active ?? true,
      claudeInstallMethod: row.claude_install_method ?? false,
      codexInstallMethod: row.codex_install_method ?? false,
      claudePluginName: row.claude_plugin_name || null,
      claudeMarketplaceName: row.claude_marketplace_name || null,
      gitCloneMethod: row.git_clone_method ?? false,
      docUrl: row.doc_url || null,
      createdAt: row.created_at || null,
      updatedAt: row.updated_at || null,
    };
  }
}

module.exports = new AgentSkillService();
