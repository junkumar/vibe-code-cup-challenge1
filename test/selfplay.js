#!/usr/bin/env node
// Automated self-play harness.
// Examples:
//   node test/selfplay.js --games 20 --validate
//   node test/selfplay.js --games 1000 --concurrency 20 --validate --json-out test-results/selfplay-1000.json

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyMove, isKingInCheck, legalMoves, moveToUci, parseFen, squareToIndex } from '../agent.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const agentFile = ['agent.js', 'agent.ts'].find((f) => existsSync(join(root, f)));
const agentPath = join(root, agentFile);
const UCI_RE = /^(?:[a-h][1-8][a-h][1-8][qrbn]?|0000)$/;
const OPENING_POOL_TARGET = 4096;
const OPENING_POOL_DEPTH = 4;
const OPENING_BRANCH_FACTOR = 8;
const FILES = 'abcdefgh';
const FIXED_STARTS = [
  { label: 'Standard start', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' },
  { label: 'Open game (1.e4 e5)', fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2' },
  { label: 'Closed game (1.d4 d5)', fen: 'rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq d6 0 2' },
  { label: 'Sicilian (1.e4 c5)', fen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2' },
  { label: "King's Indian (1.d4 Nf6)", fen: 'rnbqkb1r/pppppppp/5n2/8/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 1 2' },
];
const OPENING_TARGETS = new Set([
  'c3', 'd3', 'e3', 'f3',
  'c4', 'd4', 'e4', 'f4',
  'c5', 'd5', 'e5', 'f5',
  'c6', 'd6', 'e6', 'f6',
]);

function parseArgs(argv) {
  const options = {
    games: 5,
    offset: 0,
    concurrency: 1,
    maxPlies: 400,
    validate: false,
    quiet: false,
    jsonOut: null,
    summaryJson: false,
  };
  const positional = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      positional.push(arg);
      continue;
    }
    const [flag, inlineValue] = arg.split('=');
    if (flag === '--validate') options.validate = true;
    else if (flag === '--quiet') options.quiet = true;
    else if (flag === '--summary-json') options.summaryJson = true;
    else {
      const value = inlineValue ?? argv[++i];
      if (flag === '--games') options.games = Math.max(Number(value), 0);
      else if (flag === '--offset') options.offset = Math.max(Number(value), 0);
      else if (flag === '--concurrency') options.concurrency = Math.max(Number(value), 1);
      else if (flag === '--max-plies') options.maxPlies = Math.max(Number(value), 1);
      else if (flag === '--json-out') options.jsonOut = value;
      else throw new Error(`Unknown flag: ${flag}`);
    }
  }

  if (positional[0] != null) options.games = Math.max(Number(positional[0]), 0);
  if (positional[1] != null) options.offset = Math.max(Number(positional[1]), 0);
  return options;
}

function boardToFen(board) {
  const rows = [];
  for (let r = 0; r < 8; r++) {
    let row = '';
    let empty = 0;
    for (let c = 0; c < 8; c++) {
      const piece = board[r * 8 + c];
      if (piece === '.') empty++;
      else {
        if (empty) {
          row += String(empty);
          empty = 0;
        }
        row += piece;
      }
    }
    if (empty) row += String(empty);
    rows.push(row);
  }
  return rows.join('/');
}

function posToFen(pos) {
  return `${boardToFen(pos.board)} ${pos.side} ${pos.castling} ${pos.enPassant} ${pos.halfmove} ${pos.fullmove}`;
}

function positionKey(pos) {
  return `${pos.board.join('')}:${pos.side}:${pos.castling}:${pos.enPassant}`;
}

function colorOf(piece) {
  if (!piece || piece === '.') return null;
  return piece === piece.toUpperCase() ? 'w' : 'b';
}

function openingMoveScore(pos, move) {
  const piece = pos.board[squareToIndex(move.from)];
  const target = pos.board[squareToIndex(move.to)];
  const lower = piece.toLowerCase();
  let score = 0;

  if (OPENING_TARGETS.has(move.to)) score += 12;
  if (target !== '.') score += 20 + (lower === 'p' ? 10 : 0);
  if (lower === 'p') {
    if (move.from[0] >= 'c' && move.from[0] <= 'f') score += 6;
    if (Math.abs(Number(move.to[1]) - Number(move.from[1])) === 2) score += 4;
    if (move.from[0] === 'a' || move.from[0] === 'h') score -= 2;
  }
  if (lower === 'n' && ['c3', 'f3', 'c6', 'f6', 'd2', 'e2', 'd7', 'e7'].includes(move.to)) score += 14;
  if (lower === 'b' && ['b5', 'c4', 'f4', 'g2', 'b4', 'c5', 'f5', 'g7'].includes(move.to)) score += 8;
  if (lower === 'k' && Math.abs(squareToIndex(move.to) - squareToIndex(move.from)) === 2) score += 18;
  if (lower === 'q') score -= 8;
  if (lower === 'r') score -= 10;

  return score;
}

function buildGeneratedStarts(targetCount = OPENING_POOL_TARGET, maxDepth = OPENING_POOL_DEPTH, branchFactor = OPENING_BRANCH_FACTOR) {
  const rootPos = parseFen(FIXED_STARTS[0].fen);
  const seen = new Set(FIXED_STARTS.map((start) => positionKey(parseFen(start.fen))));
  const generated = [];
  let frontier = [{ pos: rootPos, line: [] }];

  for (let depth = 0; depth < maxDepth && frontier.length && generated.length < targetCount; depth++) {
    const next = [];
    for (const node of frontier) {
      const rankedMoves = legalMoves(node.pos)
        .slice()
        .sort((a, b) => {
          const delta = openingMoveScore(node.pos, b) - openingMoveScore(node.pos, a);
          return delta || moveToUci(a).localeCompare(moveToUci(b));
        })
        .slice(0, branchFactor);

      for (const move of rankedMoves) {
        const child = applyMove(node.pos, move);
        const key = positionKey(child);
        if (seen.has(key)) continue;
        seen.add(key);

        const line = node.line.concat(moveToUci(move));
        generated.push({
          label: `Generated opening #${generated.length + 1}`,
          fen: posToFen(child),
          line,
        });
        next.push({ pos: child, line });
        if (generated.length >= targetCount) break;
      }

      if (generated.length >= targetCount) break;
    }
    frontier = next;
  }

  return generated;
}

const STARTS = FIXED_STARTS.concat(buildGeneratedStarts());

function terminalState(pos, seenPositions) {
  const key = positionKey(pos);
  const seen = new Map(seenPositions);
  seen.set(key, (seen.get(key) || 0) + 1);
  if (seen.get(key) >= 3) return { result: '1/2-1/2', reason: 'threefold repetition', seen };
  if (pos.halfmove >= 100) return { result: '1/2-1/2', reason: '50-move rule', seen };

  const legal = legalMoves(pos);
  if (!legal.length) {
    const inCheck = isKingInCheck(pos, pos.side);
    return {
      result: inCheck ? (pos.side === 'w' ? '0-1' : '1-0') : '1/2-1/2',
      reason: inCheck ? 'checkmate' : 'stalemate',
      seen,
    };
  }

  return { legal, seen };
}

function percentile(sorted, ratio) {
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))];
}

function callAgent(fen) {
  return new Promise((resolve) => {
    const t0 = process.hrtime.bigint();
    const child = spawn('node', [agentPath], {
      cwd: root,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let settled = false;

    const finish = (payload) => {
      if (settled) return;
      settled = true;
      const elapsedMs = Number(process.hrtime.bigint() - t0) / 1e6;
      resolve({
        elapsedMs,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        ...payload,
      });
    };

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      finish({ failed: true, reason: 'timeout' });
    }, 1000);

    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => {
      clearTimeout(timer);
      finish({ failed: true, reason: `spawn error: ${error.message}` });
    });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      if (settled) return;
      if (signal || code !== 0) finish({ failed: true, reason: `exit code=${code} signal=${signal}` });
      else finish({ failed: false, reason: 'ok' });
    });

    child.stdin.end(`${fen}\n`);
  });
}

async function playGame(start, maxPlies) {
  let pos = parseFen(start.fen);
  let seenPositions = new Map();
  const log = [];
  const stats = {
    over250Moves: 0,
    over1000Moves: 0,
    invalidUciMoves: 0,
    illegalMoves: 0,
    placeholderMoves: 0,
    crashOrTimeoutGames: 0,
  };

  for (let ply = 0; ply < maxPlies; ply++) {
    const state = terminalState(pos, seenPositions);
    seenPositions = state.seen;
    if (!state.legal) {
      return { start, result: state.result, reason: state.reason, plies: ply, log, stats };
    }

    const fen = posToFen(pos);
    const response = await callAgent(fen);
    if (response.elapsedMs > 250) stats.over250Moves++;
    if (response.elapsedMs > 1000) stats.over1000Moves++;

    const move = response.stdout || null;
    const entry = {
      fen,
      move,
      elapsedMs: response.elapsedMs,
      failed: response.failed,
    };
    log.push(entry);

    if (response.failed) {
      stats.crashOrTimeoutGames++;
      return { start, result: pos.side === 'w' ? '0-1' : '1-0', reason: 'agent crash/timeout', plies: ply, log, stats };
    }
    if (!UCI_RE.test(move || '')) {
      stats.invalidUciMoves++;
      return { start, result: pos.side === 'w' ? '0-1' : '1-0', reason: 'malformed UCI', plies: ply, log, stats };
    }
    if (move === '0000') {
      stats.placeholderMoves++;
      return { start, result: pos.side === 'w' ? '0-1' : '1-0', reason: 'unexpected 0000', plies: ply, log, stats };
    }

    const legalMove = state.legal.find((candidate) => moveToUci(candidate) === move);
    if (!legalMove) {
      stats.illegalMoves++;
      return { start, result: pos.side === 'w' ? '0-1' : '1-0', reason: 'illegal move', plies: ply, log, stats };
    }

    pos = applyMove(pos, legalMove);
  }

  return { start, result: '1/2-1/2', reason: 'move limit', plies: maxPlies, log, stats };
}

function validateGame(game, fenToMove) {
  let pos = parseFen(game.start.fen);
  let seenPositions = new Map();
  const errors = [];

  for (let ply = 0; ply < game.log.length; ply++) {
    const state = terminalState(pos, seenPositions);
    seenPositions = state.seen;
    if (!state.legal) {
      errors.push(`extra logged move after terminal state at ply ${ply}`);
      break;
    }

    const entry = game.log[ply];
    if (entry.fen !== posToFen(pos)) errors.push(`fen mismatch at ply ${ply + 1}`);
    if (!UCI_RE.test(entry.move || '')) errors.push(`malformed UCI at ply ${ply + 1}: ${entry.move}`);
    if (entry.move === '0000') errors.push(`unexpected 0000 at ply ${ply + 1}`);
    if (entry.elapsedMs > 1000) errors.push(`move exceeded 1000 ms at ply ${ply + 1}: ${entry.elapsedMs.toFixed(2)} ms`);

    const prior = fenToMove.get(entry.fen);
    if (prior && prior !== entry.move) errors.push(`non-deterministic move for FEN at ply ${ply + 1}: ${prior} vs ${entry.move}`);
    else if (!prior) fenToMove.set(entry.fen, entry.move);

    const legalMove = state.legal.find((candidate) => moveToUci(candidate) === entry.move);
    if (!legalMove) {
      errors.push(`illegal move in log at ply ${ply + 1}: ${entry.move}`);
      break;
    }
    pos = applyMove(pos, legalMove);
  }

  const end = terminalState(pos, seenPositions);
  const expectedResult = end.legal ? '1/2-1/2' : end.result;
  const expectedReason = end.legal ? 'move limit' : end.reason;
  if (game.result !== expectedResult) errors.push(`result mismatch: recorded ${game.result}, replay ${expectedResult}`);
  if (game.reason !== expectedReason) errors.push(`reason mismatch: recorded ${game.reason}, replay ${expectedReason}`);
  return errors;
}

function summarize(results, validationErrors, totalWallMs, options) {
  const outcomeCounts = { '1-0': 0, '0-1': 0, '1/2-1/2': 0 };
  const reasonCounts = new Map();
  const openingCounts = new Map();
  const moveTimes = [];
  let totalPlies = 0;
  let totalMoves = 0;
  let totalMoveMs = 0;
  const counters = {
    over250Moves: 0,
    over1000Moves: 0,
    invalidUciMoves: 0,
    illegalMoves: 0,
    placeholderMoves: 0,
    crashOrTimeoutGames: 0,
  };

  for (const game of results) {
    outcomeCounts[game.result]++;
    reasonCounts.set(game.reason, (reasonCounts.get(game.reason) || 0) + 1);
    openingCounts.set(game.start.label, (openingCounts.get(game.start.label) || 0) + 1);
    totalPlies += game.plies;
    totalMoves += game.log.length;
    for (const entry of game.log) {
      moveTimes.push(entry.elapsedMs);
      totalMoveMs += entry.elapsedMs;
    }
    for (const key of Object.keys(counters)) counters[key] += game.stats[key];
  }

  moveTimes.sort((a, b) => a - b);
  return {
    games: results.length,
    concurrency: options.concurrency,
    offset: options.offset,
    startPoolSize: STARTS.length,
    totalWallMs,
    totalPlies,
    totalMoves,
    avgPliesPerGame: Number((totalPlies / Math.max(results.length, 1)).toFixed(2)),
    avgMoveMs: Number((totalMoveMs / Math.max(totalMoves, 1)).toFixed(2)),
    p95MoveMs: Number(percentile(moveTimes, 0.95).toFixed(2)),
    maxMoveMs: Number((moveTimes[moveTimes.length - 1] || 0).toFixed(2)),
    results: outcomeCounts,
    reasons: Object.fromEntries(reasonCounts),
    startsUsed: Object.fromEntries(openingCounts),
    validationFailures: validationErrors.length,
    validationFailureSamples: validationErrors.slice(0, 10),
    ...counters,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const selectedStarts = STARTS.slice(options.offset, options.offset + options.games);
  if (!options.quiet) {
    console.log(`Self-play: ${selectedStarts.length} game(s) from ${STARTS.length} starting positions (offset ${options.offset}, concurrency ${options.concurrency}) — ${agentFile} vs itself\n`);
  }

  let nextIndex = 0;
  let completed = 0;
  const results = [];
  const startedAt = Date.now();

  async function worker() {
    while (true) {
      const index = nextIndex++;
      if (index >= selectedStarts.length) return;
      const start = selectedStarts[index];
      const game = await playGame(start, options.maxPlies);
      results[index] = game;
      completed++;

      if (!options.quiet) {
        const timings = game.log.map((entry) => entry.elapsedMs);
        const avgT = timings.length ? timings.reduce((sum, value) => sum + value, 0) / timings.length : 0;
        const maxT = timings.length ? Math.max(...timings) : 0;
        console.log(`Game ${index + 1}: ${start.label} … ${game.result}  (${game.reason}, ${game.plies} plies, avg ${avgT.toFixed(0)} ms/move, max ${maxT.toFixed(0)} ms)`);
        if (start.line?.length) console.log(`         Start line: ${start.line.join(' ')}`);
        if (game.log.length) {
          const preview = game.log.slice(0, 10).map((entry) => entry.move).join(' ') + (game.log.length > 10 ? ' …' : '');
          console.log(`         Moves: ${preview}`);
        }
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(options.concurrency, Math.max(selectedStarts.length, 1)) }, () => worker()));

  const fenToMove = new Map();
  const validationErrors = [];
  if (options.validate) {
    for (let i = 0; i < results.length; i++) {
      const errors = validateGame(results[i], fenToMove);
      if (errors.length) validationErrors.push({ game: i + 1, label: results[i].start.label, errors: errors.slice(0, 5) });
    }
  }

  const summary = summarize(results, validationErrors, Date.now() - startedAt, options);

  if (!options.quiet) {
    console.log('\nSummary');
    console.log(`Games: ${summary.games}, total plies: ${summary.totalPlies}, total wall time: ${summary.totalWallMs} ms`);
    console.log(`Move timing: avg ${summary.avgMoveMs} ms, p95 ${summary.p95MoveMs} ms, max ${summary.maxMoveMs} ms`);
    console.log(`Results: 1-0=${summary.results['1-0']}  0-1=${summary.results['0-1']}  1/2-1/2=${summary.results['1/2-1/2']}`);
    console.log(`Hard failures: crashes/timeouts=${summary.crashOrTimeoutGames}, malformed=${summary.invalidUciMoves}, illegal=${summary.illegalMoves}, 0000=${summary.placeholderMoves}, >1000ms=${summary.over1000Moves}`);
    if (summary.over250Moves) console.log(`Soft timing warning: ${summary.over250Moves} move(s) exceeded 250 ms`);
    if (options.validate) console.log(`Validation: ${summary.validationFailures === 0 ? 'PASS' : `FAIL (${summary.validationFailures} game(s))`}`);
  }

  if (options.summaryJson || options.quiet) {
    console.log(`SUMMARY_JSON ${JSON.stringify(summary)}`);
  }

  if (options.jsonOut) {
    mkdirSync(dirname(join(root, options.jsonOut)), { recursive: true });
    writeFileSync(join(root, options.jsonOut), JSON.stringify({ summary, games: results }, null, 2));
  }

  const hardFailures = summary.crashOrTimeoutGames || summary.invalidUciMoves || summary.illegalMoves || summary.placeholderMoves || summary.over1000Moves || summary.validationFailures;
  process.exitCode = hardFailures ? 1 : 0;
}

await main();
