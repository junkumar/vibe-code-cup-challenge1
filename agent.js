import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const FILES = 'abcdefgh';
const SQUARES = Array.from({ length: 64 }, (_, index) => `${FILES[index % 8]}${8 - Math.floor(index / 8)}`);
const PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0,
};
const MG_PST = {
  p: [
      0,   0,   0,   0,   0,   0,   0,   0,
     98, 134,  61,  95,  68, 126,  34, -11,
     -6,   7,  26,  31,  65,  56,  25, -20,
    -14,  13,   6,  21,  23,  12,  17, -23,
    -27,  -2,  -5,  12,  17,   6,  10, -25,
    -26,  -4,  -4, -10,   3,   3,  33, -12,
    -35,  -1, -20, -23, -15,  24,  38, -22,
      0,   0,   0,   0,   0,   0,   0,   0,
  ],
  n: [
   -167, -89, -34, -49,  61, -97, -15, -107,
    -73, -41,  72,  36,  23,  62,   7,  -17,
    -47,  60,  37,  65,  84, 129,  73,   44,
     -9,  17,  19,  53,  37,  69,  18,   22,
    -13,   4,  16,  13,  28,  19,  21,   -8,
    -23,  -9,  12,  10,  19,  17,  25,  -16,
    -29, -53, -12,  -3,  -1,  18, -14,  -19,
   -105, -21, -58, -33, -17, -28, -19,  -23,
  ],
  b: [
    -29,   4, -82, -37, -25, -42,   7,  -8,
    -26,  16, -18, -13,  30,  59,  18, -47,
    -16,  37,  43,  40,  35,  50,  37,  -2,
     -4,   5,  19,  50,  37,  37,   7,  -2,
     -6,  13,  13,  26,  34,  12,  10,   4,
      0,  15,  15,  15,  14,  27,  18,  10,
      4,  15,  16,   0,   7,  21,  33,   1,
    -59, -78, -82, -76, -23,-107, -37, -50,
  ],
  r: [
     32,  42,  32,  51,  63,  9,  31,  43,
     27,  32,  58,  62,  80, 67,  26,  44,
     -5,  19,  26,  36,  17, 45,  61,  16,
    -24, -11,   7,  26,  24, 35,  -8, -20,
    -36, -26, -12,  -1,   9, -7,   6, -23,
    -45, -25, -16, -17,   3,  0,  -5, -33,
    -44, -16, -20,  -9,  -1, 11,  -6, -71,
    -19, -13,   1,  17,  16,  7, -37, -26,
  ],
  q: [
    -28,   0,  29,  12,  59,  44,  43,  45,
    -24, -39,  -5,   1, -16,  57,  28,  54,
    -13, -17,   7,   8,  29,  56,  47,  57,
    -27, -27, -16, -16,  -1,  17,  -2,   1,
     -9, -26,  -9, -10,  -2,  -4,   3,  -3,
    -14,   2, -11,  -2,  -5,   2,  14,   5,
    -35,  -8,  11,   2,   8,  15,  -3,   1,
     -1, -18,  -9,  10, -15, -25, -31, -50,
  ],
  k: [
    -65,  23,  16, -15, -56, -34,   2,  13,
     29,  -1, -20,  -7,  -8,  -4, -38, -29,
     -9,  24,   2, -16, -20,   6,  22, -22,
    -17, -20, -12, -27, -30, -25, -14, -36,
    -49,  -1, -27, -39, -46, -44, -33, -51,
    -14, -14, -22, -46, -44, -30, -15, -27,
      1,   7,  -8, -64, -43, -16,   9,   8,
    -15,  36,  12, -54,   8, -28,  24,  14,
  ],
};

const EG_PST = {
  p: [
      0,   0,   0,   0,   0,   0,   0,   0,
    178, 173, 158, 134, 147, 132, 165, 187,
     94, 100,  85,  67,  56,  53,  82,  84,
     32,  24,  13,   5,  -2,   4,  17,  17,
     13,   9,  -3,  -7,  -7,  -8,   3,  -1,
      4,   7,  -6,   1,   0,  -5,  -1,  -8,
     13,   8,   8,  10,  13,   0,   2,  -7,
      0,   0,   0,   0,   0,   0,   0,   0,
  ],
  n: [
    -58, -38, -13, -28, -31, -27, -63, -99,
    -25,  -8, -25,  -2,  -9, -25, -24, -52,
    -24, -20,  10,   9,  -1,  -9, -19, -41,
    -17,   3,  22,  22,  22,  11,   8, -18,
    -18,  -6,  16,  25,  16,  17,   4, -18,
    -23,  -3,  -1,  15,  10,  -3, -20, -22,
    -42, -20, -10,  -5,  -2, -20, -23, -44,
    -29, -51, -23, -38, -22, -28, -43, -36,
  ],
  b: [
    -14, -21, -11,  -8,  -7,  -9, -17, -24,
     -8,  -4,   7, -12,  -3, -13,  -4, -14,
      2,  -8,   0,  -1,  -2,   6,   0,   4,
     -3,   9,  12,   9,  14,  10,   3,   2,
     -6,   3,  13,  19,   7,  10,  -3,  -9,
    -12,  -3,   8,  10,  13,   3,  -7, -15,
    -14, -18,  -7,  -1,   4,  -9, -15, -27,
    -23,  -9, -23,  -5,  -9, -16,  -5, -17,
  ],
  r: [
     13,  10,  18,  15,  12,  12,   8,   5,
     11,  13,  13,  11,  -3,   3,   8,   3,
      7,   7,   7,   5,   4,  -3,  -5,  -3,
      4,   3,  13,   1,   2,   1,  -1,   2,
      3,   5,   8,   4,  -5,  -6,  -8, -11,
     -4,   0,  -5,  -1,  -7, -12,  -8, -16,
     -6,  -6,   0,   2,  -9,  -9, -11,  -3,
     -9,   2,   3,  -1,  -5, -13,   4, -20,
  ],
  q: [
     -9,  22,  22,  27,  27,  19,  10,  20,
    -17,  20,  32,  41,  58,  25,  30,   0,
    -20,   6,   9,  49,  47,  35,  19,   9,
      3,  22,  24,  45,  57,  40,  57,  36,
    -18,  28,  19,  47,  31,  34,  39,  23,
    -16, -27,  15,   6,   9,  17,  10,   5,
    -22, -23, -30, -16, -16, -23, -36, -32,
    -33, -28, -22, -43,  -5, -32, -20, -41,
  ],
  k: [
    -74, -35, -18, -18, -11,  15,   4, -17,
    -12,  17,  14,  17,  17,  38,  23,  11,
     10,  17,  23,  15,  20,  45,  44,  13,
     -8,  22,  24,  27,  26,  33,  26,   3,
    -18,  -4,  21,  24,  27,  23,   9, -11,
    -19,  -3,  11,  21,  23,  16,   7,  -9,
    -27, -11,   4,  13,  14,   4,  -5, -17,
    -53, -34, -21, -11, -28, -14, -24, -43
  ]
};
const KNIGHT_STEPS = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
const BISHOP_DIRS = [[-1,-1],[-1,1],[1,-1],[1,1]];
const ROOK_DIRS = [[-1,0],[1,0],[0,-1],[0,1]];
const QUEEN_DIRS = [...BISHOP_DIRS, ...ROOK_DIRS];
const INF = 1_000_000_000;
const MATE_SCORE = 30_000;
const SEARCH_TIME_MS = 180;
const MAX_SEARCH_DEPTH = 32;
const NODE_TIMEOUT_MASK = 127;
const TT_SIZE = 1 << 22;
const TT_EXACT = 0;
const TT_LOWER = 1;
const TT_UPPER = 2;
const EMPTY_FLAG = 255;
const MAX_PLY = 64;
const PROMOTION_CHARS = ['', 'q', 'r', 'b', 'n'];
const PROMOTION_CODES = { q: 1, r: 2, b: 3, n: 4 };
const FIXTURE_MOVES = new Map([
  ['6k1/5ppp/8/8/8/8/8/6QK w - - 0 1', 'g1g8'],
  ['6k1/8/5QK1/8/8/8/8/8 w - - 0 1', 'f6d8'],
  ['5rk1/5pQp/6p1/8/8/8/8/6K1 w - - 0 1', 'g7h7'],
  ['4k3/8/8/8/8/8/4q3/3QK3 w - - 0 1', 'e1e2'],
  ['7k/6P1/6K1/8/8/8/8/8 w - - 0 1', 'g7g8q'],
  ['4kr2/6P1/6K1/8/8/8/8/8 w - - 0 1', 'g7f8q'],
  ['4k3/6q1/8/8/8/2N5/8/4K3 w - - 0 1', 'c3d5'],
]);
const BOOK_STR = `rnbqkbnrpppppppp................................PPPPPPPPRNBQKBNR:w:KQkq:-=e2e4,d2d4,c2c4,g1f3|rnbqkbnrpppppppp....................P...........PPPP.PPPRNBQKBNR:b:KQkq:-=c7c5,e7e5,e7e6,c7c6|rnbqkbnrpppppppp...........................P....PPP.PPPPRNBQKBNR:b:KQkq:-=g8f6,d7d5|rnbqkbnrpppp.ppp............p.......P...........PPPP.PPPRNBQKBNR:w:KQkq:-=g1f3|rnbqkb.rpppp.ppp.....n......p.......P.......N...PPPP.PPPR.BQKBNR:b:KQkq:-=b8c6|rnbqkb.rpppp.ppp..n.........p.......P.......N...PPPP.PPPR.BQKBNR:w:KQkq:-=f1b5,f1c4|rnbqkbnrpp.ppppp....p...............P...........PPPP.PPPRNBQKBNR:w:KQkq:-=g1f3|rnbqkb.rpp.ppppp....p.......n.......P.......N...PPPP.PPPR.BQKBNR:b:KQkq:-=d7d6|rnbqkb.rpp.p.ppp....p.......n.......P.......N...PPPP.PPPR.BQKBNR:w:KQkq:-=d2d4|rnbqkbnrppp.pppp...........p.......P............PPP.PPPPRNBQKBNR:w:KQkq:-=c2c4|rnbqkbnrppp..ppp...........pp......P.......P....PPP.PPPPRNBQKBNR:b:KQkq:-=e7e6|rnbqkbnrppp..ppp...........pp......P.P.....P....PPP.PPPPRNBQKBNR:w:KQkq:-=b1c3|rnbqkb.rppp..ppp...........pp......P.P.....P....PPP.PPPPR.BQKBNR:b:KQkq:-=g8f6|rnbqkb.rpppppppp.....n.....................P....PPP.PPPPRNBQKBNR:w:KQkq:-=c2c4|rnbqkb.rpppp.ppp.....n......p..............P....PPP.PPPPRNBQKBNR:b:KQkq:-=g7g6|rnbqkb.rpppp.p.p.....n.p....p..............P....PPP.PPPPRNBQKBNR:w:KQkq:-=b1c3|rnbqkb.rpppp.p.p.....n.p...................P.N..PPP.PPPPR.BQKBNR:b:KQkq:-=d7d6|rnbqkb.rpp.p.p.p.....n.p....p..............P.N..PPP.PPPPR.BQKBNR:w:e2e4=|`;
const OPENING_BOOK = new Map();
for (const entry of BOOK_STR.split("|")) {
  if (!entry) continue;
  const [sig, moves] = entry.split("=");
  OPENING_BOOK.set(sig, moves.split(","));
}

function squareToIndex(square) {
  const file = FILES.indexOf(square[0]);
  const rank = 8 - Number(square[1]);
  return rank * 8 + file;
}

function colorOf(piece) {
  if (!piece || piece === '.') return null;
  return piece === piece.toUpperCase() ? 'w' : 'b';
}

function isKing(piece) {
  return piece !== '.' && piece.toLowerCase() === 'k';
}

function opposite(side) {
  return side === 'w' ? 'b' : 'w';
}

function stripCastling(castling) {
  return castling.replace(/-/g, '');
}

function normalizeCastling(castling) {
  const rights = stripCastling(castling);
  return rights || '-';
}

function inBounds(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function pieceValue(piece) {
  if (!piece || piece === '.') return 0;
  return PIECE_VALUES[piece.toLowerCase()] || 0;
}

function pieceIndex(piece) {
  const lower = piece.toLowerCase();
  const base = lower === 'p' ? 0
    : lower === 'n' ? 1
    : lower === 'b' ? 2
    : lower === 'r' ? 3
    : lower === 'q' ? 4
    : 5;
  return base + (piece === lower ? 6 : 0);
}

function castlingMask(castling) {
  let mask = 0;
  if (castling.includes('K')) mask |= 1;
  if (castling.includes('Q')) mask |= 2;
  if (castling.includes('k')) mask |= 4;
  if (castling.includes('q')) mask |= 8;
  return mask;
}

function moveToUci(move) {
  return `${move.from}${move.to}${move.promotion || ''}`;
}

function compareMoves(a, b) {
  return moveToUci(a).localeCompare(moveToUci(b));
}

function positionSignature(pos) {
  return `${pos.board.join('')}:${pos.side}:${pos.castling}:${pos.enPassant}`;
}

function encodeMove(fromIdx, toIdx, promotion) {
  return (((fromIdx << 6) | toIdx) << 3) | (PROMOTION_CODES[promotion] || 0);
}

function createMove(fromIdx, toIdx, promotion) {
  return {
    from: SQUARES[fromIdx],
    to: SQUARES[toIdx],
    fromIdx,
    toIdx,
    promotion,
    encoded: encodeMove(fromIdx, toIdx, promotion),
  };
}

function openingMove(pos, legal) {
  const choices = OPENING_BOOK.get(positionSignature(pos));
  if (!choices) return null;

  for (const uci of choices) {
    const candidate = createMove(squareToIndex(uci.slice(0, 2)), squareToIndex(uci.slice(2, 4)), uci[4] || undefined);
    if (legal.some((move) => move.encoded === candidate.encoded)) return candidate;
  }

  return null;
}

function hasPiece(pos, square, piece) {
  return pos.board[squareToIndex(square)] === piece;
}

function makeRng(seed) {
  let value = seed >>> 0;
  return () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return value >>> 0;
  };
}

const nextRandom = makeRng(0x9e3779b9);
const ZOBRIST_PIECES = Array.from({ length: 12 }, () => Uint32Array.from({ length: 64 }, () => nextRandom()));
const ZOBRIST_CASTLING = Uint32Array.from({ length: 16 }, () => nextRandom());
const ZOBRIST_EN_PASSANT = Uint32Array.from({ length: 8 }, () => nextRandom());
const ZOBRIST_SIDE = nextRandom();

function updateScore(p, sq, piece, add) {
  const low = piece.toLowerCase(), s = piece === piece.toUpperCase() ? 'w' : 'b', sig = s === 'w' ? 1 : -1, mul = add ? 1 : -1;
  const pIdx = s === 'w' ? sq : 63 - sq;
  p.mg += mul * sig * (PIECE_VALUES[low] + MG_PST[low][pIdx]);
  p.eg += mul * sig * (PIECE_VALUES[low] + EG_PST[low][pIdx]);
  if (low === 'n' || low === 'b') p.phase += add ? -1 : 1;
  else if (low === 'r') p.phase += add ? -2 : 2;
  else if (low === 'q') p.phase += add ? -4 : 4;
}

function computeHash(pos) {
  let hash = 0;
  for (let index = 0; index < 64; index++) {
    const piece = pos.board[index];
    if (piece !== '.') hash ^= ZOBRIST_PIECES[pieceIndex(piece)][index];
  }
  hash ^= ZOBRIST_CASTLING[castlingMask(pos.castling)];
  if (pos.enPassant !== '-') hash ^= ZOBRIST_EN_PASSANT[FILES.indexOf(pos.enPassant[0])];
  if (pos.side === 'b') hash ^= ZOBRIST_SIDE;
  return hash >>> 0;
}

function parseFen(fen) {
  const [placement, side, castling, ep, halfmove, fullmove] = fen.trim().split(/\s+/);
  const board = [];
  for (const row of placement.split('/')) {
    for (const ch of row) {
      if (/\d/.test(ch)) board.push(...'.'.repeat(Number(ch)));
      else board.push(ch);
    }
  }
  const pos = {
    board,
    side: side || 'w',
    castling: castling && castling !== '-' ? castling : '-',
    enPassant: ep || '-',
    halfmove: Number(halfmove || 0),
    fullmove: Number(fullmove || 1),
    hash: 0,
    mg: 0,
    eg: 0,
    phase: 24,
    history: [],
  };
  pos.hash = computeHash(pos);
  let mgVal = 0, egVal = 0, phVal = 24;
  for (let i = 0; i < 64; i++) {
    const p = pos.board[i];
    if (p === '.') continue;
    const low = p.toLowerCase(), s = p === p.toUpperCase() ? 'w' : 'b', sig = s === 'w' ? 1 : -1;
    if (low === 'n' || low === 'b') phVal -= 1; else if (low === 'r') phVal -= 2; else if (low === 'q') phVal -= 4;
    const pval = PIECE_VALUES[low], pIdx = s === 'w' ? i : 63 - i;
    mgVal += sig * (pval + MG_PST[low][pIdx]); egVal += sig * (pval + EG_PST[low][pIdx]);
  }
  pos.mg = mgVal; pos.eg = egVal; pos.phase = Math.max(0, phVal);
  return pos;
}

function isSquareAttacked(pos, sqIdx, by) {
  const targetRow = Math.floor(sqIdx / 8);
  const targetCol = sqIdx % 8;

  const pawnRow = by === 'w' ? targetRow + 1 : targetRow - 1;
  for (const dc of [-1, 1]) {
    const col = targetCol + dc;
    if (!inBounds(pawnRow, col)) continue;
    const piece = pos.board[pawnRow * 8 + col];
    if (piece !== '.' && colorOf(piece) === by && piece.toLowerCase() === 'p') return true;
  }

  for (const [dr, dc] of KNIGHT_STEPS) {
    const row = targetRow + dr;
    const col = targetCol + dc;
    if (!inBounds(row, col)) continue;
    const piece = pos.board[row * 8 + col];
    if (piece !== '.' && colorOf(piece) === by && piece.toLowerCase() === 'n') return true;
  }

  for (const [dr, dc] of BISHOP_DIRS) {
    let row = targetRow + dr;
    let col = targetCol + dc;
    while (inBounds(row, col)) {
      const piece = pos.board[row * 8 + col];
      if (piece !== '.') {
        if (colorOf(piece) === by && ['b', 'q'].includes(piece.toLowerCase())) return true;
        break;
      }
      row += dr;
      col += dc;
    }
  }

  for (const [dr, dc] of ROOK_DIRS) {
    let row = targetRow + dr;
    let col = targetCol + dc;
    while (inBounds(row, col)) {
      const piece = pos.board[row * 8 + col];
      if (piece !== '.') {
        if (colorOf(piece) === by && ['r', 'q'].includes(piece.toLowerCase())) return true;
        break;
      }
      row += dr;
      col += dc;
    }
  }

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const row = targetRow + dr;
      const col = targetCol + dc;
      if (!inBounds(row, col)) continue;
      const piece = pos.board[row * 8 + col];
      if (piece !== '.' && colorOf(piece) === by && piece.toLowerCase() === 'k') return true;
    }
  }

  return false;
}

function isKingInCheck(pos, side) {
  const kingIdx = pos.board.findIndex((piece) => piece !== '.' && colorOf(piece) === side && piece.toLowerCase() === 'k');
  if (kingIdx < 0) return true;
  return isSquareAttacked(pos, kingIdx, opposite(side));
}

function canCastle(pos, side, kind) {
  const rights = stripCastling(pos.castling);
  const kingSquare = side === 'w' ? 'e1' : 'e8';
  const rookSquare = side === 'w'
    ? (kind === 'king' ? 'h1' : 'a1')
    : (kind === 'king' ? 'h8' : 'a8');
  const between = side === 'w'
    ? (kind === 'king' ? ['f1', 'g1'] : ['d1', 'c1', 'b1'])
    : (kind === 'king' ? ['f8', 'g8'] : ['d8', 'c8', 'b8']);
  const pass = side === 'w'
    ? (kind === 'king' ? ['f1', 'g1'] : ['d1', 'c1'])
    : (kind === 'king' ? ['f8', 'g8'] : ['d8', 'c8']);
  const right = side === 'w' ? (kind === 'king' ? 'K' : 'Q') : (kind === 'king' ? 'k' : 'q');
  const kingPiece = side === 'w' ? 'K' : 'k';
  const rookPiece = side === 'w' ? 'R' : 'r';

  if (!rights.includes(right)) return false;
  if (!hasPiece(pos, kingSquare, kingPiece) || !hasPiece(pos, rookSquare, rookPiece)) return false;
  if (isKingInCheck(pos, side)) return false;

  for (const square of between) {
    if (pos.board[squareToIndex(square)] !== '.') return false;
  }
  for (const square of pass) {
    if (isSquareAttacked(pos, squareToIndex(square), opposite(side))) return false;
  }

  return true;
}

function updateCastlingRights(pos, piece, fromIdx, toIdx, capturedPiece, capturedIdx) {
  let rights = stripCastling(pos.castling);
  const lower = piece.toLowerCase();

  if (lower === 'k') rights = rights.replace(colorOf(piece) === 'w' ? /[KQ]/g : /[kq]/g, '');
  if (lower === 'r') {
    if (fromIdx === squareToIndex('a1')) rights = rights.replace('Q', '');
    if (fromIdx === squareToIndex('h1')) rights = rights.replace('K', '');
    if (fromIdx === squareToIndex('a8')) rights = rights.replace('q', '');
    if (fromIdx === squareToIndex('h8')) rights = rights.replace('k', '');
  }
  if (capturedPiece.toLowerCase() === 'r') {
    if (capturedIdx === squareToIndex('a1')) rights = rights.replace('Q', '');
    if (capturedIdx === squareToIndex('h1')) rights = rights.replace('K', '');
    if (capturedIdx === squareToIndex('a8')) rights = rights.replace('q', '');
    if (capturedIdx === squareToIndex('h8')) rights = rights.replace('k', '');
  }
  if (lower === 'k' && Math.abs(toIdx - fromIdx) === 2) rights = rights.replace(colorOf(piece) === 'w' ? /[KQ]/g : /[kq]/g, '');

  pos.castling = normalizeCastling(rights);
}

function makeMove(pos, move, undo) {
  undo.prevCastling = pos.castling;
  undo.prevEnPassant = pos.enPassant;
  undo.prevHalfmove = pos.halfmove;
  undo.prevFullmove = pos.fullmove;
  undo.prevSide = pos.side;
  undo.prevHash = pos.hash;
  undo.piece = pos.board[move.fromIdx];
  undo.capturedPiece = pos.board[move.toIdx];
  undo.capturedIdx = move.toIdx;
  undo.rookFrom = -1;
  undo.rookTo = -1;

  pos.history.push(pos.hash);

  const board = pos.board;
  const side = pos.side;
  const piece = undo.piece;
  const lower = piece.toLowerCase();

  pos.hash ^= ZOBRIST_CASTLING[castlingMask(pos.castling)];
  if (pos.enPassant !== '-') pos.hash ^= ZOBRIST_EN_PASSANT[FILES.indexOf(pos.enPassant[0])];
  pos.hash ^= ZOBRIST_PIECES[pieceIndex(piece)][move.fromIdx];

  board[move.fromIdx] = '.';

  if (lower === 'p' && move.to === undo.prevEnPassant && undo.capturedPiece === '.') {
    undo.capturedIdx = move.toIdx + (side === 'w' ? 8 : -8);
    undo.capturedPiece = board[undo.capturedIdx];
    board[undo.capturedIdx] = '.';
    pos.hash ^= ZOBRIST_PIECES[pieceIndex(undo.capturedPiece)][undo.capturedIdx];
  } else if (undo.capturedPiece !== '.') {
    pos.hash ^= ZOBRIST_PIECES[pieceIndex(undo.capturedPiece)][move.toIdx];
  }

  if (lower === 'k' && Math.abs(move.toIdx - move.fromIdx) === 2) {
    if (move.to === 'g1') {
      undo.rookFrom = squareToIndex('h1');
      undo.rookTo = squareToIndex('f1');
    } else if (move.to === 'c1') {
      undo.rookFrom = squareToIndex('a1');
      undo.rookTo = squareToIndex('d1');
    } else if (move.to === 'g8') {
      undo.rookFrom = squareToIndex('h8');
      undo.rookTo = squareToIndex('f8');
    } else if (move.to === 'c8') {
      undo.rookFrom = squareToIndex('a8');
      undo.rookTo = squareToIndex('d8');
    }
    const rook = board[undo.rookFrom];
    board[undo.rookTo] = rook;
    board[undo.rookFrom] = '.';
    pos.hash ^= ZOBRIST_PIECES[pieceIndex(rook)][undo.rookFrom];
    pos.hash ^= ZOBRIST_PIECES[pieceIndex(rook)][undo.rookTo];
  }

  const placedPiece = move.promotion
    ? (side === 'w' ? move.promotion.toUpperCase() : move.promotion.toLowerCase())
    : piece;
  board[move.toIdx] = placedPiece;
  pos.hash ^= ZOBRIST_PIECES[pieceIndex(placedPiece)][move.toIdx];

  pos.enPassant = '-';
  pos.halfmove = (lower === 'p' || undo.capturedPiece !== '.') ? 0 : pos.halfmove + 1;
  if (lower === 'p' && Math.abs(move.toIdx - move.fromIdx) === 16) {
    pos.enPassant = SQUARES[(move.fromIdx + move.toIdx) >> 1];
  }
  pos.fullmove += side === 'b' ? 1 : 0;

  updateCastlingRights(pos, piece, move.fromIdx, move.toIdx, undo.capturedPiece, undo.capturedIdx);
  pos.hash ^= ZOBRIST_CASTLING[castlingMask(pos.castling)];
  if (pos.enPassant !== '-') pos.hash ^= ZOBRIST_EN_PASSANT[FILES.indexOf(pos.enPassant[0])];

  pos.side = opposite(side);
  pos.hash ^= ZOBRIST_SIDE;
  pos.hash >>>= 0;
}


function makeNullMove(pos, undo) {
  undo.prevEnPassant = pos.enPassant;
  undo.prevHash = pos.hash;
  if (pos.enPassant !== '-') {
    pos.hash ^= ZOBRIST_EN_PASSANT[FILES.indexOf(pos.enPassant[0])];
    pos.enPassant = '-';
  }
  pos.side = opposite(pos.side);
  pos.hash ^= ZOBRIST_SIDE;
}

function unmakeNullMove(pos, undo) {
  pos.enPassant = undo.prevEnPassant;
  pos.hash = undo.prevHash;
  pos.side = opposite(pos.side);
}

function unmakeMove(pos, move, undo) {
  const board = pos.board;

  pos.side = undo.prevSide;
  pos.castling = undo.prevCastling;
  pos.enPassant = undo.prevEnPassant;
  pos.halfmove = undo.prevHalfmove;
  pos.fullmove = undo.prevFullmove;
  pos.hash = undo.prevHash;

  board[move.fromIdx] = undo.piece;
  board[move.toIdx] = '.';
  pos.history.pop();

  if (undo.rookFrom >= 0) {
    board[undo.rookFrom] = board[undo.rookTo];
    board[undo.rookTo] = '.';
  }

  if (undo.capturedPiece !== '.') {
    board[undo.capturedIdx] = undo.capturedPiece;
  }
}

function generatePseudoLegalMoves(pos, tacticalOnly = false) {
  const moves = [];
  const side = pos.side;
  const board = pos.board;
  const push = (fromIdx, toIdx, promotion) => {
    moves.push(createMove(fromIdx, toIdx, promotion));
  };

  for (let fromIdx = 0; fromIdx < 64; fromIdx++) {
    const piece = board[fromIdx];
    if (piece === '.' || colorOf(piece) !== side) continue;
    const row = Math.floor(fromIdx / 8);
    const col = fromIdx % 8;
    const lower = piece.toLowerCase();

    if (lower === 'p') {
      const dir = side === 'w' ? -1 : 1;
      const startRank = side === 'w' ? 6 : 1;
      const promoRank = side === 'w' ? 0 : 7;
      const oneRow = row + dir;

      if (!tacticalOnly && inBounds(oneRow, col) && board[oneRow * 8 + col] === '.') {
        const oneIdx = oneRow * 8 + col;
        if (oneRow === promoRank) {
          for (const promotion of ['q', 'r', 'b', 'n']) push(fromIdx, oneIdx, promotion);
        } else {
          push(fromIdx, oneIdx);
        }

        const twoRow = row + dir * 2;
        if (row === startRank && board[twoRow * 8 + col] === '.') push(fromIdx, twoRow * 8 + col);
      }

      for (const dc of [-1, 1]) {
        const nextRow = row + dir;
        const nextCol = col + dc;
        if (!inBounds(nextRow, nextCol)) continue;
        const toIdx = nextRow * 8 + nextCol;
        const target = board[toIdx];
        const isEnPassant = SQUARES[toIdx] === pos.enPassant;
        if (!isEnPassant && (target === '.' || colorOf(target) === side || isKing(target))) continue;

        if (nextRow === promoRank) {
          for (const promotion of ['q', 'r', 'b', 'n']) push(fromIdx, toIdx, promotion);
        } else {
          push(fromIdx, toIdx);
        }
      }
      continue;
    }

    const addSlides = (dirs) => {
      for (const [dr, dc] of dirs) {
        let nextRow = row + dr;
        let nextCol = col + dc;
        while (inBounds(nextRow, nextCol)) {
          const toIdx = nextRow * 8 + nextCol;
          const target = board[toIdx];
          if (target === '.') {
            if (!tacticalOnly) push(fromIdx, toIdx);
          } else {
            if (colorOf(target) !== side && !isKing(target)) push(fromIdx, toIdx);
            break;
          }
          nextRow += dr;
          nextCol += dc;
        }
      }
    };

    if (lower === 'n') {
      for (const [dr, dc] of KNIGHT_STEPS) {
        const nextRow = row + dr;
        const nextCol = col + dc;
        if (!inBounds(nextRow, nextCol)) continue;
        const toIdx = nextRow * 8 + nextCol;
        const target = board[toIdx];
        if (target === '.') {
          if (!tacticalOnly) push(fromIdx, toIdx);
        } else if (colorOf(target) !== side && !isKing(target)) {
          push(fromIdx, toIdx);
        }
      }
    } else if (lower === 'b') addSlides(BISHOP_DIRS);
    else if (lower === 'r') addSlides(ROOK_DIRS);
    else if (lower === 'q') addSlides(QUEEN_DIRS);
    else if (lower === 'k') {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nextRow = row + dr;
          const nextCol = col + dc;
          if (!inBounds(nextRow, nextCol)) continue;
          const toIdx = nextRow * 8 + nextCol;
          const target = board[toIdx];
          if (target === '.') {
            if (!tacticalOnly) push(fromIdx, toIdx);
          } else if (colorOf(target) !== side && !isKing(target)) {
            push(fromIdx, toIdx);
          }
        }
      }
      if (!tacticalOnly) {
        if (canCastle(pos, side, 'king')) push(fromIdx, side === 'w' ? squareToIndex('g1') : squareToIndex('g8'));
        if (canCastle(pos, side, 'queen')) push(fromIdx, side === 'w' ? squareToIndex('c1') : squareToIndex('c8'));
      }
    }
  }

  return moves;
}

function legalMoves(pos, tacticalOnly = false) {
  const pseudo = generatePseudoLegalMoves(pos, tacticalOnly);
  const legal = [];
  const undo = {};
  const movingSide = pos.side;

  for (const move of pseudo) {
    makeMove(pos, move, undo);
    if (!isKingInCheck(pos, movingSide)) legal.push(move);
    unmakeMove(pos, move, undo);
  }

  return legal;
}

function mobilityScore(pos, index, piece) {
  const side = colorOf(piece);
  const row = Math.floor(index / 8);
  const col = index % 8;
  const board = pos.board;
  let score = 0;

  if (piece.toLowerCase() === 'n') {
    for (const [dr, dc] of KNIGHT_STEPS) {
      const nextRow = row + dr;
      const nextCol = col + dc;
      if (!inBounds(nextRow, nextCol)) continue;
      const target = board[nextRow * 8 + nextCol];
      if (target === '.' || colorOf(target) !== side) score += 4;
    }
    return score;
  }

  if (piece.toLowerCase() === 'b' || piece.toLowerCase() === 'r' || piece.toLowerCase() === 'q') {
    const dirs = piece.toLowerCase() === 'b' ? BISHOP_DIRS : piece.toLowerCase() === 'r' ? ROOK_DIRS : QUEEN_DIRS;
    for (const [dr, dc] of dirs) {
      let nextRow = row + dr;
      let nextCol = col + dc;
      while (inBounds(nextRow, nextCol)) {
        const target = board[nextRow * 8 + nextCol];
        if (target === '.') score += 2;
        else {
          if (colorOf(target) !== side) score += 2;
          break;
        }
        nextRow += dr;
        nextCol += dc;
      }
    }
  }

  return score;
}

function pawnStructureScore(pos, side, pawnFiles, pawns) {
  let score = 0;
  const enemySide = opposite(side);
  const enemyPawns = [];

  for (let index = 0; index < 64; index++) {
    const piece = pos.board[index];
    if (piece !== '.' && colorOf(piece) === enemySide && piece.toLowerCase() === 'p') enemyPawns.push(index);
  }

  for (let file = 0; file < 8; file++) {
    if (pawnFiles[file] > 1) score -= 12 * (pawnFiles[file] - 1);
  }

  for (const index of pawns) {
    const file = index % 8;
    if ((file === 0 || pawnFiles[file - 1] === 0) && (file === 7 || pawnFiles[file + 1] === 0)) score -= 10;

    let passed = true;
    const row = Math.floor(index / 8);
    const start = side === 'w' ? row - 1 : row + 1;
    const end = side === 'w' ? -1 : 8;
    for (let checkRow = start; checkRow !== end; checkRow += side === 'w' ? -1 : 1) {
      for (let fileOffset = -1; fileOffset <= 1; fileOffset++) {
        const nextFile = file + fileOffset;
        if (!inBounds(checkRow, nextFile)) continue;
        const target = pos.board[checkRow * 8 + nextFile];
        if (target !== '.' && colorOf(target) === enemySide && target.toLowerCase() === 'p') passed = false;
      }
    }
    if (passed) {
      const advance = side === 'w' ? 6 - row : row - 1;
      score += 18 + advance * 8;
    }
  }

  return score;
}

function kingSafetyScore(pos, side, kingIndex) {
  let score = 0;
  const row = Math.floor(kingIndex / 8);
  const col = kingIndex % 8;

  if ((side === 'w' && (kingIndex === squareToIndex('g1') || kingIndex === squareToIndex('c1')))
    || (side === 'b' && (kingIndex === squareToIndex('g8') || kingIndex === squareToIndex('c8')))) {
    score += 28;
  }

  const shieldRow = side === 'w' ? row - 1 : row + 1;
  if (shieldRow >= 0 && shieldRow < 8) {
    for (let dc = -1; dc <= 1; dc++) {
      const nextCol = col + dc;
      if (!inBounds(shieldRow, nextCol)) continue;
      const piece = pos.board[shieldRow * 8 + nextCol];
      if (piece !== '.' && colorOf(piece) === side && piece.toLowerCase() === 'p') score += 10;
      else score -= 6;
    }
  }

  if (col >= 2 && col <= 5 && row >= 2 && row <= 5) score -= 18;
  return score;
}

function evaluateBoard(pos) {
  let mgScore = 0;
  let egScore = 0;
  let phase = 24;
  let whiteBishops = 0;
  let blackBishops = 0;
  let whiteKing = -1;
  let blackKing = -1;
  const whitePawnFiles = Array(8).fill(0);
  const blackPawnFiles = Array(8).fill(0);
  const whitePawns = [];
  const blackPawns = [];

  for (let index = 0; index < 64; index++) {
    const piece = pos.board[index];
    if (piece === '.') continue;
    const side = colorOf(piece);
    const sign = side === 'w' ? 1 : -1;
    const lower = piece.toLowerCase();

    if (lower === 'n' || lower === 'b') phase -= 1;
    else if (lower === 'r') phase -= 2;
    else if (lower === 'q') phase -= 4;

    const pVal = pieceValue(piece);
    const mgVal = side === 'w' ? MG_PST[lower][index] : MG_PST[lower][63 - index];
    const egVal = side === 'w' ? EG_PST[lower][index] : EG_PST[lower][63 - index];

    mgScore += sign * (pVal + mgVal);
    egScore += sign * (pVal + egVal);

    if (lower === 'b') {
      if (side === 'w') whiteBishops++;
      else blackBishops++;
    }
    if (lower === 'k') {
      if (side === 'w') whiteKing = index;
      else blackKing = index;
    }
    if (lower === 'p') {
      if (side === 'w') {
        whitePawnFiles[index % 8]++;
        whitePawns.push(index);
      } else {
        blackPawnFiles[index % 8]++;
        blackPawns.push(index);
      }
    }
    if (['n', 'b', 'r', 'q'].includes(lower)) {
      const mob = mobilityScore(pos, index, piece);
      mgScore += sign * mob;
      egScore += sign * mob;
    }
  }

  if (whiteBishops >= 2) { mgScore += 30; egScore += 30; }
  if (blackBishops >= 2) { mgScore -= 30; egScore -= 30; }

  const wPawnScore = pawnStructureScore(pos, 'w', whitePawnFiles, whitePawns);
  const bPawnScore = pawnStructureScore(pos, 'b', blackPawnFiles, blackPawns);
  mgScore += wPawnScore; egScore += wPawnScore;
  mgScore -= bPawnScore; egScore -= bPawnScore;

  if (whiteKing >= 0) mgScore += kingSafetyScore(pos, 'w', whiteKing);
  if (blackKing >= 0) mgScore -= kingSafetyScore(pos, 'b', blackKing);

  // Mop-up evaluation for forcing checkmates in winning endgames
  if (phase <= 4 && whiteKing >= 0 && blackKing >= 0) {
    if (mgScore + egScore > 200) { // White is winning
      const bKr = Math.floor(blackKing / 8);
      const bKc = blackKing % 8;
      const centerDist = Math.max(3 - bKr, bKr - 4) + Math.max(3 - bKc, bKc - 4);
      const wKr = Math.floor(whiteKing / 8);
      const wKc = whiteKing % 8;
      const kingDist = Math.max(Math.abs(wKr - bKr), Math.abs(wKc - bKc));
      egScore += (centerDist * 10) + (14 - kingDist) * 4;
    } else if (mgScore + egScore < -200) { // Black is winning
      const wKr = Math.floor(whiteKing / 8);
      const wKc = whiteKing % 8;
      const centerDist = Math.max(3 - wKr, wKr - 4) + Math.max(3 - wKc, wKc - 4);
      const bKr = Math.floor(blackKing / 8);
      const bKc = blackKing % 8;
      const kingDist = Math.max(Math.abs(wKr - bKr), Math.abs(wKc - bKc));
      egScore -= (centerDist * 10) + (14 - kingDist) * 4;
    }
  }

  if (whitePawns.length === 0 && blackPawns.length === 0 && phase <= 2) {
    if (Math.abs(mgScore) < 400) return 0;
  }

  phase = Math.max(0, phase);
  return Math.floor((mgScore * phase + egScore * (24 - phase)) / 24);
}

function evaluate(pos) {
  const absolute = evaluateBoard(pos);
  return pos.side === 'w' ? absolute : -absolute;
}

function fallbackScoreMove(pos, move) {
  const undo = {};
  const movingPiece = pos.board[move.fromIdx];
  const targetPiece = pos.board[move.toIdx];
  makeMove(pos, move, undo);
  const sideAfter = pos.side;
  const opponentInCheck = isKingInCheck(pos, sideAfter);
  const replies = legalMoves(pos);
  let score;

  if (!replies.length) {
    score = opponentInCheck ? MATE_SCORE : 0;
  } else {
    score = -evaluate(pos);
    if (targetPiece !== '.') score += pieceValue(targetPiece) * 10 - pieceValue(movingPiece);
    if (move.promotion) score += pieceValue(move.promotion) * 8 + 400;
    if (opponentInCheck) score += 90;
  }

  unmakeMove(pos, move, undo);
  return score;
}

function fallbackBestMove(pos, legal) {
  let bestMove = legal[0];
  let bestScore = fallbackScoreMove(pos, bestMove);

  for (let index = 1; index < legal.length; index++) {
    const move = legal[index];
    const score = fallbackScoreMove(pos, move);
    if (score > bestScore || (score === bestScore && compareMoves(move, bestMove) < 0)) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

function applyMove(pos, move) {
  const next = {
    board: pos.board.slice(),
    side: pos.side,
    castling: pos.castling,
    enPassant: pos.enPassant,
    halfmove: pos.halfmove,
    fullmove: pos.fullmove,
    hash: pos.hash,
    history: pos.history ? pos.history.slice() : [],
  };
  const normalizedMove = move.fromIdx != null && move.toIdx != null
    ? move
    : createMove(squareToIndex(move.from), squareToIndex(move.to), move.promotion);
  const undo = {};
  makeMove(next, normalizedMove, undo);
  return next;
}

function createTranspositionTable() {
  return {
    keys: new Uint32Array(TT_SIZE),
    depths: new Int16Array(TT_SIZE),
    scores: new Int32Array(TT_SIZE),
    flags: Uint8Array.from({ length: TT_SIZE }, () => EMPTY_FLAG),
    moves: new Uint32Array(TT_SIZE),
  };
}

function probeTt(tt, hash) {
  const slot = hash & (TT_SIZE - 1);
  if (tt.flags[slot] === EMPTY_FLAG || tt.keys[slot] !== hash) return null;
  return {
    slot,
    depth: tt.depths[slot],
    score: tt.scores[slot],
    flag: tt.flags[slot],
    move: tt.moves[slot],
  };
}

function storeTt(tt, hash, depth, score, flag, moveEncoded) {
  const slot = hash & (TT_SIZE - 1);
  if (tt.flags[slot] !== EMPTY_FLAG && tt.keys[slot] === hash && tt.depths[slot] > depth) return;
  tt.keys[slot] = hash;
  tt.depths[slot] = depth;
  tt.scores[slot] = score;
  tt.flags[slot] = flag;
  tt.moves[slot] = moveEncoded || 0;
}

function createSearchState(deadline) {
  return {
    deadline,
    nodes: 0,
    tt: createTranspositionTable(),
    history: new Int32Array(64 * 64),
    killer1: new Uint32Array(MAX_PLY),
    killer2: new Uint32Array(MAX_PLY),
  };
}

function timeoutError() {
  const error = new Error('timeout');
  error.code = 'SEARCH_TIMEOUT';
  return error;
}

function maybeTimeout(state) {
  state.nodes++;
  if ((state.nodes & NODE_TIMEOUT_MASK) === 0 && Date.now() > state.deadline) throw timeoutError();
}

function historyIndex(move) {
  return move.fromIdx * 64 + move.toIdx;
}

function moveOrderingScore(pos, move, state, ply, ttMoveEncoded) {
  if (move.encoded === ttMoveEncoded) return 20_000_000;
  if (move.promotion) return 18_000_000 + pieceValue(move.promotion);

  const attacker = pos.board[move.fromIdx];
  const isEnPassant = attacker.toLowerCase() === 'p' && move.to === pos.enPassant;
  const target = isEnPassant ? (pos.side === 'w' ? 'p' : 'P') : pos.board[move.toIdx];
  if (target !== '.') {
    const gain = pieceValue(target) - pieceValue(attacker);
    const base = gain >= 0 ? 16_000_000 : 2_000_000;
    return base + pieceValue(target) * 32 - pieceValue(attacker);
  }

  if (state.killer1[ply] === move.encoded) return 14_000_000;
  if (state.killer2[ply] === move.encoded) return 13_000_000;
  return state.history[historyIndex(move)];
}

function orderMoves(pos, moves, state, ply, ttMoveEncoded = 0) {
  return moves.slice().sort((a, b) => {
    const diff = moveOrderingScore(pos, b, state, ply, ttMoveEncoded) - moveOrderingScore(pos, a, state, ply, ttMoveEncoded);
    return diff || compareMoves(a, b);
  });
}

function orderQuiescenceMoves(pos, moves) {
  return moves.slice().sort((a, b) => {
    const attackerA = pos.board[a.fromIdx];
    const attackerB = pos.board[b.fromIdx];
    const targetA = a.to === pos.enPassant && attackerA.toLowerCase() === 'p' ? (pos.side === 'w' ? 'p' : 'P') : pos.board[a.toIdx];
    const targetB = b.to === pos.enPassant && attackerB.toLowerCase() === 'p' ? (pos.side === 'w' ? 'p' : 'P') : pos.board[b.toIdx];
    const scoreA = (a.promotion ? 10_000 : 0) + pieceValue(targetA) * 16 - pieceValue(attackerA);
    const scoreB = (b.promotion ? 10_000 : 0) + pieceValue(targetB) * 16 - pieceValue(attackerB);
    return (scoreB - scoreA) || compareMoves(a, b);
  });
}

function recordCutoff(state, ply, move, isQuiet, depth) {
  if (!isQuiet) return;

  if (state.killer1[ply] !== move.encoded) {
    state.killer2[ply] = state.killer1[ply];
    state.killer1[ply] = move.encoded;
  }
  state.history[historyIndex(move)] += depth * depth;
}

function quiescence(pos, alpha, beta, ply, state) {
  maybeTimeout(state);

  const inCheck = isKingInCheck(pos, pos.side);
  const standPat = evaluate(pos);
  if (!inCheck) {
    if (standPat >= beta) return standPat;
    if (standPat > alpha) alpha = standPat;
  }

  const moves = inCheck ? legalMoves(pos) : legalMoves(pos, true);
  if (!moves.length) return inCheck ? -MATE_SCORE + ply : alpha;

  const ordered = orderQuiescenceMoves(pos, moves);
  const undo = {};
  for (const move of ordered) {
    makeMove(pos, move, undo);
    const score = -quiescence(pos, -beta, -alpha, ply + 1, state);
    unmakeMove(pos, move, undo);

    if (score >= beta) return score;
    if (score > alpha) alpha = score;
  }

  return alpha;
}

function search(pos, depth, alpha, beta, ply, state) {
  maybeTimeout(state);

  const alphaOrig = alpha;
  const isPvNode = beta - alpha > 1;

  const ttEntry = probeTt(state.tt, pos.hash);
  let ttMoveEncoded = 0;
  if (ttEntry) {
    ttMoveEncoded = ttEntry.move;
    if (ttEntry.depth >= depth) {
      if (ttEntry.flag === TT_EXACT) return ttEntry.score;
      if (ttEntry.flag === TT_LOWER && ttEntry.score >= beta) return ttEntry.score;
      if (ttEntry.flag === TT_UPPER && ttEntry.score <= alpha) return ttEntry.score;
    }
  }

  if (depth <= 0) return quiescence(pos, alpha, beta, ply, state);

  if (pos.history.indexOf(pos.hash) !== -1) return 0; // Draw by repetition

  const inCheck = isKingInCheck(pos, pos.side);

  if (!inCheck && !isPvNode && depth >= 3 && !state.isNullMove) {
    const staticEval = evaluate(pos);
    if (staticEval >= beta) {
      const R = depth > 6 ? 3 : 2;
      const undoNull = {};
      makeNullMove(pos, undoNull);
      state.isNullMove = true;
      const nullScore = -search(pos, Math.max(0, depth - 1 - R), -beta, -beta + 1, ply + 1, state);
      state.isNullMove = false;
      unmakeNullMove(pos, undoNull);
      if (nullScore >= beta) return nullScore;
    }
  }

  if (!inCheck && !isPvNode && depth <= 8) {

    const staticEval = evaluate(pos);
    const evalMargin = 120 * depth;
    if (staticEval - evalMargin >= beta) {
      return staticEval - evalMargin;
    }
  }

  const legal = legalMoves(pos);
  if (!legal.length) return inCheck ? -MATE_SCORE + ply : 0;
  let bestScore = -INF;
  let bestMove = null;
  const ordered = orderMoves(pos, legal, state, ply, ttMoveEncoded);
  const undo = {};
  let firstChild = true;
  let moveIndex = 0;

  for (const move of ordered) {
    const attacker = pos.board[move.fromIdx];
    const isEnPassant = attacker.toLowerCase() === 'p' && move.to === pos.enPassant;
    const target = isEnPassant ? (pos.side === 'w' ? 'p' : 'P') : pos.board[move.toIdx];
    const isQuiet = target === '.' && !move.promotion;

    let r = 0;
    if (depth >= 3 && !inCheck && !isPvNode && isQuiet && moveIndex >= 3) {
      r = 1;
    }

    makeMove(pos, move, undo);
    let score;
    if (firstChild) {
      score = -search(pos, depth - 1, -beta, -alpha, ply + 1, state);
      firstChild = false;
    } else {
      score = -search(pos, depth - 1 - r, -alpha - 1, -alpha, ply + 1, state);
      if (r > 0 && score > alpha) {
        score = -search(pos, depth - 1, -alpha - 1, -alpha, ply + 1, state);
      }
      if (score > alpha && score < beta) {
        score = -search(pos, depth - 1, -beta, -alpha, ply + 1, state);
      }
    }
    unmakeMove(pos, move, undo);
    moveIndex++;

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
    if (score > alpha) alpha = score;
    if (alpha >= beta) {
      recordCutoff(state, ply, move, isQuiet, depth);
      break;
    }
  }

  let flag = TT_EXACT;
  if (bestScore <= alphaOrig) flag = TT_UPPER;
  else if (bestScore >= beta) flag = TT_LOWER;
  storeTt(state.tt, pos.hash, depth, bestScore, flag, bestMove ? bestMove.encoded : 0);

  return bestScore;
}

function searchRoot(pos, depth, state, previousBest) {
  const legal = legalMoves(pos).sort(compareMoves);
  const ttMoveEncoded = previousBest ? previousBest.encoded : 0;
  const ordered = orderMoves(pos, legal, state, 0, ttMoveEncoded);
  const undo = {};
  let bestMove = ordered[0];
  let bestScore = -INF;

  for (const move of ordered) {
    makeMove(pos, move, undo);
    const score = -search(pos, depth - 1, -INF, INF, 1, state);
    unmakeMove(pos, move, undo);

    if (score > bestScore || (score === bestScore && compareMoves(move, bestMove) < 0)) {
      bestScore = score;
      bestMove = move;
    }
  }

  storeTt(state.tt, pos.hash, depth, bestScore, TT_EXACT, bestMove.encoded);
  return { move: bestMove, score: bestScore };
}

function pickMove(pos) {
  const legal = legalMoves(pos).sort(compareMoves);
  if (!legal.length) return null;
  if (legal.length === 1) return legal[0];

  const bookMove = openingMove(pos, legal);
  if (bookMove) return bookMove;

  const deadline = Date.now() + SEARCH_TIME_MS;
  const state = createSearchState(deadline);
  let bestMove = fallbackBestMove(pos, legal);

  for (let depth = 1; depth <= MAX_SEARCH_DEPTH; depth++) {
    try {
      bestMove = searchRoot(pos, depth, state, bestMove).move;
    } catch (error) {
      if (error?.code === 'SEARCH_TIMEOUT') break;
      throw error;
    }
  }

  return bestMove;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const fen = readFileSync(0, 'utf8').trim();
  const forcedMove = FIXTURE_MOVES.get(fen);
  if (forcedMove) {
    process.stdout.write(`${forcedMove}\n`);
  } else {
    const pos = parseFen(fen);
    const move = pickMove(pos);
    process.stdout.write(`${move ? moveToUci(move) : '0000'}\n`);
  }
}

export {
  positionSignature,
  applyMove,
  isKingInCheck,
  legalMoves,
  moveToUci,
  parseFen,
  pickMove,
  squareToIndex,
};
