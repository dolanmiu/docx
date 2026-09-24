---
name: annotate
description: Add detailed comments to recent code changes explaining what was fixed, why it's needed, and the rationale. Use after making code changes to document the reasoning inline.
allowed-tools: Bash, Read, Edit
---

# Annotate Changes

Add detailed inline comments to all code changes made in this conversation. For each changed section, write comments that explain:

1. **What it fixes** — the bug or problem this code addresses
2. **Why it's needed** — the root cause that made this change necessary
3. **Rationale** — why this specific approach was chosen, what alternatives were considered, and what makes this safe

## Process

1. Review all files modified in this conversation to identify the changed sections
2. For each change, add a comment block **above** the changed code (or above the relevant block/function/field)
3. Write multi-line comments using `//` style for TypeScript, matching the project's existing conventions
4. Keep each comment block focused on one logical change — don't lump unrelated changes into one block

## Comment Style

- Write in plain English, not jargon
- Reference the data flow or signal dependency chain when relevant (e.g., "Firestore writes here, real-time subscription delivers it there, this effect picks it up")
- Explain non-obvious safety properties (e.g., "this doesn't cause an infinite loop because X", "duplicate calls are safe because of the Y guard")
- Describe the symptom in the **present tense, as a standing failure mode** — "Without this, the user sees 'Not Connected' despite a successful OAuth", never "the user was seeing…" or "this broke on Tuesday"
- If a guard was added, describe **what the guard prevents**, not the history of it being missing

## Comments must be timeless and drift-proof

A comment is read months later by someone who has none of today's context. Three things reliably rot; none of them may appear in a comment.

### 1. No literal values that live in the code

Numbers, sizes, timeouts, quotas, and version numbers drift the moment someone tunes the adjacent constant — and nobody updates the prose. Describe the **intent and the constraint**; let the code carry the number.

```ts
// BAD — every one of these numbers is a future lie
// Each context uses ~50MB RSS. On a 2GB instance, more than 2 concurrent
// renders risks OOM. The timeout (5 min) covers slow widgets.

// GOOD — states the trade-off; the values stay in the code
// Concurrency is capped against instance memory, not CPU: every simultaneous
// context holds a browser renderer resident, so exceeding what RAM can hold
// trades a slow render for an OOM kill. The queue timeout covers a worst-case
// widget that fetches heavily before producing output.
```

If a value genuinely matters (an external platform limit, a threshold that must stay below another system's), name the **relationship** — "kept below the load balancer's backend timeout" — not the digits.

### 2. No file paths or filenames

Files get moved, renamed, split, and deleted. A path in a comment is a dead link waiting to happen, and there is no compiler or linter that will catch it.

```ts
// BAD — all of these are one refactor away from being wrong
// See frame-render-server/monitoring for the alert.
// (see shutdownGraceTime in src/worker-main.ts)
// Documented in HANDOFF-AUTOSCALING.md.

// GOOD — symbol names survive file moves and are searchable
// The alert this feeds is defined alongside the service's other log metrics.
// Must stay comfortably larger than the worker's own `shutdownGraceTime`.
```

Reference **symbol names** in backticks (`` `WIDGET_PULL_EXECUTION_TIMEOUT` ``, `` `buildFallbackResponse` ``) or use a TSDoc `{@link}` when the symbol is imported. Describe a neighboring module by what it does ("the admin batch provisioner"), not by its filename.

Never cite a planning or handoff document. Those are written to be deleted.

### 3. No references to events in time

The company moves fast; last month's outage is not context, it's noise. Ban: dates, "the incident", "the Aug 18 regression", "recently", "the old design", "this used to be", "root cause of the deploy outage", "mid-incident".

The reasoning behind a fix is worth keeping — it just has to be stated as a **property of the system**, not as a story about a day.

```ts
// BAD — tied to an event nobody remembers, and unverifiable later
// Root cause of the deploy outage: this fell back to the distro Chromium, and
// when a rebuild pulled a mismatched playwright-core, Chromium was force-killed.

// GOOD — same reasoning, stated as a standing hazard
// Left undefined so Playwright launches its own version-matched Chromium. Point
// it at a distro build instead and any version skew force-kills the browser at
// launch, after which every render fails and the server looks dead rather than
// misconfigured.
```

Test: **would this sentence still make sense, and still be true, to someone reading it a year from now with no knowledge of what happened this week?** If not, rewrite it as a failure mode rather than a memory.

## What NOT to do

- Don't add trivial comments that restate the code (e.g., `// set the value` above `.set(value)`)
- Don't reference ticket numbers or PR numbers — those belong in commit messages, not code
- Don't write anything that violates the timeless/drift-proof rules above: no literal values that
  live in the adjacent code, no file paths or filenames, no dates or references to specific events
- Don't add comments to unchanged code
- Don't add a separate `//` comment block when a TSDoc `/** ... */` comment already exists on the function/method — instead, append the rationale to the existing TSDoc block
- When annotating function/method/class signatures with TSDoc, always use multi-line format:
  ```ts
  /**
   * Explanation here.
   */
  ```
  Never use single-line `/** Explanation here. */` for these — the multi-line form is the project convention
- Don't rewrite or refactor the code — only add comments

## After Annotating

Run `/fix-spelling` after all annotations are added. Annotations often introduce domain-specific words that trigger cspell false positives.
