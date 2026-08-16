const fs = require('fs');
const path = require('path');
const swaggerAutogen = require('swagger-autogen');

const CANONICAL_SERVER_URL = 'http://localhost:3000';
const IGNORED_PATHS = new Set(['/openapi.json', '/openapi.json/']);
const outputFile = path.join(__dirname, '../../docs/openapi/swagger-output.json');
const endpointsFiles = [path.join(__dirname, '../../app.js')];

const uuid = (description) => ({
  type: 'string',
  format: 'uuid',
  description,
  example: '755f3568-2333-4709-b916-582eae69e195',
});

const dateTime = (description) => ({
  type: 'string',
  format: 'date-time',
  description,
  example: '2026-01-01T00:00:00.000Z',
});

const nullableUuid = (description) => ({
  ...uuid(description),
  nullable: true,
});

const uuidOrEmpty = (description) => ({
  description,
  oneOf: [
    { type: 'string', format: 'uuid', example: '755f3568-2333-4709-b916-582eae69e195' },
    { type: 'string', enum: [''], example: '' },
  ],
});

const uriOrEmpty = (description) => ({
  description,
  oneOf: [
    { type: 'string', format: 'uri', example: 'https://example.com/resource' },
    { type: 'string', enum: [''], example: '' },
  ],
});

const bigIntValue = (description) => ({
  description,
  oneOf: [
    { type: 'integer', format: 'int64', example: 42 },
    { type: 'string', pattern: '^[0-9]+$', example: '42' },
  ],
});

const jsonValue = {
  oneOf: [
    { type: 'array', items: {} },
    { type: 'object', additionalProperties: true },
  ],
};

const errorProperties = {
  status: { type: 'string', example: 'error' },
  message: { type: 'string', example: '請求處理失敗' },
};

const components = {
  schemas: {
    ErrorResponse: {
      type: 'object',
      required: ['status', 'message'],
      properties: errorProperties,
    },
    AuthErrorResponse: {
      type: 'object',
      required: ['status', 'message'],
      properties: {
        status: { type: 'string', enum: ['false'], example: 'false' },
        message: { type: 'string', example: 'Token 無效或已過期' },
      },
    },
    Prompt: {
      type: 'object',
      properties: {
        id: uuid('Prompt UUID'),
        title: { type: 'string', example: '建立產品需求文件' },
        slug: { type: 'string', example: 'product-requirements' },
        intro: { type: 'string', example: '協助整理產品需求與驗收條件' },
        contentTypeId: uuidOrEmpty('內容類型 UUID；未設定時為空字串'),
        modelType: { type: 'array', items: { type: 'string' }, example: ['text'] },
        promptContent: { type: 'string', example: '請根據以下需求產出...' },
        useCase: { type: 'string', example: '產品規劃' },
        exampleInput: { type: 'string', example: '產品背景與目標使用者' },
        exampleOutput: { type: 'array', items: { type: 'object', additionalProperties: true } },
        categoryId: uuidOrEmpty('分類 UUID；未設定時為空字串'),
        category: { type: 'string', example: '產品管理' },
        memo: { type: 'string', example: '使用前請補充專案背景' },
        tags: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'name'],
            properties: {
              id: uuid('標籤 UUID'),
              name: { type: 'string', example: '需求分析' },
            },
          },
        },
        sourceUrl: uriOrEmpty('來源網址；未設定時為空字串'),
        copyCount: { type: 'integer', example: 12 },
        favoriteCount: { type: 'integer', example: 4 },
        isNew: { type: 'boolean', example: true },
        isHot: { type: 'boolean', example: false },
        isActive: { type: 'boolean', example: true },
        createdAt: dateTime('建立時間'),
        updatedAt: dateTime('更新時間'),
      },
    },
    AgentSkill: {
      type: 'object',
      properties: {
        id: uuid('Agent Skill UUID'),
        name: { type: 'string', example: 'Frontend Review' },
        description: { type: 'string', example: '檢查前端程式碼品質' },
        intro: { type: 'string', example: '提供前端程式碼審查能力' },
        repoOwner: { type: 'string', example: 'prompt-alchemy' },
        repoName: { type: 'string', example: 'frontend-review' },
        skillSlug: { type: 'string', example: 'frontend-review' },
        creatorName: { type: 'string', example: 'Prompt Alchemy' },
        creatorAvatarUrl: uriOrEmpty('建立者頭像網址；未設定時為空字串'),
        creatorProfileUrl: uriOrEmpty('建立者個人頁網址；未設定時為空字串'),
        license: { type: 'string', example: 'MIT' },
        categoryId: uuid('分類 UUID'),
        category: { type: 'string', example: 'Development' },
        stargazersCount: { type: 'integer', example: 120 },
        copyCount: { type: 'integer', example: 20 },
        favoriteCount: { type: 'integer', example: 8 },
        isHot: { type: 'boolean', example: false },
        isActive: { type: 'boolean', example: true },
        installKind: {
          type: 'string',
          enum: ['full_package', 'single_kit', 'git_clone'],
          example: 'single_kit',
        },
        supportedAgents: {
          type: 'array',
          items: { type: 'string', enum: ['claude-code', 'codex', 'cursor'] },
          example: ['codex', 'claude-code'],
        },
        docUrl: { type: 'string', format: 'uri', nullable: true, example: 'https://example.com/docs' },
        createdAt: dateTime('建立時間'),
        updatedAt: dateTime('更新時間'),
      },
    },
    FavoritePromptItem: {
      type: 'object',
      properties: {
        id: uuid('Prompt UUID'),
        user_id: nullableUuid('建立者 UUID'),
        title: { type: 'string' },
        slug: { type: 'string', nullable: true },
        intro: { type: 'string', nullable: true },
        content_type_id: nullableUuid('內容類型 UUID'),
        model_type: jsonValue,
        prompt_content: { type: 'string' },
        use_case: { type: 'string', nullable: true },
        example_input: { type: 'string', nullable: true },
        example_output: jsonValue,
        category_id: nullableUuid('分類 UUID'),
        category_name: { type: 'string', nullable: true },
        tags: jsonValue,
        source_url: {
          type: 'string',
          nullable: true,
          description: '來源網址；資料庫可能回傳 URL、空字串或 null',
        },
        copy_count: { type: 'integer' },
        favorite_count: { type: 'integer' },
        status: { type: 'boolean' },
        is_active: { type: 'boolean' },
        created_at: dateTime('建立時間'),
        updated_at: dateTime('更新時間'),
        favorited_at: dateTime('收藏時間'),
        sort_order: { type: 'integer' },
      },
    },
    FavoriteSkillItem: {
      type: 'object',
      properties: {
        id: uuid('Agent Skill UUID'),
        user_id: uuid('建立者 UUID'),
        name: { type: 'string' },
        description: { type: 'string', nullable: true },
        intro: { type: 'string', nullable: true },
        repo_owner: { type: 'string' },
        repo_name: { type: 'string' },
        skill_slug: { type: 'string' },
        creator_name: { type: 'string', nullable: true },
        creator_avatar_url: { type: 'string', format: 'uri', nullable: true },
        creator_profile_url: { type: 'string', format: 'uri', nullable: true },
        license: { type: 'string', nullable: true },
        category_id: uuid('分類 UUID'),
        stargazers_count: { type: 'integer' },
        favorite_count: { type: 'integer' },
        copy_count: { type: 'integer' },
        is_active: { type: 'boolean' },
        install_kind: { type: 'string', enum: ['full_package', 'single_kit', 'git_clone'] },
        supported_agents: {
          type: 'array',
          items: { type: 'string', enum: ['claude-code', 'codex', 'cursor'] },
        },
        doc_url: { type: 'string', format: 'uri', nullable: true },
        created_at: dateTime('建立時間'),
        updated_at: dateTime('更新時間'),
        favorite_id: bigIntValue('收藏 ID；PGlite 回傳 number，PostgreSQL/pg 預設回傳十進位字串'),
        favorited_at: dateTime('收藏時間'),
        sort_order: { type: 'integer' },
        category_name: { type: 'string', nullable: true },
      },
    },
    Recipe: {
      type: 'object',
      properties: {
        id: uuid('Recipe UUID'),
        user_id: uuid('使用者 UUID'),
        name: { type: 'string', example: 'Frontend Toolkit' },
        last_selected_agent: {
          type: 'string',
          enum: ['claude-code', 'codex', 'cursor'],
          nullable: true,
        },
        created_at: dateTime('建立時間'),
        updated_at: dateTime('更新時間'),
      },
    },
    RecipeItem: {
      type: 'object',
      properties: {
        id: uuid('Agent Skill UUID'),
        user_id: uuid('建立者 UUID'),
        name: { type: 'string' },
        description: { type: 'string', nullable: true },
        intro: { type: 'string', nullable: true },
        repo_owner: { type: 'string' },
        repo_name: { type: 'string' },
        skill_slug: { type: 'string' },
        creator_name: { type: 'string', nullable: true },
        creator_avatar_url: { type: 'string', format: 'uri', nullable: true },
        creator_profile_url: { type: 'string', format: 'uri', nullable: true },
        license: { type: 'string', nullable: true },
        category_id: uuid('分類 UUID'),
        stargazers_count: { type: 'integer' },
        favorite_count: { type: 'integer' },
        copy_count: { type: 'integer' },
        is_active: { type: 'boolean' },
        install_kind: { type: 'string', enum: ['full_package', 'single_kit', 'git_clone'] },
        supported_agents: {
          type: 'array',
          items: { type: 'string', enum: ['claude-code', 'codex', 'cursor'] },
        },
        doc_url: { type: 'string', format: 'uri', nullable: true },
        created_at: dateTime('建立時間'),
        updated_at: dateTime('更新時間'),
        favorite_id: bigIntValue('收藏 ID；PGlite 回傳 number，PostgreSQL/pg 預設回傳十進位字串'),
        added_at: dateTime('加入 Recipe 的時間'),
      },
    },
    PublicFAQ: {
      type: 'object',
      properties: {
        id: uuid('FAQ UUID'),
        question: { type: 'string', example: '如何建立收藏？' },
        answer: { type: 'string', example: '在項目頁面點選收藏即可。' },
      },
    },
    FAQ: {
      type: 'object',
      properties: {
        id: uuid('FAQ UUID'),
        question: { type: 'string', example: '如何建立收藏？' },
        answer: { type: 'string', example: '在項目頁面點選收藏即可。' },
        sortOrder: { type: 'integer', example: 0 },
        isActive: { type: 'boolean', example: true },
        createdAt: dateTime('建立時間'),
        updatedAt: dateTime('更新時間'),
      },
    },
    User: {
      type: 'object',
      properties: {
        id: uuid('使用者 UUID'),
        name: { type: 'string', example: 'Prompt User' },
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        role: { type: 'string', enum: ['member', 'admin'], example: 'member' },
        isActive: { type: 'boolean', example: true },
        createdAt: dateTime('建立時間'),
      },
    },
    Parameter: {
      type: 'object',
      properties: {
        id: uuid('參數 UUID'),
        type: {
          type: 'string',
          enum: ['role', 'contentType', 'category', 'model', 'tag'],
          example: 'category',
        },
        name: { type: 'string', example: '前端開發' },
        description: { type: 'string', example: 'React / Vue / CSS / UI 相關' },
        isActive: { type: 'boolean', example: true },
        sortOrder: { type: 'integer', example: 1 },
      },
    },
    Contact: {
      type: 'object',
      properties: {
        id: uuid('聯絡紀錄 UUID'),
        name: { type: 'string', example: 'Prompt User' },
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        message: { type: 'string', example: '我想了解更多資訊。' },
        status: { type: 'string', enum: ['pending', 'resolved'], example: 'pending' },
        createdAt: dateTime('建立時間'),
        updatedAt: dateTime('更新時間'),
      },
    },
  },
};

function createDocument() {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Prompt 鍊金坊 Prompt Alchemy API',
      description: 'Prompt 鍊金坊 Prompt Alchemy — Prompt/Skill 收藏庫後端 API 文件',
      version: '1.0.0',
    },
    servers: [{ url: CANONICAL_SERVER_URL }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      '@schemas': components.schemas,
    },
  };
}

function removeIgnoredPaths(document) {
  const filtered = { ...document, paths: { ...(document.paths || {}) } };
  for (const ignoredPath of Object.keys(filtered.paths)) {
    if (IGNORED_PATHS.has(ignoredPath)) {
      delete filtered.paths[ignoredPath];
    }
  }
  return filtered;
}

async function generateSwaggerDocument({ disableLogs = true, disableWarnings = true } = {}) {
  const generate = swaggerAutogen({
    openapi: '3.0.0',
    writeOutputFile: false,
    autoHeaders: false,
    autoQuery: false,
    autoBody: false,
    autoResponse: false,
    sanitizeOutputData: true,
    disableLogs,
    disableWarnings,
  });

  const result = await generate(outputFile, endpointsFiles, createDocument());
  if (!result || result.success !== true || !result.data) {
    throw new Error('swagger-autogen 無法產生 OpenAPI 文件');
  }

  return removeIgnoredPaths(result.data);
}

async function writeSnapshot() {
  const document = await generateSwaggerDocument({ disableLogs: false, disableWarnings: false });
  fs.writeFileSync(outputFile, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  return document;
}

if (require.main === module) {
  writeSnapshot().catch((error) => {
    console.error('[swagger] 產生 OpenAPI snapshot 失敗', error);
    process.exitCode = 1;
  });
}

module.exports = {
  CANONICAL_SERVER_URL,
  IGNORED_PATHS,
  components,
  createDocument,
  endpointsFiles,
  generateSwaggerDocument,
  outputFile,
  removeIgnoredPaths,
  writeSnapshot,
};
