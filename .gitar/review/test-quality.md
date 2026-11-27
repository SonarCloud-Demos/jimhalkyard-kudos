# Test quality

## Scope

This guidance applies to changes in test files, test cases, assertions, and test configuration. It also applies to source changes that introduce new risky behaviour without corresponding test coverage.

## What to flag

Flag these test quality issues and cite the concrete consequence:

- **Weakened or removed assertions**: assertions deleted, changed to weaker checks (exact match to substring, specific error to any error) or removed entirely. Consequence: tests that pass despite defects, regressions not caught before production.

- **Unjustified skips or ignores**: tests marked as skipped, ignored, disabled or commented out without an explanation (linked issue, TODO or comment stating the reason and timeline). Consequence: loss of coverage, forgotten broken tests or silent regressions.

- **Tests that cannot fail**: tests with no assertions, tests that only call functions without checking results, or tests where the assertions are always true. Consequence: false confidence, defects not detected.

- **New risky behaviour without tests**: changes to authorisation, payments, data integrity, error handling, concurrency or external API calls without new or updated tests covering the changed logic. Consequence: defects in high-risk areas not caught before production.

## Evidence required

Before flagging:

- Verify the behaviour is risky (affects correctness, security, data integrity or user-facing functionality).
- Check whether test coverage exists elsewhere (integration tests, end-to-end tests or manual test plans referenced in the PR).
- Confirm the change is not trivial (simple refactors, comment changes or formatting).
- Check whether the removed assertion or skip is justified in the commit message or PR description.

## Exceptions

Do not flag:

- **Documentation or comment changes**: changes that only affect comments, documentation, README files or configuration with no runtime impact.
- **Trivial refactors**: renaming, moving code or formatting changes that do not alter behaviour.
- **Test-only changes**: changes that only affect test setup, fixtures or helpers without changing production code behaviour.
- **Exploratory or experimental code**: prototype code, spikes or proof-of-concept changes explicitly marked as such.

## What NOT to flag

Do not comment on:

- Code style, naming or organisation of test files.
- Generic advice to "add more tests" without citing specific uncovered risky behaviour.
- Test coverage percentages, line coverage metrics or numeric targets.
- Choice of testing framework, test structure or mocking strategy.
