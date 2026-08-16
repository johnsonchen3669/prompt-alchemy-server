import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { generateSwaggerDocument } = require('../config/swagger');

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'options', 'head']);
const ALLOWED_TAGS = new Set([
  'Health',
  'Auth',
  'Utility',
  'Prompts',
  'Favorites',
  'Contacts',
  'Agent Skills',
  'FAQs',
  'Recipes',
  'Admin Parameters',
  'Admin Users',
  'Admin Skills',
  'Admin Agent Skills',
  'Admin Contacts',
  'Admin FAQs',
]);

const EXPECTED_OPERATIONS = [
  ['get', '/health'],
  ['post', '/auth/register'],
  ['post', '/auth/login'],
  ['post', '/auth/logout'],
  ['get', '/auth/me'],
  ['post', '/utility/upload'],
  ['get', '/prompts'],
  ['get', '/prompts/{id}'],
  ['post', '/prompts/{id}/copy'],
  ['get', '/favorites'],
  ['delete', '/favorites'],
  ['get', '/favorites/{skillId}/status'],
  ['post', '/favorites/{skillId}/toggle'],
  ['post', '/favorites/defaults'],
  ['get', '/me/recipes'],
  ['post', '/me/recipes'],
  ['get', '/me/recipes/{id}'],
  ['patch', '/me/recipes/{id}'],
  ['patch', '/me/recipes/{id}/last-selected-agent'],
  ['delete', '/me/recipes/{id}'],
  ['get', '/me/recipes/{id}/install-command'],
  ['post', '/me/recipes/{id}/items'],
  ['delete', '/me/recipes/{id}/items/{favoriteId}'],
  ['get', '/me/recipe-items'],
  ['post', '/contacts'],
  ['get', '/agent-skills'],
  ['get', '/agent-skills/{id}'],
  ['get', '/agent-skills/{id}/install-command'],
  ['post', '/agent-skills/{id}/copy'],
  ['get', '/faqs'],
  ['get', '/admin/parameters'],
  ['post', '/admin/parameters'],
  ['put', '/admin/parameters/{id}'],
  ['delete', '/admin/parameters/{id}'],
  ['get', '/admin/users'],
  ['put', '/admin/users/{id}'],
  ['get', '/admin/skills'],
  ['post', '/admin/skills'],
  ['get', '/admin/skills/{id}'],
  ['put', '/admin/skills/{id}'],
  ['get', '/admin/agent-skills'],
  ['post', '/admin/agent-skills'],
  ['get', '/admin/agent-skills/{id}'],
  ['put', '/admin/agent-skills/{id}'],
  ['patch', '/admin/agent-skills/{id}/active'],
  ['get', '/admin/contacts'],
  ['patch', '/admin/contacts/{id}/status'],
  ['put', '/admin/contacts/{id}/status'],
  ['delete', '/admin/contacts/{id}'],
  ['get', '/admin/faqs'],
  ['post', '/admin/faqs'],
  ['get', '/admin/faqs/{id}'],
  ['put', '/admin/faqs/{id}'],
  ['delete', '/admin/faqs/{id}'],
];

const PUBLIC_OPERATIONS = new Set([
  'GET /health',
  'POST /auth/register',
  'POST /auth/login',
  'POST /utility/upload',
  'GET /prompts',
  'GET /prompts/{id}',
  'POST /prompts/{id}/copy',
  'POST /contacts',
  'GET /agent-skills',
  'GET /agent-skills/{id}',
  'GET /agent-skills/{id}/install-command',
  'POST /agent-skills/{id}/copy',
  'GET /faqs',
]);

function normalizePath(value) {
  if (value === '/') return value;
  return value.replace(/\/+$/, '');
}

function operationKey(method, routePath) {
  return `${method.toUpperCase()} ${normalizePath(routePath)}`;
}

function buildOperationMap(document) {
  const operations = new Map();

  for (const [rawPath, pathItem] of Object.entries(document.paths || {})) {
    const normalizedPath = normalizePath(rawPath);
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.has(method)) continue;
      const key = operationKey(method, normalizedPath);
      if (operations.has(key)) throw new Error(`重複的 normalized operation：${key}`);
      operations.set(key, { operation, pathItem, rawPath, normalizedPath });
    }
  }

  return operations;
}

function resolveJsonPointer(document, reference) {
  const segments = reference
    .slice(2)
    .split('/')
    .map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'));

  return segments.reduce((value, segment) => value?.[segment], document);
}

function resolveSchema(document, schema) {
  if (!schema?.$ref) return schema;
  return resolveJsonPointer(document, schema.$ref);
}

function getOperation(operations, method, routePath) {
  return operations.get(operationKey(method, routePath))?.operation;
}

function getParameter(operation, name, location) {
  return (operation.parameters || []).find(
    (parameter) => parameter.name === name && parameter.in === location,
  );
}

function getRequestSchema(document, operation, mediaType = 'application/json') {
  const schema = operation.requestBody?.content?.[mediaType]?.schema;
  return resolveSchema(document, schema);
}

function getResponseSchema(document, operation, statusCode) {
  const schema = operation.responses?.[statusCode]?.content?.['application/json']?.schema;
  return resolveSchema(document, schema);
}

function collectLocalReferences(value, references = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectLocalReferences(item, references);
    return references;
  }

  if (!value || typeof value !== 'object') return references;
  if (typeof value.$ref === 'string' && value.$ref.startsWith('#/')) references.push(value.$ref);
  for (const child of Object.values(value)) collectLocalReferences(child, references);
  return references;
}

let document;
let operations;

beforeAll(async () => {
  document = await generateSwaggerDocument();
  operations = buildOperationMap(document);
});

describe('Swagger/OpenAPI 路由合約', () => {
  it('精確涵蓋 40 個 business paths 與 54 個 operations', () => {
    const expectedKeys = EXPECTED_OPERATIONS.map(([method, routePath]) => (
      operationKey(method, routePath)
    )).sort();
    const actualKeys = [...operations.keys()].sort();
    const normalizedPaths = new Set(
      [...operations.values()].map(({ normalizedPath }) => normalizedPath),
    );

    expect(actualKeys).toEqual(expectedKeys);
    expect(normalizedPaths.size).toBe(40);
    expect(operations.size).toBe(54);
    expect(normalizedPaths.has('/openapi.json')).toBe(false);
    expect(document.servers).toStrictEqual([{ url: 'http://localhost:3000' }]);
    expect(document).not.toHaveProperty('security');
  });

  it('每個 operation 都有一致的 metadata、security 與成功 response', () => {
    for (const [key, { operation }] of operations) {
      expect(operation.tags, `${key} tags`).toHaveLength(1);
      expect(ALLOWED_TAGS.has(operation.tags[0]), `${key} tag`).toBe(true);
      expect(operation.summary?.trim(), `${key} summary`).toBeTruthy();
      expect(operation.description?.trim(), `${key} description`).toBeTruthy();
      expect(
        Object.prototype.hasOwnProperty.call(operation, 'security'),
        `${key} security`,
      ).toBe(true);
      expect(operation.security, `${key} security policy`).toEqual(
        PUBLIC_OPERATIONS.has(key) ? [] : [{ bearerAuth: [] }],
      );
      if (!PUBLIC_OPERATIONS.has(key)) {
        expect(operation.responses, `${key} authentication error`).toHaveProperty('401');
      }

      const responseCodes = Object.keys(operation.responses || {});
      expect(
        responseCodes.some((statusCode) => /^2\d\d$/.test(statusCode)),
        `${key} success response`,
      ).toBe(true);
    }
  });

  it('所有 admin operation 都文件化 JWT、admin 與 server error', () => {
    for (const [key, { operation }] of operations) {
      if (!key.includes(' /admin/')) continue;
      expect(operation.responses, `${key} responses`).toHaveProperty('401');
      expect(operation.responses, `${key} responses`).toHaveProperty('403');
      expect(operation.responses, `${key} responses`).toHaveProperty('500');
    }
  });

  it('path/query parameters 使用 nested schema 並完整對應 path placeholder', () => {
    for (const [key, { operation, pathItem, normalizedPath }] of operations) {
      const parameters = [...(pathItem.parameters || []), ...(operation.parameters || [])];
      const placeholders = [...normalizedPath.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]);

      for (const placeholder of placeholders) {
        const parameter = parameters.find(
          (candidate) => candidate.in === 'path' && candidate.name === placeholder,
        );
        expect(parameter, `${key} 缺少 ${placeholder} path parameter`).toBeTruthy();
        expect(parameter.required, `${key} ${placeholder} required`).toBe(true);
      }

      for (const parameter of parameters) {
        expect(parameter.schema, `${key} ${parameter.name} schema`).toBeTruthy();
        const parameterSchemas = parameter.schema.oneOf || [parameter.schema];
        for (const schema of parameterSchemas) {
          expect(
            ['string', 'integer', 'number', 'boolean', 'array'],
            `${key} ${parameter.name} scalar parameter type`,
          ).toContain(schema.type);
        }
        for (const keyword of ['type', 'format', 'enum', 'default', 'minimum', 'maximum']) {
          expect(
            Object.prototype.hasOwnProperty.call(parameter, keyword),
            `${key} ${parameter.name} 不應在 Parameter Object 直接設定 ${keyword}`,
          ).toBe(false);
        }
        expect(parameter.name.toLowerCase(), `${key} 不應手動宣告 Authorization header`).not.toBe(
          'authorization',
        );
      }
    }
  });

  it('所有 response 都明確描述 JSON schema，且不含 application/xml', () => {
    for (const [key, { operation }] of operations) {
      for (const [statusCode, response] of Object.entries(operation.responses || {})) {
        expect(
          Object.keys(response.content || {}),
          `${key} ${statusCode} response media types`,
        ).toEqual(['application/json']);
        expect(
          response.content['application/json'].schema,
          `${key} ${statusCode} response schema`,
        ).toBeTruthy();
      }
    }
  });

  it('components 保持有效 Schema Object，不被 swagger-autogen 當成 example 重新推斷', () => {
    for (const [name, schema] of Object.entries(document.components.schemas || {})) {
      expect(schema.type, `${name} type`).toBe('object');
      expect(schema.properties, `${name} properties`).toBeTruthy();
      expect(schema.properties, `${name} nested inference`).not.toHaveProperty('properties');
    }
  });

  it('所有 local $ref 都能在 document 中解析', () => {
    const references = collectLocalReferences(document);
    expect(references.length).toBeGreaterThan(0);
    for (const reference of references) {
      expect(resolveJsonPointer(document, reference), reference).toBeDefined();
    }
  });
});

describe('Swagger/OpenAPI 關鍵 runtime 合約', () => {
  it('公開 FAQ 只回傳 public mapper 的 id、question、answer', () => {
    const operation = getOperation(operations, 'get', '/faqs');
    const response = getResponseSchema(document, operation, '200');
    const itemSchema = resolveSchema(document, response.properties.data.items);
    expect(Object.keys(itemSchema.properties).sort()).toEqual(['answer', 'id', 'question']);
  });

  it('Prompt schema 符合 mapper 的 tags 與空字串 fallback', () => {
    const prompt = document.components.schemas.Prompt;
    expect(Object.keys(prompt.properties.tags.items.properties).sort()).toEqual(['id', 'name']);
    expect(prompt.properties.tags.items.properties.id.format).toBe('uuid');

    for (const propertyName of ['contentTypeId', 'categoryId']) {
      expect(prompt.properties[propertyName].oneOf).toEqual(expect.arrayContaining([
        expect.objectContaining({ type: 'string', format: 'uuid' }),
        expect.objectContaining({ type: 'string', enum: [''] }),
      ]));
    }
    expect(prompt.properties.sourceUrl.oneOf).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'string', format: 'uri' }),
      expect.objectContaining({ type: 'string', enum: [''] }),
    ]));
  });

  it('查詢與 Recipe UUID 格式錯誤的 400 response 與 runtime 一致', () => {
    for (const routePath of ['/prompts', '/agent-skills']) {
      expect(getOperation(operations, 'get', routePath).responses).toHaveProperty('400');
    }
    for (const method of ['get', 'delete']) {
      expect(getOperation(operations, method, '/me/recipes/{id}').responses).toHaveProperty('400');
    }
  });

  it('Auth 使用 UUID，且 /auth/me 回傳安全的使用者欄位', () => {
    expect(document.components.schemas.User.properties.id.format).toBe('uuid');

    const meOperation = getOperation(operations, 'get', '/auth/me');
    const meResponse = getResponseSchema(document, meOperation, '200');
    const meData = resolveSchema(document, meResponse.properties.user);
    expect(Object.keys(meData.properties).sort()).toEqual([
      'createdAt',
      'email',
      'id',
      'isActive',
      'name',
      'role',
    ]);
    expect(meData.properties.id.format).toBe('uuid');
    expect(meData.properties).not.toHaveProperty('passwordHash');
  });

  it('upload 將 multipart file 標為必要 binary 欄位', () => {
    const operation = getOperation(operations, 'post', '/utility/upload');
    const schema = getRequestSchema(document, operation, 'multipart/form-data');
    expect(schema.required).toContain('file');
    expect(schema.properties.file).toMatchObject({ type: 'string', format: 'binary' });
    expect(operation.responses).toHaveProperty('400');
    expect(operation.responses).toHaveProperty('413');
    expect(operation.responses).toHaveProperty('500');
  });

  it('Agent 選項統一為 claude-code、codex、cursor', () => {
    const expectedAgents = ['claude-code', 'codex', 'cursor'];
    const operationPaths = [
      '/agent-skills/{id}/install-command',
      '/me/recipes/{id}/install-command',
    ];

    for (const routePath of operationPaths) {
      const operation = getOperation(operations, 'get', routePath);
      expect(getParameter(operation, 'agent', 'query').schema.enum).toEqual(expectedAgents);
    }
    expect(document.components.schemas.AgentSkill.properties.supportedAgents.items.enum).toEqual(
      expectedAgents,
    );
  });

  it('Favorites list 明確分成 Prompt 與 Agent Skill schema', () => {
    const operation = getOperation(operations, 'get', '/favorites');
    const responseText = JSON.stringify(operation.responses['200']);
    expect(responseText).toContain('#/components/schemas/FavoritePromptItem');
    expect(responseText).toContain('#/components/schemas/FavoriteSkillItem');

    const itemType = getParameter(operation, 'itemType', 'query');
    expect(itemType.schema).toMatchObject({
      type: 'string',
      enum: ['prompt', 'skill'],
      default: 'prompt',
    });
  });

  it('favoriteId 涵蓋 PGlite number 與 PostgreSQL/pg 字串兩種 BIGINT runtime', () => {
    const expectedBigIntSchemas = [
      expect.objectContaining({ type: 'integer', format: 'int64' }),
      expect.objectContaining({ type: 'string', pattern: '^[0-9]+$' }),
    ];
    const expectBigIntValue = (schema) => {
      expect(schema.oneOf).toEqual(expect.arrayContaining(expectedBigIntSchemas));
    };

    const removeOperation = getOperation(
      operations,
      'delete',
      '/me/recipes/{id}/items/{favoriteId}',
    );
    expect(getParameter(removeOperation, 'favoriteId', 'path').schema).toMatchObject({
      type: 'string',
      pattern: '^[0-9]+$',
    });

    const addOperation = getOperation(operations, 'post', '/me/recipes/{id}/items');
    const addSchema = getRequestSchema(document, addOperation);
    expectBigIntValue(addSchema.properties.favoriteId);

    expectBigIntValue(document.components.schemas.FavoriteSkillItem.properties.favorite_id);
    expectBigIntValue(document.components.schemas.RecipeItem.properties.favorite_id);

    const recipeItemsOperation = getOperation(operations, 'get', '/me/recipe-items');
    const recipeItemsResponse = getResponseSchema(document, recipeItemsOperation, '200');
    expectBigIntValue(recipeItemsResponse.properties.data.items.properties.favorite_id);
  });

  it('Admin enums 與 Agent Skill 安裝約束符合目前 runtime', () => {
    const parameterList = getOperation(operations, 'get', '/admin/parameters');
    expect(getParameter(parameterList, 'type', 'query').schema.enum).toEqual([
      'role',
      'contentType',
      'category',
      'model',
      'tag',
    ]);

    const userUpdate = getOperation(operations, 'put', '/admin/users/{id}');
    expect(getRequestSchema(document, userUpdate).properties.role.enum).toEqual(['member', 'admin']);

    const agentSkillCreate = getOperation(operations, 'post', '/admin/agent-skills');
    const agentSkillCreateSchema = getRequestSchema(document, agentSkillCreate);
    const installBranches = Object.fromEntries(
      agentSkillCreateSchema.oneOf.map((branch) => [branch.title, branch]),
    );
    expect(Object.keys(installBranches).sort()).toEqual(['full_package', 'git_clone', 'single_kit']);
    expect(installBranches.git_clone.properties.supportedAgents.maxItems).toBe(0);
    expect(installBranches.single_kit.required).toContain('supportedAgents');
    expect(installBranches.single_kit.properties.supportedAgents.minItems).toBe(1);
    expect(installBranches.full_package.required).toContain('supportedAgents');
    expect(installBranches.full_package.properties.skillSlug.enum).toEqual(['*']);
    expect(installBranches.full_package.properties.supportedAgents.minItems).toBe(1);

    const agentSkillUpdate = getOperation(operations, 'put', '/admin/agent-skills/{id}');
    const agentSkillUpdateSchema = getRequestSchema(document, agentSkillUpdate);
    const updateInstallBranches = Object.fromEntries(
      agentSkillUpdateSchema.oneOf.map((branch) => [branch.title, branch]),
    );
    expect(Object.keys(updateInstallBranches).sort()).toEqual([
      '不變更 installKind',
      '切換為 full_package',
      '切換為 git_clone',
      '切換為 single_kit',
    ]);
    expect(updateInstallBranches['不變更 installKind'].not.required).toEqual(['installKind']);
    expect(updateInstallBranches['切換為 git_clone'].required).toContain('supportedAgents');
    expect(updateInstallBranches['切換為 git_clone'].properties.supportedAgents.maxItems).toBe(0);
    expect(updateInstallBranches['切換為 single_kit'].properties.supportedAgents.minItems).toBe(1);
    expect(updateInstallBranches['切換為 full_package'].required).toEqual(
      expect.arrayContaining(['skillSlug', 'supportedAgents']),
    );
    expect(updateInstallBranches['切換為 full_package'].properties.skillSlug.enum).toEqual(['*']);

    const skillList = getOperation(operations, 'get', '/admin/skills');
    expect(getParameter(skillList, 'active', 'query').schema.enum).toEqual(['active', 'inactive']);

    for (const method of ['patch', 'put']) {
      const contactUpdate = getOperation(operations, method, '/admin/contacts/{id}/status');
      expect(getRequestSchema(document, contactUpdate).properties.status.enum).toEqual([
        'pending',
        'resolved',
      ]);
    }
  });

  it('Admin FAQ UUID format 位於 parameter schema', () => {
    const operation = getOperation(operations, 'get', '/admin/faqs/{id}');
    const parameter = getParameter(operation, 'id', 'path');
    expect(parameter.schema).toMatchObject({ type: 'string', format: 'uuid' });
    expect(parameter).not.toHaveProperty('format');
  });
});

describe('Swagger/OpenAPI generated snapshot', () => {
  it('tracked snapshot 可解析且與 fresh generation 完全一致', () => {
    const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
    const snapshotPath = path.resolve(
      currentDirectory,
      '../../docs/openapi/swagger-output.json',
    );
    const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));

    expect(snapshot).toStrictEqual(document);
  });
});
