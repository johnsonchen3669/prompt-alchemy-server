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
