
const SUPPORTED_AGENTS = ['claude-code', 'codex', 'cursor'];

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
  const fullPackageCommands = [];
  const fullPackageRepos = new Set();

  for (const skill of skills) {
    const repoKey = `${skill.repoOwner}/${skill.repoName}`;

    if (skill.installKind === 'git_clone') {
      if (!seenGitCloneRepos.has(repoKey)) {
        seenGitCloneRepos.add(repoKey);
        gitCloneCommands.push(buildGitCloneSnippet(repoKey));
      }
      continue;
    }

    if (skill.installKind === 'full_package' && skill.supportedAgents?.includes(agent)) {
      if (!fullPackageRepos.has(repoKey)) {
        fullPackageRepos.add(repoKey);
        fullPackageCommands.push(`npx skills add ${repoKey} --skill '*' -a ${agent}`);
      }
    }
  }

  const singleKitRepoOrder = [];
  const singleKitSkillSlugsByRepo = new Map();

  for (const skill of skills) {
    if (skill.installKind !== 'single_kit') continue;
    if (!skill.supportedAgents?.includes(agent)) continue;

    const repoKey = `${skill.repoOwner}/${skill.repoName}`;
    if (fullPackageRepos.has(repoKey)) continue;

    if (!singleKitSkillSlugsByRepo.has(repoKey)) {
      singleKitSkillSlugsByRepo.set(repoKey, []);
      singleKitRepoOrder.push(repoKey);
    }
    singleKitSkillSlugsByRepo.get(repoKey).push(skill.skillSlug);
  }

  const singleKitCommands = singleKitRepoOrder.map((repoKey) => {
    const skillFlags = singleKitSkillSlugsByRepo
      .get(repoKey)
      .map((slug) => `--skill ${slug}`)
      .join(' ');
    return `npx skills add ${repoKey} ${skillFlags} -a ${agent}`;
  });

  return [...gitCloneCommands, ...fullPackageCommands, ...singleKitCommands];
}

module.exports = { buildInstallCommands, SUPPORTED_AGENTS };
