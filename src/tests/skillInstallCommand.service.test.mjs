import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { buildInstallCommands } = require('../services/skillInstallCommand.service');

// 最終定案規則（CONTEXT.md／docs/adr/0001-agent-skill-install-mechanism.md
// 2026-08-12 Update）：Claude Code／Codex／Cursor 三個 agent 統一透過
// npx skills add 安裝，installKind 決定要組出哪種指令（full_package／
// single_kit／git_clone），不再有 Claude Plugin 專屬路徑。
function makeSkill(overrides = {}) {
  return {
    repoOwner: 'mattpocock',
    repoName: 'skills',
    skillSlug: 'tdd',
    installKind: 'single_kit',
    supportedAgents: ['codex', 'claude-code', 'cursor'],
    ...overrides,
  };
}

function gitCloneSnippet(repoKey) {
  return [
    '# Git Bash / WSL / macOS / Linux：',
    `curl -fsSL https://github.com/${repoKey}/archive/HEAD.tar.gz | tar -xz --strip-components=1 -k`,
    '# Windows PowerShell：',
    `curl.exe -fsSL https://github.com/${repoKey}/archive/HEAD.tar.gz | tar -xz --strip-components=1 -k`,
  ].join('\n');
}

describe('buildInstallCommands — full_package（全套安裝）', () => {
  it('產生 npx skills add <repo> --skill \'*\' -a <agent> 一行', () => {
    const result = buildInstallCommands(
      [makeSkill({ installKind: 'full_package' })],
      'codex',
    );
    expect(result).toEqual(["npx skills add mattpocock/skills --skill '*' -a codex"]);
  });

  it('claude-code／cursor 也各自產生對應的全套安裝指令', () => {
    const skill = makeSkill({ installKind: 'full_package' });
    expect(buildInstallCommands([skill], 'claude-code')).toEqual([
      "npx skills add mattpocock/skills --skill '*' -a claude-code",
    ]);
    expect(buildInstallCommands([skill], 'cursor')).toEqual([
      "npx skills add mattpocock/skills --skill '*' -a cursor",
    ]);
  });

  it('supportedAgents 不包含目前的 agent 時不產生指令', () => {
    const result = buildInstallCommands(
      [makeSkill({ installKind: 'full_package', supportedAgents: ['codex'] })],
      'cursor',
    );
    expect(result).toEqual([]);
  });

  it('同一個 repo 有多筆 full_package 資料時只產生一次', () => {
    const result = buildInstallCommands(
      [
        makeSkill({ installKind: 'full_package', skillSlug: 'a' }),
        makeSkill({ installKind: 'full_package', skillSlug: 'b' }),
      ],
      'codex',
    );
    expect(result).toEqual(["npx skills add mattpocock/skills --skill '*' -a codex"]);
  });
});

describe('buildInstallCommands — single_kit（單一元件安裝）', () => {
  it('產生 npx skills add <repo> --skill <slug> -a <agent> 一行', () => {
    const result = buildInstallCommands(
      [makeSkill({ installKind: 'single_kit', skillSlug: 'frontend-design' })],
      'claude-code',
    );
    expect(result).toEqual([
      'npx skills add mattpocock/skills --skill frontend-design -a claude-code',
    ]);
  });

  it('supportedAgents 不包含目前的 agent 時不產生指令', () => {
    const result = buildInstallCommands(
      [makeSkill({ installKind: 'single_kit', supportedAgents: ['claude-code'] })],
      'codex',
    );
    expect(result).toEqual([]);
  });

  it('同 repo 多筆 single_kit 合併成一行、多個 --skill', () => {
    const result = buildInstallCommands(
      [
        makeSkill({ installKind: 'single_kit', skillSlug: 'tdd' }),
        makeSkill({ installKind: 'single_kit', skillSlug: 'code-review' }),
      ],
      'codex',
    );
    expect(result).toEqual([
      'npx skills add mattpocock/skills --skill tdd --skill code-review -a codex',
    ]);
  });

  it('跨 repo 多筆各自分成一行，依輸入順序排列', () => {
    const result = buildInstallCommands(
      [
        makeSkill({ installKind: 'single_kit', skillSlug: 'tdd' }),
        makeSkill({
          installKind: 'single_kit',
          repoOwner: 'anthropics', repoName: 'claude-plugins-official', skillSlug: 'frontend-design',
        }),
        makeSkill({ installKind: 'single_kit', skillSlug: 'code-review' }),
      ],
      'codex',
    );
    expect(result).toEqual([
      'npx skills add mattpocock/skills --skill tdd --skill code-review -a codex',
      'npx skills add anthropics/claude-plugins-official --skill frontend-design -a codex',
    ]);
  });
});

describe('buildInstallCommands — git_clone 保底', () => {
  it('不分 agent，只產生一組 curl | tar 指令（同 repo 只產生一次）', () => {
    const skill = makeSkill({
      repoOwner: 'Wcc723', repoName: 'social-image-kit', skillSlug: 'social-image-kit',
      installKind: 'git_clone', supportedAgents: [],
    });
    expect(buildInstallCommands([skill], 'claude-code')).toEqual([
      gitCloneSnippet('Wcc723/social-image-kit'),
    ]);
    expect(buildInstallCommands([skill], 'cursor')).toEqual([
      gitCloneSnippet('Wcc723/social-image-kit'),
    ]);
  });

  it('同一個 repo 的多筆 git_clone 資料只產生一次', () => {
    const result = buildInstallCommands(
      [
        makeSkill({
          repoOwner: 'Wcc723', repoName: 'social-image-kit', skillSlug: 'deck-writer',
          installKind: 'git_clone', supportedAgents: [],
        }),
        makeSkill({
          repoOwner: 'Wcc723', repoName: 'social-image-kit', skillSlug: 'slide-html',
          installKind: 'git_clone', supportedAgents: [],
        }),
      ],
      'codex',
    );
    expect(result).toEqual([gitCloneSnippet('Wcc723/social-image-kit')]);
  });
});

describe('buildInstallCommands — 批次去重：full_package 優先於同 repo 的 single_kit', () => {
  it('同一個 repo 同時選到 full_package 與 single_kit 時，只輸出 full_package', () => {
    const result = buildInstallCommands(
      [
        makeSkill({ installKind: 'single_kit', skillSlug: 'tdd' }),
        makeSkill({ installKind: 'single_kit', skillSlug: 'code-review' }),
        makeSkill({ installKind: 'full_package', skillSlug: '*' }),
      ],
      'codex',
    );
    expect(result).toEqual(["npx skills add mattpocock/skills --skill '*' -a codex"]);
  });

  it('去重跟輸入順序無關（full_package 排在後面一樣生效）', () => {
    const result = buildInstallCommands(
      [
        makeSkill({ installKind: 'full_package', skillSlug: '*' }),
        makeSkill({ installKind: 'single_kit', skillSlug: 'tdd' }),
      ],
      'codex',
    );
    expect(result).toEqual(["npx skills add mattpocock/skills --skill '*' -a codex"]);
  });

  it('不同 repo 的 full_package 與 single_kit 互不影響', () => {
    const result = buildInstallCommands(
      [
        makeSkill({ installKind: 'full_package', skillSlug: '*' }),
        makeSkill({
          installKind: 'single_kit',
          repoOwner: 'anthropics', repoName: 'claude-plugins-official', skillSlug: 'frontend-design',
        }),
      ],
      'codex',
    );
    expect(result).toEqual([
      "npx skills add mattpocock/skills --skill '*' -a codex",
      'npx skills add anthropics/claude-plugins-official --skill frontend-design -a codex',
    ]);
  });
});

describe('buildInstallCommands — 混合情境', () => {
  it('git_clone、full_package、single_kit 同時出現，三種指令都要出現', () => {
    const result = buildInstallCommands(
      [
        makeSkill({
          repoOwner: 'Wcc723', repoName: 'social-image-kit', skillSlug: 'deck-writer',
          installKind: 'git_clone', supportedAgents: [],
        }),
        makeSkill({ installKind: 'full_package', skillSlug: '*' }),
        makeSkill({
          installKind: 'single_kit',
          repoOwner: 'anthropics', repoName: 'claude-plugins-official', skillSlug: 'frontend-design',
        }),
      ],
      'claude-code',
    );
    expect(result).toEqual([
      gitCloneSnippet('Wcc723/social-image-kit'),
      "npx skills add mattpocock/skills --skill '*' -a claude-code",
      'npx skills add anthropics/claude-plugins-official --skill frontend-design -a claude-code',
    ]);
  });
});

describe('buildInstallCommands — 邊界情況', () => {
  it('空陣列輸入時回傳空陣列', () => {
    expect(buildInstallCommands([], 'codex')).toEqual([]);
  });

  it('不支援的 agent 會拋出錯誤', () => {
    expect(() => buildInstallCommands([makeSkill()], 'cursor-legacy')).toThrow('不支援的目標 Agent');
  });
});
