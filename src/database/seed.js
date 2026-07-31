const bcrypt = require('bcrypt');
const db = require('./db');
const { createUser, findUserByEmail } = require('./repositories/user.repository');
const favoriteRepository = require('./repositories/favorite.repository');
const { DEFAULT_FAVORITE_SKILL_IDS } = require('../config/favorite.config');

const SEED_USERS = [
  {
    name: '管理者',
    email: 'admin@example.com',
    password: 'Admin1234',
    role: 'admin',
  },
  {
    name: '測試會員',
    email: 'member@example.com',
    password: 'Member1234',
    role: 'member',
  },
];

const SEED_PARAMETERS = [
  // Content Types
  { id: '10000000-0000-4000-a000-000000000001', type: 'contentType', name: 'prompt', memo: 'Prompt 提示詞', is_active: true, sort_order: 1 },
  { id: '10000000-0000-4000-a000-000000000002', type: 'contentType', name: 'skills', memo: 'AI 技能', is_active: true, sort_order: 2 },

  // Categories
  { id: '20000000-0000-4000-a000-000000000001', type: 'category', name: '前端開發', memo: 'React / Vue / CSS / UI 相關', is_active: true, sort_order: 1 },
  { id: '20000000-0000-4000-a000-000000000002', type: 'category', name: '後端開發', memo: 'Node.js / API / 資料庫設計', is_active: true, sort_order: 2 },
  { id: '20000000-0000-4000-a000-000000000003', type: 'category', name: '資安相關', memo: '漏洞檢測、滲透測試、安全審查', is_active: true, sort_order: 3 },
  { id: '20000000-0000-4000-a000-000000000004', type: 'category', name: '除錯技巧', memo: 'Debug、錯誤訊息分析、Log 分析', is_active: true, sort_order: 4 },
  { id: '20000000-0000-4000-a000-000000000005', type: 'category', name: '翻譯助手', memo: '多國語言翻譯與文件潤飾技能', is_active: true, sort_order: 5 },
  { id: '20000000-0000-4000-a000-000000000006', type: 'category', name: '小工具', memo: 'Regex 生成, JSON 格式化等輔助小工具', is_active: true, sort_order: 6 },
  { id: '20000000-0000-4000-a000-000000000007', type: 'category', name: 'DevOps / 部署維運', memo: 'CI/CD、Docker、雲端服務、監控', is_active: true, sort_order: 7 },
  { id: '20000000-0000-4000-a000-000000000008', type: 'category', name: '測試 / 品質保證', memo: '單元測試、E2E、Code Review', is_active: true, sort_order: 8 },
  { id: '20000000-0000-4000-a000-000000000009', type: 'category', name: '文件 / 寫作', memo: '技術文件、README、註解生成', is_active: true, sort_order: 9 },
  { id: '20000000-0000-4000-a000-000000000011', type: 'category', name: '設計 / UX', memo: 'UI 設計、Wireframe、使用者研究', is_active: true, sort_order: 11 },

  // Models
  { id: '30000000-0000-4000-a000-000000000001', type: 'model', name: 'gpt-4', memo: 'OpenAI GPT-4', is_active: true, sort_order: 1 },
  { id: '30000000-0000-4000-a000-000000000002', type: 'model', name: 'claude-3.5', memo: 'Anthropic Claude 3.5 Sonnet', is_active: true, sort_order: 2 },
  { id: '30000000-0000-4000-a000-000000000003', type: 'model', name: 'codex', memo: 'GitHub Copilot Codex', is_active: true, sort_order: 3 },
  { id: '30000000-0000-4000-a000-000000000004', type: 'model', name: 'gemini', memo: 'Google Gemini', is_active: true, sort_order: 4 },

  // Tags
  { id: '40000000-0000-4000-a000-000000000001', type: 'tag', name: '#API', memo: 'API 串接與設計', is_active: true, sort_order: 1 },
  { id: '40000000-0000-4000-a000-000000000002', type: 'tag', name: '#Security', memo: '資訊安全與防禦', is_active: true, sort_order: 2 },
  { id: '40000000-0000-4000-a000-000000000003', type: 'tag', name: '#React', memo: 'React 元件開發', is_active: true, sort_order: 3 },
  { id: '40000000-0000-4000-a000-000000000004', type: 'tag', name: '#Debug', memo: '故障排除與除錯', is_active: true, sort_order: 4 },
  { id: '40000000-0000-4000-a000-000000000005', type: 'tag', name: '#SQL', memo: '資料庫查詢優化', is_active: true, sort_order: 5 },
  { id: '40000000-0000-4000-a000-000000000006', type: 'tag', name: '#Translation', memo: '多國語系翻譯', is_active: true, sort_order: 6 },
  { id: '40000000-0000-4000-a000-000000000007', type: 'tag', name: '#Node.js', memo: 'Node.js 執行環境', is_active: true, sort_order: 7 },
  { id: '40000000-0000-4000-a000-000000000008', type: 'tag', name: '#Express', memo: 'Express.js 框架', is_active: true, sort_order: 8 },
  { id: '40000000-0000-4000-a000-000000000009', type: 'tag', name: '#Vite', memo: 'Vite 建置工具', is_active: true, sort_order: 9 },
  { id: '40000000-0000-4000-a000-000000000012', type: 'tag', name: '#Web', memo: '網頁應用開發', is_active: true, sort_order: 12 },
  { id: '40000000-0000-4000-a000-000000000013', type: 'tag', name: '#Design', memo: '設計相關', is_active: true, sort_order: 13 },
];

const SEED_SKILLS = [
  {
    id: DEFAULT_FAVORITE_SKILL_IDS[0], // '9fcf96a4-eb05-4d4a-b7e2-fdb4b2da87f6'
    title: '後端 API 審查',
    slug: 'backend-api-review',
    intro: '檢查 Express / Next.js API 的錯誤處理、安全性與回傳結構。',
    content_type_id: '10000000-0000-4000-a000-000000000001',
    category_id: '20000000-0000-4000-a000-000000000002',
    model_type: ['30000000-0000-4000-a000-000000000001', '30000000-0000-4000-a000-000000000002'],
    tags: ['40000000-0000-4000-a000-000000000001', '40000000-0000-4000-a000-000000000002', '40000000-0000-4000-a000-000000000008'],
    prompt_content: `請你扮演資深後端工程師，檢查以下 API 程式碼。

幫我找出可能的錯誤、安全性風險、效能問題，
並提出改善建議。

輸出請包含：
[程式碼問題]
[改善建議程式碼]
[為什麼這樣改]`,
    use_case: '當你接收一支 API，需要 AI 幫你檢查安全性、錯誤處理與資料結構時使用。',
    example_input: 'app.get("/api/user", async (req, res) => {\n  const id = req.query.id;\n  const user = await db.query(...);\n  res.json(user);\n});',
    example_output: [
      {
        type: 'text',
        data: {
          context: '【程式碼問題】\n1. 未進行輸入驗證，可能存在 SQL Injection 安全風險。\n2. 缺乏 try-catch 區塊，若資料庫查詢失敗會導致 server 當機。'
        },
        seq: 0
      }
    ],
    source_url: 'https://expressjs.com/zh-tw/advanced/best-practice-security.html',
    copy_count: 125,
    favorite_count: 32,
    is_active: true
  },
  {
    id: DEFAULT_FAVORITE_SKILL_IDS[1], // '6d56531f-a28f-4ebe-977f-5d6222cab34e'
    title: '前端 Debug 助手',
    slug: 'frontend-debug-assistant',
    intro: '協助找出 React / Next.js 專案的錯誤原因與除錯線索。',
    content_type_id: '10000000-0000-4000-a000-000000000001',
    category_id: '20000000-0000-4000-a000-000000000001',
    model_type: ['30000000-0000-4000-a000-000000000002'],
    tags: ['40000000-0000-4000-a000-000000000003', '40000000-0000-4000-a000-000000000004', '40000000-0000-4000-a000-000000000009'],
    prompt_content: `請分析以下 React / Next.js 錯誤訊息，
並給出可能的修復方案及除錯步驟：

[在此輸入錯誤訊息]`,
    use_case: '當 React 網頁發生 Runtime Error 或編譯失敗時，用於快速定位問題。',
    example_input: 'TypeError: Cannot read properties of undefined (reading "map") at ProductList (ProductList.jsx:12)',
    example_output: [
      {
        type: 'text',
        data: {
          context: '【錯誤原因】\nProductList 組件中的資料在渲染時尚為 undefined。\n\n【解決方案】\n使用 Optional Chaining (`products?.map(...)`)。'
        },
        seq: 0
      }
    ],
    source_url: 'https://react.dev/reference/react',
    copy_count: 98,
    favorite_count: 21,
    is_active: true
  },
  {
    id: '50000000-0000-4000-a000-000000000003',
    title: '資安漏洞檢查清單',
    slug: 'security-vulnerabilities-checklist',
    intro: '檢查常見的 Web 與雲端環境風險掃描方式。',
    content_type_id: '10000000-0000-4000-a000-000000000001',
    category_id: '20000000-0000-4000-a000-000000000003',
    model_type: ['30000000-0000-4000-a000-000000000001', '30000000-0000-4000-a000-000000000002'],
    tags: ['40000000-0000-4000-a000-000000000002', '40000000-0000-4000-a000-000000000012'],
    prompt_content: `請提供一份針對以下環境的 Web 應用程式安全檢測清單，
以及常見漏洞的防範建議：

[在此說明技術棧環境]`,
    use_case: '部署前進行安全性弱點自檢，或準備進行滲透測試時。',
    example_input: 'Web API Node.js environment...',
    example_output: [
      {
        type: 'text',
        data: {
          context: '1. 檢查並停用不安全的 HTTP Header (建議使用 helmet 中間件)\n2. 防範 CORS 跨網域資源共享不當設定'
        },
        seq: 0
      }
    ],
    source_url: 'https://owasp.org/www-project-top-ten/',
    copy_count: 63,
    favorite_count: 15,
    is_active: true
  },
  {
    id: '50000000-0000-4000-a000-000000000004',
    title: '英文翻譯與潤飾',
    slug: 'english-translation-polishing',
    intro: '將中文技術文件翻譯為專業流暢的英文，並提供多種口吻潤飾。',
    content_type_id: '10000000-0000-4000-a000-000000000001',
    category_id: '20000000-0000-4000-a000-000000000005',
    model_type: ['30000000-0000-4000-a000-000000000002'],
    tags: ['40000000-0000-4000-a000-000000000006', '40000000-0000-4000-a000-000000000012'],
    prompt_content: `請將以下中文技術內容翻譯成專業、自然的英文，
並提供 Academic 與 Professional 兩種口吻：

[在此輸入內容]`,
    use_case: '需要撰寫英文 API 文件、發布 PR 說明或學術發表論文時。',
    example_input: '如何使用 React 進行狀態管理...',
    example_output: [
      {
        type: 'text',
        data: {
          context: 'Academic: How to leverage React for state management...\nProfessional: Efficient ways to manage state in your React projects...'
        },
        seq: 0
      }
    ],
    source_url: '',
    copy_count: 180,
    favorite_count: 42,
    is_active: true
  }
];

async function seed() {
  console.log('[seed] 開始寫入種子資料...');

  // 1. Users
  const seededUserMap = new Map();
  for (const user of SEED_USERS) {
    let existing = await findUserByEmail(user.email);
    if (!existing) {
      const passwordHash = await bcrypt.hash(user.password, 10);
      existing = await createUser({
        name: user.name,
        email: user.email,
        passwordHash,
        role: user.role,
      });
      console.log(`[seed] 使用者 ${user.name} (${user.email}) 建立完成`);
    } else {
      console.log(`[seed] 使用者 ${user.name} (${user.email}) 已存在`);
    }
    seededUserMap.set(user.email, existing);
  }

  // 2. Parameters
  for (const param of SEED_PARAMETERS) {
    await db.query(
      `INSERT INTO parameters (id, type, name, memo, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         memo = EXCLUDED.memo,
         is_active = EXCLUDED.is_active,
         sort_order = EXCLUDED.sort_order`,
      [param.id, param.type, param.name, param.memo, param.is_active, param.sort_order]
    );
  }
  console.log(`[seed] 參數表 (parameters) 共 ${SEED_PARAMETERS.length} 筆資料同步完成`);

  // 3. Skill Items
  const adminUser = seededUserMap.get('admin@example.com');
  for (const skill of SEED_SKILLS) {
    await db.query(
      `INSERT INTO skill_item (
         id, title, slug, intro, content_type_id, category_id, model_type, tags,
         prompt_content, use_case, example_input, example_output, user_id, source_url,
         copy_count, favorite_count, status, is_active
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7::json, $8::json,
         $9, $10, $11, $12::json, $13, $14,
         $15, $16, true, $17
       ) ON CONFLICT (slug) DO UPDATE SET
         title = EXCLUDED.title,
         intro = EXCLUDED.intro,
         prompt_content = EXCLUDED.prompt_content,
         use_case = EXCLUDED.use_case,
         example_input = EXCLUDED.example_input,
         is_active = EXCLUDED.is_active`,
      [
        skill.id, skill.title, skill.slug, skill.intro, skill.content_type_id, skill.category_id,
        JSON.stringify(skill.model_type), JSON.stringify(skill.tags),
        skill.prompt_content, skill.use_case, skill.example_input, JSON.stringify(skill.example_output),
        adminUser?.id || null, skill.source_url || '',
        skill.copy_count || 0, skill.favorite_count || 0, skill.is_active
      ]
    );
  }
  console.log(`[seed] 技能表 (skill_item) 共 ${SEED_SKILLS.length} 筆資料同步完成`);

  // 4. Default Favorites for Member User
  const memberUser = seededUserMap.get('member@example.com');
  if (memberUser) {
    for (const skillId of DEFAULT_FAVORITE_SKILL_IDS) {
      await favoriteRepository.addFavorite(memberUser.id, skillId);
    }
    await favoriteRepository.recalculateFavoriteCounts(DEFAULT_FAVORITE_SKILL_IDS);
    console.log(`[seed] 測試會員預設收藏技能建立完成`);
  }

  console.log('[seed] 全部種子資料處理完成！');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[seed] 失敗', err);
  process.exit(1);
});


