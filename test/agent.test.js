import assert from 'node:assert/strict';
import test from 'node:test';
import { runAgent } from './harness.js';

const cases = [
  {
    name: 'opening move for white',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    legal: ['a2a3','a2a4','b1a3','b1c3','b2b3','b2b4','c2c3','c2c4','d2d3','d2d4','e2e3','e2e4','f2f3','f2f4','g1f3','g1h3','g2g3','g2g4','h2h3','h2h4'],
  },
  {
    name: 'opening reply for black',
    fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    legal: ['a7a5','a7a6','b7b5','b7b6','b8a6','b8c6','c7c5','c7c6','d7d5','d7d6','e7e5','e7e6','f7f5','f7f6','g7g5','g7g6','g8f6','g8h6','h7h5','h7h6'],
  },
  {
    name: 'forced check evasion',
    fen: '4k3/8/8/8/8/8/4q3/4K3 w - - 0 1',
    legal: ['e1e2'],
  },
  {
    name: 'pinned rook cannot expose king',
    fen: '4k3/8/8/8/8/8/4r3/4K2R w - - 0 1',
    legal: ['e1d1','e1e2','e1f1'],
  },
  {
    name: 'castling position',
    fen: 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',
    legal: ['a1a2','a1a3','a1a4','a1a5','a1a6','a1a7','a1a8','a1b1','a1c1','a1d1','e1c1','e1d1','e1d2','e1e2','e1f1','e1f2','e1g1','h1f1','h1g1','h1h2','h1h3','h1h4','h1h5','h1h6','h1h7','h1h8'],
  },
  {
    name: 'promotion must include a legal promotion piece',
    fen: '4k3/6P1/8/8/8/8/8/4K3 w - - 0 1',
    legal: ['e1d1','e1d2','e1e2','e1f1','e1f2','g7g8b','g7g8n','g7g8q','g7g8r'],
  },
  {
    name: 'en passant target is legal',
    fen: '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1',
    legal: ['e1d1','e1d2','e1e2','e1f1','e1f2','e5d6','e5e6'],
  },
  {
    name: 'no legal moves prints 0000 placeholder',
    fen: '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1',
    legal: [],
  },
];

for (const testCase of cases) {
  test(testCase.name, () => {
    const { output } = runAgent(testCase.fen);
    if (testCase.legal.length === 0) {
      assert.equal(output, '0000', `${testCase.name}: expected 0000 when no legal moves exist`);
      return;
    }
    assert.ok(testCase.legal.includes(output), `${testCase.name}: illegal move ${output}`);
  });
}

test('same FEN always yields the same move', () => {
  assert.equal(runAgent(cases[0].fen).output, runAgent(cases[0].fen).output);
});

test('prefers a mate in one when available', () => {
  const fen = '6k1/5Q2/6K1/8/8/8/8/8 w - - 0 1';
  assert.equal(runAgent(fen).output, 'f7e8');
});

test('prefers a free queen capture over quiet moves', () => {
  const fen = '4k3/8/8/8/8/8/4q3/3QK3 w - - 0 1';
  assert.equal(runAgent(fen).output, 'e1e2');
});

test('prefers promotion to a queen in a winning promotion spot', () => {
  const fen = '7k/6P1/6K1/8/8/8/8/8 w - - 0 1';
  assert.equal(runAgent(fen).output, 'g7g8q');
});
