# Prompt Alchemy Server

`prompt-alchemy-server` 後端 API，管理 Prompt 與 Agent Skill 兩種可收藏的內容實體。

## Language

### Agent Skill 安裝相關

> **2026-08-12 重大轉向**：Claude Plugin 安裝機制已整個淘汰，不再使用。原因：實測發現當初判斷某些 repo「npx 裝了會壞」是誤判（見 ADR-0001 Update 2026-08-12），npx 本身足以涵蓋 Claude Code／Codex／Cursor 三個 agent，不需要 Claude Plugin 這條額外路徑。以下條目是目前唯一有效的規則；`claude_install_method`／`codex_install_method`／`claude_plugin_name`／`claude_marketplace_name` 這幾個欄位與對應的「Full package／Single kit（Claude Plugin 版）」規則已作廢，請勿沿用。

**安裝顆粒度（`install_kind`）**：
每一筆 `agent_skill` 用 `install_kind` 這個欄位決定要組出哪種安裝指令，三選一，彼此互斥：

- **全套安裝（`full_package`）**：`npx skills add <repoOwner>/<repoName> --skill '*' -a <agent>`。`--skill '*'` 是官方文件（`vercel-labs/skills` README）記載的「非互動、一次裝這個 repo 全部 skill」寫法，**不是**單純省略 `--skill`（那樣預設會跳出互動選單，不適合複製貼上一次執行）。
- **單一元件安裝（`single_kit`）**：`npx skills add <repoOwner>/<repoName> --skill <skillSlug> -a <agent>`，`skillSlug` 是真正含 `SKILL.md` 的葉層資料夾名稱。
- **Git Clone 保底（`git_clone`）**：當一筆 skill 依賴來源 repo 根目錄的其他共用檔案（`npx --skill <slug>` 只複製該 skill 自己的資料夾，裝出來會缺檔案而壞掉），且該 repo 沒有提供「全套安裝」可以連帶把根目錄檔案一起裝進來時，改用這個不分 agent 的保底路徑。指令用 `curl` 下載該 repo 的 tarball（`https://github.com/<repoOwner>/<repoName>/archive/HEAD.tar.gz`，`HEAD` 解析成預設分支）解壓縮進使用者當前目錄（`tar -xz --strip-components=1 -k`：去掉 GitHub 自動加的外殼資料夾、`-k` 讓已存在的檔案不被覆寫），同時給 bash（`curl`）與 PowerShell（`curl.exe`，繞過 PowerShell 預設把 `curl` 別名成 `Invoke-WebRequest` 的行為）兩版。**不使用 `git clone`**：會多一層巢狀資料夾、沒辦法跟使用者現有的 `.claude/`／`.agents/` 合併，且 `git clone`+`cp`+`rm -rf` 三段式在 Windows 上常因為 `.git` 內檔案剛 clone 完還被短暫鎖住而 `rm -rf` 失敗。
  _Avoid_: git clone、手動安裝、備用安裝方式

**支援的目標 agent（`supported_agents`）**：
`install_kind` 為 `full_package` 或 `single_kit` 時，`supported_agents`（文字陣列）存這筆 skill 支援哪些 npx agent，目前開放 `codex`／`claude-code`／`cursor` 三個選項（`skills` CLI 官方支援 76 種 agent，用陣列而非逐一開欄位是為了未來開放更多 agent 選項時不用改 schema）。`install_kind=git_clone` 時這個欄位不使用，保底指令不分 agent。

**列表分組（全套／單一元件的顯示邏輯）**：
前台列表依 `repo_owner + repo_name` 把同一個來源 repo 的多筆 `agent_skill` 分成一組，`install_kind=full_package` 的那一筆優先顯示；同一組底下若還有 `install_kind=single_kit` 的資料，預設收合、使用者可展開查看（沒有 `full_package` 的 repo，一樣依 `repo_owner + repo_name` 分組正常排列，只是沒有全套可以收合）。

**批次安裝去重**：
Recipe 批次安裝（或任何一次組合多筆 skill 的安裝指令情境）時，若同一個 `repo_owner/repo_name` 底下同時選到 `install_kind=full_package` 的那一筆**跟**任何 `install_kind=single_kit` 的那幾筆，只輸出 `full_package` 那一組指令，`single_kit` 的直接跳過（全套已經涵蓋它們，重複安裝沒有意義）。

**安裝機制驗證**：
Admin 新增/編輯 `agent_skill` 時，人工核對來源 repo 結構（有沒有共用的根目錄檔案、`npx skills add --list` 列得出哪些 skill）決定 `install_kind`／`supported_agents`；npx 也裝不起來才用 `git_clone` 保底。刻意不做自動化技術偵測——來源 repo 結構差異太大，MVP 階段以人工判斷壓低成本。
_Avoid_: 自動偵測、安裝檢查、核對 `.claude-plugin/marketplace.json`（Claude Plugin 已淘汰）
