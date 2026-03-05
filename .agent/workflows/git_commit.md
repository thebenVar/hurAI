---
description: how to commit changes and create version tags
---

## Git Commit Workflow

**IMPORTANT: Never auto-commit or auto-tag. All commits and tags require explicit user approval.**

### Steps

1. After completing a feature or fix, stage all changed files:
   - Use `mcp_GitKraken_git_add_or_commit` with `action: "add"` to stage all changes.

2. Show the user a summary of what was changed and what the proposed commit message will be. Wait for explicit approval.

3. Once the user approves, commit using:
   - Use `mcp_GitKraken_git_add_or_commit` with `action: "commit"` and the approved message.

4. Update `package.json` version if appropriate (following `0.x.y.z` convention used in this project). Present the version bump to the user before applying it.

5. **Do NOT create a git tag** unless the user explicitly asks for one (e.g. "tag this as v0.2.1.4"). When creating tags, use:
   ```
   cmd /c "git tag vX.Y.Z.W"
   ```

6. Do NOT run `git push`. Instruct the user to run `git push --follow-tags` manually in their own terminal to handle SSH passphrase authentication safely.

### Version Summary Files

After committing, write a change summary to `.local/commits/vX.Y.Z.md` with:
- Version number and short title
- List of commits included
- Bullet-point list of changes

These files are `.gitignore`d and stay offline.
