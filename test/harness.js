import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = dirname(dirname(fileURLToPath(import.meta.url)));
export const entryFiles = ['agent.js', 'agent.ts'].filter((file) => existsSync(join(root, file)));

assert.equal(entryFiles.length, 1, 'Expected exactly one root entry file: agent.js or agent.ts');

export const agentFilename = entryFiles[0];
export const agentPath = join(root, agentFilename);
export const agentSource = readFileSync(agentPath, 'utf8');
export const agentStats = statSync(agentPath);
export const UCI_OR_NO_MOVE = /^(?:[a-h][1-8][a-h][1-8][qrbn]?|0000)$/;
export const NODE_BUILTINS = new Set(
  builtinModules.flatMap((name) => [name, `node:${name}`]),
);

export function runAgent(fen, options = {}) {
  const {
    timeout = 1000,
    maxBuffer = 1024 * 1024,
  } = options;
  const startedAt = process.hrtime.bigint();
  const raw = execFileSync('node', [agentPath], {
    input: `${fen}\n`,
    encoding: 'utf8',
    timeout,
    maxBuffer,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
  const output = String(raw).trim();
  assert.match(output, UCI_OR_NO_MOVE, `Agent printed malformed output: ${JSON.stringify(raw)}`);
  return {
    output,
    elapsedMs,
  };
}

export function getStaticImports(source = agentSource) {
  const imports = new Set();
  const importPattern = /\bimport\s+(?:[^'"]+?\s+from\s+)?['"]([^'"]+)['"]/g;
  const requirePattern = /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g;

  for (const pattern of [importPattern, requirePattern]) {
    let match;
    while ((match = pattern.exec(source))) {
      imports.add(match[1]);
    }
  }

  return [...imports].sort();
}
