# Logging and sensitive data

## Scope

This guidance applies to logging statements, error messages, debug output, URLs, query strings, stack traces, and any code that writes data to logs, monitoring systems or external observability tools.

## What to flag

Flag these data exposure risks and cite the concrete consequence:

- **Secrets or credentials in logs**: API keys, passwords, tokens, private keys, session identifiers or other secrets logged directly or included in logged objects. Consequence: credential exposure in log aggregation systems, increasing blast radius of a log breach.

- **Personal data in logs**: names, email addresses, phone numbers, addresses, payment details, health data or other personally identifiable information logged without redaction. Consequence: privacy violations, GDPR or regulatory non-compliance, increased breach impact.

- **Sensitive data in URLs or query strings**: secrets, tokens, personal data or business-sensitive values passed in URL paths or query parameters that will appear in access logs, proxy logs and browser history. Consequence: credential or data exposure in infrastructure logs.

- **Missing redaction**: objects, structs or JSON payloads logged wholesale that contain sensitive fields without redaction or filtering. Consequence: accidental exposure of secrets or personal data buried in logged structures.

- **Verbose logging in hot paths**: debug or trace-level logging in performance-critical code paths (tight loops, per-request handlers, database query loops) without level guards. Consequence: performance degradation, log volume exceeding retention limits, increased observability costs.

## Evidence required

Before flagging:

- Verify the data is sensitive (secrets, credentials, personal data, payment details) or the logging is in a hot path (per-request, per-query, tight loop).
- Check whether redaction or filtering is applied by a logging framework, middleware or structured logging library.
- Confirm the logging level is enabled in production. Debug and trace logs disabled in production are lower risk.
- Check whether the field or value is already redacted elsewhere (such as in the object's string representation or by a centralised logging policy).

## Exceptions

Do not flag:

- **Non-sensitive identifiers**: user IDs, account IDs, request IDs or other identifiers that are not secrets or personal data.
- **Public data**: information already publicly accessible (public usernames, public repository names, product names).
- **Redacted values**: logging of placeholder strings (such as `[REDACTED]`, `***`, hashed values) or counts without actual values.
- **Local development logging**: verbose logging explicitly guarded by development-only configuration or environment variables.

## What NOT to flag

Do not comment on:

- Code style, naming or structure of log statements.
- Generic advice to "log less" or "redact sensitive data" without citing specific exposure risks in the diff.
- Logging of non-sensitive operational data (request counts, latencies, error rates, feature flags).
- Choice of logging framework, structured logging format or log levels.
