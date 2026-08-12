# Agent Skill 安裝指令依目標 agent 分成兩條獨立、互斥的路徑，而非單一 npx 公式

`spec.md` 原始設計假設所有來源 repo 都能用同一條公式產生安裝指令：`npx skills add <repo> --skill <slug> -a <agent>`。實測 `Wcc723/social-image-kit`（`npx skills add --skill slide-html`）發現這條公式對某些 repo 結構會裝出壞掉的結果（skill 依賴 repo 根目錄的 `_runtime/`，但 `npx skills add --skill` 只複製 skill 自己的資料夾）；同時查證得知多個來源 repo（`mattpocock/skills`、`dotnet/skills`、`anthropics/skills`）都各自透過 `.claude-plugin/marketplace.json` 提供 Claude Code 專屬的 Claude Plugin 安裝（`claude plugin install`）。

最終定案：**Claude Code 與 Codex 兩個 agent 的安裝機制完全獨立、各自最多一種，不並存**——`claude_install_method=true` 一律走 Claude Plugin（`claude plugin marketplace add` + `claude plugin install`，需要 `claude_plugin_name`／`claude_marketplace_name`），絕不產生 npx；`codex_install_method=true` 一律走 npx（`npx skills add ... -a codex`），絕不使用 claude plugins（Codex 沒有對應機制）。兩者都不適用時（例如 skill 依賴 repo 根目錄其他檔案而 npx 會裝壞、且該 repo 沒有對應的 Claude Plugin），用 `git_clone_method` 保底，產生不分 agent 的 `git clone` 指令。

判斷方式為 Admin 人工核對來源 repo 的 `.claude-plugin/marketplace.json`（是否有對應這支 skill／這個 repo 的 plugin）與 npx 是否可用，不做自動化技術偵測——來源 repo 結構差異太大，自動判斷的開發成本在 MVP 階段不划算。

## Considered Options

- 只做 npx、把 Claude Plugin 與 git-clone 排除在範疇外：最簡單，但會漏掉「npx 裝了會壞」的真實案例（social-image-kit），且放棄官方明確支援的 Claude Plugin 路徑。
- Claude Code 同時提供 npx 與 Claude Plugin 兩條指令並存、讓使用者自己選：中間版本考慮過，但最終定案是每個 agent 只對應一種機制，兩者互斥，理由是簡化前端「這個 agent 要顯示哪條指令」的判斷邏輯，且避免「同一顆按鈕底下混雜不同機制的指令」造成使用者混淆。
- 自動偵測 repo 結構決定安裝機制：技術上需要解析 SKILL.md 內文找相對路徑引用，容易誤判，且需求方明確表示 MVP 階段要壓低開發成本，改為人工判斷。

## Update（2026-08-11）：`claude_plugin_name` 與 `claude_marketplace_name` 解除雙向綁定

原定案「兩者要嘛同時成立、要嘛同時不成立」對應的是 Claude Plugin 安裝只有一種指令形狀的假設。實測發現 Claude Plugin 安裝其實有兩種形狀，且都合法：

- **整包安裝（Full package）**：`claude plugin install <claude_plugin_name>`，只裝一個獨立 plugin，不需要先註冊 marketplace（例如 `claude plugin install mattpocock-skills`）。
- **單一元件安裝（Single kit）**：`claude plugin marketplace add <repoOwner>/<repoName>` + `claude plugin install <claude_plugin_name>@<claude_marketplace_name>`，從一個 marketplace 底下裝其中一個元件（例如 `claude plugin install frontend-design@claude-plugins-official`）。

新規則：`claude_plugin_name` 仍與 `claude_install_method` 雙向綁定（必填），`claude_marketplace_name` 改為**選填**——有值就在 `claude plugin install` 指令加上 `@<marketplace>` 後綴、且前面多一行 `claude plugin marketplace add`；沒有值就只有 `claude plugin install <plugin>` 一行。判斷方式維持人工核對（不做官方／非官方 marketplace 的自動區分，見下方 Considered Options 新增項）。

Schema 層級：`agent_skill_install_method_check` 拿掉 `(claude_plugin_name IS NULL) = (claude_marketplace_name IS NULL)`，改成單向限制 `(claude_marketplace_name IS NULL OR claude_plugin_name IS NOT NULL)`（有 marketplace 就一定要有 plugin，反之不必）。

新增 considered option：

- 加欄位區分「官方 marketplace（Claude Code 內建、不需要 `marketplace add`）」與「第三方 marketplace（需要 `marketplace add`）」：現階段查證到的所有 Claude Plugin 資料（`dotnet`、`anthropics` 系列、`mattpocock`）都是第三方 marketplace，尚無官方 marketplace 的實際案例，暫不加欄位；一律「有 `claude_marketplace_name` 就輸出 `marketplace add` + `install`」。等真的出現官方 marketplace 案例再回頭處理。

## Update（2026-08-12）：Git Clone 保底改用 curl + tar，不再用 `git clone`

原定案的 `git_clone_method` 保底指令是單純 `git clone https://github.com/<repoOwner>/<repoName>.git`。實測發現兩個問題：

1. **無法合併進使用者現有的 agent skill 目錄結構**：`git clone` 一定會把整個來源 repo 複製成一個新的巢狀資料夾（例如 `social-image-kit/`），沒辦法讓 repo 自帶的 `.claude/`、`.agents/` 直接跟使用者現有的同名目錄合併——這正是 git-clone 保底存在的目的（讓 skill 資料夾依賴的其他檔案一起裝進來），卻反而讓使用者要手動搬移檔案。
2. **`git clone` + `cp` 複製 + `rm -rf` 清理暫存資料夾的三段式做法在 Windows 上不穩定**：`rm -rf` 緊接在 `git clone` 完成後執行，實測（`Wcc723/social-image-kit`）常撞到 `.git` 內的檔案還被防毒軟體或 Git 背景程序短暫鎖住的 race condition，噴 `Device or resource busy`，雖然單獨重跑通常會成功，但不適合放進使用者複製貼上就要能一次成功的保底指令。

最終定案：改用 `curl` 下載 GitHub tarball、`tar` 解壓縮直接進當前目錄，兩者都查證過對這次的真實案例（`Wcc723/social-image-kit`）可行：

```
curl -fsSL https://github.com/<repoOwner>/<repoName>/archive/HEAD.tar.gz | tar -xz --strip-components=1 -k
```

- `archive/HEAD.tar.gz`：已查證 GitHub 支援用 `HEAD` 代表預設分支（`Wcc723/social-image-kit` 實測回應 `HTTP 200`，且 `gh api` 查到的 `default_branch` 是 `main`，兩者一致），不需要額外查詢分支名稱。
- `--strip-components=1`：去掉 GitHub tarball 自動加的 `<repoName>-<sha>/` 外殼，內容直接落在目前目錄，達成跟使用者現有目錄合併的效果。
- `-k`（`--keep-old-files`）：tar 內建的 no-clobber 選項，目前目錄已存在的檔案不會被覆寫，取代原本要另外寫 `cp -rn` 的必要。
- 完全不建立 `.git`，因此也不需要 `rm -rf` 清理，根本避開 race condition。

同時提供 **bash**（`curl`）與 **PowerShell**（`curl.exe`）兩版指令，兩者都在 Windows 上實測驗證過（bash 版由使用者在 Git Bash 實測；PowerShell 版用 `robocopy` 方案 A/B 比較後，改用同一套 curl+tar 方案，只有 `curl` 換成 `curl.exe` 一個差異——PowerShell 預設把 `curl` 別名成 `Invoke-WebRequest`，語法完全不同，要用 `curl.exe` 明確繞過別名才會呼叫到真正的 curl）。兩版指令都回傳在同一個 `commands` 陣列元素裡（用 `\n` 換行、`#` 開頭的註解行分隔），不新增 API 參數。

新增 considered option：

- 新增 `shell=bash|powershell` query 參數，讓前端仿照 `agent` 選擇器做一個 shell 切換 UI：討論過，但 git-clone 保底是「保底中的保底」，不值得為它在 API 契約上加一個新維度；兩版指令都不長，直接都顯示、讓使用者自己認得自己的終端機環境更簡單。
- 只取 skill 需要的子資料夾（例如用 `npx degit <repo>/<skillSlug>` 或 tar 只解壓縮子路徑）：討論過，但這剛好會重現 git-clone 保底存在的理由——這些 skill 之所以不能用 `npx skills add --skill` 裝，正是因為它們依賴 repo 根目錄的其他檔案，只取子資料夾會重新製造出一樣的破損。

## Update（2026-08-12）：Claude Plugin 安裝機制整個淘汰，三個 agent 統一走 npx

**這個 Update 推翻本 ADR 最初的定案**（第 5 段「Claude Code 與 Codex 兩個 agent 的安裝機制完全獨立」）與 2026-08-11 那次 Update（`claude_plugin_name`／`claude_marketplace_name` 解除雙向綁定）——兩者都建立在「Claude Code 必須走 Claude Plugin，npx 對 Claude Code 不可靠」這個前提上，這個前提本身查證後是錯的。

**發現**：最初定案引用的 `Wcc723/social-image-kit` 案例（`npx skills add --skill slide-html` 裝出缺檔案的結果）事後查證是 **marketplace 誤判**造成的，不是 npx 這個機制本身有結構性缺陷。同時查證 `npx skills` 官方文件（`vercel-labs/skills` README）確認 `--skill '*'`（全套安裝）本來就是官方支援、非互動、會把整個 repo 的檔案（包含根目錄共用檔案）一次裝完的寫法——並非只有 Claude Plugin 才能處理「skill 依賴 repo 根目錄其他檔案」這種情境。

**新規則**：Claude Code、Codex、Cursor 三個 agent 統一透過 `npx skills add <repoOwner>/<repoName> [--skill <skillSlug>] -a <agent>` 安裝，不再有 agent 專屬的安裝機制分支。**Claude Plugin 整條路徑（`claude plugin marketplace add`／`claude plugin install`）作廢，不再產生。** `git_clone_method` 保底維持不變（見 2026-08-12 稍早那次 Update），只是判斷「這筆要不要保底」的參照對象從「有沒有 Claude Plugin」改成「npx 全套安裝裝不裝得起來」。

**Schema 變更**：

- 移除：`claude_install_method`、`codex_install_method`、`claude_plugin_name`、`claude_marketplace_name`、`agent_skill_install_method_check`。
- 新增：`install_kind`（`'full_package'` \| `'single_kit'` \| `'git_clone'`，三選一，取代原本三個布林欄位分散判斷、還要靠 CHECK constraint 防止互斥狀態出錯的做法）、`supported_agents`（`TEXT[]`，`install_kind` 為 `full_package`／`single_kit` 時存支援的 npx agent，目前開放 `codex`／`claude-code`／`cursor`；`install_kind='git_clone'` 時不使用，用陣列而非逐一開欄位是預留未來開放 `skills` CLI 支援的其他 73 種 agent 的擴充空間）。
- `skill_slug`：`install_kind='single_kit'` 時代表真正的技能資料夾名稱；`install_kind='full_package'` 或 `'git_clone'` 時不使用（可為 `null`）。

**列表顯示與批次安裝去重**（連帶決策，非 schema 本身，記錄於 `CONTEXT.md`）：前台列表依 `repo_owner + repo_name` 分組，`full_package` 優先顯示、`single_kit` 預設收合可展開；批次安裝（Recipe）若同一 repo 同時選到 `full_package` 與其下的 `single_kit`，只輸出 `full_package`，避免重複安裝。

**既有種子資料**：所有現有 `agent_skill` 種子資料（`dotnet/skills` 的 16 個 plugin、`anthropics/claude-plugins-official` 的多個獨立 plugin 等）需要依新規則逐筆重新查證 `install_kind`／`supported_agents`，不是機械式欄位改名就能沿用——`dotnet/skills` 這類「一個 repo 底下有多個獨立可裝單位」的來源，過去用單一 `skillSlug: '*'` 一筆代表整個 repo 會失真（見查證記錄：`dotnet` plugin 實際只有 1 個 skill，並非「.NET 完整合集」），需要拆成 `full_package`（若 npx 全套安裝真的能裝出完整結果）＋多筆 `single_kit`（各 plugin／skill）。

新增 considered option：

- Claude Code 保留 Claude Plugin、跟 npx 並存，讓使用者兩者都能選：討論過，但既然當初「npx 不可靠」的前提已經證偽，維持兩條路徑只會增加使用者選擇負擔與程式碼複雜度，沒有對應的好處，故直接汰除 Claude Plugin 路徑。
