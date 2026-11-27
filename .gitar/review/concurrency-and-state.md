# Concurrency and shared state

## Scope

This guidance applies to code that uses threads, goroutines, async/await, locks, channels, shared mutable state, or performs non-atomic operations on shared data.

## What to flag

Flag these concurrency defects and cite the concrete consequence:

- **Unsynchronised shared mutable state**: mutable variables, collections or objects accessed from multiple threads or goroutines without synchronisation (locks, atomics, channels or immutability). Consequence: data races, corrupted state or non-deterministic behaviour.

- **Check-then-act races**: code that checks a condition and then acts on it in separate non-atomic steps (such as checking a map key exists, then reading it; checking a file exists, then opening it). Consequence: race conditions where the state changes between check and act, leading to errors or incorrect behaviour.

- **Locks held across I/O or blocking calls**: locks held while performing network calls, file I/O, database queries or other blocking operations. Consequence: contention, reduced throughput, deadlocks or starvation.

- **Async or goroutine misuse**: goroutines or async tasks launched without synchronisation, error handling, cancellation or bounded concurrency. Consequence: goroutine leaks, unhandled errors, unbounded resource use or failure to propagate cancellation.

- **Non-idempotent operations in retry logic**: operations retried without idempotency guarantees (such as incrementing a counter, appending to a list or charging a payment). Consequence: duplicate actions, incorrect totals or financial errors.

## Evidence required

Before flagging:

- Verify the data is actually shared between concurrent contexts (not thread-local, not confined to a single goroutine or task).
- Check whether synchronisation exists elsewhere (such as a mutex held by the caller, a single-threaded runtime or framework guarantees).
- Confirm the operation is not idempotent or the retry logic does not deduplicate.
- Check whether the language or framework provides automatic protection (such as Rust's Send and Sync traits, or single-threaded JavaScript event loops).

## Exceptions

Do not flag:

- **Single-threaded or synchronous code**: code that runs in a single-threaded runtime or event loop with no concurrency.
- **Immutable data**: reads of immutable data structures, constants or configuration that is not modified after initialisation.
- **Thread-safe types**: use of data structures explicitly documented as thread-safe or concurrent (such as Java ConcurrentHashMap, Go sync.Map or Rust Arc).
- **Framework-managed concurrency**: concurrency managed by a framework or library that handles synchronisation (such as web framework request handlers, database connection pools or actor systems).

## What NOT to flag

Do not comment on:

- Code style, naming or structure of concurrency primitives.
- Generic advice to "be careful with concurrency" without citing specific races or missing synchronisation.
- Performance characteristics or choice of concurrency model (threads versus async).
- Hypothetical races that the language or type system prevents (such as data races in Rust's safe code).
