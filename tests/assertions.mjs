import assert from 'node:assert/strict';

export function createChecks() {
  const results = [];
  return {
    results,
    equal(label, actual, expected) {
      const passed = JSON.stringify(actual) === JSON.stringify(expected);
      results.push({ label, expected, actual, passed });
      console.log(`${passed ? 'PASS' : 'FAIL'} ${label} | expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`);
      assert.deepEqual(actual, expected, label);
    },
    truth(label, value) { this.equal(label, Boolean(value), true); }
  };
}
