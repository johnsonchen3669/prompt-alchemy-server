// 獨立於 seed.js 之外的 Agent Skills 種子腳本。
// 刻意分開，是因為 seed.js 是既有 Prompt 種子資料的腳本，
// 不希望 Agent Skills 的異動跟它綁在一起被誤觸發。
//
// 執行目標由 NODE_ENV 決定（比照 src/config/env.js 的慣例）：
//   本機 PGlite：  npm run seed:skill
//   雲端正式環境： npm run seed:skill:prod
//
// 下方每一筆資料皆為透過 GitHub API（gh api repos/<owner>/<repo>）
// 查證過的真實 repo，description/intro 直接引用對應 SKILL.md frontmatter
// 原文，不自行改寫。stargazers_count 為查證當下的即時星數快照，
// 之後應由 Admin 的「同步 GitHub」功能定期更新（見 spec.md）。
const db = require('./db');
const { findUserByEmail } = require('./repositories/user.repository');

// 用「分類名稱」而非固定 UUID 對應 category，因為本機 PGlite（seed.js 的
// SEED_PARAMETERS 固定 UUID）跟雲端正式環境（Admin 手動建立、UUID 皆為
// gen_random_uuid()）的 parameters.id 並不一致，只有 name 是兩邊都一致的。
const CATEGORY_FRONTEND = '前端開發';
const CATEGORY_BACKEND = '後端開發';
const CATEGORY_DEBUG = '除錯技巧';
const CATEGORY_TOOL = '小工具';
const CATEGORY_DEVOPS = 'DevOps / 部署維運';
const CATEGORY_TEST = '測試 / 品質保證';
const CATEGORY_DOC = '文件 / 寫作';

const SEED_AGENT_SKILLS = [
  {
    name: 'improve-skill-quality',
    description:
      'Diagnoses and fixes skills in the dotnet/skills repository that lose to their own baseline, fail to activate, time out, or return "no credible improvement". Use when an evaluation verdict is a regression or underpowered, when a skill regressed after a change, when /evaluate reports no results, or when deciding whether a weak skill should be strengthened or retired. Do not use for scaffolding a brand-new skill (use create-skill) or a brand-new eval (use create-skill-test).',
    repoOwner: 'dotnet',
    repoName: 'skills',
    skillSlug: 'improve-skill-quality',
    creatorName: 'dotnet',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/9141961?v=4',
    creatorProfileUrl: 'https://github.com/dotnet',
    license: 'MIT',
    categoryName: CATEGORY_TEST,
    stargazersCount: 5101,
  },
  {
    name: 'deck-writer',
    description:
      '撰寫簡報內容（大綱、文案、表格、KPI、列點、流程圖）並輸出 Markdown，供 slide-html 渲染為投影片圖檔。重視每頁資訊密度，避免純金句頁。當使用者要求規劃簡報內容、寫投影片文案、整理簡報大綱、把主題拆成 N 頁、或要把資料整理成可演說的內容時觸發。不負責圖檔產生（那是 slide-html 的工作）。',
    repoOwner: 'Wcc723',
    repoName: 'social-image-kit',
    skillSlug: 'deck-writer',
    creatorName: 'Wcc723',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/3422575?v=4',
    creatorProfileUrl: 'https://github.com/Wcc723',
    license: null,
    categoryName: CATEGORY_DOC,
    stargazersCount: 3,
  },
  {
    name: 'frontend-design',
    description:
      "Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Helps with aesthetic direction, typography, and making choices that don't read as templated defaults.",
    repoOwner: 'anthropics',
    repoName: 'skills',
    skillSlug: 'frontend-design',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: null,
    categoryName: CATEGORY_FRONTEND,
    stargazersCount: 167174,
  },
  {
    name: 'lazy-senior',
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
  },
  // mattpocock/skills — engineering + misc + productivity 全部 29 個穩定 skill
  // （不含 in-progress／deprecated 目錄），name/description 皆為 SKILL.md
  // frontmatter 原文，stargazers_count 為查證當下的 repo 星數快照。
  {
    name: "ask-matt",
    description: "Ask which skill or flow fits your situation. A router over the skills in this repo.",
    repoOwner: 'mattpocock',
    repoName: 'skills',
    skillSlug: "ask-matt",
    creatorName: 'mattpocock',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/28293365?v=4',
    creatorProfileUrl: 'https://github.com/mattpocock',
    license: 'MIT',
    categoryName: CATEGORY_TOOL,
    stargazersCount: 210731,
  },
  {
    name: "code-review",
    description: "Review the changes since a fixed point (commit, branch, tag, or merge-base) along two axes — Standards (does the code follow this repo's documented coding standards?) and Spec (does the code match what the originating issue/spec asked for?). Runs both reviews in parallel sub-agents and reports them side by side. Use when the user wants to review a branch, a PR, work-in-progress changes, or asks to \"review since X\".",
    repoOwner: 'mattpocock',
    repoName: 'skills',
    skillSlug: "code-review",
    creatorName: 'mattpocock',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/28293365?v=4',
    creatorProfileUrl: 'https://github.com/mattpocock',
    license: 'MIT',
    categoryName: CATEGORY_TEST,
    stargazersCount: 210731,
  },
  {
    name: "codebase-design",
    description: "Shared vocabulary for designing deep modules. Use when the user wants to design or improve a module's interface, find deepening opportunities, decide where a seam goes, make code more testable or AI-navigable, or when another skill needs the deep-module vocabulary.",
    repoOwner: 'mattpocock',
    repoName: 'skills',
    skillSlug: "codebase-design",
    creatorName: 'mattpocock',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/28293365?v=4',
    creatorProfileUrl: 'https://github.com/mattpocock',
    license: 'MIT',
    categoryName: CATEGORY_BACKEND,
    stargazersCount: 210731,
  },
  {
    name: "diagnosing-bugs",
    description: "Diagnosis loop for hard bugs and performance regressions. Use when the user says \"diagnose\"/\"debug this\", or reports something broken/throwing/failing/slow.",
    repoOwner: 'mattpocock',
    repoName: 'skills',
    skillSlug: "diagnosing-bugs",
    creatorName: 'mattpocock',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/28293365?v=4',
    creatorProfileUrl: 'https://github.com/mattpocock',
    license: 'MIT',
    categoryName: CATEGORY_DEBUG,
    stargazersCount: 210731,
  },
  {
    name: "domain-modeling",
    description: "Build and sharpen a project's domain model. Use when the user wants to pin down domain terminology or a ubiquitous language, record an architectural decision, or when another skill needs to maintain the domain model.",
    repoOwner: 'mattpocock',
    repoName: 'skills',
    skillSlug: "domain-modeling",
    creatorName: 'mattpocock',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/28293365?v=4',
    creatorProfileUrl: 'https://github.com/mattpocock',
    license: 'MIT',
    categoryName: CATEGORY_BACKEND,
    stargazersCount: 210731,
  },
  {
    name: "grill-with-docs",
    description: "A relentless interview to sharpen a plan or design, which also creates docs (ADR's and glossary) as we go.",
    repoOwner: 'mattpocock',
    repoName: 'skills',
    skillSlug: "grill-with-docs",
    creatorName: 'mattpocock',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/28293365?v=4',
    creatorProfileUrl: 'https://github.com/mattpocock',
    license: 'MIT',
    categoryName: CATEGORY_DOC,
    stargazersCount: 210731,
  },
  {
    name: "implement",
    description: "Implement a piece of work based on a spec or set of tickets.",
    repoOwner: 'mattpocock',
    repoName: 'skills',
    skillSlug: "implement",
    creatorName: 'mattpocock',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/28293365?v=4',
    creatorProfileUrl: 'https://github.com/mattpocock',
    license: 'MIT',
    categoryName: CATEGORY_BACKEND,
    stargazersCount: 210731,
  },
  {
    name: "improve-codebase-architecture",
    description: "Scan a codebase for deepening opportunities, present them as a visual HTML report, then grill through whichever one you pick.",
    repoOwner: 'mattpocock',
    repoName: 'skills',
    skillSlug: "improve-codebase-architecture",
    creatorName: 'mattpocock',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/28293365?v=4',
    creatorProfileUrl: 'https://github.com/mattpocock',
    license: 'MIT',
    categoryName: CATEGORY_BACKEND,
    stargazersCount: 210731,
  },
  {
    name: "prototype",
    description: "Build a throwaway prototype to answer a design question. Use when the user wants to sanity-check whether a state model or logic feels right, or explore what a UI should look like.",
    repoOwner: 'mattpocock',
    repoName: 'skills',
    skillSlug: "prototype",
    creatorName: 'mattpocock',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/28293365?v=4',
    creatorProfileUrl: 'https://github.com/mattpocock',
    license: 'MIT',
    categoryName: CATEGORY_TOOL,
    stargazersCount: 210731,
  },
  {
    name: "research",
    description: "Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent.",
    repoOwner: 'mattpocock',
    repoName: 'skills',
    skillSlug: "research",
    creatorName: 'mattpocock',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/28293365?v=4',
    creatorProfileUrl: 'https://github.com/mattpocock',
    license: 'MIT',
    categoryName: CATEGORY_DOC,
    stargazersCount: 210731,
  },
  {
    name: "resolving-merge-conflicts",
    description: "Use when you need to resolve an in-progress git merge/rebase conflict.",
    repoOwner: 'mattpocock',
    repoName: 'skills',
    skillSlug: "resolving-merge-conflicts",
    creatorName: 'mattpocock',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/28293365?v=4',
    creatorProfileUrl: 'https://github.com/mattpocock',
    license: 'MIT',
    categoryName: CATEGORY_DEBUG,
    stargazersCount: 210731,
  },
  {
    name: "setup-matt-pocock-skills",
    description: "Configure this repo for the engineering skills — set up its issue tracker, triage label vocabulary, and domain doc layout. Run once before first use of the other engineering skills.",
    repoOwner: 'mattpocock',
    repoName: 'skills',
    skillSlug: "setup-matt-pocock-skills",
    creatorName: 'mattpocock',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/28293365?v=4',
    creatorProfileUrl: 'https://github.com/mattpocock',
    license: 'MIT',
    categoryName: CATEGORY_DEVOPS,
    stargazersCount: 210731,
  },
  {
    name: "tdd",
    description: "Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions \"red-green-refactor\", or wants integration tests.",
    repoOwner: 'mattpocock',
    repoName: 'skills',
    skillSlug: "tdd",
    creatorName: 'mattpocock',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/28293365?v=4',
    creatorProfileUrl: 'https://github.com/mattpocock',
    license: 'MIT',
    categoryName: CATEGORY_TEST,
    stargazersCount: 210731,
  },
  {
    name: "to-spec",
    description: "Turn the current conversation into a spec and publish it to the project issue tracker — no interview, just synthesis of what you've already discussed.",
    repoOwner: 'mattpocock',
    repoName: 'skills',
    skillSlug: "to-spec",
    creatorName: 'mattpocock',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/28293365?v=4',
    creatorProfileUrl: 'https://github.com/mattpocock',
    license: 'MIT',
    categoryName: CATEGORY_DOC,
    stargazersCount: 210731,
  },
  {
    name: "to-tickets",
    description: "Break a plan, spec, or the current conversation into a set of tracer-bullet tickets, each declaring its blocking edges, published to the configured tracker — edges as text in one file per ticket locally, or native blocking links on a real tracker.",
    repoOwner: 'mattpocock',
    repoName: 'skills',
    skillSlug: "to-tickets",
    creatorName: 'mattpocock',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/28293365?v=4',
    creatorProfileUrl: 'https://github.com/mattpocock',
    license: 'MIT',
    categoryName: CATEGORY_DOC,
    stargazersCount: 210731,
  },
  {
    name: "triage",
    description: "Move issues and external PRs through a state machine of triage roles — categorise, verify, grill if needed, and write agent-ready briefs.",
    repoOwner: 'mattpocock',
    repoName: 'skills',
    skillSlug: "triage",
    creatorName: 'mattpocock',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/28293365?v=4',
    creatorProfileUrl: 'https://github.com/mattpocock',
    license: 'MIT',
    categoryName: CATEGORY_DEBUG,
    stargazersCount: 210731,
  },
  {
    name: "wayfinder",
    description: "Plan a huge chunk of work — more than one agent session can hold — as a shared map of decision tickets on your issue tracker, and resolve them one at a time until the way to the destination is clear.",
    repoOwner: 'mattpocock',
    repoName: 'skills',
    skillSlug: "wayfinder",
    creatorName: 'mattpocock',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/28293365?v=4',
    creatorProfileUrl: 'https://github.com/mattpocock',
    license: 'MIT',
    categoryName: CATEGORY_TOOL,
    stargazersCount: 210731,
  },
  {
    name: "wizard",
    description: "Generate an interactive bash wizard that walks a human through steps only they can perform. Use when provisioning infrastructure, setting up credentials or CI secrets, walking an unfamiliar third-party dashboard, or running a one-off migration or cutover. Don't invoke this for steps the agent can perform itself.",
    repoOwner: 'mattpocock',
    repoName: 'skills',
    skillSlug: "wizard",
    creatorName: 'mattpocock',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/28293365?v=4',
    creatorProfileUrl: 'https://github.com/mattpocock',
    license: 'MIT',
    categoryName: CATEGORY_TOOL,
    stargazersCount: 210731,
  },
  {
    name: "git-guardrails-claude-code",
    description: "Set up Claude Code hooks to block dangerous git commands (push, reset --hard, clean, branch -D, etc.) before they execute. Use when user wants to prevent destructive git operations, add git safety hooks, or block git push/reset in Claude Code.",
    repoOwner: 'mattpocock',
    repoName: 'skills',
    skillSlug: "git-guardrails-claude-code",
    creatorName: 'mattpocock',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/28293365?v=4',
    creatorProfileUrl: 'https://github.com/mattpocock',
    license: 'MIT',
    categoryName: CATEGORY_DEVOPS,
    stargazersCount: 210731,
  },
  {
    name: "migrate-to-shoehorn",
    description: "Migrate test files from `as` type assertions to @total-typescript/shoehorn. Use when user mentions shoehorn, wants to replace `as` in tests, or needs partial test data.",
    repoOwner: 'mattpocock',
    repoName: 'skills',
    skillSlug: "migrate-to-shoehorn",
    creatorName: 'mattpocock',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/28293365?v=4',
    creatorProfileUrl: 'https://github.com/mattpocock',
    license: 'MIT',
    categoryName: CATEGORY_BACKEND,
    stargazersCount: 210731,
  },
  {
    name: "scaffold-exercises",
    description: "Create exercise directory structures with sections, problems, solutions, and explainers that pass linting. Use when user wants to scaffold exercises, create exercise stubs, or set up a new course section.",
    repoOwner: 'mattpocock',
    repoName: 'skills',
    skillSlug: "scaffold-exercises",
    creatorName: 'mattpocock',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/28293365?v=4',
    creatorProfileUrl: 'https://github.com/mattpocock',
    license: 'MIT',
    categoryName: CATEGORY_TOOL,
    stargazersCount: 210731,
  },
  {
    name: "setup-pre-commit",
    description: "Set up Husky pre-commit hooks with lint-staged (Prettier), type checking, and tests in the current repo. Use when user wants to add pre-commit hooks, set up Husky, configure lint-staged, or add commit-time formatting/typechecking/testing.",
    repoOwner: 'mattpocock',
    repoName: 'skills',
    skillSlug: "setup-pre-commit",
    creatorName: 'mattpocock',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/28293365?v=4',
    creatorProfileUrl: 'https://github.com/mattpocock',
    license: 'MIT',
    categoryName: CATEGORY_DEVOPS,
    stargazersCount: 210731,
  },
  {
    name: "grill-me",
    description: "A relentless interview to sharpen a plan or design.",
    repoOwner: 'mattpocock',
    repoName: 'skills',
    skillSlug: "grill-me",
    creatorName: 'mattpocock',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/28293365?v=4',
    creatorProfileUrl: 'https://github.com/mattpocock',
    license: 'MIT',
    categoryName: CATEGORY_TOOL,
    stargazersCount: 210731,
  },
  {
    name: "grilling",
    description: "Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.",
    repoOwner: 'mattpocock',
    repoName: 'skills',
    skillSlug: "grilling",
    creatorName: 'mattpocock',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/28293365?v=4',
    creatorProfileUrl: 'https://github.com/mattpocock',
    license: 'MIT',
    categoryName: CATEGORY_TOOL,
    stargazersCount: 210731,
  },
  {
    name: "handoff",
    description: "Compact the current conversation into a handoff document for another agent to pick up.",
    repoOwner: 'mattpocock',
    repoName: 'skills',
    skillSlug: "handoff",
    creatorName: 'mattpocock',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/28293365?v=4',
    creatorProfileUrl: 'https://github.com/mattpocock',
    license: 'MIT',
    categoryName: CATEGORY_DOC,
    stargazersCount: 210731,
  },
  {
    name: "teach",
    description: "Teach the user a new skill or concept, within this workspace.",
    repoOwner: 'mattpocock',
    repoName: 'skills',
    skillSlug: "teach",
    creatorName: 'mattpocock',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/28293365?v=4',
    creatorProfileUrl: 'https://github.com/mattpocock',
    license: 'MIT',
    categoryName: CATEGORY_DOC,
    stargazersCount: 210731,
  },
  {
    name: "to-questionnaire",
    description: "Turn a decision you can't fully answer into a questionnaire for someone else to fill in.",
    repoOwner: 'mattpocock',
    repoName: 'skills',
    skillSlug: "to-questionnaire",
    creatorName: 'mattpocock',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/28293365?v=4',
    creatorProfileUrl: 'https://github.com/mattpocock',
    license: 'MIT',
    categoryName: CATEGORY_DOC,
    stargazersCount: 210731,
  },
  {
    name: "wait-what",
    description: "Stop. That last message did not land — re-pitch it.",
    repoOwner: 'mattpocock',
    repoName: 'skills',
    skillSlug: "wait-what",
    creatorName: 'mattpocock',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/28293365?v=4',
    creatorProfileUrl: 'https://github.com/mattpocock',
    license: 'MIT',
    categoryName: CATEGORY_TOOL,
    stargazersCount: 210731,
  },
  {
    name: "writing-for-agents",
    description: "Writing documents for agents. Use when creating or editing skills, or modifying AGENTS.md or CLAUDE.md.",
    repoOwner: 'mattpocock',
    repoName: 'skills',
    skillSlug: "writing-for-agents",
    creatorName: 'mattpocock',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/28293365?v=4',
    creatorProfileUrl: 'https://github.com/mattpocock',
    license: 'MIT',
    categoryName: CATEGORY_DOC,
    stargazersCount: 210731,
  },
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

  for (const skill of SEED_AGENT_SKILLS) {
    const categoryId = categoryIdByName.get(skill.categoryName);
    if (!categoryId) {
      throw new Error(
        `找不到分類「${skill.categoryName}」（${skill.repoOwner}/${skill.repoName} ${skill.skillSlug}），請先在 parameters（type='category'）建立這個分類`,
      );
    }
    await db.query(
      `INSERT INTO agent_skill (
         name, description, intro, repo_owner, repo_name, skill_slug,
         creator_name, creator_avatar_url, creator_profile_url, license,
         category_id, user_id, stargazers_count, copy_count, favorite_count, is_active
       ) VALUES (
         $1, $2, NULL, $3, $4, $5,
         $6, $7, $8, $9,
         $10, $11, $12, 0, 0, true
       ) ON CONFLICT (repo_owner, repo_name, skill_slug) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         creator_name = EXCLUDED.creator_name,
         creator_avatar_url = EXCLUDED.creator_avatar_url,
         creator_profile_url = EXCLUDED.creator_profile_url,
         license = EXCLUDED.license,
         category_id = EXCLUDED.category_id,
         stargazers_count = EXCLUDED.stargazers_count,
         updated_at = now()`,
      [
        skill.name, skill.description,
        skill.repoOwner, skill.repoName, skill.skillSlug,
        skill.creatorName, skill.creatorAvatarUrl, skill.creatorProfileUrl, skill.license,
        categoryId, adminUser.id, skill.stargazersCount,
      ],
    );
  }

  console.log(`[seed:skill] agent_skill 共 ${SEED_AGENT_SKILLS.length} 筆資料同步完成`);
  console.log('[seed:skill] 全部種子資料處理完成！');
  process.exit(0);
}

seedAgentSkills().catch((err) => {
  console.error('[seed:skill] 失敗', err);
  process.exit(1);
});
