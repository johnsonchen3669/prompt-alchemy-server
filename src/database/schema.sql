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
    sort_order INTEGER NOT NULL DEFAULT 0
  );

CREATE TABLE
  IF NOT EXISTS skill_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT,
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

CREATE TABLE
  IF NOT EXISTS favorite (
    user_id UUID NOT NULL REFERENCES users(id),
    skill_item_id UUID NOT NULL REFERENCES skill_item(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sort_order INTEGER NOT NULL DEFAULT 0,
    memo TEXT,
    CONSTRAINT favorite_pkey PRIMARY KEY (user_id, skill_item_id)
  );

CREATE INDEX IF NOT EXISTS idx_favorite_skill_item_id ON favorite(skill_item_id);

