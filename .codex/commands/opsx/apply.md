---
description: Implement tasks from an OpenSpec change
---

Implement tasks from an OpenSpec change.

**Input**: Optionally specify a change name after `/opsx:apply`
(e.g., `/opsx:apply add-auth`). If omitted, check if it can be
inferred from conversation context. If vague or ambiguous you MUST
ask the user to choose from available changes.

## Steps

1. **Select the change**

   If a name is provided, use it. Otherwise:

   - Infer from conversation context if the user mentioned a change
   - Auto-select if only one active change exists
   - If ambiguous, run `openspec list --json`, show the active changes, and ask the user to choose

   Always announce: "Using change: <name>" and how to override.

2. **Check status to understand the schema**

   ```bash
   openspec status --change "<name>" --json
   ```

   Parse the JSON to understand:

   - `schemaName`: The workflow being used
   - Which artifact contains the tasks

3. **Get apply instructions**

   ```bash
   openspec instructions apply --change "<name>" --json
   ```

   This returns:

   - Context file paths
   - Progress (total, complete, remaining)
   - Task list with status
   - Dynamic instruction based on current state

   **Handle states:**

   - If `state: "blocked"` (missing artifacts): show the message and
     suggest using `openspec-propose` or filling missing artifacts first
   - If `state: "all_done"`: report that all tasks are complete and
     suggest archive
   - Otherwise: proceed to implementation

4. **Read context files**

   Read the files listed in `contextFiles` from the apply instructions output.
   The files depend on the schema being used:

   - **spec-driven**: proposal, specs, design, tasks
   - Other schemas: follow the `contextFiles` from CLI output

5. **Show current progress**

   Display:

   - Schema being used
   - Progress: "N/M tasks complete"
   - Remaining tasks overview
   - Dynamic instruction from CLI

6. **Implement tasks (loop until done or blocked)**

   For each pending task:

   - Show which task is being worked on
   - Make the code changes required
   - Keep changes minimal and focused
   - Mark the task complete in the tasks file: `- [ ]` -> `- [x]`
   - Continue to the next task

   **Pause if:**

   - The task is unclear
   - Implementation reveals a design issue
   - An error or blocker is encountered
   - The user interrupts

7. **On completion or pause, show status**

   Display:

   - Tasks completed this session
   - Overall progress: "N/M tasks complete"
   - If all done: suggest archive
   - If paused: explain why and wait for guidance

## Guardrails

- Keep going through tasks until done or blocked
- Always read context files before starting
- If a task is ambiguous, pause and ask before implementing
- If implementation reveals issues, pause and suggest artifact updates
- Keep code changes minimal and scoped to each task
- Update the task checkbox immediately after completing each task
- Pause on errors, blockers, or unclear requirements
- Use `contextFiles` from CLI output, don't assume specific file names
