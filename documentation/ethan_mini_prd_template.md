# [Feature Name] - PRD

## Overview
[1–3 sentence summary of what's being built and the build order. If phased, name each phase and what it unlocks.]

> **Example:** Upgrade the recipe chat assistant in four phases: improve reasoning accuracy immediately with a thinking budget increase, then add timestamp-aware chunking for video playback, then a LangGraph ReAct agent for multi-step reasoning, then cross-recipe semantic search over the full library.

---

## 1. User Stories

### As a [Persona]

#### [Capability Group / Phase] (Phase N)
- I want [outcome], so [reason]
- I want [outcome], so [reason]

> **Example:**
>
> ### As a Home Cook
>
> #### Accurate Answers (Phase 1)
> - I want the chat to give me complete ingredient lists without missing items
> - I want follow-up questions to build naturally on prior answers
>
> #### Video Playback (Phase 2)
> - I want to ask "how do I cut the tomatoes?" and have the video jump to that moment
> - I want to click a timestamp in the chat response to jump straight to that part of the video

---

## 2. Functional Requirements

### Phase N — [Phase Name] (status: shipped / in progress / todo)

| # | Requirement | Status |
|---|-------------|--------|
| X1 | [Concrete, testable requirement — name files/fields/values where applicable] | Done / Todo |

**Why:** [1–3 sentences on the rationale — what problem this phase solves and any measured tradeoffs (e.g., latency, cost).]

> **Example:**
>
> ### Phase 1 — Thinking Budget (shipped)
>
> | # | Requirement | Status |
> |---|-------------|--------|
> | T1 | Increase `thinkingBudget` from 0 to 1024 in `recipe-chat.js` | Done |
>
> **Why:** The confirmed accuracy failure (Tabasco miss on Buffalo Wings, 15,419 chars) was a reasoning failure at `thinkingBudget: 0`, not a context window problem. At 1024 the miss is resolved. +622ms latency. No pipeline changes required.
>
> ### Phase 2 — Transcript Chunking + Timestamp Playback
>
> | # | Requirement | Status |
> |---|-------------|--------|
> | C1 | Strip noise tokens (`[Music]`, `[Applause]`, standalone timestamps) then split transcripts ≥5,000 chars into overlapping chunks using `RecursiveCharacterTextSplitter` with punctuation-first separators — `chunkSize: 1500`, `chunkOverlap: 150` | Todo |
> | C2 | Store per-chunk `start_ms`/`end_ms` by embedding Supadata `offset` values into the string pre-join and parsing them back out post-split | Todo |
> | C3 | Store chunks in `recipes.transcript_chunks` (jsonb array of `{ text, start_ms, end_ms }`) and set `recipes.transcript_chunked_at` on completion | Todo |
>
> **Why Phase 2 needs chunking:** Timestamp playback requires knowing *where* in the video each answer comes from. That's only possible with chunk-level `start_ms`/`end_ms`. This is the case where chunking is genuinely needed — not for context window reasons, but for video navigation.

---

## 3. Out of Scope

- [Excluded item — 1 line]
- [Excluded item — note where it belongs if it lives in another PRD]

> **Example:**
> - Voice input
> - Streaming agent responses token-by-token
> - Grocery categorisation by store aisle (belongs in grocery list PRD)
> - Manual recipe entry (no YouTube video required)

---

## 4. Data Model Changes

### Phase N
[No schema changes. / Describe changes.]

New columns on the `[table]` table:

| Column | Type | Notes |
|--------|------|-------|
| `[column_name]` | [type] | [What it stores / when it's set] |

> **Example:**
>
> ### Phase 1
> No schema changes.
>
> ### Phase 2
> New columns on the `recipes` table:
>
> | Column | Type | Notes |
> |--------|------|-------|
> | `transcript_chunks` | jsonb | Array of `{ text, start_ms, end_ms }` objects |
> | `transcript_chunked_at` | timestamptz | Set when chunking completes — used to skip already-chunked recipes |
>
> ### Phase 3
> No new schema changes — agent uses existing `ingredients` and `transcript_chunks`.

---

## 5. Build Order

```
Phase 1 — [short label]
  └── Phase 2 — [short label] ([what it enables])
        └── Phase 3 — [short label] ([dependency on prior phase])
```

> **Example:**
>
> ```
> Phase 1 — thinkingBudget: 1024 (1 line, shipped)
>   └── Phase 2 — Chunking + timestamps (enables video playback)
>         └── Phase 3 — LangGraph agent (builds on chunk-level step navigation)
>               └── Phase 4 — pgvector RAG (embeds Phase 2 chunks, adds semantic_search tool to Phase 3 agent)
> ```

---

## 6. Open Questions

- [Unresolved decision — reference the doc/ticket where it'll be answered]
- [Unresolved decision]

> **Example:**
> - What map and reduce prompts produce the best chunk summaries if Phase 2 requires them for the agent's step navigator? (OQ5/OQ6 in `RE_open_questions_chunking.md` — answered for summarisation use case, may need re-evaluation for retrieval use case)
> - What embedding model for Phase 4? (text-embedding-3-small vs Gemini embedding vs other)
> - Should Phase 4 semantic search be scoped to a single recipe or cross-library by default?
