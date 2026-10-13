import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
rmSync('work/test-results/domain.json', { force: true });
const { runEvaluation } = await import('../src/eval.js');

const result = runEvaluation();
for (const scenario of result.cases) {
  for (const check of scenario.assertions) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} ${scenario.id} · ${check.label} | expected=${JSON.stringify(check.expected)} actual=${JSON.stringify(check.actual)}`);
  }
}
assert.ok(result.total >= 20, 'At least 20 distinct failure and recovery scenarios must execute');
assert.equal(result.failed, 0, `${result.failed} scenarios failed`);
assert.ok(result.assertions >= result.total, 'Every scenario must have visible assertions');

const injected = runEvaluation({ injectBrokenRule: true });
assert.ok(injected.failed > 0, 'Broken expiry/capacity rule must turn the same evaluator red');
console.log(`CONTROL: injected broken rule produced ${injected.failed} failed scenarios; normal run ${result.passed}/${result.total} scenarios, ${result.assertions} assertions.`);
mkdirSync('work/test-results', { recursive: true });
writeFileSync('work/test-results/domain.json', JSON.stringify({ kind: 'domain', result, mutationControl: { failed: injected.failed, failedCases: injected.cases.filter(c => !c.passed).map(c => c.id) } }, null, 2));
