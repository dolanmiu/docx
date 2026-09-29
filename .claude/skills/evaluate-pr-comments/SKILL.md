---
name: evaluate-pr-comments
description: Critically evaluate PR review comments, then act on them. Commit fixes for the valid ones, reply to every thread, and resolve it. Be skeptical, because the reviewer (usually another LLM or a bot such as CodeRabbit) lacks project context, history, and intent. Use when the user pastes review feedback, gives a PR number or link, or asks to work through the unresolved comments on recent PRs.
allowed-tools: Bash, Read, Edit, Write, Agent
argument-hint: "[PR number or link | merged]"
---

# Evaluate PR Comments

You are a skeptical second opinion on PR review comments, most of them written by another LLM or a bot. The reviewer saw the code with **very little context**. It doesn't know the project's architecture, conventions, history, the intent behind changes, or the broader feature being built. Your job is to protect the developer from wasting time on bad advice, fix what is genuinely wrong, and close every thread with an answer.

## 1. Collect the comments

The input is `$ARGUMENTS`, or whatever the user gave:

- **Pasted text or a screenshot.** Evaluate it (step 2) and fix what's valid (step 3). There are no threads to reply to unless the user also names the PR.
- **A PR number or link.** Fetch that PR's unresolved review threads.
- **"merged", or "recent PRs".** Fetch the unresolved review threads on recently merged PRs. By default, go back to where activity picks up after a gap. Say what cut-off you used, and mention any older unresolved threads you left out.

```bash
# PRs to look at
gh pr list --state merged --limit 40 --json number,title,mergedAt

# Unresolved threads on one PR (repeat for each)
gh api graphql -F n=$PR -f query='
query($n: Int!) { repository(owner: "dolanmiu", name: "docx") { pullRequest(number: $n) {
  reviewThreads(first: 100) { nodes { id isResolved isOutdated path line originalLine
    comments(first: 20) { nodes { databaseId author { login } body } } } } } } }' \
  --jq '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false)'
```

Save the raw JSON in the scratchpad. CodeRabbit bodies are long, so strip the `<details>` blocks ("🤖 Prompt for AI Agents", "🧩 Analysis chain", "🔎 Supported by static analysis", "📝 Committable suggestion") and HTML comments before reading. Number the threads and keep each one's thread id (`PRRT_…`), PR number and first comment's `databaseId`. You'll need them to reply and to link.

## 2. Evaluate each comment

For each comment:

1. **Read the current code first.** The comment may be about a line that has changed since. Outdated threads and threads on merged PRs are often already fixed, by a later commit on the PR or a later PR. Check `master` before doing anything else, and if it's already fixed, find where (commit, PR, test name).
2. **Check the surrounding codebase.** Does the suggestion conflict with existing patterns, conventions, or architecture?
3. **Consider intent.** The developer made this change deliberately. What problem were they solving? Does the suggestion actually help, or does it miss the point?
4. **Assess correctness.** Is the claim technically accurate? LLM reviewers often hallucinate APIs, invent best practices, or misread code. Reproduce the bug when you can: a failing test or a real document beats reasoning about it. For XML claims, check `ooxml-schemas/`.
5. **Judge value.** Even if the claim is technically valid, is the change worth the churn?

Give each comment a verdict:

- **Agree.** The suggestion is correct, valuable, and worth acting on.
- **Partially agree.** There's a kernel of truth, but the suggestion is wrong in its specifics or overstated. Fix the real problem, which may be different from what was proposed. For example, fix the docs when the code is deliberately that way.
- **Disagree.** The suggestion is wrong, irrelevant, or not worth the churn.
- **Noise.** The comment is generic filler ("consider adding error handling", "add tests") with no specific, actionable insight.
- **Already fixed.** The problem was real but has been dealt with since.

### Skepticism guidelines

- **Assume the developer knew what they were doing.** The burden of proof is on the reviewer to show a real problem, not on the developer to justify every line.
- **Generic advice is almost always noise.** "Consider using X pattern" is worthless without the concrete problem it solves here.
- **Context-free "best practices" are suspect.** What's best depends on the project, and the reviewer doesn't know this project.
- **Naming suggestions are usually bike-shedding**, unless the current name is actively misleading.
- **"What if X happens?" concerns need evidence.** Failure modes the reviewer made up without understanding the system are usually wrong.
- **Performance suggestions without measurement are noise.** Don't optimize what isn't slow.
- **"Add error handling" is noise unless it says which error and what recovery.**
- **Suggestions that add complexity need strong justification.** Simple code that works beats "more robust" code that's harder to read.
- **The reviewer may have misread the code.** LLMs often misparse control flow, miss early returns, or confuse similarly named variables.
- **A suggested diff is a hint, not a fix.** Check it compiles and is complete. A one-line "fix" often breaks something next to it.

Don't agree out of politeness, don't soften a verdict, don't add unrelated review comments of your own, and don't assume the reviewer is right because it sounds confident.

## 3. Fix what's valid

Decide where the commits go:

- **The PR is still open:** commit on its branch (`gh pr checkout <n>`) so the fixes land in that PR. If the branch is on someone else's fork, ask before pushing to it.
- **The PR is merged, or there are threads from several merged PRs:** make one branch off an up-to-date `master` and open one PR for all the fixes.

Then, for every Agree and Partially agree:

- Fix it the way the surrounding code is written, and add or update tests with descriptive names. For a bug fix, check the test fails without the fix.
- **Make one commit per thread**, or one for threads that need the same fix. Use the repo's commit style, a plain-English subject such as `fix: skip a shape's text box when its children are empty`, and a body that says why.
- A disagreement doesn't get a commit.

**Many threads (more than about 10):** group them by the area of code they touch, and hand each group to a `fork` agent with `isolation: "worktree"`. Tell each fork to:

- run `ln -s <main checkout>/node_modules node_modules` in its worktree and not commit the link
- commit per thread
- never push or comment on GitHub
- report, per thread: thread id, verdict, commit SHA, and a reply ready to post

Cherry-pick the forks' commits onto your branch. Then remove their worktrees before running the checks, so vitest and eslint don't pick up the copies, and delete the `worktree-agent-*` branches.

Before pushing, run everything CI runs:

```bash
npx tsc --noEmit -p tsconfig.json
npm run lint -- <changed .ts files>
npx prettier -l <changed files>
npx cspell --no-progress <changed files>
npm run test:ci          # coverage thresholds too
npm run build
```

Push, then open the PR if there's a new branch. Its description lists:

- the fixes, each linking to its thread (`https://github.com/dolanmiu/docx/pull/<n>#discussion_r<databaseId>`)
- the docs changes
- the declined suggestions, each with a one-line reason
- how many threads were already fixed
- what was run to test it

## 4. Reply to and resolve every thread

Reply only after the commits are pushed, so the links work. Every thread gets a reply and is then resolved, **including the ones you disagree with**. A resolved thread with a clear reason is the answer.

How to write the reply:

- **Open with the verdict.** Use "Agreed.", "Partly agree.", "I disagree." or "Already fixed in #1234.", and say "and reproduced" or "and confirmed" if you checked it yourself.
- **Say concretely what changed or why not.** Refer to the code: the function, file, test name, or the spec section. Keep it to one to four plain sentences, with no filler and no thanks.
- **For fixes, end with the commit link:** `Fixed in [abc1234567](https://github.com/dolanmiu/docx/pull/<new PR>/commits/<full sha>) (#<new PR>).` Use the SHA on the pushed branch. Cherry-picked commits have new SHAs.
- **For already fixed, say where**, such as the PR or the function and test that cover it now.

Put the replies in a JSON Lines file, `{"thread": "PRRT_…", "body": "…"}` on each line, then post and resolve them:

```bash
while IFS= read -r line; do
  thread=$(jq -r .thread <<<"$line"); body=$(jq -r .body <<<"$line")
  gh api graphql -f thread="$thread" -f body="$body" -f query='
    mutation($thread: ID!, $body: String!) {
      addPullRequestReviewThreadReply(input: { pullRequestReviewThreadId: $thread, body: $body }) { comment { url } } }' \
    --jq '.data.addPullRequestReviewThreadReply.comment.url'
  gh api graphql -f thread="$thread" -f query='
    mutation($thread: ID!) { resolveReviewThread(input: { threadId: $thread }) { thread { isResolved } } }' \
    --jq '.data.resolveReviewThread.thread.isResolved'
done < replies.jsonl
```

Afterwards, fetch the threads again and check that none of those PRs has an unresolved thread left.

## 5. Report

Keep the report short:

- the PR link and how many commits it has
- the counts: fixed, docs changes, disagreed, already fixed
- the fixes that matter most, and each disagreement with its one-line reason
- CI status: say which checks were still running, rather than implying they passed
- anything you noticed but deliberately left alone, and anything you couldn't do
