---
name: release
description: Release a new version of docx to npm. Bumps the version and syncs package-lock.json in a PR, then, once that PR has merged, tags master with the version and creates a GitHub Release on the tag, which runs the workflow that publishes to npm. Use when the user asks to release, publish or bump the version.
allowed-tools: Bash
argument-hint: "[version]"
---

# Release

Release a new version of docx. The version is `$ARGUMENTS` if given, otherwise work it out in step 1. It's written `$VERSION` below. Shell variables don't last from one command to the next, so put the version itself into each command, or set `VERSION` at the start of each.

Creating the GitHub Release runs `.github/workflows/npm-publish.yml`, which publishes to npm. That can't be taken back, so the release is only created once the version bump has merged and everything below checks out. If a check fails, stop and tell the user what you found.

## 1. Work out the version

```bash
git checkout master && git pull --ff-only
PREVIOUS=$(git describe --tags --abbrev=0)
git log --oneline "$PREVIOUS"..master
```

- **Minor** (`9.14.0` to `9.15.0`) when any commit is a `feat:`.
- **Patch** (`9.14.0` to `9.14.1`) otherwise, such as when there are only fixes, docs, chores and dependency bumps.
- **Never major.** docx stays on v9, with no breaking changes.

Tags are the bare version, such as `9.15.0`, with no `v`.

## 2. Bump the version in a PR

Pushing to `master` is blocked, so the bump goes through a PR like any other change.

```bash
git checkout -b "chore/version-bump-$VERSION"
npm version "$VERSION" --no-git-tag-version
npm install
git diff          # only the version line in package.json, and the two in package-lock.json
git commit -am "chore: Version bump to $VERSION"
git push -u origin "chore/version-bump-$VERSION"
gh pr create --base master --title "chore: Version bump to $VERSION" --body-file <file>
```

The description says which versions it goes from and to, and why it's a minor or patch bump, naming the PRs. For example: "Minor bump because of the new features since 9.14.0: `readTheme` (#3839), `ImagePatch` (#3828)…". Leave out the Claude Code attribution, as the repo is public.

## 3. Wait for the merge

The user merges the PR. Don't merge it yourself unless they ask you to. Stop here and tell them the PR is ready, unless they have said to carry on once it merges.

## 4. Tag the merge commit

```bash
git checkout master && git pull --ff-only
git log --oneline -1                          # must be "chore: Version bump to $VERSION (#<PR>)"
node -p "require('./package.json').version"   # must be $VERSION
git tag -a "$VERSION" -m ""
git push origin "$VERSION"
```

Past tags are annotated with an empty message.

## 5. Create the release

The notes are a paragraph that sums up the release, followed by GitHub's generated notes ("What's Changed", "New Contributors" and "Full Changelog"). See `gh release view 9.14.0` for an example.

- The paragraph says what the release adds first, then what it fixes, in plain English.
- It names each issue a change closes, such as `(#878)`. Dependency bumps and chores are left out.

```bash
gh api repos/dolanmiu/docx/releases/generate-notes -f tag_name="$VERSION" --jq .body > generated.md
# Write notes.md: the paragraph, a blank line, then generated.md
gh release create "$VERSION" --verify-tag --title "$VERSION" --notes-file notes.md
```

GitHub works out the previous release itself, so the "Full Changelog" link runs from it to `$VERSION`. Write the notes files in the scratchpad. Don't create the release as a draft: the workflow runs on the release's `created` event, which GitHub doesn't send for drafts.

## 6. Watch the publish

```bash
gh run list --workflow npm-publish.yml --limit 1
gh run watch <run id> --exit-status
npm view docx version   # must be $VERSION
```

The workflow tests and builds, then publishes with npm's trusted publishing, so it needs no token. It takes about 5 minutes. If a job fails on something flaky, rerun it with `gh run rerun <run id> --failed`. Never delete and recreate the tag or the release to retry.

## 7. Report

Keep the report short:

- the version bump PR
- the tag and the release's URL
- whether the publish run passed, and the version npm now shows

The bump's branch can then be cleaned up with the post-merge-cleanup skill.
