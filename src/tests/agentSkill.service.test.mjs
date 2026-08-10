import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const agentSkillRepository = require('../database/repositories/agent_skill.repository');
const agentSkillService = require('../services/agentSkill.service');

afterEach(() => {
  vi.restoreAllMocks();
});

function makeRow(overrides = {}) {
  return {
    id: 's1',
    name: 'tdd',
    description: '',
    intro: '',
    repo_owner: 'mattpocock',
    repo_name: 'skills',
    skill_slug: 'tdd',
    creator_name: '',
    creator_avatar_url: '',
    creator_profile_url: '',
    license: '',
    category_id: 'cat1',
    category_name: '測試',
    stargazers_count: 100,
    copy_count: 0,
    favorite_count: 0,
    is_active: true,
    claude_install_method: true,
    codex_install_method: true,
    claude_plugin_name: 'mattpocock-skills',
    claude_marketplace_name: 'mattpocock',
    git_clone_method: false,
    doc_url: null,
    created_at: null,
    updated_at: null,
    ...overrides,
  };
}

describe('AgentSkillService.getInstallCommands', () => {
  it('claude-code 目標組出 Claude Plugin 安裝指令（不含 npx）', async () => {
    vi.spyOn(agentSkillRepository, 'findActiveById').mockResolvedValue(makeRow());
    const result = await agentSkillService.getInstallCommands('s1', 'claude-code');
    expect(result).toEqual([
      'claude plugin marketplace add mattpocock/skills',
      'claude plugin install mattpocock-skills@mattpocock',
    ]);
  });

  it('codex 目標組出 npx 安裝指令（不含 claude plugins）', async () => {
    vi.spyOn(agentSkillRepository, 'findActiveById').mockResolvedValue(makeRow());
    const result = await agentSkillService.getInstallCommands('s1', 'codex');
    expect(result).toEqual([
      'npx skills add mattpocock/skills --skill tdd -a codex',
    ]);
  });

  it('gitCloneMethod 的 Skill 回傳 git clone 指令', async () => {
    vi.spyOn(agentSkillRepository, 'findActiveById').mockResolvedValue(
      makeRow({
        repo_owner: 'Wcc723',
        repo_name: 'social-image-kit',
        claude_install_method: false,
        codex_install_method: false,
        git_clone_method: true,
      }),
    );
    const result = await agentSkillService.getInstallCommands('s1', 'codex');
    expect(result).toEqual(['git clone https://github.com/Wcc723/social-image-kit.git']);
  });

  it('查無該 Skill 時拋出錯誤', async () => {
    vi.spyOn(agentSkillRepository, 'findActiveById').mockResolvedValue(null);
    await expect(agentSkillService.getInstallCommands('missing', 'claude-code')).rejects.toThrow(
      '找不到該 Agent Skill',
    );
  });

  it('不支援的 agent 拋出錯誤', async () => {
    vi.spyOn(agentSkillRepository, 'findActiveById').mockResolvedValue(makeRow());
    await expect(agentSkillService.getInstallCommands('s1', 'cursor')).rejects.toThrow(
      '不支援的目標 Agent',
    );
  });
});
