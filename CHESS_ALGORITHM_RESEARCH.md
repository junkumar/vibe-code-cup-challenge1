# Chess Algorithm Research for This Repo

This writeup answers two different questions:

1. What are the strongest chess-engine algorithm families today?
2. Which one is the best fit for this repo's actual constraints?

The answer is not the same for both.

## Bottom Line

**Best fit for this repo:** implement a **classical negamax alpha-beta engine** with:

- iterative deepening
- quiescence search
- a transposition table keyed by Zobrist hashing
- strong move ordering
- aspiration windows
- a better static evaluation

**Not the best first fit here:** AlphaZero-style `policy + value network + MCTS/PUCT`.

**Longer-term strongest practical family:** Stockfish-style **alpha-beta search + NNUE evaluation** is the most realistic "top-engine" direction for chess on CPU hardware today, but it is much more work than the challenge needs.

## Why This Recommendation Fits This Repo

This repo is not an unrestricted chess-engine project. The challenge requires:

- one root source file only
- Node.js standard library only
- no network or package installs at runtime
- deterministic behavior
- target `250 ms` per move
- hard timeout at `1000 ms`

See [README.md](/Users/nandu/dev/vibe-code-cup-challenge1/README.md).

**Inference for this repo:** under those constraints, the highest expected strength per unit of engineering time is a classical search engine, not a neural/MCTS engine. AlphaZero/Lc0-style systems are strong because they combine a trained network with expensive search infrastructure and optimized inference. That does not map well to a single-file Node submission with a tight per-move budget.

## What The Best Engines Actually Use

### 1. Classical search engines

The core idea is still alpha-beta search. Knuth and Moore's classic 1975 paper describes alpha-beta as an optimized way to search game trees and analyzes its running time and correctness: [An Analysis of Alpha-Beta Pruning](https://charlesames.net/references/DonaldKnuth/alpha-beta.html).

Modern engines do not stop at plain alpha-beta. They layer on:

- iterative deepening
- transposition tables
- quiescence search
- move ordering heuristics
- aspiration windows
- selective pruning and reductions

Stockfish's current search code is a direct contemporary example:

- iterative deepening loop in `search.cpp`: [search.cpp](https://github.com/official-stockfish/Stockfish/blob/master/src/search.cpp)
- aspiration windows in the root search loop: same file
- transposition-table cutoffs and bound handling: same file
- null-move pruning and ProbCut: same file
- clustered TT layout and replacement policy: [tt.cpp](https://github.com/official-stockfish/Stockfish/blob/master/src/tt.cpp)
- staged move ordering and SEE/history-driven ordering: [movepick.cpp](https://github.com/official-stockfish/Stockfish/blob/master/src/movepick.cpp) and [history.h](https://github.com/official-stockfish/Stockfish/blob/master/src/history.h)

### 2. Neural MCTS engines

AlphaZero and Leela Chess Zero use a different family:

- a neural net produces a **policy** over moves and a **value** for the position
- search uses **MCTS/PUCT** instead of alpha-beta

Primary sources:

- DeepMind preprint: [A general reinforcement learning algorithm that masters chess, shogi and Go through self-play](https://storage.googleapis.com/deepmind-media/DeepMind.com/Blog/alphazero-shedding-new-light-on-chess-shogi-and-go/alphazero_preprint.pdf)
- Lc0 primer: [AlphaZero Primer](https://lczero.org/dev/lc0/search/alphazero/)

Important takeaways from those sources:

- AlphaZero uses MCTS with policy and value heads, not brute-force alpha-beta.
- Lc0 describes the edge score as `PUCT = Q + U`, with `U = c_puct * P * sqrt(N_total) / (1 + N)`.
- AlphaZero searched far fewer positions than Stockfish in the published match, but relied on a trained network to focus search.

**Inference for this repo:** MCTS without a strong trained policy/value model is usually the wrong tradeoff for chess. Plain rollouts are much less effective in chess than in Go, and a tiny handcrafted policy network is unlikely to repay its implementation cost here.

### 3. NNUE engines

NNUE is the main bridge between classical search and neural evaluation. Stockfish's NNUE docs describe it as an **efficiently updatable neural network** designed for low-latency CPU inference:

- [NNUE docs](https://official-stockfish.github.io/docs/nnue-pytorch-wiki/docs/nnue.html)

Important takeaways:

- NNUE works because inputs are sparse and change only slightly between moves.
- the first layer can be incrementally updated using added/removed features
- the design targets CPU inference at very high evaluation throughput

**Inference for this repo:** NNUE is the strongest long-term upgrade path if you keep a classical alpha-beta engine, but it is phase 2 or phase 3 work, not the first change to make in this challenge repo.

## Recommendation Matrix

| Approach | Strength ceiling | Implementation cost | Fit for this repo | Recommendation |
| --- | --- | --- | --- | --- |
| Plain minimax / fixed-depth alpha-beta | Moderate | Low | Good | Too weak by itself |
| Iterative deepening negamax alpha-beta + qsearch + TT + ordering | High | Moderate | Excellent | **Best next step** |
| Alpha-beta + stronger pruning/reductions | Very high | Moderate to high | Excellent | **Add after baseline search works** |
| Alpha-beta + NNUE | Extremely high | High | Medium | Strong, but not first |
| MCTS without trained net | Low to moderate | Moderate | Poor | Avoid |
| AlphaZero/Lc0-style policy+value+MCTS | Extremely high | Very high | Poor | Not practical here |

## Grandmaster Starting Moves

If you want this engine to behave like strong human opening practice, the opening tree should stay concentrated around a very small set of first moves.

### White's first move

A 2019 analysis of the Lichess Masters database reported this first-move distribution over `2.12m` master games:

- `1.e4`: `45.3%`
- `1.d4`: `35.9%`
- `1.Nf3`: `10.1%`
- `1.c4`: `6.9%`
- everything else combined: `1.8%`

Source: [Opening Frequencies](https://raskerino.wordpress.com/2019/05/03/opening-frequencies/) quoting the Lichess Masters database.

A newer Chess.com summary published on **February 27, 2026** still describes the same top tier: `1.e4` is the most popular first move in grandmaster games, `1.d4` is second, and `1.Nf3` and `1.c4` remain close enough in objective strength that engines treat all four as near-equivalent.

Source: [In Search of the Perfect Debut](https://www.chess.com/blog/paulqbk/in-search-of-the-perfect-debut-statistical-proof-and-expert-opinions-on-the-best-chess-openings).

**Inference for this repo:** if you ever add a tiny opening book or opening prior, it does not need to cover dozens of White first moves. Covering `e4`, `d4`, `Nf3`, and `c4` gets almost all serious grandmaster practice.

### Black's main replies to `1.e4`

Across standard opening references and frequency summaries, the reply families that matter are:

- `1...e5`
- `1...c5` (Sicilian)
- `1...e6` (French)
- `1...c6` (Caro-Kann)

The 2026 Chess.com summary specifically calls out the **Sicilian** and **...e5** as Black's main equalizing tries against `1.e4`.

Source: [In Search of the Perfect Debut](https://www.chess.com/blog/paulqbk/in-search-of-the-perfect-debut-statistical-proof-and-expert-opinions-on-the-best-chess-openings).

An older opening-frequency survey also lists the ordering after `1.e4` as:

- most common: `1...e5`
- next: `1...c5`
- then `1...e6`
- then `1...c6`

Source: [Chess Opening Frequency](https://www.chess.com/article/view/chess-opening-frequency).

Inside Open Sicilian master games, the same 2019 Lichess Masters analysis found that after
`1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3`, Black chose:

- `5...a6` Najdorf: `66.4%`
- `5...Nc6` Classical: `15.2%`
- `5...g6` Dragon: `13.6%`
- `5...e6` Scheveningen: `4.0%`

Source: [Opening Frequencies](https://raskerino.wordpress.com/2019/05/03/opening-frequencies/).

The same source also notes that in its master snapshot, the **French** was the third most popular reply to `1.e4`, and the **Caro-Kann** was materially behind the top two but still a real part of serious practice.

### Black's main replies to `1.d4`

The high-level picture is much tighter than many club repertoires suggest.

An opening-frequency survey reported that the most common Black reply to `1.d4` was `1...Nf6`, followed closely by `1...d5`, with those plus `1...f5` accounting for over `90%` of responses in that database.

Source: [Chess Opening Frequency](https://www.chess.com/article/view/chess-opening-frequency).

The 2019 Lichess Masters analysis is more specific about current master practice:

- `1...Nf6` is more popular than `1...d5`
- after `1.d4 d5`, White chooses `2.c4` `78.1%` of the time
- after `1.d4 Nf6`, White chooses `2.c4` `80.4%` of the time
- in those `1...Nf6 2.c4` positions, Black mostly chooses `...e6` or `...g6`

Source: [Opening Frequencies](https://raskerino.wordpress.com/2019/05/03/opening-frequencies/).

**Inference for this repo:** if you prepare only a tiny amount of `1.d4` opening knowledge, prioritize:

- `1...Nf6` structures leading to Nimzo/QID/Queen's Indian/King's Indian/Grunfeld-style setups
- `1...d5` structures leading to Queen's Gambit Declined, Slav, and Semi-Slav positions

### What this means for implementation

If you decide to add an opening component, keep it very small and very concentrated.

A practical first book or prior should emphasize:

- as White: `1.e4`, `1.d4`, `1.Nf3`, `1.c4`
- against `1.e4`: mostly `...e5`, `...c5`, with `...e6` and `...c6` as secondary
- against `1.d4`: mostly `...Nf6` and `...d5`

Do not overfit to named openings too early. For this engine, the useful lesson from grandmaster practice is mainly **tree concentration**:

- elite games overwhelmingly start from a narrow opening trunk
- transpositions matter, especially between `d4`, `Nf3`, and `c4`
- a tiny deterministic book is more likely to help than a large brittle one

## Concrete Build Order

The current [agent.js](/Users/nandu/dev/vibe-code-cup-challenge1/agent.js) already has legal move generation and a simple static evaluator. The right path is to upgrade the search stack in stages.

### Stage 1: replace one-ply move scoring with iterative deepening negamax alpha-beta

Target algorithm:

```text
pickMove(position):
  deadline = now + safeBudgetMs
  bestMove = first legal move
  prevScore = 0

  for depth = 1..MAX:
    [completed, score, move] = searchRoot(position, depth, prevScore, deadline)
    if !completed:
      break
    bestMove = move
    prevScore = score

  return bestMove
```

Use **fail-soft negamax alpha-beta**:

```text
search(pos, depth, alpha, beta):
  if timed out: abort
  if terminal: return mate/draw score
  if depth <= 0: return quiescence(pos, alpha, beta)

  probe TT
  if usable TT bound exists: return TT score

  bestScore = -INF
  bestMove = NONE

  for move in orderedMoves(pos):
    make(move)
    score = -search(child, depth - 1, -beta, -alpha)
    unmake(move)

    if score > bestScore:
      bestScore = score
      bestMove = move
    if score > alpha:
      alpha = score
    if alpha >= beta:
      record cutoff heuristics
      break

  store TT entry with EXACT / LOWER / UPPER bound
  return bestScore
```

### Stage 2: add quiescence search

Without quiescence, the engine will blunder at the horizon. Stockfish still uses `qsearch` as a core component of modern search; see `search.cpp`.

Use this shape:

```text
quiescence(pos, alpha, beta):
  standPat = evaluate(pos)
  if standPat >= beta: return standPat
  if standPat > alpha: alpha = standPat

  generate forcing moves:
    captures
    promotions
    evasions if in check

  for move in ordered forcing moves:
    make(move)
    score = -quiescence(child, -beta, -alpha)
    unmake(move)
    if score >= beta: return score
    if score > alpha: alpha = score

  return alpha
```

Recommended first version:

- include captures and promotions
- if side to move is in check, search all legal evasions
- do **not** add checking moves outside check yet

### Stage 3: add a transposition table

Zobrist's hashing paper introduced the standard approach for game-position hashing: [A New Hashing Method with Application for Game Playing](https://journals.sagepub.com/doi/10.3233/ICG-1990-13203).

Core implementation:

1. Precompute random 64-bit numbers for:
   - piece type x color x square
   - side to move
   - castling rights
   - en passant file
2. Position hash is XOR of active features.
3. Update the hash incrementally in `makeMove`/`unmakeMove`.
4. Index the TT with `hash & (tableSize - 1)` when table size is a power of two.

Each TT entry should store:

- partial key or full key
- depth searched
- score
- bound type: `EXACT`, `LOWER`, `UPPER`
- best move
- age / generation

Stockfish's TT source is a good reference for:

- clustered storage
- replacement policy based on depth and age
- storing bounds rather than only exact scores

Source: [tt.cpp](https://github.com/official-stockfish/Stockfish/blob/master/src/tt.cpp)

**Inference for this repo:** in Node, avoid a `Map` of JS objects for the main TT if you care about speed and memory. Use packed arrays or typed arrays. A simple fixed-size table is enough.

Recommended first JS layout:

- `Uint32Array keyLo`
- `Uint32Array keyHi` or one partial-key array
- `Int16Array score`
- `Int8Array depth`
- `Uint8Array flag`
- `Uint32Array move`
- `Uint8Array age`

Start with something like `2^16` or `2^17` entries and tune from there.

### Stage 4: add move ordering

Move ordering is the multiplier on alpha-beta. Schaeffer's history-heuristic paper calls it "an inexpensive way to re-order moves dynamically" and reported a runtime reduction in chess: [The History Heuristic](https://journals.sagepub.com/doi/pdf/10.3233/ICG-1983-6305).

Recommended move-order priority:

1. TT move
2. winning captures and promotions
3. killer moves
4. quiet moves sorted by history score
5. bad captures last

A practical first scoring function:

```text
score(move):
  if move == ttMove: return 10_000_000
  if promotion: return 9_000_000 + promotedPieceValue
  if capture: return 8_000_000 + MVV_LVA(move)
  if move == killer1[ply]: return 7_000_000
  if move == killer2[ply]: return 6_900_000
  return history[from][to]
```

Where:

- `MVV_LVA` = most valuable victim, least valuable attacker
- `killer` = quiet move that previously caused a beta cutoff at the same ply
- `history[from][to]` increases when a quiet move causes cutoffs

This is enough to get real gains before adding more advanced heuristics.

### Stage 5: upgrade evaluation

The current evaluator is material plus piece-square tables. Keep that, but extend it.

Recommended first additions:

- tapered evaluation between middlegame and endgame
- mobility bonuses for knights/bishops/rooks/queens
- bishop pair bonus
- passed pawn bonus
- isolated and doubled pawn penalties
- king safety:
  - castled bonus
  - pawn shield bonus
  - exposed king penalties

Keep evaluation cheap. Under these constraints, search speed matters more than fancy heuristics.

## Strong Add-Ons After The Baseline Works

These are worth adding after the engine is stable and timed safely.

### Aspiration windows

Stockfish starts each new root iteration with a narrow score window around the previous iteration's score, then widens on fail-low/fail-high. See `search.cpp`.

Recommended first version:

- after depth `>= 3`, start with `alpha = prevScore - 30`, `beta = prevScore + 30`
- if fail-low or fail-high, widen to `60`, `120`, `240`, then full window

This usually reduces node count when the score is stable.

### Null-move pruning

Donninger's null-move paper describes the technique as a serious candidate for controlling chess search and modern engines still use it in guarded form: [Null Move and Deep Search](https://journals.sagepub.com/doi/10.3233/ICG-1993-16304).

Recommended first version:

- only at non-PV nodes
- not in check
- not in likely zugzwang endgames
- depth `>= 3`
- reduction `R = 2 + floor(depth / 4)`

Shape:

```text
if canTryNull:
  makeNullMove()
  score = -search(pos, depth - 1 - R, -beta, -beta + 1)
  unmakeNullMove()
  if score >= beta:
    return score
```

Be conservative. Null move is powerful, but it can break in zugzwang-like endings.

### Late move reductions

**Inference from modern engine practice and Stockfish's reduction-heavy search structure:** once move ordering is good, later quiet moves are usually worse than earlier moves. Reducing depth on late quiet moves can buy a large node-count reduction.

Recommended first version:

- only for quiet non-PV moves
- depth `>= 3`
- after the first 3 or 4 ordered moves
- reduce by 1 ply first
- if reduced search returns above alpha, re-search at full depth

Do not start with an aggressive formula. A simple `-1 ply` reduction is safer.

### SEE instead of only MVV-LVA

Static exchange evaluation improves capture ordering by estimating whether a capture wins or loses material after the full exchange sequence.

**Inference for this repo:** start with MVV-LVA. Add SEE only if captures are still noisy after TT/history/killer ordering is in place.

## Data-Structure Advice Specific To This Codebase

The current [agent.js](/Users/nandu/dev/vibe-code-cup-challenge1/agent.js) clones the whole position in `applyMove()` and filters legal moves by applying each pseudo-legal move.

That is correct, but it will bottleneck quickly once you search deeper than one ply.

Recommended changes:

1. Convert from `applyMove()` cloning to `makeMove()` / `unmakeMove()` with an undo stack.
2. Keep a single mutable position during search.
3. Update:
   - board squares
   - castling rights
   - en passant
   - halfmove/fullmove
   - Zobrist hash
4. Store undo info per ply:
   - captured piece
   - previous castling rights
   - previous en passant
   - previous halfmove
   - previous hash

**Inference for this repo:** this will matter more than bitboards at first. A well-ordered alpha-beta with make/unmake on the current board representation can beat a poorly integrated bitboard rewrite.

## Parameter Defaults I Would Start With

These are engineering defaults, not paper mandates.

### Search

- safe time budget: `120-180 ms` per move, not the full `250 ms`
- iterative depths: `1, 2, 3, ...` until deadline
- timeout check every `256` or `512` nodes
- mate score: something like `30000 - ply`

### Quiescence

- stand-pat enabled unless in check
- captures + promotions only
- all evasions when in check

### Move ordering

- TT move first
- MVV-LVA captures
- 2 killer slots per ply
- history indexed by `from * 64 + to`

### TT

- power-of-two size
- overwrite if empty, older, or shallower
- store best move even on bound nodes

### Evaluation

- keep values in centipawns
- keep deterministic tie-breaking by stable move order if scores match

## What Not To Spend Time On First

- opening books
- endgame tablebases
- MCTS rollouts
- full bitboard rewrite before search exists
- NNUE training pipeline
- exotic search variants like MTD(f) before a strong alpha-beta baseline

## Suggested Implementation Plan For This Repo

1. Refactor move application to make/unmake.
2. Add iterative deepening negamax alpha-beta.
3. Add quiescence.
4. Add Zobrist hash and TT.
5. Add killer/history ordering.
6. Add aspiration windows.
7. Add conservative null move.
8. Add simple late move reduction.
9. Improve evaluation.
10. Only then consider NNUE or a deeper representation rewrite.

## Source Notes

Primary sources used here:

- Knuth and Moore on alpha-beta: [https://charlesames.net/references/DonaldKnuth/alpha-beta.html](https://charlesames.net/references/DonaldKnuth/alpha-beta.html)
- Zobrist hashing: [https://journals.sagepub.com/doi/10.3233/ICG-1990-13203](https://journals.sagepub.com/doi/10.3233/ICG-1990-13203)
- Schaeffer history heuristic: [https://journals.sagepub.com/doi/pdf/10.3233/ICG-1983-6305](https://journals.sagepub.com/doi/pdf/10.3233/ICG-1983-6305)
- Donninger null move: [https://journals.sagepub.com/doi/10.3233/ICG-1993-16304](https://journals.sagepub.com/doi/10.3233/ICG-1993-16304)
- DeepMind AlphaZero preprint: [https://storage.googleapis.com/deepmind-media/DeepMind.com/Blog/alphazero-shedding-new-light-on-chess-shogi-and-go/alphazero_preprint.pdf](https://storage.googleapis.com/deepmind-media/DeepMind.com/Blog/alphazero-shedding-new-light-on-chess-shogi-and-go/alphazero_preprint.pdf)
- Lc0 AlphaZero primer: [https://lczero.org/dev/lc0/search/alphazero/](https://lczero.org/dev/lc0/search/alphazero/)
- Stockfish search: [https://github.com/official-stockfish/Stockfish/blob/master/src/search.cpp](https://github.com/official-stockfish/Stockfish/blob/master/src/search.cpp)
- Stockfish TT: [https://github.com/official-stockfish/Stockfish/blob/master/src/tt.cpp](https://github.com/official-stockfish/Stockfish/blob/master/src/tt.cpp)
- Stockfish NNUE docs: [https://official-stockfish.github.io/docs/nnue-pytorch-wiki/docs/nnue.html](https://official-stockfish.github.io/docs/nnue-pytorch-wiki/docs/nnue.html)

Where this document says **Inference**, that part is my engineering recommendation derived from those sources plus this repo's constraints.

---

## Deep-Dive Additions (Round 2 Research)

*These sections fill gaps in the original document with more precise formulas, implementation details, and techniques not previously covered.*

---

### Principal Variation Search (PVS / NegaScout)

All modern top engines use **PVS** rather than plain negamax alpha-beta. The code difference is small; the speed difference is significant.

**Core idea:** with good move ordering, the first move at each node is almost always the best. Search it with the full `[alpha, beta]` window. Search all subsequent moves with a zero-width window `[-alpha-1, -alpha]` — this is cheap because the 1-cp window prunes almost immediately. If a zero-window search surprisingly returns above alpha, do a full re-search.

```text
pvs(pos, depth, alpha, beta):
  if depth <= 0: return quiescence(pos, alpha, beta)

  firstChild = true
  for move in orderedMoves(pos):
    make(move)
    if firstChild:
      score = -pvs(child, depth-1, -beta, -alpha)
      firstChild = false
    else:
      score = -pvs(child, depth-1, -alpha-1, -alpha)   // zero-window scout
      if score > alpha and score < beta:                // surprise: re-search
        score = -pvs(child, depth-1, -beta, -alpha)
    unmake(move)

    if score >= beta: return score
    if score > alpha: alpha = score

  return alpha
```

With perfect ordering, PVS visits O(b^(d/2)) nodes — the theoretical minimum for alpha-beta. Re-searches are rare when ordering is good.

**Node type tracking:** always track `isPvNode = (beta - alpha > 1)`. LMR, futility pruning, RFP, and other heuristics should only fire at non-PV nodes. PV nodes are on the principal variation and must be searched fully.

---

### LMR: The Exact Stockfish Formula

The existing document describes LMR conceptually. The precise Stockfish 16/17 formula:

```cpp
// Precomputed at engine init:
Reductions[d][m] = int(1.69 * log(d) * log(m) + 0.5);
```

Base reduction: `R ≈ 1.69 × ln(depth) × ln(moveNumber)`

Per-move adjustments applied on top:

| Condition | Δ |
|---|---|
| Non-PV node | +1 |
| Not improving (staticEval worse than 2 plies ago) | +1 |
| Low / negative history score | +1 or +2 |
| Move gives check | −1 or −2 |
| High history score | −1 or −2 |
| TT move | Never reduced |

Final `R = max(0, min(R, depth - 1))`.

**The re-search on LMR fail-high is mandatory** — never return a reduced-search result above alpha without re-searching at full depth. Skipping this produces incorrect play.

**The improving flag:** `improving = staticEval[ply] > staticEval[ply-2]` (same side to move, two plies back). When improving, reduce less; when not improving at a non-PV node, reduce more. This is ±1 ply and adds Elo for a single integer comparison.

---

### Advanced Move Ordering: The Full Priority Stack

Complete 7-stage move ordering used in modern engines:

```
Stage 1: TT move (hash move) — always first, never reduced by LMR
Stage 2: Good captures (SEE >= 0)
         score = MVV-LVA + captureHistory[moving_piece][to][captured_type]
Stage 3: Killer move slot 0   (quiet move causing cutoff at this ply)
Stage 4: Killer move slot 1
Stage 5: Countermove          (refutation stored per opponent's [piece][to])
Stage 6: Quiet moves, score = 2 * butterfly[color][from*64+to]
                             + 2 * contHist1[piece][to]   (1-ply continuation)
                             +     contHist2[piece][to]   (2-ply continuation)
                             +     contHist4[piece][to]   (4-ply continuation)
Stage 7: Bad captures (SEE < 0), sorted by SEE + captureHistory — last
```

In quiescence search:
```
Stage 1: TT move if it is a capture
Stage 2: Good captures (SEE >= 0), ordered by MVV-LVA + captureHistory
Stage 3: Quiet checks at depth >= -1 (optional)
[Bad captures pruned entirely unless in check]
```

#### Continuation History

Standard history records `(from, to)` globally. **Continuation history** conditions each move's score on what the previous move was — a bigram model. This captures patterns like "when the opponent plays Nf3, our move e5 tends to be good."

```js
// Index: [prevPiece * 64 + prevTo][currPiece * 64 + currTo]
const contHist = new Int16Array(12 * 64 * 12 * 64);
```

Combined score formula:
```
moveScore = 2 * butterfly[color][from*64+to]
          + 2 * contHist1[prev1PieceTo][currPieceTo]   // opponent's last move
          +     contHist2[prev2PieceTo][currPieceTo]   // our move 2 plies ago
          +     contHist4[prev4PieceTo][currPieceTo]   // our move 4 plies ago
```

Weiss and other small engines implement 1-ply and 2-ply continuation and skip the 4-ply, finding diminishing returns vs. memory cost.

#### Capture History

A separate `captureHistory[moving_piece][to][captured_type]` table refines MVV-LVA ordering within the good-captures bucket. Updated with depth² bonus/malus identically to quiet history.

#### History Gravity Update Formula

Plain `history += depth²` can overflow. Use the Stockfish gravity update:

```js
const MAX_HISTORY = 16384;
function updateHistory(table, idx, bonus) {
    // bonus = +min(depth*depth, 2048) for cutoff move
    // bonus = -min(depth*depth, 2048) for moves searched before cutoff (malus)
    table[idx] += bonus - table[idx] * Math.abs(bonus) / MAX_HISTORY;
}
```

Keeps values bounded in `[−MAX_HISTORY, +MAX_HISTORY]` without explicit clamping or periodic reset.

---

### Static Exchange Evaluation (SEE): The Swap Algorithm

```text
SEE(board, from, to):
  gain[0] = pieceValue(board[to])     // value of first capture
  piece = board[from]
  remove piece from board             // expose X-ray attackers
  attackers = allAttackersTo(board, to)
  side = oppositeColor(movingColor)
  d = 0

  while true:
    d++
    gain[d] = pieceValue(piece) - gain[d-1]
    if max(-gain[d-1], gain[d]) < 0: break  // alpha-beta shortcut
    side = opposite(side)
    piece = leastValuableAttacker(board, to, side)
    if piece == NONE: break
    remove piece from board            // expose next X-ray attacker

  while d > 0:
    d--
    gain[d-1] = -max(-gain[d-1], gain[d])

  return gain[0]
```

Always use the **least valuable attacker** — a side will always recapture with a pawn before a queen. The alpha-beta condition inside the loop short-circuits when the outcome is already clear.

**Stockfish's threshold API:** `see_ge(move, threshold)` returns a boolean — "does this exchange gain at least N centipawns?" It short-circuits as soon as the outcome is known, making it faster than computing the exact value.

**How SEE is used:**
1. Move picker: `SEE >= 0` → good captures (stage 2); `SEE < 0` → bad captures (stage 7)
2. Qsearch: losing captures (`SEE < 0`) are pruned unless in check
3. Quiet pruning: quiet moves with `SEE < −50 × depth` are skipped at low depth
4. Delta pruning: per-move delta uses SEE value rather than raw captured-piece value
5. ProbCut: SEE pre-filter gates which captures enter ProbCut consideration
6. Check extensions: only extend checks with `SEE >= 0`

---

### Additional Pruning Techniques

#### Reverse Futility Pruning (Static Null Move Pruning)

If the static eval is already far above beta, return without searching any moves:

```text
if !inCheck && !isPvNode && depth <= 9:
    if staticEval - 200 * depth >= beta:
        return staticEval - 200 * depth
```

Applied **before the move loop** — no moves generated. Currently in Stockfish 16/17. ~200 cp/ply is the tuned constant. Never at PV nodes. Fails in zugzwang — avoid in king+pawn endgames.

#### Futility Pruning

Near leaves, skip individual quiet moves that cannot reach alpha:

```text
futilityValue = staticEval + 200 * depth
if !inCheck && !isPvNode && depth <= 9:
    for each quiet move:
        if futilityValue <= alpha: skip move
```

Applied inside the move loop. Never apply to the TT move, captures, checks, or PV nodes.

#### Singular Extensions

When one move appears dramatically better than all alternatives, extend it:

```text
singularBeta = ttScore - 16 * depth
singularDepth = (depth - 1) / 2

if depth >= 8 && move == ttMove && ttHasLowerBound:
    score = search(pos, singularDepth, singularBeta-1, singularBeta,
                   excludingMove = ttMove)
    if score < singularBeta:
        extension = 1             // singular — extend
    else if score >= beta:
        return singularBeta       // multi-cut — prune
```

**Double extension (SF15+):** if `ttScore > singularBeta + 30`, extend by 2 instead of 1.

**Gotchas:** guard against recursive SE (set a flag); cap total extensions per node to prevent exponential depth blowup (`depth + extension <= 2 × baseDepth`).

#### ProbCut

Stockfish's two-stage implementation:

```text
probcutBeta = beta + 168

if depth >= 5 && !isPvNode:
    for each capture (SEE-ordered, SEE >= probcutBeta - staticEval):
        make(capture)
        score = -qsearch(child, -probcutBeta, -probcutBeta+1)
        if score >= probcutBeta:
            score = -search(child, depth-4, -probcutBeta, -probcutBeta+1)
        unmake(capture)
        if score >= probcutBeta: return score
```

The SEE pre-filter is essential for efficiency. The two-stage qsearch-then-full-search is Stockfish's refinement. Never at PV nodes. Only captures.

#### Delta Pruning in Quiescence Search

```text
// Node-level: can any capture help?
if standPat + maxEnemyPieceValue + 200 < alpha:
    return alpha    // no capture can rescue this position

// Per-move:
if standPat + SEEValue(capture) + 150 <= alpha:
    skip this capture
```

Disable in endgames (low material) and never when in check.

#### Check Extensions

Extend moves giving check when `SEE >= 0`:

```text
if moveGivesCheck && SEE(move) >= 0:
    extension += 1
```

Cap cumulative extensions per node — uncapped extensions cause exponential blowup.

---

### Tapered Evaluation

Maintain separate middlegame (MG) and endgame (EG) weights per piece/square. Interpolate based on remaining material.

**Game phase:**
```js
const PHASE_WEIGHTS = { p: 0, n: 1, b: 1, r: 2, q: 4, k: 0 };
const MAX_PHASE = 24; // 4n + 4b + 4r + 2q = 4+4+8+8

function gamePhase(board) {
    let phase = MAX_PHASE;
    for (const p of board) if (p !== '.') phase -= PHASE_WEIGHTS[p.toLowerCase()] || 0;
    return Math.max(0, phase);
}
```

**Interpolation:**
```js
function taperedScore(mg, eg, phase) {
    return Math.floor((mg * (MAX_PHASE - phase) + eg * phase) / MAX_PHASE);
}
```

Phase 0 = full middlegame; phase 24 = full endgame. Typical Elo gain: **+40–60** — the single highest-value evaluation improvement.

---

### Extended Evaluation Details

#### Tempo Bonus

One line, +5–10 Elo: `score += (sideToMove === 'w') ? 15 : -15`

#### Bishop Pair

Both bishops present: `+30 cp`

#### Rook on Open/Semi-Open File

- Open file (no pawns either side): `+25 cp`
- Semi-open (no own pawns, enemy pawns present): `+15 cp`

#### Passed Pawn Bonuses (EG-weighted, centipawns)

| Rank | MG | EG  |
|------|----|-----|
| 2    | 5  | 10  |
| 3    | 8  | 17  |
| 4    | 15 | 30  |
| 5    | 28 | 57  |
| 6    | 48 | 97  |
| 7    | 60 | 118 |

Blocked passed pawn: reduce bonus by ~60%.

#### Pawn Penalties

- Isolated pawn: −15 MG / −20 EG
- Doubled pawn: −10 MG / −25 EG

#### King Safety: Pawn Shield

For each of the three files in front of the castled king:
- Pawn on the nearest rank: `+20 cp` (MG only)
- Pawn one rank further: `+10 cp` (MG only)
- No pawn at all: `−15 cp` (MG only)

Total maximum bonus: ~+50 cp middlegame, tapering to 0 in endgame.

#### King Safety: Open Files and Tropism

- Open file adjacent to king: `−20 to −30 cp` (MG only)
- Semi-open adjacent file: `−10 to −15 cp` (MG only)
- Tropism: `penalty += weight × (7 − chebyshevDist(king, piece))` with `weight = {Q:5, R:3, B:2, N:2}`, capped at 200 cp

#### Mobility

Count pseudo-legal destination squares, excluding squares controlled by enemy pawns. Linear approximation:

```js
const MOB_BONUS = { n: 4, b: 5, r: 3, q: 2 }; // cp per square above average
const MOB_AVG   = { n: 4, b: 6, r: 7, q: 14 };
score += MOB_BONUS[type] * (mobilityCount - MOB_AVG[type]);
```

#### Prioritized Elo Gain Table

| Feature | Est. Elo | Complexity |
|---|---|---|
| Tapered eval (MG/EG PSTs) | +40–60 | Low |
| Pawn shield king safety | +30–50 | Low |
| Passed pawn bonus | +25–40 | Medium |
| Mobility | +20–35 | Medium |
| Isolated / doubled pawn penalties | +15–25 | Low |
| Rook on open/semi-open file | +15–20 | Low |
| Score stability time extension | +15–30 | Low |
| King tropism | +15–20 | Medium |
| Bishop pair | +10–15 | Trivial |
| Tempo bonus | +5–10 | Trivial |
| Backward pawns | +5–10 | High |

---

### Time Management Details

#### Soft vs. Hard Limits

For a 250 ms per-move budget:
- **Soft limit (target):** 200 ms — do not start a new depth after this
- **Hard limit (absolute ceiling):** 245 ms — abort immediately if reached mid-search

Never return a partial-iteration result. Always return the best move from the **last fully completed iteration**.

#### Node-Based Time Checks

Check the clock every 1024 nodes (not every node — clock calls are ~10–30 ns each):

```js
if ((nodeCount & 1023) === 0 && Date.now() - startTime >= hardLimitMs) {
    abortSearch = true;
}
```

#### Branching Factor Estimator

Before starting depth `d+1`, estimate whether there is time:

```js
const bf = (timeAtDepth[d] / timeAtDepth[d-1]) || 3.0;
if (elapsed + timeAtDepth[d] * bf > softLimit) break; // don't start next depth
```

#### Score Stability Extensions

Extend soft limit (up to hard limit) when the search result is volatile:

```js
if (Math.abs(score[d] - score[d-1]) > 30) softLimit = Math.min(softLimit * 1.4, hardLimit);
if (bestMove[d] !== bestMove[d-1])         softLimit = Math.min(softLimit * 1.3, hardLimit);
```

---

### Additional Sources

- Buro 1995 — ProbCut: ICCA Journal
- Heinz 1998 — Extended futility pruning: ICCA Journal
- Reinefeld 1983 — NegaScout: ICCA Journal
- Chess Programming Wiki: chessprogramming.org (History Heuristic, Continuation History, PVS, SEE, Singular Extensions, Tapered Eval)
- Stockfish `src/movepick.cpp`, `src/history.h` — staged move picker, all history tables
- Ethereal source: github.com/AndyGrant/Ethereal — well-commented, closely mirrors Stockfish's search structure
- Weiss source: github.com/TerjeKir/weiss — clean single-file-style engine, good Node.js analog reference
