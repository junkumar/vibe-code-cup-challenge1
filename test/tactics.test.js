// Tactical puzzle suite.
// Each case describes a position and the best move(s) that a strong agent
// should find. Cases are grouped by what they test so regressions are easy
// to diagnose.
//
// 1-ply cases: the correct move is visible without search (the current scoring
//   function should handle these).
// Deeper cases: require minimax/alpha-beta to find (will fail until search is
//   added and are marked with the minimum depth required).

import assert from 'node:assert/strict';
import test from 'node:test';
import { applyMove, isKingInCheck, legalMoves, moveToUci, parseFen } from '../agent.js';
import { runAgent } from './harness.js';

function assertMoveIsMateInOne(fen, output) {
  const pos = parseFen(fen);
  const move = legalMoves(pos).find((candidate) => moveToUci(candidate) === output);
  assert.ok(move, `Expected a legal move, got ${output}`);

  const next = applyMove(pos, move);
  const replies = legalMoves(next);
  assert.equal(replies.length, 0, `Expected ${output} to leave no legal replies`);
  assert.ok(isKingInCheck(next, next.side), `Expected ${output} to give checkmate`);
}

// ── Mate in one ───────────────────────────────────────────────────────────────

test('tactic: queen mate in one with king support', () => {
  const fen = '6k1/5Q2/6K1/8/8/8/8/8 w - - 0 1';
  const { output } = runAgent(fen);
  assertMoveIsMateInOne(fen, output);
});

test('tactic: rook delivers checkmate (Ra8#)', () => {
  // White rook slides to a8 for checkmate
  const fen = '7k/8/7K/8/8/8/8/R7 w - - 0 1';
  const { output } = runAgent(fen);
  assert.equal(output, 'a1a8', `Expected a1a8 (Ra8#), got ${output}`);
});

test('tactic: diagonal queen mate in one', () => {
  const fen = '6k1/8/5QK1/8/8/8/8/8 w - - 0 1';
  const { output } = runAgent(fen);
  assertMoveIsMateInOne(fen, output);
});

// ── Winning captures ──────────────────────────────────────────────────────────

test('tactic: capture free queen (no defender)', () => {
  // White queen on d1, black queen on d5 undefended
  const fen = '4k3/8/8/3q4/8/8/8/3QK3 w - - 0 1';
  const { output } = runAgent(fen);
  assert.equal(output, 'd1d5', `Expected d1d5 (Qxd5), got ${output}`);
});

test('tactic: capture free rook with pawn', () => {
  // White pawn on e4 can capture undefended black rook on d5
  const fen = '4k3/8/8/3r4/4P3/8/8/4K3 w - - 0 1';
  const { output } = runAgent(fen);
  assert.equal(output, 'e4d5', `Expected e4d5 (exd5), got ${output}`);
});

test('tactic: MVV-LVA: pawn takes queen beats pawn takes pawn', () => {
  // White pawn on c4, can take black queen on d5 or black pawn on b5 — must take queen
  const fen = '4k3/8/8/1p1q4/2P5/8/8/4K3 w - - 0 1';
  const { output } = runAgent(fen);
  assert.equal(output, 'c4d5', `Expected c4d5 (cxd5 queen), got ${output}`);
});

// ── Promotion ─────────────────────────────────────────────────────────────────

test('tactic: promote to queen (clear path)', () => {
  const fen = '4k3/6P1/6K1/8/8/8/8/8 w - - 0 1';
  const { output } = runAgent(fen);
  assert.equal(output, 'g7g8q', `Expected g7g8q, got ${output}`);
});

test('tactic: capture-promote to queen is preferred over quiet push', () => {
  // Pawn on g7 can push to g8 or capture on f8 (rook) — capturing and promoting is stronger
  const fen = '4kr2/6P1/6K1/8/8/8/8/8 w - - 0 1';
  const { output } = runAgent(fen);
  assert.ok(['g7f8q', 'g7g8q'].includes(output), `Expected promotion, got ${output}`);
});

// ── Avoiding blunders (requires at least 2-ply) ───────────────────────────────
// These will FAIL with a 1-ply agent and are here as a regression target once
// iterative deepening is added.

test('tactic [2-ply]: do not hang the queen (move away from attack)', () => {
  // White queen on e4 is attacked by black bishop on b7; must move queen or the agent
  // will play into material loss.
  const fen = '4k3/1b6/8/8/4Q3/8/8/4K3 w - - 0 1';
  const { output } = runAgent(fen);
  // Any queen move that escapes b7's diagonal is fine; d5/c6/f5/f3 etc.
  // The squares that stay on the b7-h1 diagonal are d5, f3 — wrong.
  const badMoves = ['e4d5', 'e4f3']; // remain on b7-h1 diagonal
  assert.ok(!badMoves.includes(output), `Hung queen with ${output}`);
});

test('tactic [2-ply]: fork detection — knight fork wins material', () => {
  // White knight on c3 can fork black king on e8 and queen on g7 via d5.
  // Needs 2-ply to see the queen is won after the forced king move.
  const fen = '4k3/6q1/8/8/8/2N5/8/4K3 w - - 0 1';
  const { output } = runAgent(fen);
  assert.equal(output, 'c3d5', `Expected c3d5 (knight fork), got ${output}`);
});
