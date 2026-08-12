
const db = require('./db');
const { findUserByEmail } = require('./repositories/user.repository');

const CATEGORY_FRONTEND = '前端開發';
const CATEGORY_BACKEND = '後端開發';
const CATEGORY_DEBUG = '除錯技巧';
const CATEGORY_TOOL = '小工具';
const CATEGORY_DEVOPS = 'DevOps / 部署維運';
const CATEGORY_TEST = '測試 / 品質保證';
const CATEGORY_DOC = '文件 / 寫作';
const CATEGORY_SECURITY = '資安相關';
const CATEGORY_LEARNING = '教育 / 學習';

const SEED_AGENT_SKILLS = [
  {
    name: '.NET Agent Skills',
    description:
      '.NET Team at Microsoft 提供的完整 Agent Skills 合集，涵蓋語言伺服器整合、測試、建置診斷、套件管理、升級移轉、MAUI、AI/ML 等主題，依 npx 萬用字元一次安裝全部，或依 Claude Plugin marketplace 安裝主要的 dotnet plugin。',
    repoOwner: 'dotnet',
    repoName: 'skills',
    skillSlug: '*',
    creatorName: '.NET Team at Microsoft',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/9141961?v=4',
    creatorProfileUrl: 'https://github.com/dotnet',
    license: 'MIT',
    categoryName: CATEGORY_TEST,
    stargazersCount: 5101,
    installKind: 'full_package',
    supportedAgents: ['codex', 'claude-code', 'cursor'],
    docUrl: 'https://raw.githubusercontent.com/dotnet/skills/main/README.md',
  },
  {
    name: 'social-image-kit',
    description:
      '撰寫簡報內容（大綱、文案、表格、KPI、列點、流程圖）並輸出 Markdown，供 slide-html 渲染為投影片圖檔。重視每頁資訊密度，避免純金句頁。當使用者要求規劃簡報內容、寫投影片文案、整理簡報大綱、把主題拆成 N 頁、或要把資料整理成可演說的內容時觸發。不負責圖檔產生（那是 slide-html 的工作）。',
    repoOwner: 'Wcc723',
    repoName: 'social-image-kit',
    skillSlug: 'social-image-kit',
    creatorName: 'Wcc723',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/3422575?v=4',
    creatorProfileUrl: 'https://github.com/Wcc723',
    license: null,
    categoryName: CATEGORY_DOC,
    stargazersCount: 3,
    installKind: 'git_clone',
    supportedAgents: [],

    docUrl: 'https://raw.githubusercontent.com/Wcc723/social-image-kit/main/README.md',
  },
  {
    name: 'frontend-design',
    description:
      "Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Helps with aesthetic direction, typography, and making choices that don't read as templated defaults.",
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',
    skillSlug: 'frontend-design',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_FRONTEND,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['codex', 'claude-code', 'cursor'],

    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/frontend-design/README.md',
  },
  {
    name: 'code-review',
    description:
      'Automated code review for pull requests using multiple specialized agents with confidence-based scoring to filter false positives.',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',

    skillSlug: 'code-review',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_TEST,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['claude-code'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/code-review/README.md',
  },
  {
    name: 'claude-plugins-official',
    description:
      'Anthropic 官方 Claude Code plugin marketplace 的完整收錄清單，涵蓋開發工具、生產力、MCP 整合等主題。marketplace.json 列出 287 個 plugin，但其中僅 53 個實體放在這個 repo 底下（其餘為 git-subdir／url 指向外部 repo，npx 掃描不到），依 npx 萬用字元一次安裝的只有這實體收錄的部分，且僅限有 SKILL.md 的那幾個；其餘 plugin 仍需個別查找對應的獨立條目安裝。',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',
    skillSlug: '*',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_TOOL,
    stargazersCount: 33426,

    installKind: 'full_package',
    supportedAgents: ['codex', 'claude-code', 'cursor'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/README.md',
  },


  {
    name: 'claude-code-setup',
    description:
      'Analyze a codebase and recommend Claude Code automations (hooks, subagents, skills, plugins, MCP servers). Use when user asks for automation recommendations, wants to optimize their Claude Code setup, mentions improving Claude Code workflows, asks how to first set up Claude Code for a project, or wants to know what Claude Code features they should use.',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',
    skillSlug: 'claude-automation-recommender',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_TOOL,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['codex', 'claude-code', 'cursor'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/claude-code-setup/README.md',
  },
  {
    name: 'claude-md-management',
    description:
      'Audit and improve CLAUDE.md files in repositories. Use when user asks to check, audit, update, improve, or fix CLAUDE.md files. Scans for all CLAUDE.md files, evaluates quality against templates, outputs quality report, then makes targeted updates.',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',
    skillSlug: 'claude-md-improver',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_DOC,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['codex', 'claude-code', 'cursor'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/claude-md-management/README.md',
  },
  {
    name: 'claude-security',
    description:
      'The Claude Security menu — pick a job: scan the codebase (the whole repository or a scoped part of it), scan changes (this branch\'s or a pull request\'s diff, or one commit), or suggest patches (findings turned into targeted patch files, each verified by a panel of agents, that you apply when you choose).',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',
    skillSlug: 'claude-security',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_SECURITY,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['codex', 'claude-code', 'cursor'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/claude-security/README.md',
  },
  {
    name: 'cwc-makers',
    description:
      'Iterate on Cardputer-Adv and M5 maker device app bundles after the device is provisioned — add apps, push changed files without re-flashing, watch device serial logs, run one-shot REPL commands.',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',

    skillSlug: 'cardputer-buddy',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_TOOL,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['claude-code'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/cwc-makers/README.md',
  },
  {
    name: 'hookify',
    description:
      'This skill should be used when the user asks to "create a hookify rule", "write a hook rule", "configure hookify", "add a hookify rule", or needs guidance on hookify rule syntax and patterns.',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',
    skillSlug: 'writing-rules',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_TOOL,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['codex', 'claude-code', 'cursor'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/hookify/README.md',
  },
  {
    name: 'math-olympiad',
    description:
      'Solve competition math problems (IMO, Putnam, USAMO, AIME) with adversarial verification that catches the errors self-verification misses.',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',
    skillSlug: 'math-olympiad',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_LEARNING,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['codex', 'claude-code', 'cursor'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/math-olympiad/README.md',
  },
  {
    name: 'mcp-server-dev',
    description:
      'Development kit for building MCP servers, MCP apps, and MCPB bundles — covers building an MCP server from scratch, building an MCP-connected app, and packaging an MCP server as an MCPB bundle.',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',

    skillSlug: 'build-mcp-server',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_BACKEND,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['claude-code'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/mcp-server-dev/README.md',
  },
  {
    name: 'playground',
    description:
      'Creates interactive HTML playgrounds — self-contained single-file explorers that let users configure something visually through controls, see a live preview, and copy out a prompt. Use when the user asks to make a playground, explorer, or interactive tool for a topic.',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',
    skillSlug: 'playground',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_FRONTEND,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['codex', 'claude-code', 'cursor'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/playground/README.md',
  },
  {
    name: 'plugin-dev',
    description:
      'Development kit for building Claude Code plugins — covers agent, command, hook, MCP integration, plugin settings, plugin structure, and skill development.',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',

    skillSlug: 'plugin-structure',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_TOOL,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['claude-code'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/plugin-dev/README.md',
  },
  {
    name: 'project-artifact',
    description:
      'Generate and publish a project status artifact — an opinionated, tabbed status page for a project too big for one update — published with the built-in Artifact tool to a default-private claude.ai page the user can share with teammates.',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',
    skillSlug: 'project-artifact',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_DOC,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['codex', 'claude-code', 'cursor'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/project-artifact/README.md',
  },
  {
    name: 'receipts',
    description:
      'Generate a personal Claude Code usage & impact report ("receipts") from this machine\'s local session transcripts — for justifying Claude Code usage/spend to a manager, self-review, or "what have I been using this for" check-ins.',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',
    skillSlug: 'receipts',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_DOC,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['codex', 'claude-code', 'cursor'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/receipts/README.md',
  },
  {
    name: 'session-report',
    description:
      'Generate an explorable HTML report of Claude Code session usage (tokens, cache, subagents, skills, expensive prompts) from ~/.claude/projects transcripts.',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',
    skillSlug: 'session-report',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_DOC,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['codex', 'claude-code', 'cursor'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/session-report/README.md',
  },
  {
    name: 'skill-creator',
    description:
      'Create new skills, modify and improve existing skills, and measure skill performance. Use when users want to create a skill from scratch, edit, or optimize an existing skill, run evals to test a skill, or benchmark skill performance.',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',
    skillSlug: 'skill-creator',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_TOOL,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['codex', 'claude-code', 'cursor'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/skill-creator/README.md',
  },

  {
    name: 'agent-sdk-dev',
    description:
      'Development kit for working with the Claude Agent SDK',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',
    skillSlug: 'agent-sdk-dev',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_BACKEND,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['claude-code'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/agent-sdk-dev/README.md',
  },
  {
    name: 'clangd-lsp',
    description:
      'C/C++ language server (clangd) for code intelligence',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',
    skillSlug: 'clangd-lsp',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_DEBUG,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['claude-code'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/clangd-lsp/README.md',
  },
  {
    name: 'code-modernization',
    description:
      'Modernize legacy codebases (COBOL, legacy Java/C++, monolith web apps) with a structured preflight / assess / map / extract-rules / brief / reimagine / transform / harden workflow, an interactive topology viewer, and specialist review agents',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',
    skillSlug: 'code-modernization',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_BACKEND,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['claude-code'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/code-modernization/README.md',
  },
  {
    name: 'commit-commands',
    description:
      'Commands for git commit workflows including commit, push, and PR creation',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',
    skillSlug: 'commit-commands',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_DEVOPS,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['claude-code'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/commit-commands/README.md',
  },
  {
    name: 'csharp-lsp',
    description:
      'C# language server for code intelligence',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',
    skillSlug: 'csharp-lsp',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_DEBUG,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['claude-code'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/csharp-lsp/README.md',
  },
  {
    name: 'explanatory-output-style',
    description:
      'Adds educational insights about implementation choices and codebase patterns (mimics the deprecated Explanatory output style)',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',
    skillSlug: 'explanatory-output-style',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_LEARNING,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['claude-code'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/explanatory-output-style/README.md',
  },
  {
    name: 'feature-dev',
    description:
      'Comprehensive feature development workflow with specialized agents for codebase exploration, architecture design, and quality review',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',
    skillSlug: 'feature-dev',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_TOOL,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['claude-code'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/feature-dev/README.md',
  },
  {
    name: 'gopls-lsp',
    description:
      'Go language server for code intelligence and refactoring',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',
    skillSlug: 'gopls-lsp',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_DEBUG,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['claude-code'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/gopls-lsp/README.md',
  },
  {
    name: 'jdtls-lsp',
    description:
      'Java language server (Eclipse JDT.LS) for code intelligence',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',
    skillSlug: 'jdtls-lsp',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_DEBUG,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['claude-code'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/jdtls-lsp/README.md',
  },
  {
    name: 'kotlin-lsp',
    description:
      'Kotlin language server for code intelligence',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',
    skillSlug: 'kotlin-lsp',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_DEBUG,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['claude-code'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/kotlin-lsp/README.md',
  },
  {
    name: 'learning-output-style',
    description:
      'Interactive learning mode that requests meaningful code contributions at decision points (mimics the unshipped Learning output style)',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',
    skillSlug: 'learning-output-style',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_LEARNING,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['claude-code'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/learning-output-style/README.md',
  },
  {
    name: 'lua-lsp',
    description:
      'Lua language server for code intelligence',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',
    skillSlug: 'lua-lsp',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_DEBUG,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['claude-code'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/lua-lsp/README.md',
  },
  {
    name: 'php-lsp',
    description:
      'PHP language server (Intelephense) for code intelligence',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',
    skillSlug: 'php-lsp',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_DEBUG,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['claude-code'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/php-lsp/README.md',
  },
  {
    name: 'pr-review-toolkit',
    description:
      'Comprehensive PR review agents specializing in comments, tests, error handling, type design, code quality, and code simplification',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',
    skillSlug: 'pr-review-toolkit',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_TEST,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['claude-code'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/pr-review-toolkit/README.md',
  },
  {
    name: 'pyright-lsp',
    description:
      'Python language server (Pyright) for type checking and code intelligence',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',
    skillSlug: 'pyright-lsp',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_DEBUG,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['claude-code'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/pyright-lsp/README.md',
  },
  {
    name: 'ralph-loop',
    description:
      'Interactive self-referential AI loops for iterative development, implementing the Ralph Wiggum technique. Claude works on the same task repeatedly, seeing its previous work, until completion.',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',
    skillSlug: 'ralph-loop',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_TOOL,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['claude-code'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/ralph-loop/README.md',
  },
  {
    name: 'ruby-lsp',
    description:
      'Ruby language server for code intelligence and analysis',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',
    skillSlug: 'ruby-lsp',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_DEBUG,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['claude-code'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/ruby-lsp/README.md',
  },
  {
    name: 'rust-analyzer-lsp',
    description:
      'Rust language server for code intelligence and analysis',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',
    skillSlug: 'rust-analyzer-lsp',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_DEBUG,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['claude-code'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/rust-analyzer-lsp/README.md',
  },
  {
    name: 'security-guidance',
    description:
      'Security review for Claude-generated code. Pattern-based warnings on edits, LLM-powered diff review on Stop, and an agentic commit reviewer that catches injection, XSS, SSRF, hardcoded secrets, and 25+ other vulnerability classes.',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',
    skillSlug: 'security-guidance',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_SECURITY,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['claude-code'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/security-guidance/README.md',
  },
  {
    name: 'swift-lsp',
    description:
      'Swift language server (SourceKit-LSP) for code intelligence',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',
    skillSlug: 'swift-lsp',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_DEBUG,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['claude-code'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/swift-lsp/README.md',
  },
  {
    name: 'typescript-lsp',
    description:
      'TypeScript/JavaScript language server for enhanced code intelligence',
    repoOwner: 'anthropics',
    repoName: 'claude-plugins-official',
    skillSlug: 'typescript-lsp',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: 'Apache-2.0',
    categoryName: CATEGORY_DEBUG,
    stargazersCount: 33426,
    installKind: 'single_kit',
    supportedAgents: ['claude-code'],
    docUrl: 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/typescript-lsp/README.md',
  },
  {
    name: 'liai',
    description:
      '讓 AI 擁有最強的「極簡主義工程師」思維，堅守 YAGNI 原則，寫最少、最安全的程式碼。',
    repoOwner: 'liwenchiou',
    repoName: 'liai',
    skillSlug: 'lazy-senior',
    creatorName: 'liwenchiou',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/30397088?v=4',
    creatorProfileUrl: 'https://github.com/liwenchiou',
    license: 'MIT',
    categoryName: CATEGORY_BACKEND,
    stargazersCount: 0,
    installKind: 'single_kit',
    supportedAgents: ['codex', 'cursor'],
    docUrl: 'https://raw.githubusercontent.com/liwenchiou/liai/main/skills/lazy-senior/SKILL.md',
  },
  {
    name: "matt",
    description: "Skills For Real Engineers",
    repoOwner: 'mattpocock',
    repoName: 'skills',
    skillSlug: '*',
    creatorName: 'mattpocock',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/28293365?v=4',
    creatorProfileUrl: 'https://github.com/mattpocock',
    license: 'MIT',
    categoryName: CATEGORY_TOOL,
    stargazersCount: 210731,

    installKind: 'full_package',
    supportedAgents: ['codex', 'claude-code', 'cursor'],

    docUrl: 'https://raw.githubusercontent.com/mattpocock/skills/main/README.md',
  }
];


async function seedAgentSkills() {
  console.log('[seed:skill] 開始寫入 Agent Skills 種子資料...');

  const adminUser = await findUserByEmail('admin@example.com');
  if (!adminUser) {
    throw new Error(
      '找不到 admin@example.com，請先執行 seed.js 建立基礎使用者與 parameters 資料',
    );
  }

  const categoryRows = await db.query(
    `SELECT id, name FROM parameters WHERE type = 'category'`,
  );
  const categoryIdByName = new Map(
    categoryRows.rows.map((row) => [row.name, row.id]),
  );

  await db.withTransaction(async (trx) => {
    for (const skill of SEED_AGENT_SKILLS) {
      const categoryId = categoryIdByName.get(skill.categoryName);
      if (!categoryId) {
        throw new Error(
          `找不到分類「${skill.categoryName}」（${skill.repoOwner}/${skill.repoName} ${skill.skillSlug}），請先在 parameters（type='category'）建立這個分類`,
        );
      }
      await trx.query(
        `INSERT INTO agent_skill (
           name, description, intro, repo_owner, repo_name, skill_slug,
           creator_name, creator_avatar_url, creator_profile_url, license,
           category_id, user_id, stargazers_count, copy_count, favorite_count, is_active,
           install_kind, supported_agents, doc_url
         ) VALUES (
           $1, $2, NULL, $3, $4, $5,
           $6, $7, $8, $9,
           $10, $11, $12, 0, 0, true,
           $13, $14, $15
         )
         ON CONFLICT (repo_owner, repo_name, skill_slug) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           creator_name = EXCLUDED.creator_name,
           creator_avatar_url = EXCLUDED.creator_avatar_url,
           creator_profile_url = EXCLUDED.creator_profile_url,
           license = EXCLUDED.license,
           category_id = EXCLUDED.category_id,
           install_kind = EXCLUDED.install_kind,
           supported_agents = EXCLUDED.supported_agents,
           doc_url = EXCLUDED.doc_url,
           is_active = true,
           updated_at = now()`,
        [
          skill.name, skill.description,
          skill.repoOwner, skill.repoName, skill.skillSlug,
          skill.creatorName, skill.creatorAvatarUrl, skill.creatorProfileUrl, skill.license,
          categoryId, adminUser.id, skill.stargazersCount,
          skill.installKind, skill.supportedAgents, skill.docUrl ?? null,
        ],
      );
    }

    const seedKeys = SEED_AGENT_SKILLS.map(
      (skill) => `${skill.repoOwner}/${skill.repoName}/${skill.skillSlug}`,
    );
    const staleRows = await trx.query(
      `SELECT id, name, repo_owner, repo_name, skill_slug FROM agent_skill
       WHERE is_active = true
         AND (repo_owner || '/' || repo_name || '/' || skill_slug) != ALL($1::text[])`,
      [seedKeys],
    );
    if (staleRows.rows.length > 0) {
      console.warn(
        `[seed:skill] 提醒：以下 ${staleRows.rows.length} 筆上架中的資料不在這次的種子清單裡，` +
        '本腳本不會自動下架（可能是 Admin 手動建立的），如需下架請自行到後台處理：',
      );
      for (const row of staleRows.rows) {
        console.warn(`  - ${row.name}（${row.id}，${row.repo_owner}/${row.repo_name} ${row.skill_slug}）`);
      }
    }
  });

  console.log(`[seed:skill] agent_skill 共 ${SEED_AGENT_SKILLS.length} 筆資料同步完成`);
  console.log('[seed:skill] 全部種子資料處理完成！');
  process.exit(0);
}

seedAgentSkills().catch((err) => {
  console.error('[seed:skill] 失敗', err);
  process.exit(1);
});
