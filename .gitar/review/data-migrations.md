# Data migrations

## Scope

This guidance applies to database schema migrations, data backfills, schema changes (DDL statements), index creation or deletion, and any code that modifies database structure or bulk-updates data.

## What to flag

Flag these migration risks and cite the concrete consequence:

- **Irreversible migrations**: migrations that drop tables, columns or indexes, or delete data, without a documented rollback procedure or migration reversal. Consequence: inability to roll back a failed deploy, permanent data loss on rollback.

- **Lock-heavy operations**: migrations that add non-nullable columns without defaults, change column types, or rebuild tables on large tables without batching or online schema change tools. Consequence: table locks blocking writes, downtime or deploy timeouts.

- **Missing backfill for new constraints**: adding NOT NULL constraints, foreign keys or unique indexes without first backfilling existing data or verifying constraint satisfaction. Consequence: migration failure mid-deploy, partial schema changes or data inconsistency.

- **Incompatibility with rolling deploys**: schema changes that require application code changes to be deployed simultaneously (such as renaming columns, changing semantics or removing columns that old code versions still read). Consequence: errors during rolling deploy, downtime or corrupt reads.

## Evidence required

Before flagging:

- Verify the migration targets a large or write-heavy table (check table size, row counts or write rates in production).
- Confirm the migration does not use online schema change tools (such as pt-online-schema-change, gh-ost, or database-native online DDL).
- Check whether a rollback or reversal procedure is documented in the commit message, PR description or migration comments.
- Verify the application code change requires the schema change to be deployed first (or simultaneously).

## Exceptions

Do not flag:

- **Small or low-traffic tables**: migrations on tables with fewer than 10,000 rows or low write rates where locks are acceptable.
- **Additive schema changes**: adding nullable columns, new tables or new indexes with CONCURRENTLY (Postgres) or ONLINE (MySQL) clauses.
- **Test or development databases**: migrations explicitly scoped to test environments or feature-flagged for gradual rollout.
- **Migrations with documented rollback**: irreversible operations accompanied by a documented rollback procedure, backup strategy or data export.

## What NOT to flag

Do not comment on:

- Code style, naming or organisation of migration files.
- Generic advice to "be careful with migrations" without citing specific lock or rollback risks in the diff.
- Migration tools, versioning strategies or choice of migration framework.
- Performance optimisation suggestions that do not affect correctness or rollback safety.

## Related

This guidance pairs with the `migration-check` skill, which provides a step-by-step verification procedure for migration safety.
