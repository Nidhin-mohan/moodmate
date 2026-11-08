---
name: ship
description: Take finished, committed work on a feature branch to production — push, open a PR to main, wait for CI, get the user's go-ahead to merge, watch the CD workflows deploy, then smoke-test production with the ui-tester agent. Use after /implement when a ticket or feature is done. Triggers on "/ship", "ship it", "push to prod", "open a PR and deploy".
---

# /ship

Merging to `main` **is** the deploy here: `cd-backend.yml` fires on `server/**`, `cd-frontend.yml`
on `client/**`. So this skill has exactly one irreversible step — the merge — and it never takes
it without the user saying yes in this run.

Shell rules for this repo: one plain command per call, literal absolute paths, `git -C <repo>`,
no `cd`, no `$VAR`, no heredocs. Multi-line PR bodies go in a scratchpad file via `--body-file`.

Requires the `gh` CLI, authenticated (`gh auth status`). If it's missing, stop and tell the user
to install it (`winget install --id GitHub.cli`) and run `! gh auth login`.

## 1. Preflight

- **Branch.** Must be a feature branch, not `main`. If on `main`, stop — offer to create a branch
  from the current commits instead.
- **Clean and committed.** `git -C <repo> status --short`. Uncommitted changes that belong to the
  work: list them and ask before committing — stage named paths only, never `git add -A`. Changes
  that don't belong (local env tweaks, `.mcp.json`): leave them alone and say so.
- **Up to date.** `git -C <repo> fetch origin main`, then check `git -C <repo> log --oneline HEAD..origin/main`.
  If main moved, rebase or merge it in and re-run tests. A conflict → `/resolving-merge-conflicts`.
- **Tests, for what changed.** `git -C <repo> diff --stat origin/main...HEAD` decides which:
  - `server/**` → `npm --prefix <repo>/server run lint` and `npm --prefix <repo>/server test`
  - `client/**` → `npm --prefix <repo>/client run lint`, `npm --prefix <repo>/client test`, `npm --prefix <repo>/client run build`

  Red here means not shippable. Report and stop; don't push red work to watch CI fail.

## 2. Push and open the PR

- `git -C <repo> push -u origin <branch>`
- Write the PR body to a scratchpad file, then `gh pr create --base main --head <branch> --title "<title>" --body-file <path>`.

Body:

```markdown
## What
<user-visible change, one or two sentences>

## Why
<the problem — link the spec issue>

Closes #<ticket>, #<ticket>

## Deploys
- [ ] backend (server/** changed)   <- tick only what applies
- [ ] frontend (client/** changed)

## Verified
- Tests: <server / client results>
- UI: <ui-tester verdict from /implement, or "not run">

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 3. Wait for CI

`gh pr checks <pr> --watch --fail-fast` — run it in the background; you're re-invoked when it exits.

- **Green** → step 4.
- **Red** → `gh run view <run-id> --log-failed`. If the failure is in this PR's code, fix it on the
  branch (test first), push, and wait again. If it's flaky or environmental (e.g. the
  MongoMemoryServer download timing out), say so and offer a re-run: `gh run rerun <run-id> --failed`.
  Never merge on red.

## 4. The merge gate — ask

Use `AskUserQuestion`. Make the question stand alone:

> PR #<n> "<title>" is green on CI. Merging deploys **<backend / frontend / both>** to production.
> Merge now?

Options: **Merge and deploy** · **Not yet** (stop here, PR stays open).

On yes: `gh pr merge <pr> --merge --delete-branch`. (Merge commits, matching this repo's history.)

## 5. Watch the deploy

For each workflow the diff triggers:

- `gh run list --workflow cd-backend.yml --branch main --limit 1 --json databaseId,status,headSha`
- `gh run list --workflow cd-frontend.yml --branch main --limit 1 --json databaseId,status,headSha`

Confirm `headSha` is the merge commit (`gh pr view <pr> --json mergeCommit`), then
`gh run watch <run-id> --exit-status` in the background.

A failed CD run means production is still on the previous version (the image or S3 sync didn't
complete) — report which step failed from `gh run view <run-id> --log-failed`. AWS/OIDC failures:
see "CD pipeline fails on AWS authentication" in `CLAUDE.md`. Never re-run a deploy unasked.

## 6. Smoke-test production

Production URLs live in `docs/agents/deploy.md`. If they aren't recorded there yet, ask the user
once and write them in.

1. API: `curl -s -m 10 <api-url>/health` — expect `"status":"healthy"` and `"db":"connected"`.
2. UI: dispatch the `ui-tester` agent with: the production frontend URL, "smoke test — read-only,
   create no data", and the screens this PR changed. Keep it short — this checks the deploy landed
   and the changed screens load, not the full acceptance criteria (those were checked before the PR).

## 7. If the smoke test fails

Don't fix forward silently and don't revert on your own. Report what failed, then `AskUserQuestion`:

- **Revert** — `gh pr create` a revert of the merge commit (`git -C <repo> revert -m 1 <merge-sha>`
  on a new branch), then run this skill again on it.
- **Fix forward** — back to `/diagnosing-bugs` with the failure as the reproduction.
- **Leave it** — the user will look.

## Report

Lead with the verdict.

```
SHIPPED: PR #<n> "<title>" → main @ <short-sha>     (or: STOPPED at <step> — <why>)

CI:        pass | fail (<job>)
DEPLOY:    backend <pass|fail|n/a> · frontend <pass|fail|n/a>
HEALTH:    healthy | <what came back>
SMOKE:     <ui-tester verdict line per screen>
CLOSED:    #<issue>, #<issue>
```
