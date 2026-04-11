import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  NODE_BUILTINS,
  agentFilename,
  agentPath,
  agentSource,
  agentStats,
  entryFiles,
  getStaticImports,
  root,
  runAgent,
} from './harness.js';

const representativeFens = [
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
  'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',
  '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1',
  '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1',
];

test('constraint: exactly one root entry file exists', () => {
  assert.deepEqual(entryFiles, [agentFilename]);
});

test('constraint: submission report exists at the repo root', () => {
  assert.ok(existsSync(join(root, 'submission-report.md')));
});

test('constraint: source file stays under 1 MB', () => {
  assert.ok(agentStats.size < 1024 * 1024, `Source file is ${agentStats.size} bytes`);
});

test('constraint: no external dependencies are declared in package.json', () => {
  const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  assert.deepEqual(packageJson.dependencies ?? {}, {});
  assert.deepEqual(packageJson.devDependencies ?? {}, {});
});

test('constraint: imports stay within the Node.js standard library', () => {
  const imports = getStaticImports();
  const externalImports = imports.filter((name) => {
    if (name.startsWith('./') || name.startsWith('../') || name.startsWith('/')) return true;
    return !NODE_BUILTINS.has(name);
  });
  assert.deepEqual(externalImports, [], `Found non-builtin imports: ${externalImports.join(', ')}`);
});

test('constraint: agent does not use network modules', () => {
  const forbidden = ['http', 'https', 'http2', 'net', 'tls', 'dgram', 'dns', 'node:http', 'node:https', 'node:http2', 'node:net', 'node:tls', 'node:dgram', 'node:dns'];
  const imports = new Set(getStaticImports());
  const used = forbidden.filter((name) => imports.has(name));
  assert.deepEqual(used, [], `Found network-related imports: ${used.join(', ')}`);
});

test('constraint: agent does not start subprocesses or worker pools', () => {
  const forbidden = ['child_process', 'cluster', 'worker_threads', 'node:child_process', 'node:cluster', 'node:worker_threads'];
  const imports = new Set(getStaticImports());
  const used = forbidden.filter((name) => imports.has(name));
  assert.deepEqual(used, [], `Found forbidden runtime-control imports: ${used.join(', ')}`);
});

test('constraint: agent does not perform obvious runtime downloads or self-modifying writes', () => {
  const forbiddenPatterns = [
    /\bwriteFileSync\b/,
    /\bwriteFile\b/,
    /\bappendFileSync\b/,
    /\bappendFile\b/,
    /\brmSync\b/,
    /\bunlinkSync\b/,
    /\brenameSync\b/,
    /\bfetch\s*\(/,
  ];
  for (const pattern of forbiddenPatterns) {
    assert.ok(!pattern.test(agentSource), `Forbidden pattern present: ${pattern}`);
  }
});

test('constraint: agent only reads stdin, not arbitrary files', () => {
  const readCalls = [...agentSource.matchAll(/\breadFileSync\(([^)]*)\)/g)].map((match) => match[1].trim());
  assert.deepEqual(readCalls, ['0, \'utf8\''], `Unexpected readFileSync usage: ${readCalls.join('; ')}`);
});

test('constraint: identical FEN inputs are deterministic', () => {
  const fen = representativeFens[0];
  const first = runAgent(fen).output;
  const second = runAgent(fen).output;
  const third = runAgent(fen).output;
  assert.equal(first, second);
  assert.equal(second, third);
});

test('constraint: representative positions complete within the 1000 ms hard timeout', () => {
  for (const fen of representativeFens) {
    const { elapsedMs } = runAgent(fen, { timeout: 1000 });
    assert.ok(elapsedMs < 1000, `Move took ${elapsedMs.toFixed(2)} ms for ${fen}`);
  }
});

test('constraint: representative positions target under 250 ms think time', () => {
  for (const fen of representativeFens) {
    const { elapsedMs } = runAgent(fen, { timeout: 1000 });
    assert.ok(elapsedMs < 250, `Move took ${elapsedMs.toFixed(2)} ms for ${fen}`);
  }
});

test('constraint: representative workload fits within a 30 s total compute budget', () => {
  let totalMs = 0;
  for (let i = 0; i < 20; i++) {
    const { elapsedMs } = runAgent(representativeFens[i % representativeFens.length], { timeout: 1000 });
    totalMs += elapsedMs;
  }
  assert.ok(totalMs < 30000, `Representative 20-move budget took ${totalMs.toFixed(2)} ms`);
});

test('constraint: agent runs under a 256 MB V8 heap cap', () => {
  const output = execFileSync(
    'node',
    ['--max-old-space-size=256', agentPath],
    {
      input: `${representativeFens[0]}\n`,
      encoding: 'utf8',
      timeout: 1000,
      stdio: ['pipe', 'pipe', 'pipe'],
    },
  ).trim();
  assert.match(output, /^(?:[a-h][1-8][a-h][1-8][qrbn]?|0000)$/);
});
