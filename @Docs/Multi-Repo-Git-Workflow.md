# Multi-Repo Git Workflow

For projects where a frontend and backend live in separate repos but are deployed together.

---

## Quick Setup — zsh function (recommended)

Add to `~/.zshrc`:

```zsh
mem() {
  for r in ~/CLONED/Memory-Peg-System ~/CLONED/Memory-Peg-System-front-end; do
    echo "\n── $(basename $r) ──"
    git -C "$r" "$@"
  done
}
```

Reload:
```bash
source ~/.zshrc
```

### Usage

```bash
mem status              # status of both repos
mem pull                # pull both
mem push                # push both
mem log --oneline -3    # last 3 commits in each
mem diff                # diff in both
```

---

## Pi Deploy — one-liner

After pushing from your Mac, SSH into the Pi and run:

```bash
for r in ~/Memory-Peg-System ~/Memory-Peg-System-front-end; do git -C $r pull; done && pm2 restart memory-peg-backend memory-peg-frontend
```

- Pulls both repos sequentially
- Restarts both pm2 processes in one command
- `pm2 restart` accepts multiple names space-separated

---

## Optional — Makefile at parent level

Create `~/CLONED/Makefile`:

```makefile
REPOS = Memory-Peg-System Memory-Peg-System-front-end

pull:
	@for r in $(REPOS); do echo "\n── $$r ──"; git -C $$r pull; done

push:
	@for r in $(REPOS); do echo "\n── $$r ──"; git -C $$r push; done

status:
	@for r in $(REPOS); do echo "\n── $$r ──"; git -C $$r status -s; done
```

```bash
cd ~/CLONED
make pull
make status
make push
```

---

## When to consider a monorepo

If you add a 3rd service or the repos change in lockstep 90%+ of the time, migrate to:

```
Memory-Peg-System-monorepo/
├── backend/    # was Memory-Peg-System
├── frontend/   # was Memory-Peg-System-front-end
└── package.json (optional workspaces)
```

One `git pull`, one commit history, one deploy step.
