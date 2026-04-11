# Submission Report

## Submission summary

- **Participant / team name:** Nandu Jayakumar (junkumar on github, BlackYellow)
- **Final source file:** `agent.js`
- **Model(s) / system(s) used:** Claude Code, Codex, Gemini
- **Short strategy summary:** Classical negamax alpha-beta engine with iterative deepening, quiescence search, transposition table (Zobrist hashing), killer/history move ordering, and a hand-crafted evaluation function (material + piece-square tables + mobility + pawn structure + king safety). Development was AI-assisted throughout — prompts drove architecture decisions, the AI wrote and iterated on the code, and a parallel research track gathered algorithm details from Stockfish, Ethereal, and Chess Programming Wiki sources.

---

## Prompt log

See [prompt-log.md](./prompt-log.md) for the full chronological prompt history.

---

## Tools used

| Tool | How it was used |
| --- | --- |
| Codex | Primary development agent — wrote and iterated on agent.js, all test files, and documentation across two sessions |
| Claude Code parallel agents and Gemini | Three background research agents ran simultaneously to gather deep technical information on pruning techniques, move ordering/history heuristics, and time management/evaluation — results compiled into CHESS_ALGORITHM_RESEARCH.md |
| Gemini agent | Reviewed PLAN.md and provided structured feedback; feedback was incorporated into the revised implementation plan |
| node --test | Built-in Node.js test runner used to run all test suites locally |
| test/selfplay.js | Custom self-play harness (built during development) used to run games and observe agent behavior — identified threefold repetition as the core weakness before deeper search was added |
| git | Version control — commits tracked each major development stage |

---

## Rules compliance checklist

| Item | Yes / No |
| --- | --- |
| The submission has exactly one source file: `agent.js` or `agent.ts` | Yes |
| The agent uses only the Node.js standard library | Yes |
| The agent does not use network access | Yes |
| The agent does not read files outside the submission root | Yes |
| The agent does not start background daemons, subprocesses, worker pools, or child processes | Yes |
| The agent does not use runtime downloads or self-modifying code | Yes |
| The same FEN input always produces the same stdout output | Yes |
| `npm test` passes locally for the included smoke tests | Yes |
| The source file is under `1 MB` | Yes |

---

## Additional notes

The agent exports its core chess functions (`parseFen`, `legalMoves`, `applyMove`, `isKingInCheck`, `moveToUci`, `squareToIndex`) so that test files can import them directly without spawning a subprocess. This pattern — a single file that is both runnable and importable — is enabled by the `import.meta.url` check at the bottom of agent.js. The exports are test infrastructure only and are not used during judging.

Research notes and algorithm references are in `CHESS_ALGORITHM_RESEARCH.md`. Implementation plan and rationale are in `PLAN.md`. Neither file is source code.
