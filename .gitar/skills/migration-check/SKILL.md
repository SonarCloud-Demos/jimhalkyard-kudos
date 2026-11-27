---
name: migration-check
description: Verify a database migration is reversible, safe and compatible with rolling deploys
---

# Migration safety check procedure

This skill provides steps to verify a database migration is reversible, safe against production data and compatible with a rolling deploy.

## Purpose

When a pull request adds or modifies a database migration, this skill helps verify:

- The migration can be rolled back without data loss
- The migration will not cause long locks or downtime
- The migration is compatible with a rolling deploy (old and new code versions running simultaneously)

## Steps

1. **Review the migration DDL**
   - Identify the specific DDL statements (CREATE, ALTER, DROP, ADD COLUMN, ADD INDEX)
   - Note the target table(s) and estimated row count or write rate
   - Record the file and line number

2. **Check for irreversible operations**
   - Identify operations that delete data: DROP TABLE, DROP COLUMN, DELETE, TRUNCATE
   - Check whether a rollback or reversal migration is documented (in comments, commit message or PR description)
   - Verify that dropped columns or tables are not referenced by application code that may be rolled back

3. **Check for lock-heavy operations**
   - Identify operations that require table locks: ADD COLUMN NOT NULL without default, CHANGE COLUMN type, ALTER TABLE without online DDL
   - Estimate lock duration based on table size and operation type
   - Check whether the migration uses online schema change tools (pt-online-schema-change, gh-ost, or database-native online DDL)
   - Verify that lock timeouts are configured to prevent deploy hangs

4. **Check for missing backfill**
   - Identify new constraints: NOT NULL, FOREIGN KEY, UNIQUE, CHECK constraints
   - Verify that existing data satisfies the constraint (or is backfilled before the constraint is added)
   - Check whether the migration script includes a backfill step or separate backfill query

5. **Check for rolling deploy compatibility**
   - Identify schema changes that require simultaneous code deployment: renamed columns, removed columns, semantic changes
   - Verify that old application code (not yet deployed) can operate with the new schema
   - Check whether a multi-step migration is needed (additive migration first, code deployment, then cleanup migration)

6. **Check for index creation impact**
   - Identify new indexes and their target tables
   - Verify that index creation uses CONCURRENTLY (Postgres) or ONLINE (MySQL) to avoid blocking writes
   - Estimate index build time based on table size

7. **Report findings**
   - Summarise the migration (what changes, which tables)
   - List any irreversible operations and whether rollback is documented
   - List any lock-heavy operations and estimated lock duration
   - List any missing backfills for new constraints
   - List any rolling deploy compatibility issues
   - Recommend mitigations (online DDL, multi-step migration, backfill script)

## Output format

The report should include:

- **Migration summary**: describe the DDL changes and target tables
- **Reversibility**: list irreversible operations and rollback procedure (or missing procedure)
- **Lock risk**: list lock-heavy operations, estimated lock duration and mitigation (or lack thereof)
- **Backfill status**: list new constraints and whether data is backfilled
- **Rolling deploy compatibility**: list compatibility issues and recommended multi-step approach
- **Index creation**: list new indexes and whether they are built online
- **Recommendations**: suggest specific mitigations or flag as safe
