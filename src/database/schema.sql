CREATE TABLE
  IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now ()
  );

CREATE TABLE
  IF NOT EXISTS parameters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    memo TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT parameters_type_name_key UNIQUE (type, name)
  );

-- seed.js 使用 ON CONFLICT (type, name)，因此資料庫必須具備相同欄位的唯一索引。
CREATE UNIQUE INDEX IF NOT EXISTS idx_parameters_type_name_unique ON parameters(type, name);

CREATE TABLE
  IF NOT EXISTS skill_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    intro TEXT,
    content_type_id UUID,
    model_type JSON DEFAULT '[]'::json,
    prompt_content TEXT NOT NULL,
    use_case TEXT,
    example_input TEXT,
    example_output JSON DEFAULT '[]'::json,
    category_id UUID,
    tags JSON DEFAULT '[]'::json,
    user_id UUID,
    source_url TEXT,
    copy_count INTEGER NOT NULL DEFAULT 0,
    favorite_count INTEGER NOT NULL DEFAULT 0,
    status BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

CREATE INDEX IF NOT EXISTS idx_skill_item_category_id ON skill_item(category_id);
CREATE INDEX IF NOT EXISTS idx_skill_item_is_active ON skill_item(is_active);
-- PostgreSQL 的 UNIQUE index 允許多筆 NULL，並可供 seed.js 的 ON CONFLICT (slug) 使用。
CREATE UNIQUE INDEX IF NOT EXISTS idx_skill_item_slug_unique ON skill_item(slug);

CREATE TABLE
  IF NOT EXISTS agent_skill (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    intro TEXT,
    repo_owner TEXT NOT NULL,
    repo_name TEXT NOT NULL,
    skill_slug TEXT NOT NULL,
    creator_name TEXT,
    creator_avatar_url TEXT,
    creator_profile_url TEXT,
    license TEXT,
    category_id UUID NOT NULL REFERENCES parameters(id),
    user_id UUID NOT NULL REFERENCES users(id),
    stargazers_count INTEGER NOT NULL DEFAULT 0,
    favorite_count INTEGER NOT NULL DEFAULT 0,
    copy_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  
    install_kind TEXT NOT NULL
      CHECK (install_kind IN ('full_package', 'single_kit', 'git_clone')),

    supported_agents TEXT[] NOT NULL DEFAULT '{}',

    doc_url TEXT,
    CONSTRAINT uq_agent_skill_repo_slug UNIQUE (repo_owner, repo_name, skill_slug),
    CONSTRAINT agent_skill_install_kind_agents_check CHECK (
      supported_agents <@ ARRAY['codex', 'claude-code', 'cursor']::text[]
      AND (
        (install_kind = 'git_clone' AND supported_agents = '{}')
        OR
        (install_kind != 'git_clone' AND supported_agents <> '{}')
      )

      AND (install_kind != 'full_package' OR skill_slug = '*')
    )
  );


DO $migrate_agent_skill_install_kind$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agent_skill' AND column_name = 'git_clone_method'
  ) THEN
    ALTER TABLE agent_skill ADD COLUMN IF NOT EXISTS install_kind TEXT;
    ALTER TABLE agent_skill ADD COLUMN IF NOT EXISTS supported_agents TEXT[] NOT NULL DEFAULT '{}';

    UPDATE agent_skill SET install_kind = CASE
      WHEN git_clone_method THEN 'git_clone'
      WHEN skill_slug = '*' THEN 'full_package'
      ELSE 'single_kit'
    END
    WHERE install_kind IS NULL;

    UPDATE agent_skill a SET supported_agents = sub.agents
    FROM (
      SELECT s.id, COALESCE(array_agg(v.agent) FILTER (WHERE v.agent IS NOT NULL), '{}') AS agents
      FROM agent_skill s
      LEFT JOIN LATERAL (
        VALUES
          (CASE WHEN s.codex_install_method THEN 'codex' END),
          (CASE WHEN s.claude_install_method THEN 'claude-code' END)
      ) AS v(agent) ON true
      GROUP BY s.id
    ) AS sub
    WHERE a.id = sub.id AND a.install_kind != 'git_clone' AND a.supported_agents = '{}';

    ALTER TABLE agent_skill ALTER COLUMN install_kind SET NOT NULL;
    ALTER TABLE agent_skill DROP CONSTRAINT IF EXISTS agent_skill_install_method_check;

    ALTER TABLE agent_skill DROP COLUMN claude_install_method;
    ALTER TABLE agent_skill DROP COLUMN codex_install_method;
    ALTER TABLE agent_skill DROP COLUMN claude_plugin_name;
    ALTER TABLE agent_skill DROP COLUMN claude_marketplace_name;
    ALTER TABLE agent_skill DROP COLUMN git_clone_method;
  END IF;
END
$migrate_agent_skill_install_kind$;

ALTER TABLE agent_skill DROP CONSTRAINT IF EXISTS agent_skill_install_kind_agents_check;
ALTER TABLE agent_skill ADD CONSTRAINT agent_skill_install_kind_agents_check CHECK (
  supported_agents <@ ARRAY['codex', 'claude-code', 'cursor']::text[]
  AND (
    (install_kind = 'git_clone' AND supported_agents = '{}')
    OR
    (install_kind != 'git_clone' AND supported_agents <> '{}')
  )
  AND (install_kind != 'full_package' OR skill_slug = '*')
);

CREATE INDEX IF NOT EXISTS idx_agent_skill_category_id ON agent_skill(category_id);
CREATE INDEX IF NOT EXISTS idx_agent_skill_is_active ON agent_skill(is_active);
CREATE INDEX IF NOT EXISTS idx_agent_skill_created_at ON agent_skill(created_at);


CREATE TABLE
  IF NOT EXISTS favorite (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    item_type TEXT NOT NULL DEFAULT 'prompt' CHECK (item_type IN ('prompt', 'skill')),
    skill_item_id UUID REFERENCES skill_item(id),
    skill_id UUID REFERENCES agent_skill(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sort_order INTEGER NOT NULL DEFAULT 0,
    memo TEXT,
    CONSTRAINT favorite_item_type_ref_check CHECK (
      (item_type = 'prompt' AND skill_item_id IS NOT NULL AND skill_id IS NULL)
      OR
      (item_type = 'skill' AND skill_id IS NOT NULL AND skill_item_id IS NULL)
    )
  );

CREATE INDEX IF NOT EXISTS idx_favorite_skill_item_id ON favorite(skill_item_id);
CREATE INDEX IF NOT EXISTS idx_favorite_skill_id ON favorite(skill_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_favorite_user_skill_item
  ON favorite (user_id, skill_item_id) WHERE item_type = 'prompt';
CREATE UNIQUE INDEX IF NOT EXISTS uq_favorite_user_skill
  ON favorite (user_id, skill_id) WHERE item_type = 'skill';

CREATE TABLE
  IF NOT EXISTS skill_recipe (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
   
    last_selected_agent TEXT
      CONSTRAINT skill_recipe_last_selected_agent_check
      CHECK (last_selected_agent IS NULL OR last_selected_agent IN ('codex', 'claude-code', 'cursor')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );


ALTER TABLE skill_recipe ADD COLUMN IF NOT EXISTS last_selected_agent TEXT;
ALTER TABLE skill_recipe DROP CONSTRAINT IF EXISTS skill_recipe_last_selected_agent_check;
ALTER TABLE skill_recipe ADD CONSTRAINT skill_recipe_last_selected_agent_check
  CHECK (last_selected_agent IS NULL OR last_selected_agent IN ('codex', 'claude-code', 'cursor'));

CREATE INDEX IF NOT EXISTS idx_skill_recipe_user_id ON skill_recipe(user_id);


CREATE TABLE
  IF NOT EXISTS skill_recipe_item (
    recipe_id UUID NOT NULL REFERENCES skill_recipe(id) ON DELETE CASCADE,
    favorite_skill_id BIGINT NOT NULL REFERENCES favorite(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT skill_recipe_item_pkey PRIMARY KEY (recipe_id, favorite_skill_id)
  );

CREATE INDEX IF NOT EXISTS idx_skill_recipe_item_favorite_skill_id ON skill_recipe_item(favorite_skill_id);

CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL CHECK (length(btrim(question)) > 0),
  answer TEXT NOT NULL CHECK (length(btrim(answer)) > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE
  IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);
