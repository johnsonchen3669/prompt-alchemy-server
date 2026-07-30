# Prompt 鍊金坊 Prompt Alchemy — Server

Prompt/Skill 收藏庫：會員登入前台瀏覽、搜尋、篩選、收藏 Prompt/Skill 資料；管理者登入後台管理類別與資料的後端 API server。

## 技術棧

- Express 5、cors、dotenv
- 認證：jsonwebtoken、bcrypt
- API 文件：`swagger-autogen`（掃描 `app.js` 的路由自動產生 OpenAPI 3.0 規格）+ `swagger-ui-express` + `@scalar/express-api-reference`
- 測試：Vitest 已安裝為 devDependency，`npm test` 對應 `vitest run`，但目前尚未撰寫任何測試檔
- 資料持久化：本地開發預設用內嵌的 **PGlite**（`@electric-sql/pglite`，免安裝、免啟動任何資料庫服務），也可以透過 `DATABASE_URL` 切換成真正的 PostgreSQL（本地 Docker 容器或遠端/正式環境），依 `NODE_ENV` 自動載入對應的 `.env.{NODE_ENV}` 檔。不使用 ORM，`src/database/schema.sql` 手寫 DDL，`src/database/repositories` 用參數化 SQL 查詢

## 專案資料夾架構

```
prompt-alchemy-server/
├── src/
│   ├── config/
│   │   ├── env.js                       # 依 NODE_ENV 載入對應 .env.{NODE_ENV} 檔，集中讀取環境變數（NODE_ENV、PORT、JWT_SECRET、DATABASE_URL）
│   │   ├── favorite.config.js           # DEFAULT_FAVORITE_SKILL_IDS：恢復預設收藏 / 註冊時自動建立的預設收藏清單
│   │   └── swagger.js                   # swagger-autogen 產生器：掃描 app.js 路由，輸出 docs/openapi/swagger-output.json
│   │
│   ├── middlewares/
│   │   └── authenticate.js              # vertfyToken：驗證 Authorization Bearer JWT，設定 req.user；isAdmin：檢查 req.user.role === 'admin'
│   │
│   ├── database/
│   │   ├── db.js                        # 統一的 query(text, params)/exec(sql)，依 DATABASE_URL 切換 PGlite / pg.Pool
│   │   ├── schema.sql                   # users、parameters、skill_item、favorite 四張表手寫 DDL（id 皆為 UUID，DEFAULT gen_random_uuid()）
│   │   ├── migrate.js                   # 套用 schema.sql（npm run dev:init）
│   │   ├── seed.js                      # 建立預設管理者/測試會員帳號、parameters 參數表與 Prompt/Skill 種子資料，已存在則略過（npm run dev:seed，冪等）
│   │   └── repositories/
│   │       ├── user.repository.js       # createUser / findUserByEmail / findUserById / getUsers / updateUser
│   │       ├── parameter.repository.js  # parameters 表的 CRUD 查詢
│   │       ├── prompt.repository.js     # skill_item 表的前台查詢 + 後台 CRUD 查詢
│   │       └── favorite.repository.js   # favorite 表的查詢/新增/刪除
│   │
│   ├── services/
│   │   ├── auth.service.js              # 註冊/登入/取得登入者業務邏輯（含註冊時建立預設收藏）
│   │   ├── favorite.service.js          # 收藏業務邏輯
│   │   ├── parameter.service.js         # 後台參數（分類/標籤/模型...）業務邏輯
│   │   ├── prompt.service.js            # Prompt/Skill 業務邏輯（含前台/後台共用的欄位轉換）
│   │   └── upload.service.js            # 檔案上傳至 GCP Bucket
│   │
│   ├── scripts/
│   │   └── updateAdmin.js               # 手動建立/重設管理者帳號密碼與 role 的一次性腳本
│   │
│   ├── tests/
│   │   └── read-favorites.js            # 手動執行的收藏資料檢查腳本（非 Vitest 測試檔）
│   │
│   ├── controllers/
│   │   ├── health.controller.js
│   │   ├── auth.controller.js           # register / login / logout / getUser
│   │   ├── utility.controller.js        # 檔案上傳（GCP Bucket）
│   │   ├── prompt.controller.js         # 前台 Prompt 列表 / 詳情 / 複製次數累加
│   │   ├── category.controller.js       # TODO：前台 category（尚未實作，空殼）
│   │   ├── favorite.controller.js       # 收藏功能：getMyFavorites / checkFavoriteStatus / toggleFavorite / clearMyFavorites / restoreDefaultFavorites
│   │   ├── skill.controller.js          # TODO：前台 skill（尚未實作，空殼；功能已由 prompt.controller 涵蓋，待確認是否仍需要）
│   │   └── admin/
│   │       ├── parameter.controller.js  # 後台參數管理（新增/修改/刪除）
│   │       ├── skill.controller.js      # 後台 Prompt/Skill 管理（列表/詳情/新增/修改）
│   │       ├── user.controller.js       # 後台會員管理（列表/修改）
│   │       └── category.controller.js   # TODO：尚未實作，空殼（分類已併入 admin/parameter 用 type=category 管理，這支可能會廢除）
│   │
│   └── routes/
│       ├── index.js                     # 統一掛載 /health、/auth、/utility、/prompts、/favorites、/admin/parameters、/admin/users、/admin/skills，app.js 只 require 這一個入口
│       ├── health.routes.js             # GET /
│       ├── auth.routes.js               # /register、/login、/logout（需登入）、/me（需登入）
│       ├── utility.routes.js            # POST /upload
│       ├── prompt.routes.js             # GET /、GET /:id、POST /:id/copy
│       ├── category.routes.js           # TODO：空殼，尚未掛載任何 endpoint，index.js 也還沒 use
│       ├── favorite.routes.js           # GET /、DELETE /、GET /:skillId/status、POST /:skillId/toggle、POST /defaults（皆需登入，router.use(vertfyToken)）
│       ├── skill.routes.js              # TODO：空殼，尚未掛載任何 endpoint，index.js 也還沒 use
│       └── admin/
│           ├── parameter.routes.js      # GET /、POST /、PUT /:id、DELETE /:id（皆需 admin）
│           ├── skill.routes.js          # GET /、POST /、GET /:id、PUT /:id（皆需 admin）
│           ├── user.routes.js           # GET /、PUT /:id（皆需 admin）
│           └── category.routes.js       # TODO：空殼，尚未掛載任何 endpoint，index.js 也還沒 use
│
├── app.js                   # 組裝 express app（cors/json/routes/API 文件），export app，不呼叫 listen
├── server.js                # require('./config/env') → require('./app') → app.listen(PORT)
├── .env.development         # 開發環境變數，.gitignore 排除，不進版控（需自行從 .env.example 複製建立）
├── .env.production          # 雲端/正式環境變數，含真實連線資訊，.gitignore 排除，不進版控（目前 repo 內尚未建立）
├── .env.example             # 環境變數範本（唯一進版控的 env 檔，不含真實值）
├── .pglite-data/            # 本地內嵌 PGlite 的資料檔（.gitignore 排除，執行 dev:init 後自動產生）
├── docker-compose.yml       # 可選：想切換成本地 Docker PostgreSQL 才需要，見下方說明
│
├── docs/
│   ├── plan.md                   # PRD（產品目標、角色權限、API 規格、錯誤處理、邊界情境）
│   ├── dev-plan.md               # 資料庫手把手實作教學 + 端點對應表（MVP / 加分功能分層）
│   ├── FRONTEND_API_SPEC.md      # 前端提供的完整 API 需求規格，加分功能的 request/response 範例以此為準
│   └── openapi/
│       ├── components.yaml       # 早期手寫的 schema 元件草稿，目前 swagger-autogen 沒有使用這份
│       └── swagger-output.json   # swagger-autogen 產生的 OpenAPI 3.0 文件快照（npm run swagger 重新產生）
│
└── package.json
```

> `health`、`auth`、前台 `prompts`、`favorites`、`utility/upload`、後台 `admin/parameters`、`admin/skills`、`admin/users` 已完成並掛載（部分端點還缺規格要求的動作，見下表打 ❌ 的列）。前台 `category`/`skill` 與後台 `admin/category` 目前只是空殼 route/controller，沒有任何 endpoint，`src/routes/index.js` 也還沒 `use` 這三支。

## API 路由

> 完成欄位：✅ 已實作並掛載、❌ 尚未實作（規格要求但目前打不通）。所有路徑都沒有 `/api` 前綴，直接掛在根路徑下。

### Health

| 完成 | 類型 | Method | Path | 權限 | 說明 |
|---|---|---|---|---|---|
| ✅ | MVP | GET | `/health` | 公開 | 確認服務存活狀態 |

### API 文件（app.js 直接掛載，非 src/routes）

| 完成 | 類型 | Method | Path | 權限 | 說明 |
|---|---|---|---|---|---|
| ✅ | - | GET | `/openapi.json` | 公開 | swagger-autogen 產生的 OpenAPI 3.0 規格 |
| ✅ | - | GET | `/docs` | 公開 | Swagger UI |
| ✅ | - | GET | `/scalar` | 公開 | Scalar API Reference |

> 目前所有已掛載的端點（含 `/favorites` 系列）都有 `#swagger` 註解並收錄在 `docs/openapi/swagger-output.json`。新增或改動路由後記得跑 `npm run swagger` 重新產生。

### Auth

| 完成 | 類型 | Method | Path | 權限 | 說明 |
|---|---|---|---|---|---|
| ✅ | MVP | POST | `/auth/login` | 公開 | 會員/管理者登入 |
| ✅ | MVP | POST | `/auth/logout` | 已登入 | 登出 |
| ✅ | MVP | GET | `/auth/me` | 已登入 | 取得目前登入者資訊 |
| ✅ | 加分 | POST | `/auth/register` | 公開 | 會員註冊 |

### 前台 Prompt/Skill

| 完成 | 類型 | Method | Path | 權限 | 說明 |
|---|---|---|---|---|---|
| ❌ | MVP | GET | `/categories` | 已登入 | 取得類別列表（`category.routes.js` 是空殼，index.js 也未掛載；目前只能用 `/admin/parameters?type=category`） |
| ❌ | MVP | GET | `/skills` | 已登入 | 取得列表，支援 `keyword`、`categoryId`（`skill.routes.js` 是空殼，index.js 也未掛載；功能暫由 `/prompts` 代替） |
| ❌ | MVP | GET | `/skills/:id` | 已登入 | 取得單筆詳情（同上，暫由 `/prompts/:id` 代替） |
| ✅ | 加分 | GET | `/prompts` | 公開 | 取得上架中的 Prompt 列表，支援 `category`、`tag`、`search` query |
| ✅ | 加分 | GET | `/prompts/:id` | 公開 | 取得單一 Prompt 詳細內容 |
| ✅ | 加分 | POST | `/prompts/:id/copy` | 公開 | 增加 Prompt 複製使用次數 |

### Favorites

| 完成 | 類型 | Method | Path | 權限 | 說明 |
|---|---|---|---|---|---|
| ✅ | 加分 | GET | `/favorites` | 已登入 | 取得我的收藏清單 |
| ✅ | 加分 | GET | `/favorites/:skillId/status` | 已登入 | 檢查單一 Skill 是否已收藏 |
| ✅ | 加分 | POST | `/favorites/:skillId/toggle` | 已登入 | 切換收藏狀態（新增/取消） |
| ✅ | 加分 | DELETE | `/favorites` | 已登入 | 清除我的所有收藏 |
| ✅ | 加分 | POST | `/favorites/defaults` | 已登入 | 恢復預設收藏 |

### Utility

| 完成 | 類型 | Method | Path | 權限 | 說明 |
|---|---|---|---|---|---|
| ✅ | 加分 | POST | `/utility/upload` | 公開 | 上傳檔案至 GCP Bucket（multipart/form-data，欄位名 `file`，上限 10MB） |
| ❌ | 加分 | GET | `/utility/categories` | 公開 | 取得分類選單列表 |
| ❌ | 加分 | GET | `/utility/tags` | 公開 | 取得標籤清單 |

### Admin Categories

| 完成 | 類型 | Method | Path | 權限 | 說明 |
|---|---|---|---|---|---|
| ❌ | MVP | POST | `/admin/categories` | admin | 新增類別（`admin/category.routes.js` 是空殼，index.js 也未掛載；改用 `POST /admin/parameters` 帶 `type=category`） |
| ❌ | MVP | PATCH | `/admin/categories/:id` | admin | 編輯類別（改用 `PUT /admin/parameters/:id`） |
| ❌ | MVP | DELETE | `/admin/categories/:id` | admin | 刪除類別（改用 `DELETE /admin/parameters/:id`） |

### Admin Skills

| 完成 | 類型 | Method | Path | 權限 | 說明 |
|---|---|---|---|---|---|
| ✅ | MVP | POST | `/admin/skills` | admin | 新增 Prompt/Skill |
| ❌ | MVP | PATCH | `/admin/skills/:id` | admin | 編輯 Prompt/Skill（目前只有 `PUT /admin/skills/:id`，但它本身支援部分更新） |
| ❌ | MVP | DELETE | `/admin/skills/:id` | admin | 刪除 Prompt/Skill |
| ✅ | 加分 | GET | `/admin/skills` | admin | 取得後台 Prompt 列表，支援 `keyword`、`contentTypeId`、`categoryId`、`active` query |
| ✅ | 加分 | GET | `/admin/skills/:id` | admin | 取得單筆後台 Prompt |
| ✅ | 加分 | PUT | `/admin/skills/:id` | admin | 修改 Prompt（支援部分／完整更新） |
| ❌ | 加分 | PATCH | `/admin/skills/:id/active` | admin | 切換啟用/停用狀態（目前用 `PUT /admin/skills/:id` 帶 `isActive` 替代） |

### Admin Parameters

| 完成 | 類型 | Method | Path | 權限 | 說明 |
|---|---|---|---|---|---|
| ✅ | 加分 | GET | `/admin/parameters` | admin | 取得所有參數列表（分類/標籤/模型...），可用 `type` 篩選 |
| ✅ | 加分 | POST | `/admin/parameters` | admin | 新增參數 |
| ✅ | 加分 | PUT | `/admin/parameters/:id` | admin | 修改參數 |
| ❌ | 加分 | PATCH | `/admin/parameters/:id/active` | admin | 切換啟用/停用狀態（目前用 `PUT /admin/parameters/:id` 帶 `isActive` 替代） |
| ✅ | 加分 | DELETE | `/admin/parameters/:id` | admin | 刪除參數（**軟刪除**，實際是把 `isActive` 設為 false） |

### Admin Users

| 完成 | 類型 | Method | Path | 權限 | 說明 |
|---|---|---|---|---|---|
| ✅ | 加分 | GET | `/admin/users` | admin | 取得會員清單，支援 `role` query（`member`／`admin`） |
| ❌ | 加分 | POST | `/admin/users` | admin | 新增會員（目前共用前台 `POST /auth/register`） |
| ✅ | 加分 | PUT | `/admin/users/:id` | admin | 修改會員資料（`name`／`role`／`isActive`） |
| ❌ | 加分 | PATCH | `/admin/users/:id/active` | admin | 切換啟用/停用狀態（目前用 `PUT /admin/users/:id` 帶 `isActive` 替代） |
| ❌ | 加分 | DELETE | `/admin/users/:id` | admin | 刪除會員 |

## 認證方式

Authorization Header 帶 Bearer JWT（無 cookie）。`POST /auth/login` 成功回傳 `{ status: 'success', token }`；`vertfyToken` middleware（`src/middlewares/authenticate.js`）驗證 token 合法後，把解碼出來的內容設進 `req.user`（含 `userId`、`email`、`role`），`/auth/logout`、`/auth/me` 都掛了這個 middleware。登入失敗（帳號不存在或密碼錯）統一回同一則「email 或密碼錯誤」，不透露帳號是否存在。角色權限用同檔案裡的 `isAdmin` middleware（檢查 `req.user.role === 'admin'`），所有 `/admin/*` 路由都疊加 `vertfyToken` + `isAdmin`。

## 環境變數

`.env.example` 列出所有需要的 key（不含真實值）。實際使用時複製成對應的 `.env.{NODE_ENV}` 檔並填值：

| Key | 說明 | 留空/不設定的效果 |
|---|---|---|
| `NODE_ENV` | 執行環境（`development`/`test`/`production`），決定 `env.js` 要載入哪個 `.env.{NODE_ENV}` 檔 | 不設定時 `env.js` 預設當作 `development` |
| `PORT` | Express server 監聽的 port | 預設 `3000` |
| `JWT_SECRET` | 簽發/驗證 JWT 用的密鑰 | 未設定時 token 簽章會失敗；`production` 下 `env.js` 會直接 throw 不讓服務啟動 |
| `DATABASE_URL` | PostgreSQL 連線字串，格式 `postgres://帳號:密碼@主機:port/資料庫名稱` | 留空 → 改用內嵌的 PGlite（見下方〈資料庫〉章節）；`production` 下留空會直接 throw，不會誤用 PGlite |
| `GCP_PROJECT_ID` | GCP 專案 ID，`/utility/upload` 上傳檔案用 | 留空 → 上傳端點會失敗（其餘 API 不受影響） |
| `GCP_CLIENT_EMAIL` | GCP service account 的 email | 同上 |
| `GCP_PRIVATE_KEY` | GCP service account 的私鑰 | 同上 |
| `GCP_BUCKET_NAME` | 上傳目標 Bucket 名稱 | 同上 |

> `.env.development` 與 `.env.production` 都被 `.gitignore` 排除，clone 下來後要自己從 `.env.example` 複製一份。目前 repo 裡的 `.env.development` 只有 `NODE_ENV`、`PORT`、`JWT_SECRET` 三個 key，沒有 `GCP_*`，所以本地跑 `/utility/upload` 會失敗 —— 要測上傳功能得自己補上這四個值。

## 開發與執行

本地開發預設完全不需要 Docker：

```bash
# 安裝套件
npm install

# 依 src/database/schema.sql 建立本地資料表（預設會建立內嵌的 PGlite 資料庫）
npm run dev:init

# 建立種子資料：管理者（admin@example.com / Admin1234）、測試會員（member@example.com / Member1234）、參數表與 Prompt/Skill，已存在會自動略過
npm run dev:seed

# 上面兩步也可以一次做完
npm run dev:setup

# 啟動開發伺服器（NODE_ENV=development，讀 .env.development，檔案變動自動重啟）
npm run dev
```

正式環境啟動用 `npm start`（`NODE_ENV=production`，讀 `.env.production`）。`env.js` 依 `NODE_ENV` 自動載入對應的 `.env.{NODE_ENV}` 檔，`npm run dev`/`npm start` 已經各自帶好對應的 `NODE_ENV`，不用手動切換。

想清空本地資料重新開始：

```bash
npm run dev:clear
npm run dev:setup
```

改動路由後，記得重新產生 API 文件：

```bash
npm run swagger
```

啟動後可透過以下路徑查看/測試 API：

- `/openapi.json`：swagger-autogen 產生的 OpenAPI 3.0 規格
- `/docs`：Swagger UI
- `/scalar`：Scalar API Reference

## 資料庫：本地用 PGlite、雲端用 PostgreSQL

**一份程式碼、兩種後端，靠 `DATABASE_URL` 有沒有值來切換，不需要改任何 SQL。** 這個雙軌設計是刻意保留的：本地開發不必裝 Docker 或起任何資料庫服務，clone 下來 `npm install && npm run dev:setup` 就能跑；上雲端只要在環境變數填 `DATABASE_URL` 就會自動改走真正的 PostgreSQL。

| | 本地開發 | 雲端 / 正式 |
|---|---|---|
| `DATABASE_URL` | 留空 | 填雲端 PostgreSQL 連線字串 |
| 實際後端 | 內嵌 PGlite（`@electric-sql/pglite`） | `pg.Pool` |
| 資料存放 | `.pglite-data/{NODE_ENV}` 本機資料夾 | 雲端資料庫 |
| 需要額外服務 | 不需要 | 需要 |

`src/database/db.js` 的 `createBackend()` 做這個判斷，並在啟動時印出實際連到哪裡（密碼會遮蔽成 `****`）。兩種後端都支援 `query()` / `exec()` / `withTransaction()`；差別只在 transaction —— PostgreSQL 從 Pool 借一條 client 用完 `release()`，PGlite 則直接用同一個內嵌實例。

**上雲端後 PGlite 不會被誤用**：`src/config/env.js` 在 `NODE_ENV=production` 時會檢查 `JWT_SECRET`、`DATABASE_URL`，缺任一個就直接 throw 讓服務啟動失敗，不會安靜地退回空的內嵌資料庫。所以雲端環境「忘記設 DATABASE_URL 結果連到空的 PGlite」這種情況不會發生。

目前 `npm test` 還沒帶 `NODE_ENV=test`、也還沒有獨立的 `.env.test`，跑測試時會沿用 `.env.development`（走同一份 `.pglite-data/development`）。

想在本地改連 Docker PostgreSQL（例如上雲端前先驗證同一份 SQL 在真 PostgreSQL 上的行為），`docker-compose.yml` 已經寫好：

```bash
docker compose up -d
# 然後在 .env.development 填入 DATABASE_URL，再重跑 npm run dev:setup
```

詳細步驟、`psql` 操作示範、跟正式環境的切換方式，見 [`docs/dev-plan.md`](docs/dev-plan.md)。
