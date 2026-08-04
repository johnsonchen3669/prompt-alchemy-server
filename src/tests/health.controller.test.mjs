import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { getHealth } = require('../controllers/health.controller');

describe('healthController.getHealth', () => {
  it('回傳 200 與 ok 狀態及 ISO 時間戳', () => {
    const res = {
      status: (code) => {
        expect(code).toBe(200);
        return res;
      },
      json: (payload) => {
        expect(payload.status).toBe('ok');
        expect(typeof payload.timestamp).toBe('string');
        expect(() => new Date(payload.timestamp).toISOString()).not.toThrow();
      },
    };
    getHealth({}, res);
  });
});