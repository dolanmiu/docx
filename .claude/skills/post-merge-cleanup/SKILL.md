---
name: post-merge-cleanup
description: Reset the repo after a PR has merged, ready for the next piece of work. Removes the branch's worktree if it has one, goes back to master, pulls, deletes the merged branch locally and on origin, and runs npm install. Use when the user says their PR is merged and wants to clean up or start the next task.
allowed-tools: Bash, ExitWorktree
argument-hint: "[branch]"
---

# Post-Merge Cleanup

Bring the repo back to a clean, up-to-date `master` after a PR has merged. The branch to clean up is `$ARGUMENTS` if given, otherwise the branch checked out in the current directory.

PRs here are squash merged, so the branch's commits never appear on `master` and `git branch -d` always refuses. Merge status therefore comes from GitHub, and the safety checks below are what make it safe to force-delete. If any check fails, stop and tell the user what you found. Never force anything past a failed check.

## 1. Work out where things are

```bash
git rev-parse --show-toplevel                                    # this checkout
dirname "$(git rev-parse --path-format=absolute --git-common-dir)" # main checkout (MAIN)
git branch --show-current                                        # branch (BRANCH), unless given as an argument
git worktree list --porcelain                                    # which checkout has BRANCH, if any
```

- `WORKTREE` is the linked worktree that has `BRANCH` checked out, if there is one. It is never `MAIN`.
- If `BRANCH` is empty or is `master`, there is no branch to delete. Skip to step 4.

## 2. Check it is safe to delete

1. **The PR merged, and the local branch holds nothing extra.**
   ```bash
   gh pr list --state merged --head "$BRANCH" --json number,title,headRefOid,mergedAt
   git rev-parse "$BRANCH"
   ```
   Stop if no merged PR is listed. Stop if the local tip differs from the PR's `headRefOid`, because it has commits that never reached the PR.
2. **No uncommitted work in the worktree** (only when `WORKTREE` exists). `git -C "$WORKTREE" status --porcelain` must be empty. Removing the worktree would delete anything listed, including untracked files.
3. **No tracked changes in `MAIN`.** `git -C "$MAIN" status --porcelain --untracked-files=no` must be empty. Untracked files in `MAIN`, such as plan notes, are fine because they carry over to `master`.

## 3. Remove the worktree

Skip this step if there is no `WORKTREE`.

- **This session entered it with EnterWorktree:** call `ExitWorktree` with `action: "remove"`. That deletes the worktree and the branch, and moves the session back to `MAIN`. If it refuses only because of the branch's commits, which step 2 showed are in the merged PR, call it again with `discard_changes: true`. If it lists uncommitted files, stop.
- **Otherwise:**
  ```bash
  git -C "$MAIN" worktree remove "$WORKTREE"   # never --force
  git -C "$MAIN" worktree prune
  ```
  If the session's working directory was inside the removed worktree, it no longer exists. Run every later command with `cd "$MAIN" &&` or `git -C "$MAIN"`.

## 4. Update master

```bash
git -C "$MAIN" checkout master
git -C "$MAIN" pull --ff-only
```

If the fast-forward fails, local `master` has diverged. Stop and report it rather than merging or resetting.

## 5. Delete the branch

Skip this step if there is no `BRANCH`.

```bash
git -C "$MAIN" branch -D "$BRANCH"                       # skip if ExitWorktree already deleted it
git -C "$MAIN" ls-remote --exit-code --heads origin "$BRANCH" && git -C "$MAIN" push origin --delete "$BRANCH"
git -C "$MAIN" fetch --prune
```

GitHub often deletes the remote branch on merge. `ls-remote` exits non-zero when it is already gone, and then there is nothing to push.

## 6. Reinstall dependencies

```bash
cd "$MAIN" && npm install
```

## 7. Report

Keep the report short:

- the worktree removed, if any
- the branch deleted, both locally and on origin
- the `master` commit you are now on (`git log --oneline -1`)
- whether `npm install` succeeded
- `git status --short`. Call out `package-lock.json` if `npm install` changed it.

End by saying the repo is ready for the next piece of work.
