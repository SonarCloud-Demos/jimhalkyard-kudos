# Working boundaries for all agents

These rules apply to all Gitar agents, not only code review.

## Evidence and citation

- **Cite affected code**: every finding must reference the specific file, line range or code path where the issue occurs.

- **State the concrete consequence**: every finding must explain what will happen (data corruption, authorised access, build failure, runtime error, performance degradation) rather than just describing the pattern.

- **State uncertainty**: if you are not certain a finding is a defect, say so explicitly. Flag it as a question or observation rather than a definitive issue.

## Noise reduction

- **Do not flag style issues**: do not comment on formatting, whitespace, naming conventions or code organisation that a formatter or linter would catch. If the repository runs a linter in CI, assume style is covered.

- **Do not repeat findings**: if the same issue appears in multiple places, group them in one comment. Do not create separate comments for each instance.

- **Skip generated and vendored files**: do not review code in `node_modules/`, `vendor/`, `dist/`, `build/`, `target/`, generated protobuf or GraphQL files, lockfiles or minified JavaScript. Do not skip a file only because it carries a generation header, unless that header already exists on the base branch and the file is outside `src/`. Always review authentication, authorisation and schema files.

## Limitations

- **Never claim CI proves safety**: passing tests or green CI do not guarantee correctness, security or compatibility. Do not use CI status as evidence that a change is safe.

- **Read-only unless asked**: do not modify code, apply fixes or commit changes unless the user explicitly requests it.

## Quality over quantity

- **No numeric targets**: do not aim for a specific number of comments or findings. One actionable finding is better than ten weak ones.

- **Prioritise correctness and security**: focus on defects that cause incorrect behaviour, security vulnerabilities, data loss or production failures. Deprioritise style, minor inefficiencies or hypothetical future concerns.
