import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { DEFAULT_FAVORITE_SKILL_IDS } = require('../config/favorite.config');

describe('favorite.config', () => {
  it('預設收藏技能為固定兩個 UUID', () => {
    expect(DEFAULT_FAVORITE_SKILL_IDS).toEqual([
      '9fcf96a4-eb05-4d4a-b7e2-fdb4b2da87f6',
      '6d56531f-a28f-4ebe-977f-5d6222cab34e',
    ]);
  });

  it('陣列已凍結，無法新增元素', () => {
    expect(Object.isFrozen(DEFAULT_FAVORITE_SKILL_IDS)).toBe(true);
    expect(() => DEFAULT_FAVORITE_SKILL_IDS.push('x')).toThrow();
  });
});