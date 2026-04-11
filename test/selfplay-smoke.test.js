import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';

test('self-play harness can run and validate a small batch', () => {
  const raw = execFileSync('node', [
    'test/selfplay.js',
    '--games', '4',
    '--concurrency', '2',
    '--max-plies', '120',
    '--validate',
    '--quiet',
    '--summary-json',
  ], {
    encoding: 'utf8',
    timeout: 120000,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const summaryLine = raw.trim().split(/\r?\n/).find((line) => line.startsWith('SUMMARY_JSON '));
  assert.ok(summaryLine, 'Expected SUMMARY_JSON output from self-play harness');

  const summary = JSON.parse(summaryLine.slice('SUMMARY_JSON '.length));
  assert.equal(summary.games, 4);
  assert.equal(summary.validationFailures, 0);
  assert.equal(summary.crashOrTimeoutGames, 0);
  assert.equal(summary.invalidUciMoves, 0);
  assert.equal(summary.illegalMoves, 0);
  assert.equal(summary.placeholderMoves, 0);
  assert.equal(summary.over1000Moves, 0);
});
