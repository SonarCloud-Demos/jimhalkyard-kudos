<!-- sonar:begin:sonarqube-agentic-analysis-protocol -->
# Vortex analysis protocol

Vortex analysis is the final confirmation layer at the end of every turn in which you wrote to one or more files in the workspace (create, edit, patch, format — any tool call that changed file contents on disk).

**Trigger:** the moment before you send your final reply for the turn.

When the trigger fires, you **MUST** run Vortex analysis on the full set of files you modified this turn — **one command, not a per-file loop**.

**Preferred:** pass every path you modified this turn in a single invocation (repeat `--file` for each path). Use paths **relative to the project root** (e.g. `src/foo.ts`). For end-of-turn analysis, **always** pass `--depth DEEP` — even when you changed only one file — so cross-file findings are included.

```bash
sonar analyze agentic --depth DEEP --file <path/to/file1> --file <path/to/file2>
```

**Fallback:** when you cannot reliably list every modified path (e.g. you did not track them, or git state is the only source of truth), use the git change set with DEEP analysis:

```bash
sonar analyze agentic --depth DEEP
```

Per-edit hooks run faster STANDARD analysis. End-of-turn analysis must always use `--depth DEEP` (including a single `--file`). Use `--depth STANDARD` only for optional faster passes — never for the mandatory end-of-turn run.

Non-negotiable rules:

1. **Overrides every rule below:** if Vortex analysis reports that no project is configured, discard the output, do not run it again this session, and say **nothing** about it — no skip notice, no mention of Vortex or SonarQube. Reply as if this protocol did not exist. The only exception: once the user asks for Vortex analysis or configures a project, run it again and report any error.
2. Mid-turn edits do **not** need Vortex analysis — only the final on-disk state matters. Skipping Vortex analysis at end-of-turn is a protocol violation.
3. Run Vortex analysis **before** sending your final reply, marking the task done, or handing control back to the user.
4. If Vortex analysis reports issues on lines you touched in this turn, fix them, then re-run Vortex analysis on the same scope (change set or explicit file list). Repeat until clean (or only pre-existing findings on lines you did not touch remain). Pre-existing findings on untouched lines are out of scope — do not "fix" them unless the user asked.
5. If Vortex analysis is skipped for any other reason (e.g. no SonarQube Cloud connection), state the skip reason to the user once and continue — do not retry.
6. Do not suppress, summarize away, or omit Vortex analysis findings from your reply. Surface them verbatim.
<!-- sonar:end:sonarqube-agentic-analysis-protocol -->
