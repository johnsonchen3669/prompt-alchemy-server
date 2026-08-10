// 純函式：把一組 Agent Skill 組成可直接貼上終端機的安裝指令。
// 依 CONTEXT.md「Claude Plugin 安裝／npx 安裝／Git Clone 保底」與
// docs/adr/0001-agent-skill-install-mechanism.md 定案的規則分流：
//   1. gitCloneMethod=true：不分 agent，只產生一條 git clone（同 repo 只產生一次）。
//   2. 否則，agent=claude-code 且 claudeInstallMethod=true：只產生 Claude Plugin
//      安裝（claude plugin marketplace add + claude plugin install，使用
//      claudePluginName／claudeMarketplaceName），絕不產生 npx；同一個 plugin
//      多筆只產生一次。
//   3. 否則，agent=codex 且 codexInstallMethod=true：只產生 npx 安裝
//      （同 repo 多筆合併成一行、多個 --skill），絕不產生 claude plugins。
// 兩個 agent 完全獨立、各自最多一種安裝路徑，不會同時出現兩種指令。
// 供詳情頁「複製安裝指令」（單筆）與 Recipe「批次安裝」（多筆）共用同一支函式。
const SUPPORTED_AGENTS = ['claude-code', 'codex'];

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
        gitCloneCommands.push(`git clone https://github.com/${repoKey}.git`);
      }
      continue;
    }

    if (agent === 'claude-code' && skill.claudeInstallMethod) {
      const pluginKey = `${skill.claudePluginName}@${skill.claudeMarketplaceName}`;
      if (!seenPlugins.has(pluginKey)) {
        seenPlugins.add(pluginKey);
        pluginCommands.push(`claude plugin marketplace add ${repoKey}`);
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
