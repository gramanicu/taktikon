# GitHub Access for Local Automation

This project lets an AI agent (or any local automation) operate on GitHub **through a
token scoped to this repository only**. This document explains how to create and wire
that token.

## Why a fine-grained token

Your default `gh` login carries the broad `repo` scope — it can touch **every**
repository you can access. For this project we want the opposite: automation that can
manage issues and PRs on `gramanicu/taktikon` **and nothing else**. A **fine-grained
personal access token (PAT)** restricted to a single repo gives exactly that.

## Known limitation — Projects boards

Fine-grained PATs **cannot be granted the *Projects* permission for repositories owned
by a personal account** — that permission only appears under the *Organizations* tab.
(Confirmed still true as of mid-2026.)

This is fine for us: **we do not give the agent Projects access.** Cards on a Project
board are moved by GitHub's built-in **issue automations** (e.g. "when an issue is
closed, move it to Done"). The agent only changes issue **state, labels, and
milestones** — the board reacts on its own.

> If you ever need direct board API access from a token, the clean fix is to move the
> repo under a GitHub **organization**, where the Projects permission becomes grantable.

## Step 1 — Create the token

1. GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained
   tokens → Generate new token**.
2. **Token name:** `taktikon-local-automation` · set an expiry you're comfortable with.
3. **Resource owner:** your personal account.
4. **Repository access:** *Only select repositories* → **`gramanicu/taktikon`**.
5. **Repository permissions** (leave everything else *No access*):

   | Permission | Level | Why |
   |---|---|---|
   | Metadata | Read | Mandatory; auto-selected |
   | Issues | Read and write | Create / read / edit / close / label issues |
   | Pull requests | Read and write | Open / review / comment on PRs |
   | Contents | Read and write | Read files; push branches for PRs |
   | Actions | Read | View CI run status (optional) |

   Do **not** grant **Workflows** — editing `.github/workflows` stays a manual action.

6. **Generate token** and copy the `github_pat_…` value (shown once).

## Step 2 — Wire it into this project only

Copy the example file and paste your token in:

```bash
cp .claude/settings.local.json.example .claude/settings.local.json
```

```jsonc
// .claude/settings.local.json  (gitignored — never committed)
{
  "env": {
    "GH_TOKEN": "github_pat_XXXXXXXXXXXXXXXXXXXX"
  }
}
```

`gh` prefers `GH_TOKEN` over your keyring login, so every `gh` call **from this project**
uses the scoped token. Because the variable is set only in this project's local
settings, your other repositories and your normal SSH `git push` are unaffected.

## Step 3 — Verify

```bash
gh auth status                 # should show the token in use
gh issue list                  # works — scoped to taktikon
gh repo view gramanicu/arke    # fails — token has no access to other repos
```

The last command failing is the point: the token cannot reach anything but this repo.

## What the agent may do

Allowed (pre-approved in `.claude/settings.json`): manage issues, labels, milestones,
and pull requests; read repo and CI state.

Blocked (by hooks in `.claude/hooks/`): force-push and hard resets, editing Claude's own
config, and any `gh` command that targets a repository other than `gramanicu/taktikon`.
