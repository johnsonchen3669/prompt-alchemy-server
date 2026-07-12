# Prompt/Skill 收藏庫 — 專案計畫書

> 參考來源：
> - 六角學院產品開發組專案規劃總覽：https://hackmd.io/-muj6IkqQcmXOziSyjxQKw?view
> - Prompt/Skill 收藏庫 Mini PRD（LV2）：https://hackmd.io/zAGzhmkuSHO3ISJL6bGXRg

## 一、產品背景與目標

開發 **Prompt/Skill 收藏庫**：會員登入前台瀏覽、搜尋、篩選、收藏 Prompt/Skill 資料；管理者登入後台管理類別與資料。

產品目標（可 Demo 的 MVP）：
- 管理者可登入後台
- 管理者可新增/編輯/刪除類別
- 管理者可新增/編輯/刪除 Prompt/Skill 資料
- 會員可登入前台
- 會員可瀏覽、搜尋、篩選 Prompt/Skill
- 會員可收藏常用項目
- 系統能區分會員與管理者權限

## 二、MVP 範圍（不含）

MVP 階段不需要：第三方 OAuth 登入、忘記密碼/Email 驗證、付款訂閱、多人協作空間、公開投稿審核、完整富文字編輯器、大型全文檢索、正式環境部署。

## 三、角色與權限

| 角色 | 可以做什麼 | 不能做什麼 |
|---|---|---|
| 未登入訪客 | 看首頁或登入頁 | 不能收藏、進後台 |
| 會員 (member) | 登入、瀏覽、搜尋、篩選、收藏/取消收藏 | 新增類別、新增/編輯/刪除 Prompt/Skill |
| 管理者 (admin) | 登入後台、管理類別、管理資料 | 不應看到其他會員密碼或敏感資料 |

MVP 至少需準備 1 個管理者測試帳號、1 個會員測試帳號。

## 四、使用者故事

### MVP

| ID | 使用者故事 | 驗收條件 |
|---|---|---|
| US-01 | 管理者登入後台，避免任何人亂改資料 | 管理者可登入後台，未登入或會員不能進 |
| US-02 | 管理者新增類別，讓資料被分類整理 | 後台可新增類別，前台可看到篩選 |
| US-03 | 管理者新增 Prompt/Skill 資料 | 後台可填寫標題、類別、標籤、內容、情境並儲存 |
| US-04 | 會員登入前台，查看系統裡的資料 | 會員登入後可看到列表 |
| US-05 | 會員用關鍵字或類別找資料 | 前台可用關鍵字搜尋、依類別篩選 |
| US-06 | 會員收藏常用項目 | 可收藏/取消收藏，並在「我的收藏」看到 |
| US-07 | 登入失敗或權限不足時看得懂 | 登入失敗、未登入、權限不足都有清楚提示 |

### 打磨與加分

| ID | 使用者故事 |
|---|---|
| US-08 | 詳情頁提供「複製內容」按鈕 |
| US-09 | 資料中加入適用情境、使用說明、範例輸入 |
| US-10 | 後台支援編輯與刪除 |
| US-11 | 支援 tag 篩選或 tag chip |

## 五、功能規格

| ID | 功能 | 規格 | 優先級 |
|---|---|---|---|
| FR-01 | 服務狀態檢查 | `GET /health` | Must |
| FR-02 | 登入 | 會員與管理者登入流程 | Must |
| FR-03 | 登出 | 會員與管理者可登出 | Should |
| FR-04 | 角色權限 | API 需檢查 `member`/`admin` 權限 | Must |
| FR-05 | 類別新增 | 管理者可新增類別 | Must |
| FR-06 | 類別列表 | 前台與後台都可讀取 | Must |
| FR-07 | Prompt/Skill 新增 | 管理者可新增資料 | Must |
| FR-08 | Prompt/Skill 列表 | 會員可瀏覽列表 | Must |
| FR-09 | Prompt/Skill 詳情 | 會員可查看完整內容 | Must |
| FR-10 | 關鍵字搜尋 | 支援標題、內容、標籤搜尋 | Must |
| FR-11 | 類別篩選 | 支援依類別篩選 | Must |
| FR-12 | 收藏 | 會員可收藏/取消收藏 | Must |
| FR-13 | 我的收藏 | 會員可查看自己收藏 | Must |
| FR-14 | 後台編輯/刪除 | 管理者可編輯/刪除 | Should |
| FR-15 | 複製 Prompt | 會員可一鍵複製 | Could |

## 六、建議 API 規格

### Auth

| Method | Path | 權限 | 說明 |
|---|---|---|---|
| GET | `/health` | 公開 | 確認服務正常 |
| POST | `/auth/login` | 公開 | 會員/管理者登入 |
| POST | `/auth/logout` | 已登入 | 登出 |
| GET | `/auth/me` | 已登入 | 取得目前登入者資訊 |

### 前台資料

| Method | Path | 權限 | 說明 |
|---|---|---|---|
| GET | `/categories` | 已登入 | 取得類別列表 |
| GET | `/skills` | 已登入 | 取得列表，支援 `keyword`、`categoryId` |
| GET | `/skills/:id` | 已登入 | 取得單筆詳情 |
| POST | `/favorites/:skillId` | 會員 | 收藏 |
| DELETE | `/favorites/:skillId` | 會員 | 取消收藏 |
| GET | `/me/favorites` | 會員 | 我的收藏 |

### 後台管理

| Method | Path | 權限 | 說明 |
|---|---|---|---|
| POST | `/admin/categories` | 管理者 | 新增類別 |
| PATCH | `/admin/categories/:id` | 管理者 | 編輯類別 |
| DELETE | `/admin/categories/:id` | 管理者 | 刪除類別 |
| POST | `/admin/skills` | 管理者 | 新增 Prompt/Skill |
| PATCH | `/admin/skills/:id` | 管理者 | 編輯 Prompt/Skill |
| DELETE | `/admin/skills/:id` | 管理者 | 刪除 Prompt/Skill |

## 七、資料規格

### User
`id`、`name`、`email`、`passwordHash`（bcrypt 雜湊，不存明碼）、`role`（`member` 或 `admin`）

### Category
`id`、`name`、`description`

### SkillItem
`id`、`title`、`categoryId`、`tags`、`content`、`useCase`、`exampleInput`（可選）、`createdAt`、`updatedAt`

### Favorite
`userId`、`skillId`、`createdAt`

## 八、錯誤處理需求

| 情境 | 狀態碼 | 回應訊息 |
|---|---:|---|
| 登入失敗 | 401 | 帳號或密碼錯誤 |
| 未登入 | 401 | 請先登入 |
| 權限不足 | 403 | 你沒有權限執行此操作 |
| 類別名稱空白 | 400 | 請輸入類別名稱 |
| Prompt/Skill 標題空白 | 400 | 請輸入標題 |
| Prompt/Skill 內容空白 | 400 | 請輸入內容 |
| 找不到資料 | 404 | 找不到指定資料 |
| 重複收藏 | 409 | 已經收藏過此項目 |
| 系統錯誤 | 500 | 系統發生錯誤，請稍後再試 |

## 九、邊界情境

| 情境 | 建議處理 |
|---|---|
| 會員直接打開後台網址 | 導回前台或顯示權限不足 |
| 未登入直接收藏 | 要求先登入 |
| 管理者刪除已有資料的類別 | 阻擋刪除或提醒先移動資料 |
| 搜尋沒有結果 | 顯示空狀態，不要當錯誤 |
| 收藏清單是空的 | 顯示「尚未收藏」提示 |
| 同一會員重複收藏同一筆 | 不要產生重複資料 |
| 密碼錯誤 | 不透露帳號是否存在，只提示帳號或密碼錯誤 |

## 十、本次架構決策

1. **僅後端 API server**：不含前台/後台靜態頁面資料夾，前端頁面由其他專案處理。
2. **資料持久化：PostgreSQL（單一資料庫方言）+ 手寫 SQL**：不採 PRD 建議的 MVP 基準版 JSON 檔案方案，也不使用 ORM（Prisma）。全程只用同一種資料庫方言 **PostgreSQL**，不同的只是「連到哪一個 PostgreSQL」。以 `src/database/schema.sql` 手寫 DDL 定義 User/Category/SkillItem/Favorite 四張表，`src/database/migrate.js` 提供獨立指令（`npm run db:migrate`）套用 schema（不在服務啟動時自動執行，避免正式環境每次重啟都對正式資料庫跑 DDL）；`src/database/repositories/` 用參數化 SQL 查詢包裝統一的資料庫存取層，維持 service 層只依賴 repository 介面的原則。此方案犧牲了 ORM 的型別產生與自動 migration 追蹤能力，換取單一 SQL 方言（本地與正式環境行為完全一致，不會有方言落差）與初學者可直接練習、看得懂的原生 SQL，符合本專案 CommonJS/教學導向的定位。
   - **本地開發預設免安裝**：`src/database/db.js` 依 `DATABASE_URL` 是否設定自動切換後端——沒設定就用內嵌的 **PGlite**（`@electric-sql/pglite`，把真正的 PostgreSQL 編譯成 WASM 直接跑在 Node.js 專案裡，SQL 語法與正式 PostgreSQL 完全相同，`npm install` 後不需要另外安裝或啟動任何資料庫服務）；有設定 `DATABASE_URL` 就改用 `pg`（node-postgres）連線池連過去。
   - **需要更貼近正式環境時可切換**：在 `.env.development` 設定 `DATABASE_URL` 指向 `docker-compose.yml` 跑起來的本地 PostgreSQL 容器，即可改用真正的 Docker PostgreSQL 開發測試；正式環境同樣透過 `.env.production` 的 `DATABASE_URL` 指向遠端/正式 PostgreSQL。三種情境（PGlite／本地 Docker／遠端正式）共用同一份 `schema.sql`、同一套 repository SQL，不需要改一行查詢邏輯。
3. **API 文件 Swagger 與 Scalar 並存**：`swagger-jsdoc` 產生 OpenAPI 規格、`swagger-ui-express` 與 `@scalar/express-api-reference` 共用同一份規格，提供兩種文件 UI 供選擇。
4. **測試框架採用 Vitest**：以 `vitest` 作為單元/整合測試框架，測試檔放於 `tests/`，`npm test` 執行 `vitest run`。

## 十一、專案資料夾結構

```
prompt-alchemy-server/
├── src/
│   ├── config/            # 環境變數、資料庫連線、Swagger/Scalar 設定
│   ├── controllers/       # auth、category、skill、favorite、admin controller
│   ├── database/
│   │   ├── db.js           # 統一的 query(text, params)：無 DATABASE_URL 用內嵌 PGlite，有則用 pg.Pool
│   │   ├── schema.sql      # User/Category/SkillItem/Favorite 手寫 DDL（PostgreSQL）
│   │   ├── migrate.js      # 手動套用 schema.sql（npm run db:migrate）
│   │   ├── seed.js         # 初始資料（admin/member 帳號、範例 category/skill）
│   │   └── repositories/   # 各資源 repository（呼叫 db.js 的 query()，參數化 SQL）
│   ├── middlewares/       # JWT 驗證、member/admin 角色檢查、錯誤處理
│   ├── routes/            # health、auth、categories、skills、favorites、admin 路由
│   ├── services/          # 對應各資源的商業邏輯
│   └── utils/             # 密碼雜湊、JWT 簽發/驗證等工具函式
├── docker-compose.yml     # 本地 PostgreSQL 容器定義
├── docs/
│   ├── openapi/           # OpenAPI 規格檔（swagger-ui-express 與 scalar 共用）
│   └── plan.md            # 本計畫書
├── tests/                 # 單元/整合測試（Vitest）
├── .env.example
├── .gitignore
└── package.json
```

已安裝套件：`express`、`cors`、`dotenv`、`jsonwebtoken`、`bcrypt`、`swagger-jsdoc`、`swagger-ui-express`、`@scalar/express-api-reference`、`pg`（PostgreSQL driver，連 Docker/遠端時使用）、`@electric-sql/pglite`（本地開發預設的內嵌 PostgreSQL，免安裝）、`vitest`（devDependencies，測試框架，`npm test` 對應 `vitest run`）。想改連本地 Docker PostgreSQL 才需要啟動 `docker-compose.yml`，非必要 npm 套件。

本階段僅完成專案骨架（資料夾與套件安裝），尚未撰寫任何商業邏輯程式碼，後續依上方 API 規格與資料規格分工實作。
