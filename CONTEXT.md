# Prompt Alchemy Server

`prompt-alchemy-server` 後端 API，管理 Prompt 與 Agent Skill 兩種可收藏的內容實體。

## Language

### Agent Skill 安裝相關

**Claude Plugin 安裝**：
`claude_install_method=true` 時唯一的安裝路徑：透過 `claude plugin marketplace add <repoOwner>/<repoName>` + `claude plugin install <claude_plugin_name>@<claude_marketplace_name>` 產生指令。只對 Claude Code 有效，Codex 沒有對應機制。`claude_install_method` 與 `claude_plugin_name` 是雙向綁定的必要條件：兩者要嘛同時成立（`claude_install_method=true` 且 `claude_plugin_name`／`claude_marketplace_name` 都有填），要嘛同時不成立——不存在「有 plugin 資訊但 `claude_install_method=false`」或「`claude_install_method=true` 但沒有 plugin 資訊」的狀態。
_Avoid_: npx（Claude Code 目標一律不產生 npx 指令）、plugin marketplace 安裝

**npx 安裝**：
`codex_install_method=true` 時唯一的安裝路徑：透過 `npx skills add <repoOwner>/<repoName> --skill <skillSlug> -a codex` 產生指令（同 repo 多筆合併成一行、多個 `--skill`）。只對 Codex 有效——Claude Code 目標一律不使用 npx，一律走 Claude Plugin 安裝。`skillSlug` 可以是萬用字元 `'*'`，代表安裝來源 repo 的全部 skill（例如整個 repo 只用一個 plugin/一次 npx 呼叫涵蓋的情況）。
_Avoid_: skills.sh 安裝、CLI 安裝

**Git Clone 保底**：
當一筆 Agent Skill 對 Claude Code 與 Codex 都不適用時（常見原因：skill 資料夾依賴來源 repo 根目錄的其他檔案，`npx skills add --skill` 只複製 skill 自己的資料夾，裝完會缺檔案而壞掉；或該 repo 根本沒有對應的 Claude Plugin），改為產生 `git clone https://github.com/<repoOwner>/<repoName>.git` 這條不區分目標 agent 的保底安裝指令，此時 `claude_install_method`／`codex_install_method`／`claude_plugin_name`／`claude_marketplace_name` 全部為 `false`／`null`。
_Avoid_: 手動安裝、備用安裝方式

**安裝機制驗證**：
Admin 新增/編輯 `agent_skill` 時，人工核對來源 repo 的 `.claude-plugin/marketplace.json`（是否有對應這支 skill／這個 repo 的 plugin）決定 `claude_install_method`／`claude_plugin_name`／`claude_marketplace_name`；人工核對 npx 對 Codex 是否可用決定 `codex_install_method`；兩者皆不適用才用 `git_clone_method` 保底。刻意不做自動化技術偵測——來源 repo 結構差異太大，MVP 階段以人工判斷壓低成本。
_Avoid_: 自動偵測、安裝檢查
