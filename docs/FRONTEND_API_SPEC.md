# 前端 & 後台全站 API 需求與規格文件 (Prompt Alchemy API Specification)

本文件完整整理前端前台 (`Prompt-Alchemy`) 與後台管理介面 (`/admin`) 所需的所有 API 規格，提供給前後端工程師作為系統設計、開發與對接參考。

> **2026-08-10 校對說明**：第 4、5、6、8 節已對照目前實際程式碼（`src/routes`／`src/controllers`）與正式環境資料庫（`agent_skill`／`favorite` 表）重新核對並修正——先前版本記錄的部分端點（例如 `PATCH /admin/skills/:id/active`、`POST /admin/users`、`GET /utility/categories`）**目前程式碼裡並不存在**，已標註清楚哪些是真的可以呼叫、哪些是尚未實作的落差，避免前端照著舊文件串接踩空。
>
> **2026-08-11 新增**：05 號票（Recipe 管理）後端 API 已完成，新增第 10 節。前台可讓已登入會員建立自訂命名的 Recipe，把已收藏的 Agent Skill 加入一個或多個 Recipe，之後改名、刪除、檢視內容。**每個會員註冊時，後端會自動建立一個名稱固定為 `Default`、內容為空的 Recipe**，前端不需要另外呼叫 API 建立這個預設 Recipe，直接呼叫 10.1 清單就看得到。同時已補上 4.1 節 `GET /favorites?itemType=skill` 回傳物件的 `favorite_id` 欄位——串接 Recipe 加入/移除項目功能需要用到這個欄位，不是 Agent Skill 的 `id`，串接前請看第 10 節最上方的提示。

---

## 📋 目錄
1. [通用規範 (General Specs)](#1-通用規範-general-specs)
2. [認證與會員模組 (Auth & User Module)](#2-認證與會員模組-auth--user-module)
3. [前台 Prompt / Skill 模組](#3-前台-prompt--skill-模組)
4. [前台會員收藏清單模組 (Favorites Module)](#4-前台會員收藏清單模組-favorites-module)
5. [通用選單與參數模組 (Utility & Parameters)](#5-通用選單與參數模組-utility--parameters)
6. [後台 Prompt / Skill 管理模組 (Admin Skills)](#6-後台-prompt--skill-管理模組-admin-skills)
7. [後台分類標籤參數管理模組 (Admin Parameters)](#7-後台分類標籤參數管理模組-admin-parameters)
8. [後台會員管理模組 (Admin Users)](#8-後台會員管理模組-admin-users)
9. [前台 Agent Skills 模組 (Agent Skills Module)](#9-前台-agent-skills-模組-agent-skills-module)
10. [前台會員 Recipe 管理模組 (Recipes Module)](#10-前台會員-recipe-管理模組-recipes-module)

---

## 1. 通用規範 (General Specs)

### Base URL
* **開發環境**：`http://localhost:3000` (或可透過 `.env` 的 `VITE_API_BASE_URL` 設定)
* **正式環境**：`https://api.promptalchemy.com`

### HTTP Client & Request Header (Axios)
* 前端使用 Axios 客戶端（`src/api/apiClient.js`），配有 Request 與 Response 攔截器：
  * **Request 攔截器**：若 `localStorage` 存在 `token`，自動注入 Authorization Header。
  * **Response 攔截器**：自動解包 `response.data`，並統一捕獲 4xx/5xx 及網路連線異常。
* 需要驗證的 API Header：
  ```http
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json
  ```

### 統一回應 JSON 結構
* **成功回應 (200 / 201)**:
  ```json
  {
    "status": "success",
    "message": "描述文字",
    "data": { ... }
  }
  ```
* **失敗回應 (400 / 401 / 403 / 404 / 500)**:
  ```json
  {
    "status": "error",
    "message": "錯誤原因說明"
  }
  ```

---

## 2. 認證與會員模組 (Auth & User Module)

### 2.1 會員註冊
* **Endpoint**: `POST /auth/register`
* **Auth**: 無需 Token
* **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "name": "使用者名稱",
    "password": "Password123"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "status": "success",
    "message": "註冊成功",
    "data": {
      "id": "user-uuid-0001",
      "email": "user@example.com",
      "name": "使用者名稱"
    }
  }
  ```

### 2.2 會員 / 管理者登入
* **Endpoint**: `POST /auth/login`
* **Auth**: 無需 Token
* **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### 2.3 取得目前登入者個人資料
* **Endpoint**: `GET /auth/me`
* **Auth**: `Authorization: Bearer <token>`
* **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "user": {
      "id": "user-uuid-0001",
      "email": "user@example.com",
      "name": "使用者名稱",
      "role": "member" // 或 "admin"
    }
  }
  ```

### 2.4 會員登出
* **Endpoint**: `POST /auth/logout`
* **Auth**: `Authorization: Bearer <token>`
* **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "已登出"
  }
  ```

---

## 3. 前台 Prompt / Skill 模組

### 範例輸出區塊格式說明 (exampleOutput)
Prompt 的範例輸出已升級為可動態增減與排序的**區塊陣列 (Block Array)**：
```json
[
  { "type": "text", "data": { "context": "輸出文字內容..." }, "seq": 0 },
  { "type": "image", "data": { "context": "https://example.com/image.png", "alt": "圖片說明", "caption": "圖說" }, "seq": 1 },
  { "type": "video", "data": { "context": "https://example.com/demo.mp4", "alt": "影片說明", "caption": "圖說" }, "seq": 2 },
  { "type": "html", "data": { "context": "https://example.com/demo.html", "alt": "HTML 說明", "caption": "圖說" }, "seq": 3 }
]
```
* `type`: `"text"` | `"image"` | `"video"` | `"html"`
* `data.context`: 必填。`text` 為純文字；`image` / `video` / `html` 為目標網址。
* `data.alt` / `data.caption`: 選填，僅 `image` / `video` / `html` 包含。
* `seq`: 排序序號 (從 0 開始整數)。

### 3.1 取得上架中的 Prompt 列表
* **Endpoint**: `GET /prompts`
* **Auth**: 無需 Token
* **Query Parameters (可選)**:
  * `category`: 分類篩選 ID
  * `tag`: 標籤篩選 ID
  * `search`: 關鍵字搜尋
* **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "prompt-uuid-0001",
        "title": "後端 API 審查",
        "slug": "backend-api-review",
        "intro": "檢查 Express / Next.js API 的錯誤處理、安全性與回傳結構。",
        "contentTypeId": "ct-prompt-uuid-0001",
        "modelType": ["GPT-4", "Claude 3.5 Sonnet"],
        "promptContent": "請你扮演資深後端工程師...",
        "useCase": "程式碼審查",
        "exampleInput": "router.post('/login', ...)",
        "exampleOutput": [
          {
            "type": "text",
            "data": { "context": "建議修改程式碼如下：..." },
            "seq": 0
          },
          {
            "type": "image",
            "data": { "context": "https://example.com/result.png", "alt": "架構圖", "caption": "輸出範例圖" },
            "seq": 1
          }
        ],
        "categoryId": "param-cat-backend",
        "category": "後端開發",
        "tags": ["Node.js", "Express", "Security"],
        "sourceUrl": "https://example.com",
        "copyCount": 15,
        "favoriteCount": 42,
        "isNew": true,
        "isHot": true,
        "isActive": true,
        "createdAt": "2026-06-25T08:00:00Z",
        "updatedAt": "2026-06-25T08:00:00Z"
      }
    ]
  }
  ```

### 3.2 取得單一 Prompt 詳細內容
* **Endpoint**: `GET /prompts/:id`
* **Auth**: 無需 Token
* **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "data": {
      "id": "prompt-uuid-0001",
      "title": "後端 API 審查",
      "slug": "backend-api-review",
      "intro": "檢查 Express API 結構",
      "contentTypeId": "ct-prompt-uuid-0001",
      "modelType": ["GPT-4", "Claude 3.5"],
      "promptContent": "請你扮演資深後端工程師...",
      "useCase": "程式碼審查",
      "exampleInput": "router.post('/login')",
      "exampleOutput": [
        {
          "type": "text",
          "data": { "context": "詳細說明..." },
          "seq": 0
        }
      ],
      "categoryId": "param-cat-backend",
      "category": "後端開發",
      "tags": ["Node.js", "Express"],
      "copyCount": 16,
      "favoriteCount": 43,
      "isActive": true,
      "createdAt": "2026-06-25T08:00:00Z"
    }
  }
  ```

### 3.3 增加 Prompt 複製使用次數
* **Endpoint**: `POST /prompts/:id/copy`
* **Auth**: 無需 Token
* **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "複製次數已累加",
    "data": {
      "id": "prompt-uuid-0001",
      "copyCount": 16
    }
  }
  ```

---

## 4. 前台會員收藏清單模組 (Favorites Module)

> **2026-08-11 更新**：04 號票（Skill 收藏通用化）已完成後端部分——`GET /favorites`、`GET /favorites/:skillId/status`、`POST /favorites/:skillId/toggle` 三支都新增了 `itemType` query 參數（允許值：`prompt`（預設）、`skill`），可以用同一組端點收藏/查詢 Agent Skill，不用另外開新路由。省略 `itemType` 時行為跟以前完全一樣（Prompt 收藏），既有前端串接不用改就能繼續動。`itemType=skill` 時，`skillId` 路徑參數要傳 Agent Skill 的 `id`（不是 Prompt 的 id），操作對象改成 `agent_skill.favorite_count`，跟 Prompt 的 `skill_item.favorite_count` 完全分開計算、互不影響。
>
> `DELETE /favorites`（清除全部收藏）與 `POST /favorites/defaults`（恢復預設收藏）**維持只操作 Prompt**，尚未擴充支援 `itemType`——呼叫這兩支不會影響、也不會清除 Skill 收藏。
>
> 前台「愛心圖示」「我的收藏頁 Skill 區塊」等 UI 尚未實作，屬於前端待辦，後端 API 已經備妥可以直接串接。

### 4.1 取得我的收藏清單（完整資料，非僅 ID）
* **Endpoint**: `GET /favorites`
* **Auth**: `Authorization: Bearer <token>`
* **Query Parameters (可選)**: `itemType`：`prompt`（預設）| `skill`
* **Response (200 OK)，`itemType` 省略或 `prompt`**：回傳每筆已收藏 Prompt 的**完整資料**（不是只有 ID 陣列），欄位為資料庫原始 snake_case 命名，額外帶 `favorited_at`／`sort_order`／`category_name`：
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "9fcf96a4-eb05-4d4a-b7e2-fdb4b2da87f6",
        "title": "後端 API 審查",
        "slug": "backend-api-review",
        "intro": "檢查 Express / Next.js API 的錯誤處理、安全性與回傳結構。",
        "content_type_id": "62891464-fb7e-4295-b544-a3b78936722b",
        "model_type": ["GPT-4"],
        "prompt_content": "請你扮演資深後端工程師...",
        "category_id": "5f40e0ac-86d0-4b9c-9573-351e9da96775",
        "category_name": "後端開發",
        "tags": ["Node.js"],
        "copy_count": 125,
        "favorite_count": 32,
        "is_active": true,
        "created_at": "2026-06-25T08:00:00Z",
        "updated_at": "2026-06-25T08:00:00Z",
        "favorited_at": "2026-08-01T09:00:00Z",
        "sort_order": 0
      }
    ]
  }
  ```
* **Response (200 OK)，`itemType=skill`**：回傳每筆已收藏 Agent Skill 的完整資料（欄位同第 9 節 `GET /agent-skills` 的單筆物件，但一樣是 snake_case），額外帶 `favorite_id`（這筆收藏紀錄自己的 id，串接第 10 節 Recipe 的加入/移除項目 API 要用這個，不是 Agent Skill 的 `id`）／`favorited_at`／`sort_order`：
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "agent-skill-uuid-0001",
        "name": "matt",
        "repo_owner": "mattpocock",
        "repo_name": "skills",
        "skill_slug": "*",
        "category_name": "小工具",
        "stargazers_count": 210731,
        "favorite_count": 6,
        "claude_install_method": true,
        "codex_install_method": true,
        "claude_plugin_name": "mattpocock-skills",
        "claude_marketplace_name": "mattpocock",
        "git_clone_method": false,
        "doc_url": "https://raw.githubusercontent.com/mattpocock/skills/main/README.md",
        "favorite_id": 42,
        "favorited_at": "2026-08-11T09:00:00Z",
        "sort_order": 0
      }
    ]
  }
  ```

### 4.2 清除我的所有收藏
* **Endpoint**: `DELETE /favorites`
* **Auth**: `Authorization: Bearer <token>`
* **說明**：**不支援 `itemType`**，一律清除該使用者全部收藏（Prompt + Skill）。
* **Response (200 OK)**：
  ```json
  {
    "status": "success",
    "data": {
      "favoriteIds": [],
      "favoriteCounts": { "9fcf96a4-eb05-4d4a-b7e2-fdb4b2da87f6": 31 }
    }
  }
  ```

### 4.3 檢查單一 Prompt / Agent Skill 是否已收藏
* **Endpoint**: `GET /favorites/:skillId/status`（`skillId` 是路徑參數：`itemType=prompt` 時傳 Prompt 的 `id`，`itemType=skill` 時傳 Agent Skill 的 `id`）
* **Auth**: `Authorization: Bearer <token>`
* **Query Parameters (可選)**: `itemType`：`prompt`（預設）| `skill`
* **Response (200 OK)**：
  ```json
  { "status": "success", "data": { "isFavorited": true } }
  ```

### 4.4 切換收藏狀態（新增/取消）
* **Endpoint**: `POST /favorites/:skillId/toggle`（`skillId` 是路徑參數，不是 Request Body；`itemType=prompt` 時傳 Prompt 的 `id`，`itemType=skill` 時傳 Agent Skill 的 `id`）
* **Auth**: `Authorization: Bearer <token>`
* **Query Parameters (可選)**: `itemType`：`prompt`（預設）| `skill`。`skill` 時切換完成後重算的是 `agent_skill.favorite_count`
* **Response (200 OK)**：
  ```json
  {
    "status": "success",
    "data": { "isFavorited": true, "favoriteCount": 33 }
  }
  ```
* **Response (400 Bad Request)**：`itemType` 不是 `prompt` 或 `skill`。
  ```json
  { "status": "error", "message": "itemType 必須是 prompt 或 skill" }
  ```

### 4.5 恢復預設收藏
* **Endpoint**: `POST /favorites/defaults`
* **Auth**: `Authorization: Bearer <token>`
* **說明**：清空目前收藏後，寫回 `src/config/favorite.config.js` 定義的預設收藏清單。
* **Response (200 OK)**：
  ```json
  {
    "status": "success",
    "data": {
      "favoriteIds": ["9fcf96a4-eb05-4d4a-b7e2-fdb4b2da87f6", "6d56531f-a28f-4ebe-977f-5d6222cab34e"],
      "favoriteCounts": { "9fcf96a4-eb05-4d4a-b7e2-fdb4b2da87f6": 32 }
    }
  }
  ```

---

## 5. 通用選單與參數模組 (Utility & Parameters)

### 5.1 取得分類選單列表
* **Endpoint**: `GET /utility/categories`
* **Auth**: 無需 Token
* **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "data": [
      { "id": "cat-1", "name": "程式開發 / 開發輔助", "slug": "dev" },
      { "id": "cat-2", "name": "文案創作 / 行銷", "slug": "marketing" },
      { "id": "cat-3", "name": "設計 / UX", "slug": "design" }
    ]
  }
  ```

### 5.2 取得標籤清單
* **Endpoint**: `GET /utility/tags`
* **Auth**: 無需 Token
* **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "data": [
      { "id": "tag-1", "name": "React" },
      { "id": "tag-2", "name": "Node.js" },
      { "id": "tag-3", "name": "Prompt 工程" }
    ]
  }
  ```

---

## 6. 後台 Prompt / Skill 管理模組 (Admin Skills)

> **注意 (狀態說明)**：後台狀態已簡化為布林值 `isActive` (啟用 / 未啟用)，相容舊資料欄位 `is_active`。已移除原有的 `status` 欄位 ("draft" / "published" / "archived")。

### 6.1 取得後台 Prompt 列表
* **Endpoint**: `GET /admin/skills`
* **Auth**: `Authorization: Bearer <admin_token>`
* **Query Parameters (可選)**:
  * `keyword`: 關鍵字搜尋
  * `contentTypeId`: 資料類型 ID
  * `categoryId`: 分類 ID
  * `active`: `active` (僅看啟用) | `inactive` (僅看未啟用)
* **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "prompt-uuid-0001",
        "title": "後端 API 審查",
        "intro": "簡介說明",
        "contentTypeId": "ct-1",
        "categoryId": "cat-1",
        "tags": ["tag-1"],
        "exampleOutput": [
          {
            "type": "text",
            "data": { "context": "範例輸出文字" },
            "seq": 0
          }
        ],
        "isActive": true,
        "copyCount": 15,
        "favoriteCount": 42,
        "createdAt": "2026-06-25T08:00:00Z",
        "updatedAt": "2026-06-25T08:00:00Z"
      }
    ]
  }
  ```

### 6.2 新增 Prompt
* **Endpoint**: `POST /admin/skills`
* **Auth**: `Authorization: Bearer <admin_token>`
* **Request Body**:
  ```json
  {
    "title": "新 Prompt 標題",
    "slug": "new-prompt-slug",
    "intro": "簡介說明",
    "contentTypeId": "ct-1",
    "categoryId": "cat-1",
    "modelType": ["model-1"],
    "tags": ["tag-1", "tag-2"],
    "promptContent": "Prompt 詳細內容...",
    "useCase": "使用場景說明",
    "exampleInput": "範例輸入",
    "exampleOutput": [
      {
        "type": "text",
        "data": { "context": "範例輸出文字" },
        "seq": 0
      },
      {
        "type": "image",
        "data": {
          "context": "https://example.com/demo.png",
          "alt": "示意圖",
          "caption": "範例圖說"
        },
        "seq": 1
      }
    ],
    "isActive": true
  }
  ```
* **Response (201 Created)**

### 6.3 修改 Prompt
* **Endpoint**: `PUT /admin/skills/:id`
* **Auth**: `Authorization: Bearer <admin_token>`
* **Request Body**: (同新增欄位，支援部分或完整更新)

### 6.4 切換 Prompt 啟用/停用狀態
* **Endpoint**: `PATCH /admin/skills/:id/active`
* **Auth**: `Authorization: Bearer <admin_token>`
* **Request Body**:
  ```json
  {
    "isActive": false
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "Prompt 狀態已更新"
  }
  ```

### 6.5 刪除 Prompt
* **Endpoint**: `DELETE /admin/skills/:id`
* **Auth**: `Authorization: Bearer <admin_token>`

---

## 7. 後台分類標籤參數管理模組 (Admin Parameters)

### 7.1 取得所有參數列表 (分類/標籤/模型)
* **Endpoint**: `GET /admin/parameters`
* **Auth**: `Authorization: Bearer <admin_token>`
* **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "param-1",
        "name": "程式開發",
        "type": "category", // "category" | "tag" | "model" | "content_type" | "role"
        "slug": "dev",
        "sortOrder": 1,
        "isActive": true
      }
    ]
  }
  ```

### 7.2 新增 / 修改 / 刪除參數
* **新增**: `POST /admin/parameters` (`{ "name": "新分類", "type": "category", "description": "", "isActive": true }`)
* **修改**: `PUT /admin/parameters/:id` (`{ "name": "新名稱", "description": "說明", "isActive": true }`)
* **切換狀態**: `PATCH /admin/parameters/:id/active` (`{ "isActive": true }`)
* **刪除**: `DELETE /admin/parameters/:id`

---

## 8. 後台會員管理模組 (Admin Users)

### 8.1 取得會員清單 (管理員)
* **Endpoint**: `GET /admin/users`
* **Auth**: `Authorization: Bearer <admin_token>`
* **Query Parameters (可選)**: `search`, `role`, `isActive`
* **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "user-1",
        "name": "張小明",
        "email": "user@example.com",
        "role": "member", // "member" | "admin"
        "isActive": true,
        "createdAt": "2026-06-01T08:00:00Z"
      }
    ]
  }
  ```

### 8.2 新增 / 修改 / 停用會員
* **新增會員**: `POST /admin/users`
* **修改會員資料**: `PUT /admin/users/:id` (修改 name, role, email, isActive)
* **切換啟用狀態**: `PATCH /admin/users/:id/active` (`{ "isActive": false }`)
* **刪除會員**: `DELETE /admin/users/:id`

---

## 9. 前台 Agent Skills 模組 (Agent Skills Module)

「Agent Skill」是可以安裝進 Claude Code / Codex 的技能套件（一份 `SKILL.md` + 附屬檔案），跟給人閱讀的 Prompt 是完全獨立的實體。本站**不代管、不鏡像**任何 Skill 內容，只存座標（來源 repo、分類等 metadata），實際安裝一律即時向 GitHub 抓取最新版本。

### 安裝機制核心概念（串接 9.3 之前必看）

每筆 Agent Skill 會用以下欄位描述「這支 Skill 在 Claude Code / Codex 上各自能不能裝、要用哪種方式裝」，全部由 Admin 人工判斷填寫：

> **這兩個 agent 的安裝機制完全獨立、各自最多一種、不並存**：Claude Code 一律走 Claude Plugin（絕不是 npx），Codex 一律走 npx（絕不是 claude plugins）。同一個欄位（例如 `claudeInstallMethod`）只會決定「這個 agent 有沒有提供安裝」，機制本身是固定的，不是可選的。

**Claude Plugin 安裝有兩種形狀**（差別在 `claudeMarketplaceName` 有沒有值，前端據此在 SkillCard 顯示 **Full package／Single kit** 徽章）：

* **整包安裝 Full package**（`claudeMarketplaceName === null`）：`claude plugin install <claudePluginName>` 一行。例：`claude plugin install mattpocock-skills`
* **單一元件安裝 Single kit**（`claudeMarketplaceName` 有值）：`claude plugin marketplace add <repoOwner>/<repoName>` + `claude plugin install <claudePluginName>@<claudeMarketplaceName>` 兩行。例：`claude plugin install frontend-design@claude-plugins-official`

| 欄位 | 型別 | 說明 |
|---|---|---|
| `claudeInstallMethod` | boolean | `true` 代表 Claude Code 提供安裝，**一律走 Claude Plugin**（`claude plugin install`，視 `claudeMarketplaceName` 有無決定要不要加一行 `claude plugin marketplace add`），**絕不產生 npx 指令**。`true` 時 `claudePluginName` 一定有填（雙向綁定） |
| `codexInstallMethod` | boolean | `true` 代表 Codex 提供安裝，**一律走 npx**（`npx skills add ... -a codex`），Codex 沒有 plugin 機制 |
| `claudePluginName` | string \| null | Claude Plugin 名稱。只有 `claudeInstallMethod=true` 時才會有值，`claudeInstallMethod=false` 時一定是 `null` |
| `claudeMarketplaceName` | string \| null | **選填**，與 `claudePluginName` 不再雙向綁定：`null` 代表整包安裝（Full package，見上），有值代表單一元件安裝（Single kit，見上）。只有 `claudePluginName` 有值時 `claudeMarketplaceName` 才可能有值 |
| `gitCloneMethod` | boolean | `true` 代表兩個 agent 都不提供安裝（可能是 npx 會裝壞、也可能是該 repo 沒有對應的 Claude Plugin），改用 `git clone` 保底，不分 agent。這種情況下 `claudeInstallMethod`／`codexInstallMethod`／`claudePluginName`／`claudeMarketplaceName` 全部是 `false`／`null` |

**`skillSlug` 補充**：只有 Codex（走 npx）才會用到這個欄位。大部分是單一 skill 的資料夾名稱（例如 `frontend-design`），少數代表「整個來源 repo 一次全裝」時會是萬用字元 `'*'`——前端不需要特別處理，畫面上顯示 `name`／`description` 即可，不用把 `skillSlug` 顯示給使用者看。

**前端串接安裝功能的判斷邏輯**：

1. 若 `gitCloneMethod === true` → **不需要讓使用者選擇目標 agent**，直接顯示一顆「複製 git clone 指令」按鈕即可（呼叫 9.3 的 API 時 `agent` 帶哪個值結果都一樣）。
2. 否則，依 `claudeInstallMethod` / `codexInstallMethod` 決定要顯示哪些 agent 按鈕（兩個都 `true` 就顯示「Claude Code」「Codex」兩個按鈕；只有一個是 `true` 就只顯示那一個，避免使用者選了卻拿到空陣列）。
3. 使用者選定 agent 後，呼叫 9.3 API 拿到 `commands` 陣列並顯示——**選 Claude Code 拿到 Claude Plugin 指令（Full package 1 行／Single kit 2 行），選 Codex 一定拿到 npx 的一行指令，兩者不會混在一起，也不會同時出現**。

### 9.1 取得上架中的 Agent Skill 列表
* **Endpoint**: `GET /agent-skills`
* **Auth**: 無需 Token
* **Query Parameters (可選)**:
  * `keyword`: 關鍵字搜尋（比對 name / intro）
  * `categoryId`: 分類篩選 ID
* **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "agent-skill-uuid-0001",
        "name": "matt",
        "description": "Skills For Real Engineers",
        "intro": "",
        "repoOwner": "mattpocock",
        "repoName": "skills",
        "skillSlug": "*",
        "creatorName": "mattpocock",
        "creatorAvatarUrl": "https://avatars.githubusercontent.com/u/28293365?v=4",
        "creatorProfileUrl": "https://github.com/mattpocock",
        "license": "MIT",
        "categoryId": "param-cat-tool",
        "category": "小工具",
        "stargazersCount": 210731,
        "copyCount": 12,
        "favoriteCount": 5,
        "isHot": true,
        "isActive": true,
        "claudeInstallMethod": true,
        "codexInstallMethod": true,
        "claudePluginName": "mattpocock-skills",
        "claudeMarketplaceName": null,
        "gitCloneMethod": false,
        "docUrl": "https://raw.githubusercontent.com/mattpocock/skills/main/README.md",
        "createdAt": "2026-08-01T08:00:00Z",
        "updatedAt": "2026-08-01T08:00:00Z"
      }
    ]
  }
  ```
  > 上面這筆 `skillSlug: "*"` 代表「整個 mattpocock/skills repo 一次全裝」，不是單一 skill——`matt`／`.NET Agent Skills`／`anthropic/skills` 這幾筆都是這種「整包」條目；`frontend-design`／`lazy-senior` 這種才是單一 skill 條目，`skillSlug` 會是真正的資料夾名稱。
  > 這筆 `claudeMarketplaceName: null` 對應 **Full package** 形狀（`claude plugin install mattpocock-skills`，1 行）；`frontend-design@claude-plugins-official` 這種 `claudeMarketplaceName` 有值的才是 **Single kit** 形狀（2 行，見 9.3）。

### 9.2 取得單一 Agent Skill 詳細內容
* **Endpoint**: `GET /agent-skills/:id`
* **Auth**: 無需 Token
* **Response (200 OK)**: 欄位同 9.1 單筆物件。
* **Response (404)**: 該 Skill 不存在或未上架。
* **`docUrl` 說明**：若不是 `null`，是一個 `raw.githubusercontent.com` 的純文字網址（README.md 優先、沒有才用 SKILL.md），該網域**開放 CORS**，前端可以直接在瀏覽器用 `fetch(docUrl)` 拿到 Markdown 原文自行渲染，**不需要透過本站後端代理**。若為 `null`，代表尚未核實，請改顯示 `intro` 欄位，不要顯示空白區塊。

### 9.3 依目標 agent 取得安裝指令 ⭐
* **Endpoint**: `GET /agent-skills/:id/install-command`
* **Auth**: 無需 Token
* **Query Parameters (必填)**:
  * `agent`: `claude-code` | `codex`（其他值會回 400）
* **Response (200 OK)，`agent=claude-code`，Full package（`claudeMarketplaceName=null`，1 行）**：
  ```json
  {
    "status": "success",
    "data": {
      "commands": [
        "claude plugin install mattpocock-skills"
      ]
    }
  }
  ```
* **Response (200 OK)，`agent=claude-code`，Single kit（`claudeMarketplaceName` 有值，2 行）**：
  ```json
  {
    "status": "success",
    "data": {
      "commands": [
        "claude plugin marketplace add anthropics/skills",
        "claude plugin install document-skills@anthropic-agent-skills"
      ]
    }
  }
  ```
* **Response (200 OK)，`agent=codex`（一律 npx，1 行）**：
  ```json
  {
    "status": "success",
    "data": {
      "commands": [
        "npx skills add mattpocock/skills --skill '*' -a codex"
      ]
    }
  }
  ```
  * `commands` 是**字串陣列**，每個字串是一行完整、可以直接複製貼上終端機執行的指令。陣列長度依情況而定：
    * `agent=claude-code`：依 `claudeMarketplaceName` 有無決定 1 行（Full package，只有 `claude plugin install`）或 2 行（Single kit，多一行 `claude plugin marketplace add`），如上兩例。
    * `agent=codex`：固定 1 行 npx 指令。
    * `gitCloneMethod=true`：固定 1 行 `git clone https://github.com/<owner>/<repo>.git`，不分 `agent` 帶哪個值。
    * 若該 skill 對這個 agent 完全不提供安裝（例如 `claudeInstallMethod=false` 卻選了 `agent=claude-code`），會回傳**空陣列** `[]`——正常情況下前端不該讓使用者選到這個 agent（見上方判斷邏輯第 2 點），但仍要處理空陣列（顯示「此 Skill 不支援此 agent」之類的訊息，不要顯示空白區塊）。
  * 請把整個陣列都顯示出來（例如用多行 code block），不要只取 `commands[0]`。
* **Response (400 Bad Request)**：`agent` 不是 `claude-code` 或 `codex`。
  ```json
  { "status": "error", "message": "不支援的目標 Agent：xxx" }
  ```
* **Response (404 Not Found)**：Skill 不存在或未上架。

### 9.4 增加安裝指令複製次數
* **Endpoint**: `POST /agent-skills/:id/copy`
* **Auth**: 無需 Token
* **使用時機**：使用者按下「複製」按鈕、把 9.3 回傳的任一行指令複製到剪貼簿之後呼叫一次（不分是複製了 npx 版還是 plugin 版還是 git clone，同一顆按鈕、同一次複製動作只呼叫一次即可，這是單純的熱門度統計，不是每行分開計數）。
* **Response (200 OK)**：
  ```json
  {
    "status": "success",
    "message": "複製次數已累加",
    "data": { "id": "agent-skill-uuid-0001", "copyCount": 13 }
  }
  ```

---

## 10. 前台會員 Recipe 管理模組 (Recipes Module)

「Recipe」是會員自己命名的收藏分類（例如「面試準備」「週報用」），底下可以放一個或多個**已收藏的 Agent Skill**。刪除 Recipe、或從 Recipe 移除項目，都**不會**取消該 Skill 本身的收藏狀態；反過來，加入 Recipe 前也**必須**該 Skill 已經被收藏過，沒收藏就加不進去。目前只支援 Agent Skill（`favorite.item_type='skill'`），不支援把 Prompt 收藏加進 Recipe。

> **會員註冊會自動建立一個預設 Recipe**：名稱固定為 `Default`、底下沒有任何項目，不需要前端另外呼叫 10.2 建立。使用者可以直接對這個 Recipe 呼叫 10.4 改名或 10.5 刪除，跟自己建立的 Recipe 沒有差別待遇。
>
> **串接注意**：Recipe 的加入/移除項目 API（10.6／10.7）用的識別碼是 `favoriteId`（`favorite` 資料表這筆收藏紀錄自己的 `id`，型別是數字），**不是** Agent Skill 的 `id`（UUID）。這個 `favoriteId` 要從 4.1 節 `GET /favorites?itemType=skill` 回傳物件裡的 `favorite_id` 欄位拿，或是 10.3／10.6／10.7 回傳的 `items[].favorite_id`。

### 10.1 取得我的 Recipe 清單
* **Endpoint**: `GET /me/recipes`
* **Auth**: `Authorization: Bearer <token>`
* **Response (200 OK)**：依建立時間新到舊排序，只有 Recipe 本身的資料，不含底下的 Skill 清單（要看內容請呼叫 10.3）。新會員一開始至少會看到一筆 `name: "Default"` 的 Recipe：
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "9b1e2f3a-1111-4a2b-8c3d-4e5f6a7b8c9d",
        "user_id": "user-uuid-0001",
        "name": "面試準備",
        "created_at": "2026-08-11T09:00:00Z",
        "updated_at": "2026-08-11T09:00:00Z"
      }
    ]
  }
  ```

### 10.1a 一次取得我名下所有 Recipe 的收藏配對（效能優化，加速收藏清單頁的 Recipe 標籤）

* **Endpoint**: `GET /me/recipe-items`
* **Auth**: `Authorization: Bearer <token>`
* **使用時機**：收藏清單頁要在每一筆收藏旁邊標示「屬於哪些 Recipe」時，**用這支端點一次拿全部配對**，前端在本地組出 `favoriteId → [recipeId, ...]` 的對照表，不要為了同樣的目的對每個 Recipe 各呼叫一次 10.3（那樣是 1+N 次請求，Recipe 一多畫面會明顯變慢）。
* **Response (200 OK)**：陣列，每個元素是一組配對，沒有巢狀結構：
  ```json
  {
    "status": "success",
    "data": [
      { "recipe_id": "9b1e2f3a-1111-4a2b-8c3d-4e5f6a7b8c9d", "favorite_id": 42 },
      { "recipe_id": "9b1e2f3a-1111-4a2b-8c3d-4e5f6a7b8c9d", "favorite_id": 43 },
      { "recipe_id": "a2c3d4e5-2222-4a2b-8c3d-4e5f6a7b8c9e", "favorite_id": 42 }
    ]
  }
  ```
  > 上例代表 `favorite_id: 42` 同時被加進了兩個 Recipe，`favorite_id: 43` 只在第一個 Recipe 裡。

### 10.2 建立 Recipe
* **Endpoint**: `POST /me/recipes`
* **Auth**: `Authorization: Bearer <token>`
* **Request Body**:
  ```json
  { "name": "面試準備" }
  ```
* **Response (201 Created)**：
  ```json
  {
    "status": "success",
    "data": {
      "id": "9b1e2f3a-1111-4a2b-8c3d-4e5f6a7b8c9d",
      "user_id": "user-uuid-0001",
      "name": "面試準備",
      "created_at": "2026-08-11T09:00:00Z",
      "updated_at": "2026-08-11T09:00:00Z"
    }
  }
  ```
* **Response (400 Bad Request)**：`name` 空白或未帶。
  ```json
  { "status": "error", "message": "請輸入 Recipe 名稱" }
  ```

### 10.3 取得單一 Recipe 內容（含底下的 Skill 清單）
* **Endpoint**: `GET /me/recipes/:id`
* **Auth**: `Authorization: Bearer <token>`
* **Response (200 OK)**：`items` 是這個 Recipe 底下的 Agent Skill 完整資料（欄位同 9.1 單筆物件，但一樣是 snake_case），額外帶 `favorite_id`（加入項目/移除項目要用的識別碼）與 `added_at`（加入 Recipe 的時間，不是收藏時間）：
  ```json
  {
    "status": "success",
    "data": {
      "id": "9b1e2f3a-1111-4a2b-8c3d-4e5f6a7b8c9d",
      "user_id": "user-uuid-0001",
      "name": "面試準備",
      "created_at": "2026-08-11T09:00:00Z",
      "updated_at": "2026-08-11T09:00:00Z",
      "items": [
        {
          "id": "agent-skill-uuid-0001",
          "name": "matt",
          "repo_owner": "mattpocock",
          "repo_name": "skills",
          "skill_slug": "*",
          "category_name": "小工具",
          "stargazers_count": 210731,
          "favorite_count": 6,
          "claude_install_method": true,
          "codex_install_method": true,
          "claude_plugin_name": "mattpocock-skills",
          "claude_marketplace_name": "mattpocock",
          "git_clone_method": false,
          "doc_url": "https://raw.githubusercontent.com/mattpocock/skills/main/README.md",
          "favorite_id": 42,
          "added_at": "2026-08-11T10:00:00Z"
        }
      ]
    }
  }
  ```
* **Response (404 Not Found)**：Recipe 不存在，或不屬於目前登入者。
  ```json
  { "status": "error", "message": "找不到指定的 Recipe" }
  ```

### 10.4 重新命名 Recipe
* **Endpoint**: `PATCH /me/recipes/:id`
* **Auth**: `Authorization: Bearer <token>`
* **Request Body**:
  ```json
  { "name": "面試準備（更新版）" }
  ```
* **Response (200 OK)**：回傳更新後的 Recipe（欄位同 10.1 單筆物件）。
* **Response (400 Bad Request)**：`name` 空白，訊息同 10.2。
* **Response (404 Not Found)**：Recipe 不存在，或不屬於目前登入者，訊息同 10.3。

### 10.5 刪除 Recipe
* **Endpoint**: `DELETE /me/recipes/:id`
* **Auth**: `Authorization: Bearer <token>`
* **說明**：連帶清除這個 Recipe 底下所有的項目關聯（`skill_recipe_item`），**不影響**任何 Skill 本身的收藏狀態。
* **Response (200 OK)**：
  ```json
  { "status": "success", "data": { "id": "9b1e2f3a-1111-4a2b-8c3d-4e5f6a7b8c9d", "deleted": true } }
  ```
* **Response (404 Not Found)**：Recipe 不存在，或不屬於目前登入者，訊息同 10.3。

### 10.6 把已收藏的 Skill 加入 Recipe
* **Endpoint**: `POST /me/recipes/:id/items`
* **Auth**: `Authorization: Bearer <token>`
* **Request Body**：`favoriteId` 是 `favorite` 這筆收藏紀錄自己的 `id`（見本節最上方「已知落差」），**不是** Agent Skill 的 `id`。
  ```json
  { "favoriteId": 42 }
  ```
* **Response (201 Created)**：回傳加入後、這個 Recipe 目前底下完整的 Skill 清單（陣列，欄位同 10.3 的 `items`）。
* **Response (404 Not Found)**，兩種情況訊息不同：
  * Recipe 不存在或不屬於自己：`{ "status": "error", "message": "找不到指定的 Recipe" }`
  * `favoriteId` 對應的收藏不存在、不屬於自己、或不是 Agent Skill 收藏（`item_type` 不是 `skill`）：
    ```json
    { "status": "error", "message": "這個 Skill 尚未被收藏，無法加入 Recipe" }
    ```
* 已經在 Recipe 裡的項目重複加入不會報錯，也不會產生重複資料（後端用複合主鍵擋重複）。

### 10.7 從 Recipe 移除項目
* **Endpoint**: `DELETE /me/recipes/:id/items/:favoriteId`
* **Auth**: `Authorization: Bearer <token>`
* **說明**：`favoriteId` 是路徑參數，同 10.6 的 `favoriteId`。只會拿掉這個 Skill 跟這個 Recipe 的關聯，**不會**取消該 Skill 本身的收藏狀態，其他 Recipe 裡若也有加這個 Skill 也不受影響。
* **Response (200 OK)**：回傳移除後、這個 Recipe 目前底下完整的 Skill 清單（欄位同 10.3 的 `items`）。
* **Response (404 Not Found)**：Recipe 不存在或不屬於自己，訊息同 10.3。（`favoriteId` 對應的項目本來就不存在時不會報錯，視為操作成功，清單原樣回傳。）
