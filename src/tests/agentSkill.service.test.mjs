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
    install_kind: 'single_kit',
    supported_agents: ['codex', 'claude-code', 'cursor'],
    doc_url: null,
    created_at: null,
    updated_at: null,
    ...overrides,
  };
}

describe('AgentSkillService.getInstallCommands', () => {
  it('claude-code 目標組出 npx 安裝指令', async () => {
    vi.spyOn(agentSkillRepository, 'findActiveById').mockResolvedValue(makeRow());
    const result = await agentSkillService.getInstallCommands('s1', 'claude-code');
    expect(result).toEqual([
      'npx skills add mattpocock/skills --skill tdd -a claude-code',
    ]);
  });

  it('codex 目標組出 npx 安裝指令', async () => {
    vi.spyOn(agentSkillRepository, 'findActiveById').mockResolvedValue(makeRow());
    const result = await agentSkillService.getInstallCommands('s1', 'codex');
    expect(result).toEqual([
      'npx skills add mattpocock/skills --skill tdd -a codex',
    ]);
  });

  it('cursor 目標組出 npx 安裝指令', async () => {
    vi.spyOn(agentSkillRepository, 'findActiveById').mockResolvedValue(makeRow());
    const result = await agentSkillService.getInstallCommands('s1', 'cursor');
    expect(result).toEqual([
      'npx skills add mattpocock/skills --skill tdd -a cursor',
    ]);
  });

  it('installKind=full_package 的 Skill 組出全套安裝指令', async () => {
    vi.spyOn(agentSkillRepository, 'findActiveById').mockResolvedValue(
      makeRow({ install_kind: 'full_package', skill_slug: '*' }),
    );
    const result = await agentSkillService.getInstallCommands('s1', 'codex');
    expect(result).toEqual([
      "npx skills add mattpocock/skills --skill '*' -a codex",
    ]);
  });

  it('installKind=git_clone 的 Skill 回傳 curl+tar 保底指令', async () => {
    vi.spyOn(agentSkillRepository, 'findActiveById').mockResolvedValue(
      makeRow({
        repo_owner: 'Wcc723',
        repo_name: 'social-image-kit',
        install_kind: 'git_clone',
        supported_agents: [],
      }),
    );
    const result = await agentSkillService.getInstallCommands('s1', 'codex');
    expect(result[0]).toContain(
      'curl -fsSL https://github.com/Wcc723/social-image-kit/archive/HEAD.tar.gz | tar -xz --strip-components=1 -k',
    );
    expect(result[0]).toContain('curl.exe -fsSL');
  });

  it('查無該 Skill 時拋出錯誤', async () => {
    vi.spyOn(agentSkillRepository, 'findActiveById').mockResolvedValue(null);
    await expect(agentSkillService.getInstallCommands('missing', 'claude-code')).rejects.toThrow(
      '找不到該 Agent Skill',
    );
  });

  it('不支援的 agent 拋出錯誤', async () => {
    vi.spyOn(agentSkillRepository, 'findActiveById').mockResolvedValue(makeRow());
    await expect(agentSkillService.getInstallCommands('s1', 'cursor-legacy')).rejects.toThrow(
      '不支援的目標 Agent',
    );
  });
});
