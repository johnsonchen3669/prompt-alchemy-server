import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { buildInstallCommands } = require('../services/skillInstallCommand.service');

// 最終定案規則（CONTEXT.md／docs/adr/0001-agent-skill-install-mechanism.md）：
// claudeInstallMethod=true → 只產生 claude plugin marketplace add + claude plugin
// install（絕不產生 npx）；codexInstallMethod=true → 只產生 npx（絕不產生
// claude plugins）。兩個 agent 完全獨立、各自最多一種安裝路徑。
function makeSkill(overrides = {}) {
  return {
    repoOwner: 'mattpocock',
    repoName: 'skills',
    skillSlug: '*',
    claudeInstallMethod: true,
    codexInstallMethod: true,
    claudePluginName: 'mattpocock-skills',
    claudeMarketplaceName: 'mattpocock',
    gitCloneMethod: false,
    ...overrides,
  };
}

describe('buildInstallCommands — claude-code 目標一律走 Claude Plugin', () => {
  it('claudeInstallMethod=true 時，只產生 marketplace add + install 兩行，不含 npx', () => {
    const result = buildInstallCommands([makeSkill()], 'claude-code');
    expect(result).toEqual([
      'claude plugin marketplace add mattpocock/skills',
      'claude plugin install mattpocock-skills@mattpocock',
    ]);
  });

  it('claudeInstallMethod=false 時，claude-code 目標不產生任何指令', () => {
    const result = buildInstallCommands(
      [makeSkill({ claudeInstallMethod: false, claudePluginName: null, claudeMarketplaceName: null })],
      'claude-code',
    );
    expect(result).toEqual([]);
  });

  it('多筆 Skill 共用同一個 plugin 時，只產生一次 marketplace add + install', () => {
    const result = buildInstallCommands(
      [
        makeSkill({ skillSlug: 'tdd' }),
        makeSkill({ skillSlug: 'code-review' }),
      ],
      'claude-code',
    );
    expect(result).toEqual([
      'claude plugin marketplace add mattpocock/skills',
      'claude plugin install mattpocock-skills@mattpocock',
    ]);
  });

  it('不同 repo 的不同 plugin，各自產生一組 marketplace add + install', () => {
    const result = buildInstallCommands(
      [
        makeSkill(),
        makeSkill({
          repoOwner: 'anthropics', repoName: 'skills', skillSlug: 'frontend-design',
          claudePluginName: 'example-skills', claudeMarketplaceName: 'anthropic-agent-skills',
        }),
      ],
      'claude-code',
    );
    expect(result).toEqual([
      'claude plugin marketplace add mattpocock/skills',
      'claude plugin install mattpocock-skills@mattpocock',
      'claude plugin marketplace add anthropics/skills',
      'claude plugin install example-skills@anthropic-agent-skills',
    ]);
  });
});

describe('buildInstallCommands — codex 目標一律走 npx', () => {
  it('codexInstallMethod=true 時，只產生 npx 指令，不含 claude plugins', () => {
    const result = buildInstallCommands(
      [makeSkill({ repoOwner: 'anthropics', repoName: 'skills', skillSlug: 'frontend-design' })],
      'codex',
    );
    expect(result).toEqual([
      'npx skills add anthropics/skills --skill frontend-design -a codex',
    ]);
  });

  it('codexInstallMethod=false 時，codex 目標不產生任何指令', () => {
    const result = buildInstallCommands(
      [makeSkill({ codexInstallMethod: false })],
      'codex',
    );
    expect(result).toEqual([]);
  });

  it('同 repo 多筆 Skill 合併成一行、多個 --skill', () => {
    const result = buildInstallCommands(
      [
        makeSkill({ skillSlug: 'tdd' }),
        makeSkill({ skillSlug: 'code-review' }),
      ],
      'codex',
    );
    expect(result).toEqual([
      'npx skills add mattpocock/skills --skill tdd --skill code-review -a codex',
    ]);
  });

  it('跨 repo 多筆 Skill 各自分成一行，依輸入順序排列', () => {
    const result = buildInstallCommands(
      [
        makeSkill({ skillSlug: 'tdd' }),
        makeSkill({ repoOwner: 'anthropics', repoName: 'skills', skillSlug: 'frontend-design' }),
        makeSkill({ skillSlug: 'code-review' }),
      ],
      'codex',
    );
    expect(result).toEqual([
      'npx skills add mattpocock/skills --skill tdd --skill code-review -a codex',
      'npx skills add anthropics/skills --skill frontend-design -a codex',
    ]);
  });
});

describe('buildInstallCommands — git clone 保底', () => {
  it('gitCloneMethod=true 時，只產生一條 git clone 指令，不分 agent', () => {
    const skill = makeSkill({
      repoOwner: 'Wcc723',
      repoName: 'social-image-kit',
      claudeInstallMethod: false,
      codexInstallMethod: false,
      claudePluginName: null,
      claudeMarketplaceName: null,
      gitCloneMethod: true,
    });
    expect(buildInstallCommands([skill], 'claude-code')).toEqual([
      'git clone https://github.com/Wcc723/social-image-kit.git',
    ]);
    expect(buildInstallCommands([skill], 'codex')).toEqual([
      'git clone https://github.com/Wcc723/social-image-kit.git',
    ]);
  });

  it('同一個 repo 的多筆 gitCloneMethod Skill 只產生一次 git clone 指令', () => {
    const result = buildInstallCommands(
      [
        makeSkill({
          repoOwner: 'Wcc723', repoName: 'social-image-kit', skillSlug: 'deck-writer',
          claudeInstallMethod: false, codexInstallMethod: false,
          claudePluginName: null, claudeMarketplaceName: null, gitCloneMethod: true,
        }),
        makeSkill({
          repoOwner: 'Wcc723', repoName: 'social-image-kit', skillSlug: 'slide-html',
          claudeInstallMethod: false, codexInstallMethod: false,
          claudePluginName: null, claudeMarketplaceName: null, gitCloneMethod: true,
        }),
      ],
      'claude-code',
    );
    expect(result).toEqual(['git clone https://github.com/Wcc723/social-image-kit.git']);
  });
});

describe('buildInstallCommands — 混合情境', () => {
  it('一筆 gitCloneMethod、一筆 claude plugin，兩條指令都要出現', () => {
    const result = buildInstallCommands(
      [
        makeSkill({
          repoOwner: 'Wcc723', repoName: 'social-image-kit', skillSlug: 'deck-writer',
          claudeInstallMethod: false, codexInstallMethod: false,
          claudePluginName: null, claudeMarketplaceName: null, gitCloneMethod: true,
        }),
        makeSkill({ skillSlug: 'tdd' }),
      ],
      'claude-code',
    );
    expect(result).toEqual([
      'git clone https://github.com/Wcc723/social-image-kit.git',
      'claude plugin marketplace add mattpocock/skills',
      'claude plugin install mattpocock-skills@mattpocock',
    ]);
  });
});

describe('buildInstallCommands — 邊界情況', () => {
  it('空陣列輸入時回傳空陣列', () => {
    expect(buildInstallCommands([], 'claude-code')).toEqual([]);
  });

  it('不支援的 agent 會拋出錯誤', () => {
    expect(() => buildInstallCommands([makeSkill()], 'cursor')).toThrow('不支援的目標 Agent');
  });
});
