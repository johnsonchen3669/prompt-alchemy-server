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
//
// skillSlug 驗證規則（新增資料前必查）：
// 必須是「實際含有 SKILL.md 的葉層資料夾名稱」，而非 plugin／分類容器名稱
// （例如 dotnet/skills 的 plugins/dotnet-test 只是容器，其下真正可裝的是
// plugins/dotnet-test/skills/run-tests 等葉層 skill；npx skills add --skill
// 只認得出葉層名稱）。查法：
//   gh api -X GET search/code -f q='"<skillSlug>" in:path repo:<owner>/<repo>'
// 找到 .../skills/<skillSlug>/SKILL.md（或等價路徑）才算驗證通過。
//
// 安裝機制欄位（claudeInstallMethod/codexInstallMethod/claudePluginName/
// claudeMarketplaceName/gitCloneMethod，見 CONTEXT.md 與
// docs/adr/0001-agent-skill-install-mechanism.md）：Admin 人工判斷填寫，
// 不做自動偵測。下方大多數筆數目前是「npx 對兩個 agent 皆可用」的預設值
// （claudeInstallMethod/codexInstallMethod 皆為 true），是待審核的暫定值，
// 尚未逐筆讀過來源 README 確認——只有 deck-writer（Wcc723/social-image-kit）
// 已實測 npx 安裝會壞（見 ADR），改標為 gitCloneMethod。其餘筆數請自行核實
// 後調整。
//
// docUrl：README.md 優先、沒有才用 SKILL.md，擇一存完整
// raw.githubusercontent.com 網址（純文字、有 CORS，前端直接 fetch 渲染）。
// 例：https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<path>/SKILL.md
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
    claudeInstallMethod: true,
    codexInstallMethod: true,
    // marketplace.json 列出的第一個 plugin（.claude-plugin/marketplace.json）。
    claudePluginName: 'dotnet',
    claudeMarketplaceName: 'dotnet-agent-skills',
    gitCloneMethod: false,
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
    claudeInstallMethod: false,
    codexInstallMethod: false,
    claudePluginName: null,
    claudeMarketplaceName: null,
    gitCloneMethod: true,
    // 這筆代表整個工具專案（非單一 skill 資料夾），用 repo 根目錄 README.md。
    docUrl: 'https://raw.githubusercontent.com/Wcc723/social-image-kit/main/README.md',
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
    claudeInstallMethod: true,
    codexInstallMethod: true,
    // frontend-design 明確列在 example-skills 這個 plugin 的 skills 清單裡。
    claudePluginName: 'example-skills',
    claudeMarketplaceName: 'anthropic-agent-skills',
    gitCloneMethod: false,
    // frontend-design 資料夾內沒有 README.md，退回用 SKILL.md。
    docUrl: 'https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md',
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
    claudeInstallMethod: false,
    codexInstallMethod: true,
    claudePluginName: null,
    claudeMarketplaceName: null,
    gitCloneMethod: false,
    // lazy-senior 資料夾內沒有 README.md，退回用 SKILL.md。
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
    claudeInstallMethod: true,
    codexInstallMethod: true,
    // marketplace.json 唯一的 plugin，source 就是整個 repo 根目錄，整包安裝
    // （Full package）：claude plugin install mattpocock-skills，不需要
    // marketplace_name（見 ADR-0001 Update）。
    claudePluginName: 'mattpocock-skills',
    claudeMarketplaceName: null,
    gitCloneMethod: false,
    // 這筆代表整個 repo（非單一 skill 資料夾），用 repo 根目錄 README.md。
    docUrl: 'https://raw.githubusercontent.com/mattpocock/skills/main/README.md',
  },
  {
    name: "anthropic/skills",
    description: "Public repository for Agent Skills",
    repoOwner: 'anthropics',
    repoName: 'skills',
    skillSlug: '*',
    creatorName: 'anthropics',
    creatorAvatarUrl: 'https://avatars.githubusercontent.com/u/76263028?v=4',
    creatorProfileUrl: 'https://github.com/anthropics',
    license: null,
    categoryName: CATEGORY_TOOL,
    stargazersCount: 210724,
    claudeInstallMethod: true,
    codexInstallMethod: true,
    // marketplace.json 列出的第一個 plugin（沒有單一涵蓋全部的 plugin）。
    claudePluginName: 'document-skills',
    claudeMarketplaceName: 'anthropic-agent-skills',
    gitCloneMethod: false,
    // 這筆代表整個 repo（非單一 skill 資料夾），用 repo 根目錄 README.md。
    docUrl: 'https://raw.githubusercontent.com/anthropics/skills/main/README.md',
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

  // 每次執行都先清空 agent_skill 再整批寫入，讓資料庫內容跟
  // SEED_AGENT_SKILLS 陣列完全同步（含刪除已從陣列移除的舊筆數），
  // 而不是靠 ON CONFLICT UPSERT 讓被拿掉的舊資料一直留在資料庫裡。
  // 包在同一個交易內，任何一筆寫入失敗就整批回復，不會留下清空後
  // 卻沒寫完的半殘狀態。
  await db.withTransaction(async (trx) => {
    await trx.query('DELETE FROM agent_skill');

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
           claude_install_method, codex_install_method, claude_plugin_name,
           claude_marketplace_name, git_clone_method, doc_url
         ) VALUES (
           $1, $2, NULL, $3, $4, $5,
           $6, $7, $8, $9,
           $10, $11, $12, 0, 0, true,
           $13, $14, $15, $16, $17, $18
         )`,
        [
          skill.name, skill.description,
          skill.repoOwner, skill.repoName, skill.skillSlug,
          skill.creatorName, skill.creatorAvatarUrl, skill.creatorProfileUrl, skill.license,
          categoryId, adminUser.id, skill.stargazersCount,
          skill.claudeInstallMethod, skill.codexInstallMethod, skill.claudePluginName,
          skill.claudeMarketplaceName, skill.gitCloneMethod, skill.docUrl ?? null,
        ],
      );
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
