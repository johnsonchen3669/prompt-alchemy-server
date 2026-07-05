# Prompt 鍊金坊 Prompt Alchemy — Server

Prompt/Skill 收藏庫：會員登入前台瀏覽、搜尋、篩選、收藏 Prompt/Skill 資料；管理者登入後台管理類別與資料的後端 API server。

## 技術棧

- Express 5、cors、dotenv
- 認證：jsonwebtoken、bcrypt
- API 文件：swagger-jsdoc + swagger-ui-express + `@scalar/express-api-reference`
- 測試：Vitest（`npm test` 對應 `vitest run`）
- 資料持久化：Prisma + SQLite（本機 `dev.db`），`src/database/repositories` 包裝 `PrismaClient`，未來可視需要換成 PostgreSQL

## 專案資料夾架構

```
prompt-alchemy-server/
├── src/
│   ├── config/
│   │   ├── env.js                       # 集中讀取/驗證環境變數（PORT, JWT_SECRET, DATABASE_URL）
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
│   │   ├── prisma.js                    # PrismaClient 單例，供所有 repository 共用
│   │   └── repositories/
│   │       ├── user.repository.js           # + findByEmail
│   │       ├── category.repository.js       # + hasRelatedSkills(categoryId)
│   │       ├── skillItem.repository.js      # + search({keyword, categoryId})，tags 於此層做 JSON 轉換
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
├── docs/
│   └── openapi/
│       └── components.yaml   # 共用 schema（User/Category/SkillItem/Favorite/ErrorResponse）+ bearerAuth 定義
│
├── tests/
│   ├── unit/
│   │   ├── utils/{password,jwt}.test.js
│   │   ├── repositories/{category,skillItem,favorite}.repository.test.js
│   │   └── services/{auth,category,skill,favorite}.service.test.js
│   ├── integration/
│   │   ├── health.test.js
│   │   ├── auth.test.js
│   │   ├── categories.test.js
│   │   ├── skills.test.js
│   │   ├── favorites.test.js
│   │   └── admin.test.js
│   └── helpers/
│       ├── buildTestApp.js    # require app + repositories.resetForTests()
│       └── authHelpers.js     # 直接呼叫 utils/jwt 產生測試用 admin/member token
│
├── app.js         # 組裝 express app（middleware/routes/docs/errorHandler），export app，不呼叫 listen
├── server.js      # require('./config/env') → require('./app') → app.listen(PORT)
├── .env.example
├── .gitignore
└── package.json
```

> 目前開發進度以由下往上（工具/資料層 → middleware → service → controller → route → API 文件 → 測試）逐步落地。

## API 路由

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

## 認證方式

Authorization Header 帶 Bearer JWT（無 cookie）。登入回傳 `{ token, user }`；`authenticate` middleware 驗證 token 並確認 user 仍存在後設定 `req.user`；`authorize(...roles)` 檢查角色。登入失敗與帳號不存在回傳同一則訊息，不透露帳號是否存在。

## 開發與執行

```bash
# 安裝套件
npm install

# 複製環境變數範例並填入 PORT、JWT_SECRET
cp .env.example .env

# 啟動伺服器
npm start

# 執行測試
npm test
```

啟動後可透過以下路徑查看 API 文件：

- `/openapi.json`：原始 OpenAPI 規格
- `/docs`：Swagger UI
- `/scalar`：Scalar API Reference
