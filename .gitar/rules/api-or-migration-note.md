---
title: API or migration note required
description: Public API changes or destructive migrations must include a migration note or changelog entry
type: check
when: A public API field is removed or renamed, or a destructive database migration is added
actions: Post one comment if a migration note, upgrade note or changelog entry is missing
---

# API or migration note required

When a pull request removes or renames a public API field, changes API semantics, or adds a destructive database migration (dropping tables, columns or indexes), a migration note, upgrade note or changelog entry should be included to communicate the change to consumers or operators.

## Changes that require documentation

- Removed or renamed fields in public APIs, serialised contracts or database schemas exposed through APIs
- Semantic changes to existing API fields (type changes, constraint changes, meaning changes)
- Destructive database migrations (DROP TABLE, DROP COLUMN, DROP INDEX)
- Changes to public error codes, status codes or API behaviour

## Where to document

Look for a migration note, upgrade note or changelog entry in one of these locations:

- `CHANGELOG.md` or `CHANGELOG.txt`
- `UPGRADING.md` or `MIGRATION.md`
- Release notes or migration guides in `docs/`
- Comments in the migration file or API change explaining the impact

## Exceptions

Do not require documentation for:

- Additive API changes (new optional fields, new endpoints)
- Internal APIs or endpoints marked as private
- Changes to fields already marked deprecated with a documented removal timeline

## Response

If a migration note or changelog entry is missing, post one comment that:

- Identifies the breaking change (which field, endpoint or migration)
- Explains why documentation is needed (impact on consumers or operators)
- Suggests where to add the documentation (changelog, upgrade guide or migration file comments)
