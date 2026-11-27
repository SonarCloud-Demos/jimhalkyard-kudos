---
title: Tests attached to behaviour changes
description: Behaviour changes in source paths must include corresponding test changes
type: check
when: Changes affect files under src/, lib/, app/ but no test files are modified
actions: Post one comment listing the uncovered behaviour changes
---

# Tests attached to behaviour changes

When a pull request changes behaviour in source files under `src/`, `lib/`, or `app/`, corresponding test changes should be included unless the change is a documentation update, configuration change or behaviour-preserving refactor.

## Behaviour changes include

- New functions, methods or classes
- Changes to function logic, control flow or error handling
- Changes to API endpoints, handlers or business logic
- Changes to data validation, authorisation or resource management

## Exceptions

Do not require tests for:

- Documentation changes (README, comments, docstrings)
- Configuration changes (environment variables, feature flags, logging configuration)
- Behaviour-preserving refactors (renaming, moving code, formatting)
- Changes where tests already exist and cover the modified behaviour

## Response

If behaviour changes are found without corresponding test changes, post one comment that:

- Lists the specific files and behaviour changes
- Asks whether test coverage exists elsewhere (integration tests, end-to-end tests or manual test plans)
- Suggests adding tests for the changed logic
