# Prompt 鍊金坊 Prompt Alchemy — Server

Prompt 鍊金坊的後端 API server，提供 Prompt 與 Agent Skill 瀏覽、搜尋、收藏、Recipe 組合與安裝指令，並支援 FAQ、聯絡表單及管理後台。

## 文件導覽與現行性

`README.md` 維持在 repository 根目錄，作為唯一的文件入口。查閱專案現況時，依下列來源判斷：

| 用途 | 現行依據 |
|---|---|
| 路由與執行行為 | [`app.js`](app.js)、[`src/routes/index.js`](src/routes/index.js) 與實際 controller、service、repository |
| 資料模型 | [`src/database/schema.sql`](src/database/schema.sql) |
| DB 連線與 migration | [`src/database/db.js`](src/database/db.js)、[`src/database/migrate.js`](src/database/migrate.js) |
| 可執行指令與套件 | [`package.json`](package.json) |
| 前後端 API 對接參考 | [`docs/FRONTEND_API_SPEC.md`](docs/FRONTEND_API_SPEC.md)；實際端點仍以 route code 為準 |
| 生成的 OpenAPI 快照 | [`docs/openapi/swagger-output.json`](docs/openapi/swagger-output.json) |
| 架構決策 | [`docs/adr/`](docs/adr/) |
| 歷史計畫 | [`docs/archive/`](docs/archive/)；只代表封存當時的狀態 |

若內容互相衝突，優先順序為：**實際程式碼、schema 與 `package.json` → 依目前路由重新生成的 OpenAPI → 維護中的 API 規格 → archive**。

### 文件封存規則

1. 以封存日期建立 `docs/archive/YYYY-MM-DD/`，同批文件放在同一個日期目錄。
2. 完整正文只搬移並保存一份；archive 正文凍結，不再跟著現況更新。
3. 原路徑只保留 deprecated pointer，避免既有連結失效或讀者誤認為現行文件。
4. 封存文件需記錄 `archived_at`、`original_path`、`source_last_updated`、`maintenance` 與 `canonical_sources`。
5. 新增封存批次時，同步更新本節的歷史文件入口；完整政策見 [`docs/adr/0002-document-archive-policy.md`](docs/adr/0002-document-archive-policy.md)。

`docs/plan.md` 與 `docs/dev-plan.md` 已封存至 [`docs/archive/2026-08-15/`](docs/archive/2026-08-15/)；原路徑僅保留導向現行來源的指標。

## 實際功能

- **公開內容**：Prompt、Agent Skill、FAQ 瀏覽，以及複製次數統計與 Agent Skill 安裝指令。
- **會員功能**：註冊／登入、Prompt 與 Agent Skill 收藏、Recipe 建立與項目管理。
- **聯絡表單**：公開送出聯絡資料，管理者可查詢、更新處理狀態或刪除。
- **管理後台**：Parameters、Users、Prompt/Skill、Agent Skills、Contacts、FAQs 管理。
- **檔案上傳**：透過 GCP Cloud Storage 儲存上傳檔案。

## 技術棧

- **Runtime / Framework**：Node.js、CommonJS、Express 5、cors、dotenv
- **認證與密碼**：jsonwebtoken、bcrypt
- **資料庫**：PostgreSQL（`pg`）與本地內嵌 PGlite（`@electric-sql/pglite`）
- **資料存取**：手寫 DDL 與參數化 SQL，不使用 ORM
- **檔案上傳**：multer、`@google-cloud/storage`
- **API 文件**：swagger-autogen、swagger-ui-express、`@scalar/express-api-reference`
- **測試**：Vitest；測試位於 [`src/tests/`](src/tests/)，以 `npm test` 執行

## 專案架構

### 執行時請求流

一般的 API 請求會依下列分層處理；部分模組會略過 service 或 repository，實際例外列在後方的模組表。

```text
server.js
└── app.js
    ├── cors / express.json
    ├── src/routes/index.js
    │   └── route-level middleware（JWT、admin、multer）
    │       └── controller
    │           └── service
    │               └── src/database/repositories
    │                   └── src/database/db.js
    │                       ├── pg.Pool（設定 DATABASE_URL）
    │                       └── PGlite（未設定 DATABASE_URL）
    ├── Swagger routes（依環境設定啟用）
    ├── 404 handler
    └── errorHandler
```

`server.js` 負責啟動 HTTP server；`app.js` 組裝全域 middleware、應用 routes、條件式 Swagger、404 與錯誤處理；`src/routes/index.js` 是所有實際 API prefix 的集中掛載入口。

### 目錄與關鍵實作

```text
prompt-alchemy-server/
├── src/
│   ├── config/
│   │   ├── env.js                              # 環境變數、production 必填檢查與 Swagger 設定
│   │   ├── favorite.config.js                  # 預設收藏設定
│   │   └── swagger.js                          # OpenAPI 產生器
│   ├── middlewares/
│   │   ├── authenticate.js                     # Bearer JWT 與 admin 權限
│   │   ├── errorHandler.js                     # 集中錯誤處理
│   │   └── swaggerProtect.js                   # Swagger Basic Auth
│   ├── database/
│   │   ├── db.js                               # query、exec、transaction 與 pg.Pool / PGlite 切換
│   │   ├── migrate.js                          # 套用 schema.sql
│   │   ├── schema.sql                          # 目前資料表 DDL
│   │   ├── seed.js                             # 基礎使用者、參數、Prompt/Skill、FAQ 與預設收藏
│   │   ├── seed_skill.js                       # Agent Skill 種子資料
│   │   ├── docker-init/                        # 目前空目錄，沒有初始化 SQL
│   │   └── repositories/
│   │       ├── agent_skill.repository.js       # Agent Skill 公開查詢與後台管理
│   │       ├── contact.repository.js           # 聯絡表單建立、查詢、狀態與刪除
│   │       ├── faq.repository.js               # FAQ 公開／後台查詢、建立、更新與軟刪除
│   │       ├── favorite.repository.js          # Prompt／Agent Skill 收藏資料存取
│   │       ├── parameter.repository.js         # 參數查詢與管理
│   │       ├── prompt.repository.js            # skill_item 公開查詢與後台管理
│   │       ├── skill_recipe.repository.js      # Recipe 所有權與資料存取
│   │       ├── skill_recipe_item.repository.js # Recipe 與收藏項目的關聯資料
│   │       └── user.repository.js              # 會員登入、資料查詢與後台管理
│   ├── services/
│   │   ├── agentSkill.service.js               # Agent Skill 查詢、安裝指令、計數與 API mapping
│   │   ├── auth.service.js                     # 註冊交易與新會員預設資料
│   │   ├── contact.service.js                  # 聯絡表單建立與後台處理
│   │   ├── faq.service.js                      # FAQ 驗證、公開／後台操作與 mapping
│   │   ├── favorite.service.js                 # Prompt／Agent Skill 收藏與預設收藏
│   │   ├── parameter.service.js                # Parameter 驗證與後台管理
│   │   ├── prompt.service.js                   # Prompt 查詢、複製計數與 API mapping
│   │   ├── skillInstallCommand.service.js      # Agent Skill／Recipe 共用安裝指令 builder
│   │   ├── skillRecipe.service.js              # Recipe、Recipe Item 與批次安裝指令
│   │   └── upload.service.js                   # GCP Cloud Storage 上傳
│   ├── controllers/                            # HTTP request/response handlers；含前台與會員模組
│   │   └── admin/                              # 管理後台 handlers
│   ├── routes/
│   │   ├── index.js                            # 所有實際 route prefix 的掛載入口
│   │   └── admin/                              # 管理後台 routes
│   ├── scripts/
│   │   └── updateAdmin.js                      # 一次性管理者更新腳本
│   ├── tests/                                  # Vitest 測試與手動測試輔助檔案
│   └── utils/                                  # 目前空目錄、尚未使用
├── docs/
│   ├── FRONTEND_API_SPEC.md                    # 前後端對接參考
│   ├── adr/                                    # 架構決策紀錄
│   ├── archive/                                # 日期化唯讀歷史快照
│   ├── plan.md                                 # 早期 PRD 的 deprecated pointer
│   ├── dev-plan.md                             # 早期教學的 deprecated pointer
│   └── openapi/
│       └── swagger-output.json                 # swagger-autogen 產生的快照
├── app.js                                      # Express app、routes、條件式 Swagger 與錯誤處理
├── server.js                                   # 啟動 HTTP server
├── docker-compose.yml                          # 可選的本地 PostgreSQL
├── .env.example                                # 唯一納管的環境變數範本
└── package.json
```

`src/routes/index.js` 目前掛載公開／會員 prefixes：`/health`、`/auth`、`/utility`、`/prompts`、`/favorites`、`/me/recipes`、`/me/recipe-items`、`/contacts`、`/agent-skills`、`/faqs`；後台 prefixes：`/admin/parameters`、`/admin/users`、`/admin/skills`、`/admin/agent-skills`、`/admin/contacts`、`/admin/faqs`。

目前由 `src/routes/index.js` 掛載的 16 個 leaf route modules 與其使用的 15 個 controllers 均已實作；`src/controllers/` 與 `src/routes/` 內沒有 skeleton、空檔或未掛載的 leaf module。`src/routes/index.js` 本身是集中掛載用的 aggregator。

### 分層責任

| 層 | 責任 |
|---|---|
| `server.js` / `app.js` | 啟動 server、組裝 Express、條件式 Swagger、404 與全域錯誤處理 |
| Routes | 宣告 endpoint、掛載 prefix，並套用 JWT、admin 或 multer 等 route-level middleware |
| Middlewares | 驗證 JWT 與 admin 權限、保護 Swagger，以及集中轉換應用程式錯誤 |
| Controllers | 讀取 request、呼叫下層並組裝 HTTP response |
| Services | 執行業務規則、輸入驗證、欄位轉換、transaction 與跨 repository 協作 |
| Repositories | 使用參數化 SQL 存取資料表，並處理資料鎖定與持久化操作 |
| `database/db.js` | 統一提供 `query`、`exec`、`withTransaction`，依設定切換 PostgreSQL／PGlite |
| External storage | `upload.service.js` 將檔案寫入 GCP Cloud Storage，不經 database |

### 主要模組資料流

| 模組 | 主要執行鏈 | 權限 |
|---|---|---|
| Health | route → `health.controller.js` | 公開 |
| Auth register | route → `auth.controller.js` → `auth.service.js` → transaction → user／favorite／recipe repositories | 公開 |
| Auth login／me／logout | route → `auth.controller.js`；login／me 直接使用 `user.repository.js` | login 公開；logout／me 需 JWT |
| Prompts／Agent Skills／FAQs | controller → 對應 service → repository | 公開 |
| Favorites | controller → `favorite.service.js` → `favorite.repository.js` | JWT |
| Recipes／Recipe Items | controller → `skillRecipe.service.js` → recipe repositories | JWT |
| Contacts | controller → `contact.service.js` → `contact.repository.js` | 公開；後台管理需 JWT + admin |
| Admin Parameters／FAQs／Contacts | admin controller → 對應 service → repository | JWT + admin |
| Admin Prompts／Agent Skills／Users | admin controller → repository，部分重用 service mapper | JWT + admin |
| Upload | route／multer → `utility.controller.js` → `upload.service.js` → GCP Storage | 公開；不經 database |

一般分層不是所有 endpoint 的硬性規則：Auth register 由 `auth.service.js` 開啟 transaction，跨 `user.repository.js`、`favorite.service.js` 與 `skillRecipe.service.js` 建立會員及預設資料；Auth login／me 直接使用 `user.repository.js`，其中 login 的 bcrypt 驗證與 JWT 簽發位於 controller，logout 只回傳成功訊息而不撤銷既有 JWT。Admin Prompts 與 Admin Agent Skills 直接使用 repository 並重用對應 service 的 API mapper；Admin Users 直接使用 `user.repository.js`；Health 不經 service／repository。`skillInstallCommand.service.js` 是 Agent Skill 與 Recipe 共用的純指令 builder，不存取 database；需要 transaction 的 Favorites 操作也由 service 開啟後再呼叫 repository。

### 空檔與空目錄

目前 `src/` 沒有空檔；空目錄只有 `src/database/docker-init/` 與 `src/utils/`。

`src/database/schema.sql` 目前包含 9 張表：`users`、`parameters`、`skill_item`、`agent_skill`、`favorite`、`skill_recipe`、`skill_recipe_item`、`faqs`、`contacts`。各表主鍵設計不同，例如 `favorite.id` 使用 BIGINT identity，`skill_recipe_item` 使用複合主鍵；欄位型別請直接以 schema 為準。

## API 路由

所有 API 都直接掛在根路徑，沒有 `/api` 前綴。權限欄位中的 `JWT` 表示需帶 `Authorization: Bearer <token>`；`JWT + admin` 另需管理者角色。

### Health

| Method | Path | 權限 | 說明 |
|---|---|---|---|
| GET | `/health` | 公開 | 取得服務存活狀態與 timestamp |

### Auth

| Method | Path | 權限 | 說明 |
|---|---|---|---|
| POST | `/auth/register` | 公開 | 建立會員與預設資料 |
| POST | `/auth/login` | 公開 | 登入並回傳有效期 7 日的 JWT |
| POST | `/auth/logout` | JWT | 回傳登出成功訊息；不撤銷既有 JWT |
| GET | `/auth/me` | JWT | 取得目前登入者資料 |

### Utility

| Method | Path | 權限 | 說明 |
|---|---|---|---|
| POST | `/utility/upload` | 公開 | 上傳檔案至 GCP Bucket；`multipart/form-data`、欄位 `file`、上限 10 MB |

### Prompts

| Method | Path | 權限 | 說明 |
|---|---|---|---|
| GET | `/prompts` | 公開 | 取得上架 Prompt 列表，支援 `category`、`tag`、`search` query |
| GET | `/prompts/:id` | 公開 | 取得上架 Prompt 詳情 |
| POST | `/prompts/:id/copy` | 公開 | 將 Prompt 的 `copy_count` 加 1 |

### Favorites

| Method | Path | 權限 | 說明 |
|---|---|---|---|
| GET | `/favorites` | JWT | 依 `itemType=prompt|skill` 取得本人收藏 |
| DELETE | `/favorites` | JWT | 清除本人全部 Prompt 與 Agent Skill 收藏 |
| GET | `/favorites/:skillId/status` | JWT | 依 `itemType` 查詢單筆收藏狀態 |
| POST | `/favorites/:skillId/toggle` | JWT | 依 `itemType` 新增或取消收藏 |
| POST | `/favorites/defaults` | JWT | 清除全部收藏後，恢復預設 Prompt 收藏 |

### Recipes

| Method | Path | 權限 | 說明 |
|---|---|---|---|
| GET | `/me/recipes` | JWT | 取得本人的 Recipe 列表 |
| POST | `/me/recipes` | JWT | 建立 Recipe |
| GET | `/me/recipes/:id` | JWT | 取得本人單一 Recipe |
| PATCH | `/me/recipes/:id` | JWT | 重新命名 Recipe（只更新 `name`） |
| PATCH | `/me/recipes/:id/last-selected-agent` | JWT | 更新最後選擇的 Agent |
| DELETE | `/me/recipes/:id` | JWT | 刪除 Recipe |
| GET | `/me/recipes/:id/install-command` | JWT | 依必要的 `agent=claude-code|codex|cursor` query 取得 Recipe 安裝指令 |
| POST | `/me/recipes/:id/items` | JWT | 將本人已收藏的 Agent Skill 加入 Recipe（body：`favoriteId`） |
| DELETE | `/me/recipes/:id/items/:favoriteId` | JWT | 從 Recipe 移除 Agent Skill 項目，不影響收藏狀態 |

### Recipe Items

| Method | Path | 權限 | 說明 |
|---|---|---|---|
| GET | `/me/recipe-items` | JWT | 取得本人 Recipe item 對照資料 |

### Contacts

| Method | Path | 權限 | 說明 |
|---|---|---|---|
| POST | `/contacts` | 公開 | 送出聯絡表單 |

### Agent Skills

| Method | Path | 權限 | 說明 |
|---|---|---|---|
| GET | `/agent-skills` | 公開 | 取得上架 Agent Skill 列表 |
| GET | `/agent-skills/:id` | 公開 | 取得 Agent Skill 詳情 |
| GET | `/agent-skills/:id/install-command` | 公開 | 依必要的 `agent=claude-code|codex|cursor` query 取得安裝指令 |
| POST | `/agent-skills/:id/copy` | 公開 | 增加 Agent Skill 複製次數 |

### FAQs

| Method | Path | 權限 | 說明 |
|---|---|---|---|
| GET | `/faqs` | 公開 | 取得公開 FAQ 列表 |

### Admin Parameters

| Method | Path | 權限 | 說明 |
|---|---|---|---|
| GET | `/admin/parameters` | JWT + admin | 取得參數列表，可依 `type=role|contentType|category|model|tag` 篩選 |
| POST | `/admin/parameters` | JWT + admin | 新增參數 |
| PUT | `/admin/parameters/:id` | JWT + admin | 更新參數 |
| DELETE | `/admin/parameters/:id` | JWT + admin | 軟刪除參數 |

### Admin Users

| Method | Path | 權限 | 說明 |
|---|---|---|---|
| GET | `/admin/users` | JWT + admin | 取得會員列表，可依 `role` 篩選 |
| PUT | `/admin/users/:id` | JWT + admin | 更新會員資料、角色或啟用狀態 |

### Admin Skills

| Method | Path | 權限 | 說明 |
|---|---|---|---|
| GET | `/admin/skills` | JWT + admin | 取得後台 Prompt/Skill 列表，支援 `keyword`、`contentTypeId`、`categoryId`、`active` query |
| POST | `/admin/skills` | JWT + admin | 新增 Prompt/Skill |
| GET | `/admin/skills/:id` | JWT + admin | 取得單筆 Prompt/Skill |
| PUT | `/admin/skills/:id` | JWT + admin | 更新 Prompt/Skill |

### Admin Agent Skills

| Method | Path | 權限 | 說明 |
|---|---|---|---|
| GET | `/admin/agent-skills` | JWT + admin | 取得後台 Agent Skill 列表，支援 `keyword`、`categoryId`、`active` query |
| POST | `/admin/agent-skills` | JWT + admin | 新增 Agent Skill |
| GET | `/admin/agent-skills/:id` | JWT + admin | 取得單一 Agent Skill |
| PUT | `/admin/agent-skills/:id` | JWT + admin | 更新 Agent Skill |
| PATCH | `/admin/agent-skills/:id/active` | JWT + admin | 切換 Agent Skill 啟用狀態 |

### Admin Contacts

| Method | Path | 權限 | 說明 |
|---|---|---|---|
| GET | `/admin/contacts` | JWT + admin | 取得聯絡表單列表，支援 `status`、`keyword` query |
| PATCH | `/admin/contacts/:id/status` | JWT + admin | 更新聯絡表單處理狀態 |
| PUT | `/admin/contacts/:id/status` | JWT + admin | 更新聯絡表單處理狀態；與 PATCH 共用 handler |
| DELETE | `/admin/contacts/:id` | JWT + admin | 刪除聯絡表單 |

### Admin FAQs

| Method | Path | 權限 | 說明 |
|---|---|---|---|
| GET | `/admin/faqs` | JWT + admin | 取得後台 FAQ 列表 |
| POST | `/admin/faqs` | JWT + admin | 新增 FAQ |
| GET | `/admin/faqs/:id` | JWT + admin | 取得單一 FAQ |
| PUT | `/admin/faqs/:id` | JWT + admin | 更新 FAQ |
| DELETE | `/admin/faqs/:id` | JWT + admin | 軟刪除／停用 FAQ |

## Swagger / OpenAPI

`app.js` 只有在 `swagger.enabled` 為 `true` 時才掛載下列文件路徑：

| Method | Path | 說明 |
|---|---|---|
| GET | `/openapi.json` | OpenAPI JSON，`servers` URL 會依目前 request 動態產生 |
| GET | `/docs` | Swagger UI |
| GET | `/scalar` | Scalar API Reference |

啟用與保護規則：

- 環境中存在 `SWAGGER_ENABLED` 時，只有字串 `true` 會啟用；空字串也屬於已設定，因此會關閉。
- 環境中完全不存在 `SWAGGER_ENABLED` key 時，非 production 預設啟用，production 預設關閉。
- `SWAGGER_BASIC_AUTH_USER` 與 `SWAGGER_BASIC_AUTH_PASS` 兩者都有設定時，文件路徑才要求 HTTP Basic Auth；任一缺少則直接放行。
- `docs/openapi/swagger-output.json` 是 generated snapshot，目前尚未涵蓋所有 mounted routes；實際 API 仍以 `src/routes/index.js` 與 route code 為準。
- Route 或 Swagger annotation 異動並需要同步文件時，執行 `npm run swagger` 重新產生快照；產生器會載入目前 `NODE_ENV` 對應設定，production 模式仍需提供 production 必填環境變數。

## 認證方式

API 使用 `Authorization: Bearer <JWT>`，不使用 cookie。`POST /auth/login` 成功後回傳 token；`vertfyToken` middleware 驗證 token 並將 `userId`、`email`、`role` 等內容設到 `req.user`。

管理端 routes 疊加 `vertfyToken` 與 `isAdmin`；`isAdmin` 會檢查 `req.user.role === 'admin'`。登入失敗時，帳號不存在與密碼錯誤共用同一則錯誤訊息，避免洩漏帳號是否存在。

## 環境變數

`.env.example` 是唯一納入版控的環境變數範本。開發或部署時，請建立對應的 `.env.{NODE_ENV}` 或由執行環境注入變數；不要提交真實密鑰。

| Key | 說明 | 未設定時的行為 |
|---|---|---|
| `NODE_ENV` | 執行環境 | 預設 `development` |
| `PORT` | HTTP server port | 預設 `3000` |
| `JWT_SECRET` | JWT 簽發與驗證密鑰 | production process／指令載入設定時若缺少便中止 |
| `DATABASE_URL` | PostgreSQL 連線字串 | 非 production 留空時使用 PGlite；production process／指令載入設定時若缺少便中止 |
| `GCP_PROJECT_ID` | GCP project ID | 上傳功能無法正常使用 |
| `GCP_CLIENT_EMAIL` | GCP service account email | 上傳功能無法正常使用 |
| `GCP_PRIVATE_KEY` | GCP service account private key | 上傳功能無法正常使用 |
| `GCP_BUCKET_NAME` | 上傳目標 Bucket | 上傳功能無法正常使用 |
| `SWAGGER_ENABLED` | 是否掛載 Swagger/OpenAPI 文件 | key 不存在時依 `NODE_ENV` 決定；key 存在時只有 `true` 會啟用，空字串會關閉 |
| `SWAGGER_BASIC_AUTH_USER` | Swagger Basic Auth 帳號 | 與密碼任一缺少時不啟用 Basic Auth |
| `SWAGGER_BASIC_AUTH_PASS` | Swagger Basic Auth 密碼 | 與帳號任一缺少時不啟用 Basic Auth |

`GCP_PRIVATE_KEY` 可使用含 `\n` 的單行環境變數值；`upload.service.js` 初始化憑證時會將其轉回實際換行。

## 開發、測試與資料指令

### 本地開發

```bash
npm install

# 依 schema.sql 建立資料表，未設定 DATABASE_URL 時使用 PGlite
npm run dev:init

# 建立基礎使用者、parameters、Prompt/Skill、FAQ 與預設收藏
npm run dev:seed

# dev:init + dev:seed
npm run dev:setup

# 如需 Agent Skill 種子資料，另行執行
npm run seed:skill

# 啟動 development server，檔案變更時自動重啟
npm run dev
```

`dev:init`、`dev:seed`、`dev:setup` 與 `seed:skill` 不會自行覆寫 `NODE_ENV`，會沿用目前 shell 的值；本地操作前請確認不是 production。只有 `npm run dev` 會明確設定 `NODE_ENV=development`。

### 常用 scripts

以下列出 `package.json` 目前全部 12 個 scripts：

| Script | 用途 |
|---|---|
| `npm start` | 以 `NODE_ENV=production` 啟動 server |
| `npm run dev` | 以 `NODE_ENV=development` 啟動 watch server |
| `npm test` | 執行 Vitest 測試 |
| `npm run swagger` | 重新產生 `docs/openapi/swagger-output.json` |
| `npm run dev:swagger-auth` | 以 production Swagger 設定與示範 Basic Auth 啟動 watch server；仍需 production 必填環境變數 |
| `npm run dev:init` | 在目前資料庫套用 `schema.sql` |
| `npm run dev:seed` | 建立基礎種子資料 |
| `npm run dev:setup` | 依序執行 `dev:init` 與 `dev:seed` |
| `npm run dev:clear` | 刪除本地 `.pglite-data` |
| `npm run seed:skill` | 建立 Agent Skill 種子資料 |
| `npm run db:migrate:prod` | 使用 production 環境執行 migration |
| `npm run seed:skill:prod` | 使用 production 環境建立 Agent Skill 種子資料 |

`dev:setup` 不包含 `seed:skill`。Agent Skill seed 應在 schema 與所需基礎資料建立後執行。`npm test` 只執行 Vitest 測試；`src/tests/read-favorites.js` 是手動查詢輔助腳本，不屬於 Vitest suite。

## 資料庫：PGlite 與 PostgreSQL

同一份 SQL 可在兩種後端執行，`src/database/db.js` 依 `DATABASE_URL` 是否存在切換：

| | 本地預設 | PostgreSQL / production |
|---|---|---|
| `DATABASE_URL` | 留空 | 提供 PostgreSQL 連線字串 |
| Backend | PGlite | `pg.Pool` |
| 資料位置 | `.pglite-data/{NODE_ENV}` | PostgreSQL server |
| 額外服務 | 不需要 | 需要 PostgreSQL |

兩種後端共用 `query()`、`exec()`、`withTransaction()`。Production 會驗證 `JWT_SECRET` 與 `DATABASE_URL`，缺少任一值即中止啟動，不會退回 PGlite。

若要使用 repository 內的 Docker PostgreSQL：

```bash
docker compose up -d --wait
# container 通過 healthcheck 後，將開發環境的 DATABASE_URL 指向 localhost:5433 再套用 schema
npm run dev:init
```

`docker-compose.yml` 將 host `5433` 對應到 container `5432`。啟動 container 不會自動套用 schema，仍需執行 migration；production 則使用 `npm run db:migrate:prod`。

目前資料庫行為與可執行指令請以 [`src/database/db.js`](src/database/db.js)、[`src/database/migrate.js`](src/database/migrate.js)、[`src/database/schema.sql`](src/database/schema.sql) 與 [`package.json`](package.json) 為準。早期教學保留在 [`docs/archive/2026-08-15/dev-plan.md`](docs/archive/2026-08-15/dev-plan.md)，其中的 scripts、schema 與測試步驟只代表封存當時的狀態。
