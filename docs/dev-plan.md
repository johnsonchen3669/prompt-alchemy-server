# Prompt/Skill 收藏庫 — 後端實作計畫（手把手版）

## Context

專案 `prompt-alchemy-server` 目前僅完成骨架階段：`docs/plan.md` 已有完整的 PRD（產品目標、角色權限、API 規格、資料規格、錯誤處理表、邊界情境），套件也已安裝好（express、cors、dotenv、jsonwebtoken、bcrypt、swagger-jsdoc、swagger-ui-express、@scalar/express-api-reference、vitest），但 `src/` 下多數子資料夾、`tests/`、`docs/openapi/` 全部是空的，尚未撰寫任何一行商業邏輯或路由（僅有 `health` 相關檔案）。

本計畫的目的是把 `docs/plan.md` 的規格逐步落地成可執行、可測試的 Express API server，**並且用手把手、逐步教學的方式帶你完成資料庫的部分**——因為你是 SQL 初學者，這次的一大目標是紮實練習手寫真實 SQL。

**與使用者確認的關鍵決策（經多輪討論定案）：**

- **不使用 Prisma、不使用任何 ORM/query builder（Knex 等）**：目標是直接手寫 SQL，親眼看到、親手寫出每一條查詢，而不是透過 ORM 生成的程式碼學習。
- **不使用 SQLite**：原本考慮過「本地 SQLite + 正式環境 PostgreSQL」的組合，但這樣要維護兩種資料庫方言（不同的參數寫法、不同的自動遞增語法、不同的日期函式），對初學者是額外負擔且容易搞混。
- **全程只用一種資料庫方言：PostgreSQL**。不管是本地開發還是正式環境，SQL 語法都是同一套 PostgreSQL 語法，差別只在「連到哪一個 PostgreSQL」。這樣你只需要學一套 SQL 語法，而且練的就是業界最常用的正式資料庫語法，不是「練習用」的簡化版。
- **本地開發預設用 PGlite（免安裝、免 Docker）**：`@electric-sql/pglite` 是把真正的 PostgreSQL 編譯成 WASM、直接內嵌執行在你的 Node.js 專案裡的套件——SQL 語法跟正式的 PostgreSQL 完全一樣，但不用另外安裝資料庫軟體、也不用啟動 Docker，`npm install` 完就能用。別人下載這個專案後，`npm install` → `npm run db:migrate` → `npm run dev` 就能直接動，不會被「要先裝 Docker」卡住。
- **想更貼近正式環境，可以隨時切換成 Docker 裡的真正 PostgreSQL**：`src/database/db.js` 的判斷邏輯很單純——`.env.*` 有沒有設定 `DATABASE_URL`。沒設定就用 PGlite；設定了，就改用 `pg`（node-postgres）連過去，不管那個網址指向的是本地 Docker 容器還是遠端/正式資料庫。本地想練「真的資料庫服務」的操作手感（例如用 `psql` 連進去下指令），只要在 `.env.development` 填上 Docker 容器的連線字串即可切換，`schema.sql`、repository 的 SQL 完全不用改。
- **`npm run dev`（本地開發）與 `npm start`（正式環境）要能明確切換連線目標**，避免你在本地測試時不小心操作到正式資料庫、把正式資料弄壞。做法是搭配不同的環境變數檔（`.env.development`/`.env.production`），並在啟動、以及任何「會改資料庫結構或資料」的指令執行時，清楚印出目前連到哪個資料庫。
- **開發順序**：依技術層次「由下往上」進行 — 先做共用基礎元件（資料庫、工具函式、錯誤處理、認證中介層），再依此堆疊 repository → service → controller → route，最後補上 API 文件與測試。

---

## 名詞快速對照（給初學者）

在開始之前，先講幾個接下來會一直用到的詞：

| 名詞 | 白話說明 |
|---|---|
| **PostgreSQL（簡稱 Postgres）** | 一種關聯式資料庫軟體，跟 MySQL、SQLite 是同類東西，差別在語法細節與功能。這次專案全程只用它。 |
| **Docker / 容器（container）** | 把一整套軟體（這裡是 PostgreSQL）連同它需要的環境打包成一個「隔離的小盒子」，在你電腦裡獨立運作，不會跟電腦上其他軟體互相干擾。你可以把容器想成「隨時可以整個刪掉重建」的迷你虛擬機。 |
| **image（映像檔）** | 容器的「安裝光碟/範本」，例如 `postgres:16-alpine` 就是官方做好的「一啟動就是一個裝好 PostgreSQL 16 版的環境」範本。 |
| **volume（資料卷）** | 容器本身關掉、刪除之後資料通常會不見，所以要把資料庫實際存資料的地方「掛」到你電腦硬碟上的一個獨立空間，這個空間就叫 volume。只要 volume 還在，容器重開資料還在。 |
| **port mapping（連接埠對應）** | 容器內部運作在某個 port（PostgreSQL 預設是 5432），但外面（你的電腦、你的 Node.js 程式）要透過「電腦上的某個 port」連進去，這個「電腦 port → 容器內部 port」的對應關係就是 port mapping。 |
| **DDL（Data Definition Language）** | 「定義資料表長什麼樣子」的 SQL 語句，像 `CREATE TABLE`、`ALTER TABLE`，跟「查詢/新增/修改資料」的 SQL（`SELECT`/`INSERT`/`UPDATE`）是不同類別。`schema.sql` 裡寫的就是 DDL。 |
| **連線池（connection pool）** | 每次跟資料庫溝通都要先「連線」，連線的建立有成本。連線池就是預先建立好一批連線放著重複使用，而不是每次查詢都重新連一次，是 Node.js 操作資料庫的標準做法。 |
| **參數化查詢（parameterized query）** | SQL 語句裡不要直接把使用者輸入的字串拼進去（會有 SQL injection 資安風險），而是用 `$1`、`$2` 這種佔位符，把實際值另外傳給資料庫 driver，由它安全地代入。 |
| **PGlite** | 把真正的 PostgreSQL 編譯成 WASM、可以直接內嵌在 Node.js 專案裡執行的套件（`@electric-sql/pglite`）。SQL 語法跟正式的 PostgreSQL 完全相同，但不用另外安裝資料庫軟體、也不用啟動 Docker，資料存在專案資料夾裡的一個目錄。本次專案本地開發預設用它。 |

---

## 資料夾/檔案配置

```
prompt-alchemy-server/
├── docker-compose.yml                 # 本地 PostgreSQL 容器定義（可選，切換到 Docker 才需要）
├── .env.development                    # 預設 DATABASE_URL 留白（走 PGlite），可切換連本地 Docker 容器（進版控，無真實密碼）
├── .env.test                           # 同上，預設走獨立的 PGlite 測試資料（進版控）
├── .env.production.example             # 正式環境變數範本（進版控，不含真實值）
├── .env.production                     # 正式環境真實連線資訊（.gitignore 排除，不進版控）
├── .pglite-data/                       # 本地內嵌 PGlite 的資料檔（執行 db:migrate 後自動產生，.gitignore 排除）
│
├── src/
│   ├── config/
│   │   ├── env.js                       # 依 NODE_ENV 載入對應 .env.* 檔，集中讀取環境變數
│   │   └── swagger.js                   # swagger-jsdoc definition + apis glob
│   │
│   ├── utils/
│   │   ├── AppError.js                  # class AppError extends Error(message, statusCode)
│   │   ├── asyncHandler.js              # 包裝 async controller，自動 next(err)
│   │   ├── password.js                  # hashPassword / comparePassword（包 bcrypt）
│   │   └── jwt.js                       # signToken / verifyToken（包 jsonwebtoken）
│   │
│   ├── middlewares/
│   │   ├── authenticate.js              # 解析並驗證 JWT，設定 req.user
│   │   ├── authorize.js                 # authorize(...roles) 角色檢查
│   │   └── errorHandler.js              # 集中式錯誤處理（4 參數 middleware，掛在最後）
│   │
│   ├── database/
│   │   ├── db.js                        # 統一的 query(text, params)：無 DATABASE_URL 用內嵌 PGlite，有則用 pg.Pool
│   │   ├── schema.sql                   # users/categories/skill_items/favorites 手寫 DDL
│   │   ├── migrate.js                   # 手動套用 schema.sql（npm run db:migrate）
│   │   ├── seed.js                      # 初始資料（admin/member 帳號、範例 category/skill）
│   │   └── repositories/
│   │       ├── user.repository.js           # + findByEmail
│   │       ├── category.repository.js       # + hasRelatedSkills(categoryId)
│   │       ├── skillItem.repository.js      # + search({keyword, categoryId})
│   │       ├── favorite.repository.js       # 複合鍵(userId+skillId) + existsFavorite/findByUser
│   │       └── index.js                     # 匯出各 repository singleton + resetForTests()
│   │
│   ├── services/
│   │   ├── auth.service.js              # login / getMe
│   │   ├── category.service.js          # 前台/後台共用：list / create / update / delete（含關聯檢查）
│   │   ├── skill.service.js             # list(keyword,categoryId) / getById / create / update / delete
│   │   └── favorite.service.js          # add / remove / listMine（含重複收藏防呆）
│   │
│   ├── controllers/
│   │   ├── health.controller.js
│   │   ├── auth.controller.js
│   │   ├── category.controller.js       # 前台 GET
│   │   ├── skill.controller.js          # 前台 GET
│   │   ├── favorite.controller.js
│   │   └── admin/
│   │       ├── category.controller.js   # 後台 CUD
│   │       └── skill.controller.js      # 後台 CUD
│   │
│   └── routes/
│       ├── health.routes.js
│       ├── auth.routes.js
│       ├── category.routes.js
│       ├── skill.routes.js
│       ├── favorite.routes.js
│       ├── admin/
│       │   ├── category.routes.js
│       │   └── skill.routes.js
│       └── index.js                     # 彙整所有 router，掛 URL prefix
│
├── app.js           # 組裝 express app（middleware/routes/docs/errorHandler），export app，不呼叫 listen
├── server.js        # require('./config/env') → require('./app') → app.listen(PORT)
│
├── docs/openapi/
│   └── components.yaml   # 共用 schema（User/Category/SkillItem/Favorite/ErrorResponse）+ bearerAuth 定義
│
└── tests/
    ├── unit/
    │   ├── utils/{password,jwt}.test.js
    │   ├── repositories/{category,skillItem,favorite}.repository.test.js
    │   └── services/{auth,category,skill,favorite}.service.test.js
    ├── integration/
    │   ├── health.test.js
    │   ├── auth.test.js
    │   ├── categories.test.js
    │   ├── skills.test.js
    │   ├── favorites.test.js
    │   └── admin.test.js
    └── helpers/
        ├── buildTestApp.js    # require app + repositories.resetForTests()
        └── authHelpers.js     # 直接呼叫 utils/jwt 產生測試用 admin/member token
```

## 關鍵設計

**認證方式**：Authorization Header 的 Bearer JWT（無 cookie）。登入回傳 `{ token, user }`。`authenticate` middleware 驗證 token 並查 user 是否仍存在 → 設 `req.user`；`authorize(...roles)` 檢查角色。密碼錯誤與帳號不存在回傳**同一則**訊息（「帳號或密碼錯誤」），符合 PRD 邊界情境「不透露帳號是否存在」。登出因採 stateless JWT，MVP 僅驗證已登入後回 200，不做 token 黑名單。

**錯誤處理**：統一用 `utils/AppError.js`（`throw new AppError(message, statusCode)`），所有 controller 用 `asyncHandler` 包裝捕捉例外，最終由 `middlewares/errorHandler.js` 依照 `docs/plan.md` 第八節的狀態碼/訊息表輸出 `{ message }`；非 AppError 的未知例外一律回 500「系統發生錯誤，請稍後再試」。

**Repository 模式**：每個資源 repository 都呼叫 `src/database/db.js` 統一提供的 `query(text, params)`，用**參數化 SQL**（`$1,$2...` 佔位符）實作查詢與寫入，並擴充查詢方法（如搜尋、關聯檢查、複合鍵防重複）。Service 層只依賴 repository 介面，完全不知道底層是 PGlite 還是真正的 PostgreSQL。`db.js` 內部依 `DATABASE_URL` 是否設定，決定要用內嵌的 PGlite 還是 `pg.Pool` 連線池，這個判斷對 repository 完全透明——repository 永遠只呼叫同一個 `query()`。（`db.js` 另外還提供一個 `exec(sql)`，只有 `migrate.js` 套用整份 `schema.sql` 時會用到，repository 不會用到它，兩者差異見步驟 5 的說明。）

不管底層是 PGlite 還是 `pg`，`query()` 都是**非同步（Promise-based）API**，所以：
- 四個 repository 的每個方法都要宣告成 `async function`，內部用 `await query(...)`。
- service 層呼叫 repository 要 `await`；controller 呼叫 service 也要 `await`（既有的 `asyncHandler` 已經會自動 catch 住 async 函式拋出的錯誤並呼叫 `next(err)`，這部分不用額外處理）。

**資料庫欄位命名（snake_case）**：資料庫裡的欄位名一律用 `snake_case`（例如 `category_id`、`password_hash`），跟 PRD 用的 `camelCase`（`categoryId`、`passwordHash`）不同。這是刻意的：PostgreSQL 對「沒有加雙引號的識別字」會自動全部轉小寫，如果欄位名故意寫成 `categoryId`，每次查詢都要加雙引號變成 `"categoryId"` 才不會被吃掉，很容易漏加而出錯。所以資料庫層乾脆用 Postgres 的慣例 `snake_case`，JS 這邊的 `camelCase` 轉換交給 repository 內的一個小函式（例如 `mapRow(row)`）負責，兩層命名的界線很清楚。

**API 文件**：`swagger-jsdoc` 掃描各 route 檔的 `@swagger` JSDoc 註解產生同一份 OpenAPI spec，`swagger-ui-express` 掛 `/docs`、`@scalar/express-api-reference` 掛 `/reference`，並提供 `/openapi.json` 原始規格路由。

**測試**：Vitest。Unit tests 針對 utils/repositories/services 純邏輯測試；Integration tests 用 **supertest**（需新增為 devDependency）對 `app.js` 發真實 HTTP request，驗證完整 middleware chain（含 401/403/400/404/409/500）。測試預設連線的是**獨立的一份 PGlite 資料**（存在 `.pglite-data/test`，跟開發用的 `.pglite-data/development` 分開，`NODE_ENV=test` 會自動切到這份），如果 `.env.test` 有設定 `DATABASE_URL` 才會改連 Docker 容器裡的 `prompt_alchemy_test` 資料庫。`repositories/index.js` 提供 `resetForTests()`（執行 `TRUNCATE TABLE ... RESTART IDENTITY CASCADE` 清空四張表），每個 integration test 的 `beforeEach` 呼叫以隔離測試資料。**注意**：跑測試前要先對測試環境套用過一次 `schema.sql`（`NODE_ENV=test npm run db:migrate`）；如果改用 Docker 路徑，還要先確保本地容器已啟動。

## 端點對應表

`docs/FRONTEND_API_SPEC.md`（2026-07-18）併入本文件時，**同一個 Method + Path 若在下方 MVP 表已存在，一律以 MVP 表的定義為準、不覆蓋**（例如 `POST /auth/login`、`POST /auth/logout`、`GET /auth/me`、`POST /admin/skills`、`DELETE /admin/skills/:id`）；只有 MVP 表沒有的路由才併入下方「加分功能」表，作為 MVP 完成後的延伸範圍。加分功能的完整請求/回應範例請直接參考 `docs/FRONTEND_API_SPEC.md`，此處只列路由與分層對應。

### MVP 功能（原有路由，維持不變）

| Method | Path | 權限 | Controller | Service |
|---|---|---|---|---|
| GET | /health | 公開 | health.controller | — |
| POST | /auth/login | 公開 | auth.controller#login | auth.service#login |
| POST | /auth/logout | 已登入 | auth.controller#logout | — |
| GET | /auth/me | 已登入 | auth.controller#me | auth.service#getMe |
| GET | /categories | 已登入 | category.controller#list | category.service#listCategories |
| GET | /skills | 已登入 | skill.controller#list | skill.service#listSkills |
| GET | /skills/:id | 已登入 | skill.controller#getById | skill.service#getSkillById |
| POST /DELETE | /favorites/:skillId | member | favorite.controller | favorite.service#add/remove |
| GET | /me/favorites | member | favorite.controller#listMine | favorite.service#listMyFavorites |
| POST/PATCH/DELETE | /admin/categories(/:id) | admin | admin/category.controller | category.service |
| POST/PATCH/DELETE | /admin/skills(/:id) | admin | admin/skill.controller | skill.service |

### 加分功能（新增自 `docs/FRONTEND_API_SPEC.md`，路由與 MVP 表不重複）

| Method | Path | 權限 | Controller | Service |
|---|---|---|---|---|
| POST | /auth/register | 公開 | auth.controller#register | auth.service#register |
| GET | /prompts | 公開 | prompt.controller#list | prompt.service#listPrompts |
| GET | /prompts/:id | 公開 | prompt.controller#getById | prompt.service#getPromptById |
| POST | /prompts/:id/copy | 公開 | prompt.controller#copy | prompt.service#incrementCopyCount |
| GET | /favorites | member | favorite.controller#listIds | favorite.service#listFavoriteIds |
| POST | /favorites/toggle | member | favorite.controller#toggle | favorite.service#toggleFavorite |
| GET | /utility/categories | 公開 | utility.controller#listCategories | category.service#listCategories |
| GET | /utility/tags | 公開 | utility.controller#listTags | tag.service#listTags |
| GET | /admin/skills | admin | admin/skill.controller#list | skill.service#listAdmin |
| PUT | /admin/skills/:id | admin | admin/skill.controller#update | skill.service#updateSkill |
| PATCH | /admin/skills/:id/active | admin | admin/skill.controller#toggleActive | skill.service#toggleActive |
| GET | /admin/parameters | admin | admin/parameter.controller#list | parameter.service#listParameters |
| POST | /admin/parameters | admin | admin/parameter.controller#create | parameter.service#createParameter |
| PUT | /admin/parameters/:id | admin | admin/parameter.controller#update | parameter.service#updateParameter |
| PATCH | /admin/parameters/:id/active | admin | admin/parameter.controller#toggleActive | parameter.service#toggleActive |
| DELETE | /admin/parameters/:id | admin | admin/parameter.controller#remove | parameter.service#removeParameter |
| GET | /admin/users | admin | admin/user.controller#list | user.service#listUsers |
| POST | /admin/users | admin | admin/user.controller#create | user.service#createUser |
| PUT | /admin/users/:id | admin | admin/user.controller#update | user.service#updateUser |
| PATCH | /admin/users/:id/active | admin | admin/user.controller#toggleActive | user.service#toggleActive |
| DELETE | /admin/users/:id | admin | admin/user.controller#remove | user.service#removeUser |

---

## 開發步驟：第一階段 — 資料庫（手把手逐步教學）

這一階段的目標是：從零開始，一步一步把「可用的 PostgreSQL 資料庫」與「連得到它的程式碼」搭起來。**預設完全不需要 Docker**——本地開發用內嵌的 PGlite（`npm install` 完就能用），日後想切換成 Docker 容器裡的真正 PostgreSQL、或正式環境的遠端 PostgreSQL，只要改 `.env.*` 裡的 `DATABASE_URL` 一個設定，`schema.sql`、`db.js`、之後的 repository 都不用改一行。三種情境的切換方式整理在本階段最後的〈附錄〉。每一步都會告訴你**要打什麼指令**、**應該看到什麼結果**、**為什麼要這樣做**。

### 步驟 1：規劃環境變數檔

在專案根目錄新增以下檔案（`.env.development`、`.env.test` 直接進版控，內容都是本機測試用的假密碼，沒有洩漏風險；`.env.production` 則不進版控）：

```bash
# .env.development
NODE_ENV=development
PORT=3000
JWT_SECRET=dev-only-secret-change-me
# DATABASE_URL 留空 → db.js 會改用內嵌的 PGlite（存在 .pglite-data/development），免裝 Docker
# 想改連本地 Docker PostgreSQL，先看本階段最後的附錄，再取消下面這行註解：
# DATABASE_URL=postgres://prompt_alchemy:prompt_alchemy@localhost:5433/prompt_alchemy_dev
```

```bash
# .env.test
NODE_ENV=test
PORT=3001
JWT_SECRET=test-secret
# 同樣留空 → 用獨立的 .pglite-data/test，不會跟 development 的資料打架
# DATABASE_URL=postgres://prompt_alchemy:prompt_alchemy@localhost:5433/prompt_alchemy_test
```

```bash
# .env.production.example（範本，之後複製成 .env.production 並填入真實值）
NODE_ENV=production
PORT=
JWT_SECRET=
DATABASE_URL=postgres://<user>:<password>@<host>:<port>/<database>?sslmode=require
```

確認 `.gitignore` 裡有 `.env.production` 這一行（避免正式環境的真實帳密不小心被 commit 進版控），另外加上 `/.pglite-data/`（本地內嵌資料庫的資料檔，不需要進版控，每個人電腦上自己產生）。

`DATABASE_URL` 的格式解釋：`postgres://帳號:密碼@主機:port/資料庫名稱`。正式環境一定要設定；本地開發／測試留空即可，代表「不連外部 PostgreSQL，改用內嵌的 PGlite」。

### 步驟 2：改寫 `src/config/env.js`（依環境載入對應設定）

```js
const path = require('path');

const NODE_ENV = process.env.NODE_ENV || 'development';

require('dotenv').config({
  path: path.resolve(__dirname, '../../', `.env.${NODE_ENV}`),
});

module.exports = {
  nodeEnv: NODE_ENV,
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET,
  databaseUrl: process.env.DATABASE_URL,
};
```

說明：`NODE_ENV` 決定要讀哪一份 `.env.*` 檔——之後 `npm run dev` 會設定 `NODE_ENV=development`，`npm start` 會設定 `NODE_ENV=production`，`npm test` 會設定 `NODE_ENV=test`，藉此自動切換連到哪個資料庫，不需要每次手動改設定檔。`databaseUrl` 允許是 `undefined`（`.env.development`/`.env.test` 預設沒設定這個值），`db.js` 會依照它有沒有值來決定用哪種後端。

驗證這一步：

```bash
node -e "console.log(require('./src/config/env'))"
```

應該印出 `{ nodeEnv: 'development', port: 3000, jwtSecret: 'dev-only-secret-change-me', databaseUrl: undefined }`。

### 步驟 3：安裝套件

```bash
npm install pg @electric-sql/pglite
```

- `pg`（node-postgres）：Node.js 官方推薦、社群最主流的 PostgreSQL driver，連 Docker 容器或遠端/正式 PostgreSQL 時使用。
- `@electric-sql/pglite`：本地開發預設用的內嵌 PostgreSQL（WASM 版），免安裝、免啟動額外服務。

兩個套件都裝，讓 `db.js` 可以依 `DATABASE_URL` 動態決定要用哪一個。

### 步驟 4：撰寫 `src/database/schema.sql`（手寫 DDL，這是本次練 SQL 的重點）

```sql
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS skill_items (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  content TEXT NOT NULL,
  use_case TEXT,
  example_input TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_skill_items_category_id ON skill_items(category_id);

CREATE TABLE IF NOT EXISTS favorites (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skill_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, skill_id)
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_skill_items_updated_at ON skill_items;
CREATE TRIGGER trg_skill_items_updated_at
BEFORE UPDATE ON skill_items
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
```

逐段解釋（這是這次最值得花時間搞懂的部分）：

- **`CREATE TABLE IF NOT EXISTS`**：建立資料表；`IF NOT EXISTS` 讓這段 SQL 可以重複執行不會報錯（表已存在就跳過），這樣的寫法叫 **idempotent（冪等）**，之後不管執行幾次 `schema.sql` 都是安全的。
- **`id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY`**：`id` 欄位是整數、自動遞增（每新增一筆資料自動 +1）、且是這張表的主鍵（不能重複、不能是空值）。`GENERATED ALWAYS AS IDENTITY` 是比較新、比較嚴謹的自動遞增寫法（SQL 標準寫法），比舊式的 `SERIAL` 更推薦用在新專案。
- **`TEXT NOT NULL`**：文字欄位，且不可以是空值。
- **`UNIQUE`**（`users.email`）：這個欄位的值在整張表裡不能重複，兩個使用者不能註冊同一個 email。
- **`CHECK (role IN ('member', 'admin'))`**：資料庫層的防呆，`role` 這個欄位只允許存 `'member'` 或 `'admin'` 這兩個值，插入其他值資料庫會直接拒絕（報錯），這是「資料庫幫你擋住錯誤資料」的例子。
- **`REFERENCES categories(id)`**（外鍵，foreign key）：`skill_items.category_id` 這個欄位的值，必須是 `categories` 表裡真實存在的 `id`，不能亂填一個不存在的類別編號。這叫「參照完整性」。
- **`ON DELETE RESTRICT`**：如果有人想刪除一筆 `categories`，但這個類別底下還有 `skill_items` 在參照它，資料庫會直接拒絕刪除（報錯），對應 PRD 的規則「管理者刪除已有資料的類別要被阻擋」。
- **`ON DELETE CASCADE`**（`favorites` 的兩個外鍵）：如果對應的 `users` 或 `skill_items` 被刪除，這筆收藏紀錄會被資料庫自動一併刪除，不會留下「指向不存在資料」的孤兒紀錄。
- **`TEXT[]`**：PostgreSQL 特有的「陣列型別」，`tags` 欄位直接存一串文字（例如 `{'文案','行銷'}`），不用像其他資料庫那樣把陣列硬轉成一串用逗號分隔的字串。
- **`TIMESTAMPTZ NOT NULL DEFAULT now()`**：帶時區的時間戳記，`DEFAULT now()` 代表新增資料時如果沒指定這個欄位，資料庫會自動填入「現在的時間」。
- **`PRIMARY KEY (user_id, skill_id)`**（`favorites`）：這叫「複合主鍵」，代表「同一個 `user_id` + `skill_id` 的組合」在整張表裡只能出現一次，天然防止「同一個人重複收藏同一筆資料」，不用額外寫程式碼判斷。
- **最後的 `FUNCTION` + `TRIGGER`**：這是 PostgreSQL 特有、也是很值得學的語法。`CREATE OR REPLACE FUNCTION set_updated_at()` 定義了一個「小程式」，內容是「把這筆資料的 `updated_at` 欄位設成現在時間」；`NEW` 代表「即將被寫入的這筆新資料」。`CREATE TRIGGER ... BEFORE UPDATE ON skill_items ... EXECUTE FUNCTION set_updated_at()` 則是告訴資料庫：「每次有人要 `UPDATE` `skill_items` 這張表的任何一筆資料之前，先自動跑一次 `set_updated_at()` 這個函式」。效果是：之後你寫 `UPDATE skill_items SET ...` 的時候完全不用手動去設定 `updated_at`，資料庫會自動幫你補上，不會有人忘記更新的問題。

### 步驟 5：撰寫 `src/database/db.js`（依 `DATABASE_URL` 自動切換 PGlite / 真正的 PostgreSQL）

```js
const path = require('path');
const { databaseUrl, nodeEnv } = require('../config/env');

function maskPassword(url) {
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = '****';
    return parsed.toString();
  } catch {
    return '(無法解析 DATABASE_URL)';
  }
}

let backendPromise;

async function createBackend() {
  if (databaseUrl) {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: databaseUrl });
    pool.on('error', (err) => {
      console.error('[DB] 閒置連線發生未預期錯誤', err);
    });
    console.log(`[DB] NODE_ENV=${nodeEnv} → 連線目標 ${maskPassword(databaseUrl)}`);
    return {
      query: (text, params) => pool.query(text, params),
      exec: (sql) => pool.query(sql),
    };
  }

  const fs = require('fs');
  const { PGlite } = require('@electric-sql/pglite');
  const dataDir = path.resolve(__dirname, '../../.pglite-data', nodeEnv);
  fs.mkdirSync(dataDir, { recursive: true });
  const pglite = new PGlite(dataDir);
  console.log(`[DB] NODE_ENV=${nodeEnv} → 本地內嵌 PGlite（資料目錄 ${dataDir}）`);
  return {
    query: (text, params) => pglite.query(text, params),
    exec: (sql) => pglite.exec(sql),
  };
}

function getBackend() {
  if (!backendPromise) backendPromise = createBackend();
  return backendPromise;
}

async function query(text, params) {
  const backend = await getBackend();
  return backend.query(text, params);
}

async function exec(sql) {
  const backend = await getBackend();
  return backend.exec(sql);
}

module.exports = { query, exec };
```

說明：`db.js` 對外暴露兩個函式——`query(text, params)` 跟 `exec(sql)`，之後所有程式碼都只呼叫這兩個函式，完全不用管背後是 PGlite 還是真正的 PostgreSQL。**為什麼要分兩個**：`pg`（`pool.query`）不帶參數時可以一次執行「多條用分號隔開的 SQL」，但 **PGlite 的 `query()` 是 prepared statement 模式，一次只能接受單一條 SQL**，塞多條會直接報錯 `cannot insert multiple commands into a prepared statement`。PGlite 另外提供 `exec(sql)`，才是設計給「一次執行一大段、多條、不帶參數的 SQL」用的。所以：
- **`query(text, params)`**：給 repository 的單一條參數化查詢用（`SELECT`/`INSERT`/`UPDATE`/`DELETE` 這種帶 `$1,$2...` 的查詢）。
- **`exec(sql)`**：專門給「一次執行一大段、多條、不帶參數的 SQL」用，這次唯一的使用場景是 `migrate.js` 套用整份 `schema.sql`。

這是 `db.js` 裡兩種後端唯一需要分開處理的地方；判斷用哪個後端的邏輯本身還是很單純：`databaseUrl`（也就是 `.env.*` 裡的 `DATABASE_URL`）有沒有設定——有，就用 `pg.Pool` 連過去（不管網址指向本地 Docker 容器還是遠端/正式資料庫）；沒有，就在專案資料夾裡的 `.pglite-data/{nodeEnv}` 建立一個內嵌的 PGlite 資料庫（`fs.mkdirSync(dataDir, { recursive: true })` 確保這個資料夾在建立 PGlite 之前就存在，包含它的上層 `.pglite-data`，PGlite 本身不會自動連父目錄一起建）。`backendPromise` 讓這個判斷只在第一次呼叫 `query()`/`exec()` 時做一次（惰性初始化），之後重複使用同一個連線。`maskPassword` 沿用同樣的防呆邏輯：程式啟動後第一眼就能在終端機看到現在連到哪個資料庫，密碼會被遮蔽。

### 步驟 6：撰寫 `src/database/migrate.js`（套用 schema 的獨立指令）

```js
const fs = require('fs');
const path = require('path');
const { exec } = require('./db');
const { nodeEnv } = require('../config/env');

async function migrate() {
  if (nodeEnv === 'production' && process.env.CONFIRM_PRODUCTION !== 'yes') {
    console.error('拒絕執行：偵測到 NODE_ENV=production。若確定要對正式資料庫執行，請加上 CONFIRM_PRODUCTION=yes 重新執行。');
    process.exit(1);
  }

  const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  await exec(`BEGIN;\n${schemaSql}\nCOMMIT;`);
  console.log('[migrate] 完成');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('[migrate] 失敗', err);
  process.exit(1);
});
```

說明：這支腳本**故意不會**在 app 啟動（`server.js`）時自動執行，而是要你手動下指令才會套用 schema——避免正式環境每次重開機、重新部署，都對正式資料庫重跑一次 DDL（雖然這份 `schema.sql` 都寫成 `IF NOT EXISTS`、理論上重跑是安全的，但「明確、由人主動觸發」對正式資料庫來說還是比「自動悄悄執行」更放心）。這裡刻意呼叫 `exec()` 而不是 `query()`：這一步要一次執行「`BEGIN` + 整份 `schema.sql`（裡面可能好幾條 `CREATE TABLE`）+ `COMMIT`」，屬於多條指令接在一起，PGlite 的 `query()`（prepared statement 模式）不支援這樣做，只有 `exec()` 才能一次跑完多條、用分號隔開的 SQL。也因為沒辦法像操作單一 `client` 那樣分開下 `BEGIN`/`COMMIT`/`ROLLBACK`，改成把三段接成同一個字串、用同一次 `exec()` 呼叫執行——不管背後是 `pg` 還是 PGlite，同一次呼叫裡的多段 SQL 都會依序在同一個連線上執行，效果等同一個交易：中間任何一段失敗，這次呼叫就會丟出例外、整個交易不會被 `COMMIT`，資料庫端自動視為失敗撤銷，不需要額外手動 `ROLLBACK`。

`package.json` 新增：

```json
"scripts": {
  "db:migrate": "node src/database/migrate.js"
}
```

### 步驟 7：執行 migration，驗證資料表建立成功

```bash
npm run db:migrate
```

預期看到（預設 PGlite 路徑）：

```
[DB] NODE_ENV=development → 本地內嵌 PGlite（資料目錄 /your/project/path/.pglite-data/development）
[migrate] 完成
```

確認 `.pglite-data/development` 這個資料夾真的被建立出來了，代表 schema 已經套用進去。

同樣的方式，對測試環境也套用一次 schema（之後跑測試才有表可以用，會用到獨立的 `.pglite-data/test`）：

```bash
NODE_ENV=test npm run db:migrate
```

想更貼近正式環境、改連 Docker 容器裡的真正 PostgreSQL 來驗證，見本階段最後的〈附錄：切換到本地 Docker PostgreSQL〉。

### 步驟 8：撰寫 repository 層（`src/database/repositories/`）

每個 repository 都 `require('../db')` 拿共用的 `query`，方法都宣告成 `async`，用 `query(text, params)` 執行參數化 SQL。

`user.repository.js` 範例（其餘 repository 依此模式擴充）：

```js
const { query } = require('../db');

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at,
  };
}

async function create({ name, email, passwordHash, role }) {
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name, email, passwordHash, role]
  );
  return mapRow(rows[0]);
}

async function findByEmail(email) {
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
  return mapRow(rows[0]);
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
  return mapRow(rows[0]);
}

module.exports = { create, findByEmail, findById };
```

說明：`$1,$2,$3,$4` 是佔位符，實際的值透過第二個參數（陣列）傳給 `query`，由底層的 `pg`/PGlite 安全地代入，不會有 SQL injection 風險（**絕對不要**自己用字串拼接的方式組 SQL，例如 `'SELECT * FROM users WHERE email = ' + email` 這種寫法是危險的）。`RETURNING *` 是 PostgreSQL 特有語法，讓 `INSERT`/`UPDATE`/`DELETE` 執行完直接回傳被影響的那筆資料，不用另外再 `SELECT` 一次。

`favorite.repository.js` 的防重複收藏（複合鍵 + `ON CONFLICT`）：

```js
async function add(userId, skillId) {
  const { rows } = await query(
    `INSERT INTO favorites (user_id, skill_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, skill_id) DO NOTHING
     RETURNING *`,
    [userId, skillId]
  );
  return rows[0] ?? null; // null 代表本來就已經收藏過
}

async function existsFavorite(userId, skillId) {
  const { rows } = await query(
    'SELECT 1 FROM favorites WHERE user_id = $1 AND skill_id = $2',
    [userId, skillId]
  );
  return rows.length > 0;
}

async function findByUser(userId) {
  const { rows } = await query(
    `SELECT s.* FROM favorites f
     JOIN skill_items s ON s.id = f.skill_id
     WHERE f.user_id = $1
     ORDER BY f.created_at DESC`,
    [userId]
  );
  return rows; // 交由 skillItem.repository 的 mapRow 統一轉換
}

module.exports = { add, existsFavorite, findByUser };
```

`ON CONFLICT (user_id, skill_id) DO NOTHING` 說明：因為 `favorites` 的主鍵是 `(user_id, skill_id)` 這對組合，如果 `INSERT` 的組合已經存在，資料庫本來會直接報錯（違反主鍵限制），`ON CONFLICT ... DO NOTHING` 讓資料庫遇到這種衝突時「什麼都不做，也不報錯」，是資料庫層面原子性的防重複寫法，比「先查一次存不存在，再決定要不要新增」更安全（避免極端情況下兩個請求同時搶著新增造成的問題）。這裡搭配 `RETURNING *`：如果真的插入成功會回傳那筆資料，如果因為衝突被跳過則 `rows` 是空陣列——用這個結果就能判斷「是不是本來就收藏過」，交給 service 層決定要不要回 409 錯誤。

`skillItem.repository.js` 的關鍵字搜尋（`ILIKE` + 陣列查詢）：

```js
async function search({ keyword, categoryId } = {}) {
  const { rows } = await query(
    `SELECT * FROM skill_items
     WHERE ($1::text IS NULL OR
            title ILIKE '%' || $1 || '%' OR
            content ILIKE '%' || $1 || '%' OR
            EXISTS (SELECT 1 FROM unnest(tags) t WHERE t ILIKE '%' || $1 || '%'))
       AND ($2::int IS NULL OR category_id = $2)
     ORDER BY created_at DESC`,
    [keyword ?? null, categoryId ?? null]
  );
  return rows.map(mapRow);
}
```

說明：`ILIKE` 是 PostgreSQL 特有的「大小寫不敏感」的 `LIKE`（標準 SQL 的 `LIKE` 是大小寫敏感的），對使用者輸入的關鍵字搜尋更直覺，不用額外處理大小寫。`$1::text IS NULL OR ...` 這個寫法讓「關鍵字」變成可選條件：如果呼叫時 `keyword` 是 `null`，這個條件恆為真（等於沒有加這條件）；如果有值，才真的去比對。`unnest(tags)` 把陣列欄位「展開」成多筆資料一列一列比對，搭配 `EXISTS` 子查詢，判斷「標籤陣列裡有沒有任何一個標籤符合關鍵字」。

`category.repository.js` 的關聯檢查：

```js
async function hasRelatedSkills(categoryId) {
  const { rows } = await query(
    'SELECT EXISTS (SELECT 1 FROM skill_items WHERE category_id = $1) AS exists',
    [categoryId]
  );
  return rows[0].exists;
}
```

### 步驟 9：撰寫 `src/database/repositories/index.js`

```js
const { query } = require('../db');
const user = require('./user.repository');
const category = require('./category.repository');
const skillItem = require('./skillItem.repository');
const favorite = require('./favorite.repository');

async function resetForTests() {
  await query('TRUNCATE TABLE favorites, skill_items, categories, users RESTART IDENTITY CASCADE');
}

module.exports = { user, category, skillItem, favorite, resetForTests };
```

`TRUNCATE TABLE ... RESTART IDENTITY CASCADE` 說明：`TRUNCATE` 比 `DELETE FROM` 更快地清空整張表；一次列出四張表可以同時清空，不用擔心外鍵順序問題；`RESTART IDENTITY` 讓自動遞增的 `id` 重新從 1 開始算，這樣每次測試裡「新建的第一筆資料 id 一定是 1」，測試斷言會更好寫；`CASCADE` 讓有外鍵關聯的表也一併正確處理。

### 步驟 10：撰寫 `src/database/seed.js`（種子資料）

```js
const repositories = require('./repositories');
const { hashPassword } = require('../utils/password');

async function seed() {
  let admin = await repositories.user.findByEmail('admin@example.com');
  if (!admin) {
    admin = await repositories.user.create({
      name: '管理者',
      email: 'admin@example.com',
      passwordHash: await hashPassword('Admin1234'),
      role: 'admin',
    });
  }

  let member = await repositories.user.findByEmail('member@example.com');
  if (!member) {
    member = await repositories.user.create({
      name: '會員',
      email: 'member@example.com',
      passwordHash: await hashPassword('Member1234'),
      role: 'member',
    });
  }

  let categories = await repositories.category.list();
  let category = categories[0];
  if (!category) {
    category = await repositories.category.create({
      name: '文案撰寫',
      description: '行銷文案、社群貼文相關 Prompt',
    });
  }

  const existing = await repositories.skillItem.search({ categoryId: category.id });
  if (existing.length === 0) {
    await repositories.skillItem.create({
      title: '產品介紹文案產生器',
      categoryId: category.id,
      tags: ['文案', '行銷'],
      content: '請幫我針對以下產品撰寫一段吸引人的介紹文案：{product}',
      useCase: '新產品上市、活動宣傳',
      exampleInput: '無線藍牙耳機',
    });
  }

  console.log('[seed] 完成');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[seed] 失敗', err);
  process.exit(1);
});
```

每個資源都是「先查是否已存在 → 不存在才新增」，這叫 idempotent（冪等），重複執行 `npm run seed` 不會產生重複資料。`package.json` 新增：

```json
"scripts": {
  "seed": "node src/database/seed.js"
}
```

執行並驗證：

```bash
npm run seed
```

應該印出 `[seed] 完成`。想直接查看資料有沒有寫進去，PGlite 沒有 `psql` 那種互動工具，最簡單的方式是在 repository 或一支小腳本裡 `console.log(await repositories.user.findByEmail('admin@example.com'))` 確認查得到；如果已切換成 Docker PostgreSQL，則可以用〈附錄〉裡的 `psql` 指令直接查。

### 步驟 11：整理 `package.json` scripts

到這一步為止，`package.json` 應該累積了以下 scripts：

```json
"scripts": {
  "dev": "NODE_ENV=development node --watch server.js",
  "start": "NODE_ENV=production node server.js",
  "db:migrate": "node src/database/migrate.js",
  "seed": "node src/database/seed.js",
  "db:reset:local": "node -e \"require('fs').rmSync('.pglite-data',{recursive:true,force:true})\" && npm run db:migrate"
}
```

- `dev`/`start` 讓 `npm run dev`（本地開發）與 `npm start`（正式環境）分別帶對應的 `NODE_ENV`，`env.js` 才會載入正確的 `.env.*` 檔。
- `db:reset:local` 是 PGlite 路徑的「清空重來」：用 Node 內建的 `fs.rmSync` 砍掉 `.pglite-data` 整個資料夾（跨平台，不依賴 shell 的 `rm`），再重新 `db:migrate`。
- Docker 路徑另外還有 `db:up`/`db:down`/`db:logs`/`db:reset`，見下方附錄。

### 第一階段完成檢查清單

- [ ] `npm install` 後，`npm run db:migrate` 成功、看到 `.pglite-data/development` 資料夾被建立
- [ ] `NODE_ENV=test npm run db:migrate` 也成功，建出獨立的 `.pglite-data/test`
- [ ] `npm run seed` 成功
- [ ] `npm run dev` 能啟動伺服器，`GET /health` 回應正常
- [ ]（可選）照〈附錄：切換到本地 Docker PostgreSQL〉操作一次，確認能改連真正的 PostgreSQL、`\dt` 看到四張表

---

## 附錄：切換到本地 Docker PostgreSQL（可選，想練習真實資料庫服務操作再做）

前面幾步用 PGlite 是為了讓專案免安裝就能跑；如果你想額外練習「啟動/連線一個真正的資料庫服務」的操作手感（例如用 `psql` 連進去下指令），可以照這裡的步驟切換。**這一段不影響任何 SQL 語法或 repository 程式碼**，純粹是換一個 `db.js` 會去連的目標。

### 附錄步驟 1：確認 Docker 已安裝

```bash
docker --version
docker compose version
```

兩個指令都要能印出版本號，代表 Docker 已經可用。如果指令找不到，需要先安裝 Docker Desktop（Windows/Mac）或 Docker Engine（Linux）。

### 附錄步驟 2：撰寫 `docker-compose.yml`（定義本地資料庫容器）

在專案根目錄新增 `docker-compose.yml`：

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: prompt-alchemy-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: prompt_alchemy
      POSTGRES_PASSWORD: prompt_alchemy
      POSTGRES_DB: prompt_alchemy_dev
    ports:
      - '5433:5432'
    volumes:
      - prompt_alchemy_pg_data:/var/lib/postgresql/data
      - ./src/database/docker-init:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U prompt_alchemy']
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  prompt_alchemy_pg_data:
```

逐行說明：
- `image: postgres:16-alpine`：用官方 PostgreSQL 16 版的精簡映像檔，啟動容器就等於啟動一個裝好的 PostgreSQL。
- `environment`：容器啟動時，PostgreSQL 會用這三個環境變數自動建立一個帳號（`prompt_alchemy`/密碼 `prompt_alchemy`）與一個資料庫（`prompt_alchemy_dev`）。這只是本機開發用的帳密，不用設得多複雜。
- `ports: '5433:5432'`：左邊 `5433` 是你電腦上要用的 port，右邊 `5432` 是容器內部 PostgreSQL 實際監聽的 port。刻意選 `5433` 而不是預設的 `5432`，是為了避免你電腦如果剛好也裝過 PostgreSQL（常佔用 5432）發生衝突。
- `volumes` 第一行：把容器內部「真正存資料的資料夾」對應到一個叫 `prompt_alchemy_pg_data` 的 volume。這樣即使你之後 `docker compose down` 把容器整個關掉刪除，資料還在這個 volume 裡，下次 `docker compose up` 資料照樣還在（除非你刻意加 `-v` 才會連 volume 一起刪除）。
- `volumes` 第二行：讓容器**第一次啟動**時自動執行 `src/database/docker-init/` 資料夾裡的 SQL 檔，我們會用它來額外建立一個測試專用的資料庫（見下一步）。
- `healthcheck`：讓 Docker 定期檢查資料庫是否「真的準備好可以接受連線」，不只是「容器有在跑」而已。

再建立初始化用的資料夾與檔案：

```bash
mkdir -p src/database/docker-init
```

新增 `src/database/docker-init/01-create-test-db.sql`：

```sql
CREATE DATABASE prompt_alchemy_test;
```

這樣容器啟動時，除了 compose 檔裡指定的 `prompt_alchemy_dev`，還會多建立一個 `prompt_alchemy_test`，兩個資料庫共用同一個容器、同一組帳密，但資料完全獨立，之後測試不會動到開發資料。

### 附錄步驟 3：啟動本地資料庫容器，並把 `.env.*` 指過去

```bash
docker compose up -d
docker compose ps
```

應該看到 `prompt-alchemy-postgres` 這個服務，狀態欄位顯示 `running` 或 `healthy`。如果狀態一直不是 healthy，用 `docker compose logs postgres` 看容器的錯誤訊息。

接著在 `.env.development` 把原本註解掉的 `DATABASE_URL` 取消註解：

```bash
DATABASE_URL=postgres://prompt_alchemy:prompt_alchemy@localhost:5433/prompt_alchemy_dev
```

（`.env.test` 同樣取消註解、指向 `prompt_alchemy_test`）。之後重新執行 `npm run db:migrate`、`npm run dev`，`db.js` 就會改印出：

```
[DB] NODE_ENV=development → 連線目標 postgres://prompt_alchemy:****@localhost:5433/prompt_alchemy_dev
```

驗證資料表真的建好了：

```bash
docker exec -it prompt-alchemy-postgres psql -U prompt_alchemy -d prompt_alchemy_dev -c '\dt'
```

應該列出 `categories`、`users`、`skill_items`、`favorites` 四張表。也可以用 `psql` 互動模式直接下 SQL 玩玩看：

```bash
docker exec -it prompt-alchemy-postgres psql -U prompt_alchemy -d prompt_alchemy_dev
```

進去之後可以試著手打 `SELECT * FROM categories;`（此時應該是空的），或 `\d skill_items` 看某張表的完整欄位定義，`\q` 離開。這是熟悉 SQL 很好的練習環境。

之後要關掉容器（但保留資料）：`docker compose down`；要重新啟動：`docker compose up -d`。想改回免安裝的 PGlite，只要把 `.env.development`/`.env.test` 的 `DATABASE_URL` 重新註解掉即可，不用解除安裝任何東西。

### 附錄步驟 4：Docker 路徑的清空重來

```bash
docker compose down -v
docker compose up -d --wait
npm run db:migrate
npm run seed
```

逐行說明：
- `docker compose down -v`：`-v` 會連同 volume（`prompt_alchemy_pg_data`）一起刪除，等於把資料庫裡的資料全部清空，下次啟動會是全新的空資料庫。**只適合本地開發／測試資料庫**，正式環境資料庫絕對不能這樣做。
- `docker compose up -d --wait`：跟前面的 `docker compose up -d` 差別在多加 `--wait`，會等到 healthcheck 顯示 healthy 才把終端機還給你，避免容器還沒準備好就緊接著執行下一行 `db:migrate` 而連線失敗。

`package.json` 加上對應的 scripts：

```json
"scripts": {
  "db:up": "docker compose up -d",
  "db:down": "docker compose down",
  "db:logs": "docker compose logs -f postgres",
  "db:reset": "docker compose down -v && docker compose up -d --wait && npm run db:migrate && npm run seed"
}
```

## 附錄：切換到遠端／正式 PostgreSQL

跟切換到 Docker 完全一樣的邏輯：把 `.env.production`（複製自 `.env.production.example`，這個檔案不進版控）的 `DATABASE_URL` 填上真實的連線資訊：

```bash
DATABASE_URL=postgres://<user>:<password>@<host>:<port>/<database>?sslmode=require
```

執行 `npm start`（會自動帶 `NODE_ENV=production`）啟動伺服器；要對正式資料庫套用 schema，因為 `migrate.js` 有防呆機制，要明確加上 `CONFIRM_PRODUCTION=yes`：

```bash
CONFIRM_PRODUCTION=yes NODE_ENV=production npm run db:migrate
```

不加 `CONFIRM_PRODUCTION=yes` 直接對 `NODE_ENV=production` 執行 `db:migrate` 應該會被拒絕並印出錯誤訊息——這是刻意設計的防呆，避免手滑對正式資料庫誤跑 DDL。

---

## 開發步驟：第二階段 — 應用程式邏輯（延續原順序）

資料庫打好基礎後，接下來的開發順序不受影響，只是 service/controller 呼叫 repository 時要記得 `await`：

**認證/授權中介層**
1. `src/middlewares/authenticate.js`
2. `src/middlewares/authorize.js`

**共用工具**
3. `src/utils/AppError.js`
4. `src/utils/asyncHandler.js`
5. `src/utils/password.js`
6. `src/utils/jwt.js`
7. `src/middlewares/errorHandler.js`

**Service 層是什麼**：夾在 controller（處理 HTTP 請求/回應）跟 repository（處理資料庫存取）中間的一層，專門放**商業邏輯**（「這件事該怎麼做」的規則），跟兩邊都脫鉤。controller 只管解析 `req`、決定 status code、包 JSON 回應；repository 只管組 SQL、查資料庫；商業規則（例如「email 不能重複」「密碼要雜湊過才能存」「登入失敗要回統一訊息、不透露帳號是否存在」）都放在 service，就算之後同一段邏輯要被兩個不同 controller 共用（例如管理者後台也能建立會員），或想寫單元測試（不用真的發 HTTP 請求，直接呼叫 `authService.register(...)` 測），都不用重複寫或拆不開。以 `register` 為例：

```js
// auth.service.js —— 商業邏輯
async function register({ email, name, password }) {
  const foundUser = await findUserByEmail(email);
  if (foundUser) throw new AppError('email 已被使用', 400);
  const passwordHash = await bcrypt.hash(password, 10);
  return createUser({ email, name, passwordHash });
}

// auth.controller.js —— 只剩「接請求、回結果」
async function register(req, res, next) {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password) { /* ... */ }
    const createdUser = await authService.register({ email, name, password });
    res.status(201).json({ status: 'success', data: createdUser });
  } catch (error) { next(error); }
}
```

專案規模小、端點沒幾支的時候，邏輯全部寫在 controller 裡也不是錯，這一層是「以後邏輯變複雜、或想寫單元測試時」值得拆出來的，不是規則上一定要有。

**Service 層**
8. `src/services/auth.service.js`
9. `src/services/category.service.js`
10. `src/services/skill.service.js`
11. `src/services/favorite.service.js`

**Controller 層**
12-18. `src/controllers/{health,auth,category,skill,favorite}.controller.js`、`src/controllers/admin/{category,skill}.controller.js`

**Route 層與進入點**
19-23. `src/routes/{health,auth,category,skill,favorite}.routes.js`、`src/routes/admin/{category,skill}.routes.js`、`src/routes/index.js`
24. `app.js`（express instance、cors、json、routes、404、errorHandler，export app）
25. `server.js`（`dev`/`start` scripts 已經在第一階段步驟 11 加過，這裡不用重複加）
26. **手動驗證**：`npm run dev` 後測 `GET /health`、登入取得 token、帶 token 打前台/後台 API，並確認終端機印出的 `[DB]` 訊息（預設應該是 PGlite 那一行）。

**API 文件**
27. `docs/openapi/components.yaml`
28. `src/config/swagger.js`
29. 各 route 檔補 `@swagger` JSDoc（涵蓋所有成功與錯誤狀態碼）
30. `app.js` 掛載 `/openapi.json`、`/docs`、`/reference`，瀏覽器驗證兩份文件皆可用

**測試**
31. 新增 `supertest` devDependency
32. `tests/helpers/{buildTestApp,authHelpers}.js`
33. `tests/unit/utils/*.test.js`
34. `tests/unit/repositories/*.test.js`（連測試資料庫，記得 `beforeEach` 呼叫 `resetForTests()`）
35. `tests/unit/services/*.test.js`
36. `tests/integration/{health,auth}.test.js`
37. `tests/integration/{categories,skills}.test.js`
38. `tests/integration/favorites.test.js`
39. `tests/integration/admin.test.js`
40. `package.json`：
    ```json
    "scripts": {
      "test": "NODE_ENV=test vitest run"
    }
    ```
41. 執行 `npm test`（**先確認 test 環境已跑過 `NODE_ENV=test npm run db:migrate`**；預設用獨立的 `.pglite-data/test`，若 `.env.test` 已切換成 Docker 則要先確認本地容器已啟動），確認全數通過，涵蓋 PRD 第八節錯誤表與第九節邊界情境
42. 對照 `docs/plan.md` 第六節 API 規格表，逐一透過 `/docs` 或 `/reference` 手動驗證每支端點行為

## 驗證方式總覽

- 第一階段每完成一步都有對應的驗證方式（見上方各步驟）,可以邊做邊確認,不用累積到最後才發現問題。
- 第二階段完成到步驟 26 後：`npm run dev` 啟動伺服器,手動用 curl/Postman 依序測試：`GET /health` → `POST /auth/login`（admin/member 種子帳號）→ 帶 token 呼叫 `GET /categories`、`GET /skills`、`POST /favorites/:id` → 驗證權限錯誤情境（member 打 `/admin/*` 應 403、未帶 token 應 401）。
- 步驟 30 完成後：瀏覽器開 `http://localhost:{PORT}/docs` 與 `/reference`,確認兩份文件內容一致且可互動測試。
- 最終：`npm test` 全數通過,且測試案例覆蓋 `docs/plan.md` 第八節（錯誤處理）與第九節（邊界情境）列出的每一種情境。
- 正式環境部署前,額外驗證防呆機制：不帶 `CONFIRM_PRODUCTION=yes` 執行 `NODE_ENV=production npm run db:migrate` 應直接被拒絕執行。
