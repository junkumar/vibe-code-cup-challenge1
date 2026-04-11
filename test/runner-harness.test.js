import assert from 'node:assert/strict';
import test from 'node:test';
import { agentPath, runAgent, UCI_OR_NO_MOVE } from './harness.js';

test('runner harness resolves the root agent entrypoint', () => {
  assert.match(agentPath, /agent\.(js|ts)$/);
});

test('runner harness can execute the agent and collect timing', () => {
  const { output, elapsedMs } = runAgent('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  assert.match(output, UCI_OR_NO_MOVE);
  assert.equal(typeof elapsedMs, 'number');
  assert.ok(Number.isFinite(elapsedMs));
  assert.ok(elapsedMs >= 0);
});
