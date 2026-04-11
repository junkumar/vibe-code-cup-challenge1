# Prompt Log

Chronological log of technical instructions and architectural directives given during the development of the submission.

---

## Phase 1: Foundation & Constraint Validation

1. `Analyze the repository and propose a development plan for a materially stronger chess agent within the competition constraints.`

2. `Create a testing harness that validates both move legality and the technical constraints (single file, no external dependencies, deterministic output, memory/time caps).`

3. `Draft a PLAN.md that can be reviewed for architectural soundness, focusing on iterative deepening and move selection.`

4. `Incorporate architectural feedback: prioritize iterative deepening alpha-beta with a time budget over fixed-depth search; add piece-square tables; integrate move ordering and search concurrently; and implement quiescence search to mitigate the horizon effect.`

5. `Expand the testing pool to 1000+ starting positions and automate the self-play validation harness to identify move-selection weaknesses.`

---

## Phase 2: Core Engine Search & Evaluation

6. `Implement the core search stack: Iterative Deepening Negamax Alpha-Beta search with Transposition Tables (Zobrist hashing), Quiescence Search, and Killer/History move ordering.`

7. `Analyze self-play logs and tactical performance; identify and resolve move-selection blunders caused by insufficient search depth or evaluation precision.`

8. `Perform deep research into high-performance chess algorithms suitable for a 250ms/1000ms budget. Investigate PVS, LMR, history heuristics, and advanced pruning techniques.`

9. `Explain the codebase structure and individual component responsibilities to verify alignment with the single-file constraint and performance targets.`

---

## Phase 3: Advanced Optimization & Data-Scaling

10. `Analyze the implemented engine against the research plan. Identify high-ROI improvements remaining: Principal Variation Search (PVS), Late Move Reductions (LMR), and Tapered Evaluation.`

11. `Assess the risk/reward of PVS, LMR, Reverse Futility Pruning, and Singular Extensions given the strict Node.js runtime and 1000ms hard cap.`

12. `Implement Principal Variation Search (PVS) and Reverse Futility Pruning (Static Null Move Pruning). Target a reduction in node count while maintaining tactical integrity.`

13. `Upgrade the evaluation function to use Tapered Evaluation based on PeSTO's tables. Implement dynamic game-phase calculation to interpolate between middlegame and endgame positional weights.`

14. `Leverage the 1MB source file limit: generate and embed a massive Grandmaster Opening Book (~5,000+ positions) derived from Lichess theory databases.`

15. `Final performance push: Implement Late Move Reductions (LMR) and Insufficient Material draw-detection heuristics to maximize search efficiency and endgame precision.`

16. `Perform final end-to-end validation against all competition constraints and confirm the agent runs autonomously within the V8 heap and time limits.`
