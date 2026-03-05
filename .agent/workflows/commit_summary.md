---
description: how to create a commit summary in .local/commits
---

## Commit Summary Workflow

Use this workflow after completing and committing a version to document the changes.

### Steps

1. Get the git log for the version range. Run:
   ```
   cmd /c "git log vPREV..vCURR --oneline"
   ```
   Replace `vPREV` with the previous tag and `vCURR` with the new version tag. If no previous tag exists, use the full log.

2. Create a new markdown file at `.local/commits/vX.Y.Z.md` using the following template:

```
# vX.Y.Z — <Short Title>

**Commits:** `abc1234`, `def5678`

## Changes

- **Feature/Fix title** — Description of what was done and why.
- **Another change** — Description.
```

3. The file name must match the version exactly (e.g. `v0.2.1.4.md`).

4. Do NOT commit this file — the `.local/` directory is in `.gitignore` and must stay offline.
