import { isJsonObject } from './json.js';

describe('isJsonObject', () => {
  it.each([[{}], [{ nested: { a: [1, 'two', null] } }], [Object.create(null)]])(
    'accepts plain objects: %j',
    (value) => {
      expect(isJsonObject(value)).toBe(true);
    },
  );

  it.each([[null], [[]], [[{ a: 1 }]], ['{}'], [42], [true], [new Date()], [new Map()]])(
    'rejects %p',
    (value) => {
      expect(isJsonObject(value)).toBe(false);
    },
  );
});
