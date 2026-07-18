# 前端 & 後台全站 API 需求與規格文件 (Prompt Alchemy API Specification)

本文件完整整理前端前台 (`Prompt-Alchemy`) 與後台管理介面 (`/admin`) 所需的所有 API 規格，提供給前後端工程師作為系統設計、開發與對接參考。

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

### 4.1 取得會員的收藏清單 ID 列表
* **Endpoint**: `GET /favorites`
* **Auth**: `Authorization: Bearer <token>`
* **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "data": [
      "prompt-uuid-0001-0000-000000000001",
      "prompt-uuid-0001-0000-000000000002"
    ]
  }
  ```

### 4.2 切換 / 更新收藏狀態
* **Endpoint**: `POST /favorites/toggle`
* **Auth**: `Authorization: Bearer <token>`
* **Request Body**:
  ```json
  {
    "promptId": "prompt-uuid-0001-0000-000000000001"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "收藏清單更新成功",
    "data": [
      "prompt-uuid-0001-0000-000000000001"
    ]
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
