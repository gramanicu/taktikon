# GitHub Access for Local Automation

This project lets local automation (including an AI agent) operate on GitHub **through a
token scoped to this repository only**. This document explains how to create that token,
store it in an isolated profile, and make both your shell and the agent use it.

## Why a fine-grained token

A default `gh` login typically carries the broad `repo` scope — it can touch **every**
repository you can access. For this project we want the opposite: automation that can
manage issues and PRs on `gramanicu/taktikon` **and nothing else**. A **fine-grained
personal access token (PAT)** restricted to a single repo gives exactly that.

## Known limitation — Projects boards

Fine-grained PATs **cannot be granted the *Projects* permission for repositories owned
by a personal account** — that permission only appears under the *Organizations* tab.
(Confirmed still true as of mid-2026.)

This is fine here: **the token has no Projects access.** Cards on a Project board are
moved by GitHub's built-in **issue automations** (e.g. "when an issue is closed, move it
to Done"). Automation only changes issue **state, labels, and milestones** — the board
reacts on its own.

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

## Step 2 — Store it in an isolated gh profile

Rather than pasting the raw token into a file in the repo, give it its own `gh` config
directory. Its login lives in that directory's own `hosts.yml` (or your OS keychain),
completely separate from your default account — and no secret ends up in any tracked or
repo-adjacent file.

```bash
mkdir -p ~/.config/gh-taktikon
GH_CONFIG_DIR=~/.config/gh-taktikon gh auth login \
  --hostname github.com --git-protocol ssh --skip-ssh-key
# When prompted, choose "Paste an authentication token" and paste the fine-grained PAT.
```

- `--skip-ssh-key` avoids re-uploading your SSH key — it is already on your account, and
  a fine-grained PAT cannot upload keys anyway. Your `git push` keeps using your existing
  SSH key regardless.
- Afterwards, any shell where `GH_CONFIG_DIR=~/.config/gh-taktikon` is set uses the scoped
  token; without it, `gh` falls back to your normal account.

## Step 3 — Wire it up

### Your terminal — direnv (auto-switch on `cd`)

[`direnv`](https://direnv.net/) loads/unloads environment variables per directory. One-time:

```bash
brew install direnv
echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc   # then open a new shell
```

A gitignored `.envrc` at the repo root points `gh` at the profile:

```bash
# .envrc  (gitignored)
export GH_CONFIG_DIR="$HOME/.config/gh-taktikon"
```

Approve it once with `direnv allow`. Now `cd` into the repo → scoped token; `cd` out →
your default account. No secret lives in `.envrc` — only the path.

### The agent (Claude Code)

`direnv` only fires in **interactive** shells, so it does **not** cover the agent's
non-interactive tool shells. Point the agent at the same profile via gitignored local
settings:

```bash
cp .claude/settings.local.json.example .claude/settings.local.json
```

```jsonc
// .claude/settings.local.json  (gitignored)
{ "env": { "GH_CONFIG_DIR": "/absolute/path/to/.config/gh-taktikon" } }
```

Use the absolute path (e.g. `/Users/<you>/.config/gh-taktikon`). This takes effect on the
agent's **next session**. The token never appears here — only the path to the profile.

## Step 4 — Verify

From a shell scoped to the profile (your terminal inside the repo, or the agent):

```bash
gh auth status                 # token comes from the gh-taktikon profile (github_pat_…)
gh issue list                  # works — scoped to taktikon
gh repo view <owner>/<other>   # fails — token cannot reach any other repo
```

The last command failing is the point: the token cannot reach anything but this repo.

## What automation may do

Allowed (pre-approved in `.claude/settings.json`): manage issues, labels, milestones, and
pull requests; read repo and CI state.

Blocked (by hooks in `.claude/hooks/`): force-push and hard resets, editing the agent's own
config, and any `gh` command that targets a repository other than `gramanicu/taktikon`.
