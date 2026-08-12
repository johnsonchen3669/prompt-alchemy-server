// 純函式：把一組 Agent Skill 組成可直接貼上終端機的安裝指令。
// 依 CONTEXT.md「Claude Plugin 安裝／npx 安裝／Git Clone 保底」與
// docs/adr/0001-agent-skill-install-mechanism.md 定案的規則分流：
//   1. gitCloneMethod=true：不分 agent，只產生一組 curl | tar 指令（同 repo 只
//      產生一次）。用 curl 下載 tarball 解壓縮進當前目錄，不建立 .git、不需要
//      額外清理步驟——改用 git clone + cp + rm 三段式會在 Windows 上因為 rm -rf
//      緊接在 clone 後執行，常撞到檔案還被短暫鎖住的 race condition（見
//      CONTEXT.md「Git Clone 保底」）。同時給 bash／PowerShell 兩版，差別只在
//      curl／curl.exe（PowerShell 預設把 curl 別名成 Invoke-WebRequest）。
//   2. 否則，agent=claude-code 且 claudeInstallMethod=true：產生 Claude Plugin
//      安裝，絕不產生 npx；claudeMarketplaceName 有值才多產生一行 claude plugin
//      marketplace add（單一元件安裝 Single kit），沒有值就只有 claude plugin
//      install 一行（整包安裝 Full package）；同一個 plugin 多筆只產生一次。
//   3. 否則，agent=codex 且 codexInstallMethod=true：只產生 npx 安裝
//      （同 repo 多筆合併成一行、多個 --skill），絕不產生 claude plugins。
// 兩個 agent 完全獨立、各自最多一種安裝路徑，不會同時出現兩種指令。
// 供詳情頁「複製安裝指令」（單筆）與 Recipe「批次安裝」（多筆）共用同一支函式。
const SUPPORTED_AGENTS = ['claude-code', 'codex'];

function buildGitCloneSnippet(repoKey) {
  const url = `https://github.com/${repoKey}/archive/HEAD.tar.gz`;
  return [
    '# Git Bash / WSL / macOS / Linux：',
    `curl -fsSL ${url} | tar -xz --strip-components=1 -k`,
    '# Windows PowerShell：',
    `curl.exe -fsSL ${url} | tar -xz --strip-components=1 -k`,
  ].join('\n');
}

function buildInstallCommands(skills, agent) {
  if (!SUPPORTED_AGENTS.includes(agent)) {
    throw new Error(`不支援的目標 Agent：${agent}`);
  }
  if (!Array.isArray(skills) || skills.length === 0) {
    return [];
  }

  const gitCloneCommands = [];
  const seenGitCloneRepos = new Set();
  const pluginCommands = [];
  const seenPlugins = new Set();
  const npxRepoOrder = [];
  const npxSkillSlugsByRepo = new Map();

  for (const skill of skills) {
    const { repoOwner, repoName, skillSlug } = skill;
    const repoKey = `${repoOwner}/${repoName}`;

    if (skill.gitCloneMethod) {
      if (!seenGitCloneRepos.has(repoKey)) {
        seenGitCloneRepos.add(repoKey);
        gitCloneCommands.push(buildGitCloneSnippet(repoKey));
      }
      continue;
    }

    if (agent === 'claude-code' && skill.claudeInstallMethod) {
      const hasMarketplace = Boolean(skill.claudeMarketplaceName);
      const pluginKey = hasMarketplace
        ? `${skill.claudePluginName}@${skill.claudeMarketplaceName}`
        : skill.claudePluginName;
      if (!seenPlugins.has(pluginKey)) {
        seenPlugins.add(pluginKey);
        if (hasMarketplace) {
          pluginCommands.push(`claude plugin marketplace add ${repoKey}`);
        }
        pluginCommands.push(`claude plugin install ${pluginKey}`);
      }
      continue;
    }

    if (agent === 'codex' && skill.codexInstallMethod) {
      if (!npxSkillSlugsByRepo.has(repoKey)) {
        npxSkillSlugsByRepo.set(repoKey, []);
        npxRepoOrder.push(repoKey);
      }
      npxSkillSlugsByRepo.get(repoKey).push(skillSlug);
    }
  }

  const npxCommands = npxRepoOrder.map((repoKey) => {
    const skillFlags = npxSkillSlugsByRepo
      .get(repoKey)
      .map((slug) => `--skill ${slug}`)
      .join(' ');
    return `npx skills add ${repoKey} ${skillFlags} -a ${agent}`;
  });

  return [...gitCloneCommands, ...pluginCommands, ...npxCommands];
}

module.exports = { buildInstallCommands, SUPPORTED_AGENTS };
