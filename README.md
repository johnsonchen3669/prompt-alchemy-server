# Prompt 鍊金坊 Prompt Alchemy — Server

Prompt/Skill 收藏庫：會員登入前台瀏覽、搜尋、篩選、收藏 Prompt/Skill 資料；管理者登入後台管理類別與資料的後端 API server。

## 技術棧

- Express 5、cors、dotenv
- 認證：jsonwebtoken、bcrypt
- API 文件：`swagger-autogen`（掃描 `app.js` 的路由自動產生 OpenAPI 3.0 規格）+ `swagger-ui-express` + `@scalar/express-api-reference`
- 測試：Vitest 已安裝為 devDependency，`npm test` 對應 `vitest run`，但目前尚未撰寫任何測試檔
- 資料持久化：本地開發預設用內嵌的 **PGlite**（`@electric-sql/pglite`，免安裝、免啟動任何資料庫服務），也可以透過 `.env` 的 `DATABASE_URL` 切換成真正的 PostgreSQL（本地 Docker 容器或遠端/正式環境）。不使用 ORM，`src/database/schema.sql` 手寫 DDL，`src/database/repositories` 用參數化 SQL 查詢

## 專案資料夾架構

```
prompt-alchemy-server/
├── src/
│   ├── config/
│   │   ├── env.js                       # 集中讀取環境變數（NODE_ENV、PORT、JWT_SECRET、DATABASE_URL）
│   │   └── swagger.js                   # swagger-autogen 產生器：掃描 app.js 路由，輸出 docs/openapi/swagger-output.json
│   │
│   ├── middlewares/
│   │   └── authenticate.js              # vertfyToken：驗證 Authorization Bearer JWT，設定 req.user
│   │
│   ├── database/
│   │   ├── db.js                        # 統一的 query(text, params)/exec(sql)，依 DATABASE_URL 切換 PGlite / pg.Pool
│   │   ├── schema.sql                   # users 表手寫 DDL（id 為 UUID，DEFAULT gen_random_uuid()）
│   │   ├── migrate.js                   # 套用 schema.sql（npm run dev:init）
│   │   ├── seed.js                      # 建立預設管理者帳號，已存在則略過（npm run dev:seed，冪等）
│   │   └── repositories/
│   │       └── user.repository.js       # createUser / findUserByEmail / findUserById
│   │
│   ├── services/                        # 尚未使用，目前商業邏輯直接寫在 controller 裡
│   │
│   ├── controllers/
│   │   ├── health.controller.js
│   │   └── auth.controller.js           # register / login / logout / getUser
│   │
│   └── routes/
│       ├── health.routes.js
│       └── auth.routes.js               # /register、/login、/logout（需登入）、/me（需登入）
│
├── app.js                   # 組裝 express app（cors/json/routes/API 文件），export app，不呼叫 listen
├── server.js                # require('./config/env') → require('./app') → app.listen(PORT)
├── .env                     # 本機環境變數（.gitignore 排除，不進版控）
├── .env.example             # 環境變數範本（進版控，不含真實值）
├── .pglite-data/            # 本地內嵌 PGlite 的資料檔（.gitignore 排除，執行 dev:init 後自動產生）
├── docker-compose.yml       # 可選：想切換成本地 Docker PostgreSQL 才需要，見下方說明
│
├── docs/
│   ├── plan.md              # PRD（產品目標、角色權限、API 規格、錯誤處理、邊界情境）
│   ├── dev-plan.md          # 資料庫手把手實作教學（PGlite 為本地預設，切換 Docker/遠端 PostgreSQL 的步驟）
│   └── openapi/
│       ├── components.yaml       # 早期手寫的 schema 元件草稿，目前 swagger-autogen 沒有使用這份
│       └── swagger-output.json   # swagger-autogen 產生的 OpenAPI 3.0 文件快照（npm run swagger 重新產生）
│
└── package.json
```

> 目前只完成 `health`、`auth`（register/login/logout/me）這條線，`categories`/`skills`/`favorites`/`admin` 相關的 service、controller、route 都還沒開始。

## API 路由

已完成的打勾（✅），還沒做的留空。

### Auth

| 完成 | Method | Path | 權限 | 說明 |
|---|---|---|---|---|
| ✅ | GET | `/health` | 公開 | 確認服務正常 |
| ✅ | POST | `/auth/register` | 公開 | 會員註冊 |
| ✅ | POST | `/auth/login` | 公開 | 會員/管理者登入 |
| ✅ | POST | `/auth/logout` | 已登入 | 登出 |
| ✅ | GET | `/auth/me` | 已登入 | 取得目前登入者資訊 |

### 前台資料

| 完成 | Method | Path | 權限 | 說明 |
|---|---|---|---|---|
|  | GET | `/categories` | 已登入 | 取得類別列表 |
|  | GET | `/skills` | 已登入 | 取得列表，支援 `keyword`、`categoryId` |
|  | GET | `/skills/:id` | 已登入 | 取得單筆詳情 |
|  | POST | `/favorites/:skillId` | 會員 | 收藏 |
|  | DELETE | `/favorites/:skillId` | 會員 | 取消收藏 |
|  | GET | `/me/favorites` | 會員 | 我的收藏 |

### 後台管理

| 完成 | Method | Path | 權限 | 說明 |
|---|---|---|---|---|
|  | POST | `/admin/categories` | 管理者 | 新增類別 |
|  | PATCH | `/admin/categories/:id` | 管理者 | 編輯類別 |
|  | DELETE | `/admin/categories/:id` | 管理者 | 刪除類別 |
|  | POST | `/admin/skills` | 管理者 | 新增 Prompt/Skill |
|  | PATCH | `/admin/skills/:id` | 管理者 | 編輯 Prompt/Skill |
|  | DELETE | `/admin/skills/:id` | 管理者 | 刪除 Prompt/Skill |

## 認證方式

Authorization Header 帶 Bearer JWT（無 cookie）。`POST /auth/login` 成功回傳 `{ status: 'success', token }`；`vertfyToken` middleware（`src/middlewares/authenticate.js`）驗證 token 合法後，把解碼出來的內容設進 `req.user`（含 `userId`、`email`），`/auth/logout`、`/auth/me` 都掛了這個 middleware。登入失敗（帳號不存在或密碼錯）統一回同一則「email 或密碼錯誤」，不透露帳號是否存在。目前還沒有角色權限（member/admin）檢查用的 middleware。

## 開發與執行

本地開發預設完全不需要 Docker：

```bash
# 安裝套件
npm install

# 依 src/database/schema.sql 建立本地資料表（預設會建立內嵌的 PGlite 資料庫）
npm run dev:init

# 建立預設管理者帳號（admin@example.com / Admin1234），已存在會自動略過
npm run dev:seed

# 上面兩步也可以一次做完
npm run dev:setup

# 啟動伺服器
npm start
```

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

## 資料庫：PGlite（預設）與 PostgreSQL（可選）

`src/database/db.js` 的設計是依 `.env` 裡有沒有設定 `DATABASE_URL` 來決定連線方式：沒設定就用內嵌的 PGlite（免安裝），有設定就改用 `pg` 連到那個網址（可以是本地 Docker 容器，也可以是遠端/正式的 PostgreSQL）。`schema.sql`、repository 的 SQL 在兩種情況下完全不用改。

**目前狀態**：`db.js` 這個切換判斷還沒接上（`createBackend()` 目前固定使用 PGlite），`.env` 裡即使填了 `DATABASE_URL` 也不會生效，這部分還是待辦事項。

想改連本地 Docker PostgreSQL 練習操作手感，`docker-compose.yml` 已經寫好：

```bash
docker compose up -d
```

詳細步驟、`psql` 操作示範、跟正式環境的切換方式，見 [`docs/dev-plan.md`](docs/dev-plan.md)。
