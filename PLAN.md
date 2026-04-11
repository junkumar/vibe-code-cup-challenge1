# Agent Improvement Plan

This file is meant to be reviewed by another LLM or collaborator before and during implementation.

## Goals

Build a materially stronger chess agent while staying within the competition constraints:

- one root source file only
- Node.js standard library only
- deterministic output
- no network access
- no external dependencies
- target under 250 ms per move

## Current State

The current agent:

- parses FEN
- generates legal moves correctly for the starter test set
- chooses a legal move deterministically
- does not evaluate positions or search variations

The main weakness is move selection. Strength is close to random among legal moves.

## Implementation Order

1. Strengthen static evaluation with piece values, piece-square tables, and deterministic tie-breaking.
2. Keep tactical behavior tests in place while evaluation changes land.
3. Add iterative deepening alpha-beta search together with move ordering.
4. Add quiescence search so the engine is less brittle at the depth boundary.
5. Tune the time budget and search parameters against the existing runtime tests.

## Step 1: Static Evaluation

The current random-like move picker has already been replaced with deterministic scoring. The next improvement is to make that scoring materially stronger without adding much runtime cost.

Priorities:

- piece values as the baseline
- piece-square tables for cheap positional strength
- tactical bonuses for captures, promotions, and check
- deterministic move ordering and tie-breaking

Implementation shape:

- keep evaluation cheap enough to call frequently during search
- prefer piece-square tables over ad hoc square heuristics
- preserve deterministic output for identical FEN inputs

## Step 2: Tests

The tactical tests should exist before and during evaluation work, not after it.

Keep and extend focused tests that assert the agent prefers:

- a mate in one when available
- a free capture over a quiet move in a simple position
- promotion to a queen in a winning promotion spot

Keep the current legality and constraints tests intact.

## Step 3: Search

Search should not be added as fixed-depth minimax in isolation. It should land with the minimum supporting pieces that make alpha-beta worthwhile.

Implementation shape:

- iterative deepening with a per-move time budget
- alpha-beta pruning
- deterministic move ordering
- MVV-LVA for capture ordering
- always return the best move from the last completed depth

Practical target:

- 2-ply is the minimum useful depth
- 4-5 ply is realistic in many positions if ordering is decent

## Step 4: Quiescence

After basic search works:

- extend leaf evaluation through forcing capture sequences
- reduce horizon blunders at the search boundary
- keep the extension narrow so runtime stays predictable

## Review Questions

Questions worth checking with another LLM:

- Are the piece-square tables pulling their weight relative to code size?
- Is the iterative deepening time budget conservative enough for worst-case positions?
- How narrow should quiescence be to avoid runtime spikes?
- Which extra tactical tests would catch horizon-effect regressions?
