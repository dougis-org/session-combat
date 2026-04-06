---
description: Archive a completed change in the experimental workflow
---

Archive a completed change in the experimental workflow.

**Input**: Optionally specify a change name after `/opsx:archive`
(e.g., `/opsx:archive add-auth`). If omitted, check if it can be
inferred from conversation context. If vague or ambiguous you MUST
ask the user to choose from available changes.

## Steps

1. **If no change name provided, ask for selection**

   Run `openspec list --json` to get available changes.

   Show only active changes (not already archived).
   Include the schema used for each change if available.

   **IMPORTANT**: Do NOT guess or auto-select a change. Always let the user choose.

2. **Check artifact completion status**

   Run `openspec status --change "<name>" --json` to check artifact completion.

   Parse the JSON to understand:

   - `schemaName`: The workflow being used
   - `artifacts`: List of artifacts with their status (`done` or other)

   **If any artifacts are not `done`:**

   - Display a warning listing incomplete artifacts
   - Ask the user to confirm whether to continue
   - Proceed if the user confirms

3. **Check task completion status**

   Read the tasks file (typically `tasks.md`) to check for incomplete tasks.

   Count tasks marked with `- [ ]` (incomplete) vs `- [x]` (complete).

   **If incomplete tasks found:**

   - Display a warning showing the count of incomplete tasks
   - Ask the user to confirm whether to continue
   - Proceed if the user confirms

   **If no tasks file exists:** Proceed without task-related warning.

4. **Assess delta spec sync state**

   Check for delta specs at `openspec/changes/<name>/specs/`. If none exist, proceed without sync prompt.

   **If delta specs exist:**

   - Compare each delta spec with its corresponding main spec at `openspec/specs/<capability>/spec.md`
   - Determine what changes would be applied
   - Show a combined summary before prompting

   **Prompt options:**

   - If changes are needed: "Sync now (recommended)", "Archive without syncing"
   - If already synced: "Archive now", "Sync anyway", "Cancel"

   If the user chooses sync, perform the sync first, then proceed to archive.

5. **Perform the archive**

   Create the archive directory if it doesn't exist:

   ```bash
   mkdir -p openspec/changes/archive
   ```

   Generate the target name using the current date: `YYYY-MM-DD-<change-name>`

   **Check if target already exists:**

   - If yes: fail with an error and suggest renaming the existing archive or using a different date
   - If no: move the change directory to archive

   ```bash
   mv openspec/changes/<name> openspec/changes/archive/YYYY-MM-DD-<name>
   ```

6. **Display summary**

   Show archive completion summary including:

   - Change name
   - Schema that was used
   - Archive location
   - Spec sync status
   - Note about any warnings

## Guardrails

- Always ask for change selection if not provided
- Use `openspec status --json` for completion checking
- Don't block archive on warnings; inform and confirm
- Preserve `.openspec.yaml` when moving to archive
- Show a clear summary of what happened
- If delta specs exist, always run the sync assessment before prompting
