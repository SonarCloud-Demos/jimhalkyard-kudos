# Error handling and resource management

## Scope

This guidance applies to all source files that handle errors, manage resources (files, connections, locks, streams) or perform operations that can fail.

## What to flag

Flag these patterns and cite the concrete consequence:

- **Swallowed exceptions**: empty catch blocks or catch blocks that log but do not propagate or take recovery action. Consequence: silent data loss, inconsistent state or undiagnosed failures in production.

- **Missing cleanup or close**: resources (file handles, database connections, HTTP clients, locks, streams) opened without guaranteed cleanup in all exit paths. Consequence: resource exhaustion, connection pool depletion, file handle leaks or deadlocks.

- **Ignored error returns**: functions or methods that return error values (such as Go error returns, Rust Result types or HTTP status codes) where the caller does not check the return. Consequence: silent failure propagation, corrupted data or incorrect program state.

- **Unbounded retries**: retry loops with no maximum attempt count or exponential backoff. Consequence: infinite loops, resource exhaustion or cascading failures under transient errors.

- **Partial failure leaving inconsistent state**: multi-step operations (database writes, API calls, file updates) where a failure in one step leaves the system in an inconsistent state with no rollback or compensation. Consequence: data corruption, referential integrity violations or user-facing inconsistency.

## Evidence required

Before flagging:

- Confirm the error or resource is not handled in a wrapper, defer statement, context manager or cleanup hook higher in the call chain.
- Verify the consequence is reachable (the code path executes in production, the resource is actually scarce, the retry is on a critical path).
- Check whether the language or framework provides automatic cleanup (such as Python context managers, Java try-with-resources, Go defer or Rust Drop).

## Exceptions

Do not flag:

- Error logging in top-level handlers or CLI entry points where propagation is not possible or appropriate.
- Resources managed by a framework or runtime (such as request-scoped database connections in a web framework, or garbage-collected objects in managed languages where finalisers handle cleanup).
- Errors explicitly documented as ignorable (such as best-effort cache writes or idempotent cleanup operations).
- Retry logic that is bounded by a timeout or circuit breaker configured elsewhere.

## What NOT to flag

Do not comment on:

- Code style, naming or formatting of error messages.
- Generic advice to "add better error handling" without citing specific missing cleanup or propagation.
- Error handling in test code, unless the test cannot detect failures.
- Hypothetical errors that the language or type system prevents (such as null pointer errors in Rust or type mismatches in statically typed languages).
