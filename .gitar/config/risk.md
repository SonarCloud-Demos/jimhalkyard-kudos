# Risk assessment

Risk levels guide review priority and severity classification. Repository criteria can raise the organisation's baseline risk level, but never lower it.

## High risk

Changes that affect:

- Authentication and authorisation logic (login, permissions, access control, session management)
- Payments and billing (transaction processing, pricing, invoicing, refunds)
- Database schema migrations (DDL statements, structure changes, constraint changes)
- Cryptography and secrets handling (encryption, key management, credential storage, token generation)
- CI, build and release configuration (pipeline definitions, deploy scripts, release automation)
- Public API contract changes (removed fields, type changes, semantic changes, status code changes)
- Files under `.gitar/` (review policy, rules, skills, configuration)

## Medium risk

Changes that affect:

- Bounded behaviour changes (new features, refactors with limited scope)
- Internal API changes (within-service contracts)
- Configuration changes (environment variables, feature flags, timeouts)
- Logging and monitoring (new instrumentation, alerting rules)

## Low risk

Changes that affect:

- Documentation (README, comments, docstrings, markdown files)
- Comments in source code
- Test-only changes (new tests, test fixtures, test helpers)
- Formatting and style (whitespace, indentation, linting fixes)
