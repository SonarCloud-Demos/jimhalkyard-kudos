# Sonar CLI Workflow

Use the `sonar` CLI for every coding task. Do not use the SonarQube MCP server tools.

## Before Writing Code

- Context augmentation: run `sonar context guidelines get --mode combined
  --languages python --categories "<relevant categories>" --files <changed files>`
  to get relevant project guidance.
- Architecture: for architecture-affecting changes, run
  `sonar context architecture get-intended` and
  `sonar context architecture get-current --ecosystem py --depth 2`.
- Code navigation: use `sonar context navigation search-signatures --pattern <regex>`,
  `sonar context navigation get-type-hierarchy --fqn <fqn>`, and
  `sonar context navigation get-references --fqn <fqn>` to find and understand the
  relevant code before changing it. Prefer these over grep or bulk file reading.
  Also available: `search-bodies`, `get-source`, `trace-callers`, `trace-callees`.

## While Coding

- Follow the retrieved guidelines and context.
- Change only the files required for the request.
- For every new file or code change, run
  `sonar analyze agentic --file <path> --branch main --format json`.
- For every returned finding, look up the rule before deciding how to fix it:
  `sonar api get "/api/rules/show?key=<rule key>&organization=suresh-demo"`
  (the `organization` parameter is required; without it the call fails with 400).
- Use the rule's rationale and recommended guidance to correct every finding
  introduced by the current task.
- Re-run `sonar analyze agentic --file <path>` on the changed file after the fix.
- Repeat until introduced findings are clean, or state clearly why a non-blocking
  issue remains.
- Before adding or upgrading any third-party package, run
  `sonar context dependencies check --purl "pkg:npm/<name>@<version>"`.
- Do not commit, push, or open a pull request unless explicitly asked.

## End-of-Task Check

Before replying, ensure every source file changed in this task was analyzed with
`sonar analyze agentic` and any introduced findings were addressed.

## Result

- Changed: [files and one-line purpose]
- Sonar: [clean / findings fixed / unavailable and why]
 
## Environment notes

- This is a TypeScript project (Bun runtime, bun test).
- SonarQube Cloud org: `sonarcloud-demos`; project key: `SonarCloud-Demos_jimhalkyard-kudos`.
- Auth lives in the OS keychain; check with `sonar auth status`.
<!-- sonar:begin:sonarqube-agentic-analysis-protocol -->
# Sonar CLI Workflow

Use the `sonar` CLI for every coding task. Do not use the SonarQube MCP server tools.

## Before Writing Code

- Context augmentation: run `sonar context guidelines get --mode combined
  --languages "<relevant languages>" --categories "<relevant categories>" --files <changed files>`
  to get relevant project guidance.
- Architecture: for architecture-affecting changes, run
  `sonar context architecture get-intended` and
  `sonar context architecture get-current --ecosystem "<relevant languages>" --depth 2`.
- Code navigation: use `sonar context navigation search-signatures --pattern <regex>`,
  `sonar context navigation get-type-hierarchy --fqn <fqn>`, and
  `sonar context navigation get-references --fqn <fqn>` to find and understand the
  relevant code before changing it. Prefer these over grep or bulk file reading.
  Also available: `search-bodies`, `get-source`, `trace-callers`, `trace-callees`.

## While Coding

- Follow the retrieved guidelines and context.
- Change only the files required for the request.
- For every new file or code change, run
  `sonar analyze agentic --file <path> --branch main --format json`.
- For every returned finding, look up the rule before deciding how to fix it:
  `sonar api get "/api/rules/show?key=<rule key>&organization=<org>"`
  (the `organization` parameter is required; without it the call fails with 400).
- Use the rule's rationale and recommended guidance to correct every finding
  introduced by the current task.
- Re-run `sonar analyze agentic --file <path>` on the changed file after the fix.
- Repeat until introduced findings are clean, or state clearly why a non-blocking
  issue remains.
- Before adding or upgrading any third-party package, run
  `sonar context dependencies check --purl "pkg:npm/<name>@<version>"`.
- Do not commit, push, or open a pull request unless explicitly asked.

## End-of-Task Check

Before replying, ensure every source file changed in this task was analyzed with
`sonar analyze agentic` and any introduced findings were addressed.

## Result

- Changed: [files and one-line purpose]
- Sonar: [clean / findings fixed / unavailable and why]

## Environment
- Sonar Project Key: `sonar context tool status --cwd "$(pwd)" --json | jq '[.[] | select(.current == true)][0]' | jq -r '.project_key'`
- Sonar Cloud Org: `sonar context tool status --cwd "$(pwd)" --json | jq '[.[] | select(.current == true)][0]' | jq -r '.org'`

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
 