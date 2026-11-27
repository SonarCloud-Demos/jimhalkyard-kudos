# Authorisation and input validation

## Scope

This guidance applies to HTTP endpoints, API handlers, database query construction, file system operations, command execution, and any code path that processes untrusted input or enforces access control.

## What to flag

Flag these security defects and cite the concrete consequence:

- **Missing authorisation checks**: new or changed endpoints that do not verify the caller's identity or permissions before accessing or modifying resources. Consequence: unauthorised access to sensitive data or operations.

- **Missing ownership checks**: operations on user-owned resources (documents, accounts, billing data) that do not verify the authenticated user owns or has permission to access the specific resource. Consequence: horizontal privilege escalation, users can access or modify other users' data.

- **Trusting client-supplied values**: code that accepts and uses client-controlled identifiers (user IDs, account IDs, prices, roles, permissions) without server-side validation or lookup. Consequence: privilege escalation, price manipulation or unauthorised actions.

- **Injection vulnerabilities**: untrusted input used in SQL queries, shell commands, file paths, templates or other contexts where it can alter program behaviour. Consequence: SQL injection, command injection, path traversal or remote code execution.

## Evidence required

Before flagging:

- Verify authorisation is not enforced by middleware, decorators, framework configuration or a centralised policy engine.
- Check whether the endpoint or operation is documented or marked as public (no authentication required).
- Confirm the input reaches a dangerous sink (database, shell, file system) without sanitisation, parameterisation or escaping.
- Check whether the language, framework or library provides automatic protection (such as parameterised queries, path sanitisation or Content Security Policy).

## Exceptions

Do not flag:

- **Public endpoints**: endpoints explicitly documented as public or unauthenticated (health checks, login, public content).
- **Read-only operations on public data**: operations that read data already intended for public access with no ownership or sensitivity concerns.
- **Input validated upstream**: cases where validation, sanitisation or parameterisation is applied in a wrapper, middleware or database layer.
- **Admin or internal tools**: endpoints restricted to internal networks or admin roles, where access control is enforced at the network or gateway layer.

## What NOT to flag

Do not comment on:

- Code style, naming or structure of authorisation logic.
- Generic security advice ("use HTTPS", "hash passwords") without citing specific missing checks in the diff.
- Hypothetical attacks that require other vulnerabilities or unrealistic preconditions.
- Security findings already reported by a static analyser or secrets scanner in CI.
