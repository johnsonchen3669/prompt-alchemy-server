# Agent Skill 安裝指令依目標 agent 分成兩條獨立、互斥的路徑，而非單一 npx 公式

`spec.md` 原始設計假設所有來源 repo 都能用同一條公式產生安裝指令：`npx skills add <repo> --skill <slug> -a <agent>`。實測 `Wcc723/social-image-kit`（`npx skills add --skill slide-html`）發現這條公式對某些 repo 結構會裝出壞掉的結果（skill 依賴 repo 根目錄的 `_runtime/`，但 `npx skills add --skill` 只複製 skill 自己的資料夾）；同時查證得知多個來源 repo（`mattpocock/skills`、`dotnet/skills`、`anthropics/skills`）都各自透過 `.claude-plugin/marketplace.json` 提供 Claude Code 專屬的 Claude Plugin 安裝（`claude plugin install`）。

最終定案：**Claude Code 與 Codex 兩個 agent 的安裝機制完全獨立、各自最多一種，不並存**——`claude_install_method=true` 一律走 Claude Plugin（`claude plugin marketplace add` + `claude plugin install`，需要 `claude_plugin_name`／`claude_marketplace_name`），絕不產生 npx；`codex_install_method=true` 一律走 npx（`npx skills add ... -a codex`），絕不使用 claude plugins（Codex 沒有對應機制）。兩者都不適用時（例如 skill 依賴 repo 根目錄其他檔案而 npx 會裝壞、且該 repo 沒有對應的 Claude Plugin），用 `git_clone_method` 保底，產生不分 agent 的 `git clone` 指令。

判斷方式為 Admin 人工核對來源 repo 的 `.claude-plugin/marketplace.json`（是否有對應這支 skill／這個 repo 的 plugin）與 npx 是否可用，不做自動化技術偵測——來源 repo 結構差異太大，自動判斷的開發成本在 MVP 階段不划算。

## Considered Options

- 只做 npx、把 Claude Plugin 與 git-clone 排除在範疇外：最簡單，但會漏掉「npx 裝了會壞」的真實案例（social-image-kit），且放棄官方明確支援的 Claude Plugin 路徑。
- Claude Code 同時提供 npx 與 Claude Plugin 兩條指令並存、讓使用者自己選：中間版本考慮過，但最終定案是每個 agent 只對應一種機制，兩者互斥，理由是簡化前端「這個 agent 要顯示哪條指令」的判斷邏輯，且避免「同一顆按鈕底下混雜不同機制的指令」造成使用者混淆。
- 自動偵測 repo 結構決定安裝機制：技術上需要解析 SKILL.md 內文找相對路徑引用，容易誤判，且需求方明確表示 MVP 階段要壓低開發成本，改為人工判斷。
