# Dependency changes

## Scope

This guidance applies to changes in dependency manifests (package.json, requirements.txt, go.mod, Cargo.toml, pom.xml, build.gradle), lockfiles, vendored dependencies, and dependency configuration.

## What to flag

Flag these dependency issues and cite the concrete consequence:

- **Unpinned or loosely pinned dependencies**: new dependencies added with version ranges that allow major or minor version changes (such as `^1.0.0`, `>=2.0`, `*` or no version specified). Consequence: non-deterministic builds, unexpected breaking changes or supply chain risk.

- **Duplicate dependencies**: the same library added multiple times at different versions, or added when a compatible version already exists in the tree. Consequence: bundle bloat, version conflicts or runtime errors.

- **Lockfile and manifest mismatch**: changes to the manifest (package.json, requirements.txt) without corresponding lockfile updates, or lockfile changes without manifest changes. Consequence: inconsistent dependency resolution, CI and production running different versions.

- **Abandoned or unmaintained packages**: dependencies with no releases, commits or activity in over two years, or packages explicitly marked as deprecated or archived. Consequence: security vulnerabilities not patched, incompatibility with newer runtimes or dependencies.

- **Licence concerns**: new dependencies with licences incompatible with the project's licence or organisation policy (such as GPL in a proprietary project, or licences requiring attribution that is not provided). Consequence: legal risk or compliance violations.

## Evidence required

Before flagging:

- Check the dependency's repository, NPM page, PyPI page or package registry for last release date and maintenance status.
- Verify the licence is incompatible (not just unfamiliar). Common permissive licences (MIT, Apache 2.0, BSD) are usually acceptable.
- Confirm the manifest and lockfile are out of sync by comparing package versions and checksums.
- Check whether vulnerability scanning is enabled in CI. If so, defer vulnerability findings to the scanner output rather than duplicating them here.

## Exceptions

Do not flag:

- **Vulnerabilities already reported**: if a security scanner or dependency bot is active and reporting vulnerabilities, do not duplicate those findings here.
- **Intentional version ranges**: ranges explicitly justified in the commit message or PR description (such as peer dependencies or plugin systems).
- **Dev dependencies**: loose versioning in development-only dependencies (test frameworks, linters, build tools) where breaking changes are caught early and do not affect production.
- **Transitive dependencies**: indirect dependencies (not directly listed in the manifest) where version control is managed by the dependency resolution tool.

## What NOT to flag

Do not comment on:

- Code style, naming or organisation of dependency configuration files.
- Generic advice to "keep dependencies up to date" without citing specific risks.
- Dependency updates that are behind the latest version but still maintained and supported.
- Choice of package manager, dependency resolution strategy or use of monorepos.
