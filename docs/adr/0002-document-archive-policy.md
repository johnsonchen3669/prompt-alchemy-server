# 文件封存採日期化唯讀快照，原路徑只保留指標

## Context

`docs/plan.md` 與 `docs/dev-plan.md` 同時包含仍有參考價值的早期決策，以及已不符合目前程式碼的 API、資料模型、目錄結構、npm scripts、測試與 Swagger 作法。若繼續在原路徑保留全文，讀者容易把歷史規劃誤認為現行規格；若直接刪除或只依賴 Git history，歷史脈絡與既有連結又不容易查找。

本 repository 的文件入口維持為根目錄 `README.md`，不另外建立第二份 README。

## Decision

1. 完成使命或已被現況取代的文件，搬移至 `docs/archive/YYYY-MM-DD/`；日期代表封存動作發生的日期，同批文件放在同一個日期目錄。
2. 封存文件保留原檔名，並在頂端加入至少以下 metadata：
   - `status: archived`
   - `canonical: false`
   - `archived_at`
   - `original_path`
   - `source_last_updated`
   - `maintenance: frozen`
   - `archive_reason`
   - `canonical_sources`
3. 完整正文只保存一份。原路徑改成短版 deprecated pointer，指向 archive snapshot、根目錄 `README.md` 與現行來源，不複製第二份正文。
4. Archive 正文凍結，不再跟著程式碼更新。若需要補充歷史背景，只能追加有日期的 archive note，不直接改寫原始敘述。
5. 現況資料的可信順序為：
   1. 實際程式碼、`src/database/schema.sql` 與 `package.json`
   2. 依目前路由重新生成的 `docs/openapi/swagger-output.json`
   3. 維護中的 API 規格
   4. Archive；只代表封存當時的狀態
6. 根目錄 `README.md` 是唯一文件入口，負責列出現行來源、ADR 與 archive 批次。
7. `.gitignore` 預設仍忽略未明確納管的 `docs/*`，但放行 `docs/archive/**` 與 `docs/adr/**`，不以 `git add -f` 作為正式流程。
8. 封存屬低頻、需要人工判斷 canonical sources 的操作，目前只維護手動檢查表，不新增 script、Git hook 或 release automation。

## Consequences

- 歷史正文與現行指引有清楚界線，舊計畫仍可直接閱讀。
- 原路徑持續存在，README、書籤或外部連結不會立即失效。
- 每份正文只有一個位置，避免 current 與 archive 形成雙重維護。
- 每次封存需要人工確認 metadata、pointer、README 索引及相對連結。
- Archive 內容不保證可直接套用於目前程式碼，讀者必須依 `canonical_sources` 查閱現況。

## Rejected Options

- **只靠 Git history**：歷史內容存在，但不容易被一般讀者發現，也沒有清楚的現況入口。
- **只在原文件頂端標示過時**：全文仍留在主要路徑，容易被搜尋結果或直接連結誤用。
- **複製全文到 archive、原路徑繼續保留**：會產生兩份正文與同步維護問題。
- **直接搬移、不保留 pointer**：會破壞既有連結，且讀者無法從舊路徑找到現行來源。
- **立即建立自動封存 script**：文件數量少，而且 archive reason 與 canonical sources 需要人工判斷，現階段成本高於收益。

## 手動封存流程

1. 確認工作樹，避免混入無關 staged 或 untracked 變更。
2. 先確認 `.gitignore` 已放行目標 archive 與 ADR 路徑。
3. 建立 `docs/archive/YYYY-MM-DD/`，搬移正文並加入 metadata。
4. 在原路徑建立 deprecated pointer。
5. 更新根目錄 `README.md` 的文件導覽與 archive 清單。
6. 以 `git diff --find-renames`、`git check-ignore`、`git diff --check` 與連結搜尋驗證結果。
