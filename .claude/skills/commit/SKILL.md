---
name: commit
description: Commit message formatting and guidelines
---

# Commit

Use this skill whenever the user asks you to create a git commit for the current work.

## Instructions

1. Review the current git state before committing:
   - `git status`
   - `git diff`
   - `git log -5 --oneline`
2. Only stage files relevant to the requested change. Do not include unrelated untracked files, generated files, or likely-local artifacts.
3. Always follow Ghost's commit conventions (see below) for commit messages
4. Run `git status --short` after committing and confirm the result.

## Important
- Do not push to remote unless the user explicitly asks
- Keep commits focused and avoid bundling unrelated changes
- If there are no relevant changes, do not create an empty commit
- If hooks fail, fix the issue and create a new commit. Never bypass hooks.

## Commit message format

Commit message 的格式規範請參考同資料夾下的 [`conventional-commits-reference.md`](./conventional-commits-reference.md)（Conventional Commits v1.0.0：`type(scope): description` 格式、feat/fix/BREAKING CHANGE 對應 SemVer、16 條規範條文與範例）。撰寫或檢查 commit message 時依該文件內容執行。