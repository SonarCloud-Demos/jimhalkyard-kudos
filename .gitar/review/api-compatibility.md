# API compatibility

## Scope

This guidance applies to changes in public APIs, serialised contracts (JSON, Protocol Buffers, GraphQL schemas), database schemas exposed through APIs, and HTTP endpoints used by external consumers or other services.

## What to flag

Flag these breaking changes and cite the concrete consequence:

- **Removed or renamed fields**: fields deleted or renamed in request or response payloads, database table columns exposed via APIs, or configuration structures. Consequence: client parsing failures, null pointer errors or data loss for consumers.

- **Changed types or semantics**: field type changes (string to integer, nullable to non-nullable), semantic changes (field now means something different), or constraint changes (maximum length reduced, enum values removed). Consequence: type errors, validation failures or incorrect business logic in consumers.

- **Changed status codes**: HTTP status code changes for existing endpoints (200 to 201, 404 to 400, success to error or vice versa). Consequence: incorrect error handling, broken retry logic or alerting false positives in consumers.

- **Removed or changed error codes**: application-level error codes removed or redefined. Consequence: consumers cannot distinguish error conditions or perform specific recovery.

## Evidence required

Before flagging:

- Check whether consumers exist in this repository. Search for imports, references, test clients or documentation mentioning the endpoint or contract.
- If cross-repository analysis is available, check for consumers in dependent services or client libraries.
- Verify the API is public or used by other services. Internal helper functions or endpoints marked explicitly as internal are out of scope.
- Confirm the change is not backward-compatible (additive changes with defaults are usually safe).

## Exceptions

Do not flag:

- **Additive changes**: new optional fields, new endpoints, new enum values (if consumers handle unknown values gracefully).
- **Internal endpoints**: APIs explicitly documented or marked as internal, private or for use within a single service boundary.
- **Deprecated fields**: fields already marked deprecated where the deprecation period has passed and removal was announced.
- **Beta or experimental APIs**: endpoints or contracts explicitly labelled as unstable or subject to change.

## What NOT to flag

Do not comment on:

- Code style, naming conventions or documentation completeness.
- Performance characteristics or implementation details that do not affect the contract.
- Generic advice to "version your APIs" without citing specific breaking changes.
- Changes to internal data structures or database schemas that are not exposed through public APIs.
