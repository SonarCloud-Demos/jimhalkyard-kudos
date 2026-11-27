---
title: Sensitive change summary
description: Provide impact summary and testing suggestions for changes to sensitive paths
type: automation
when: Changes affect src/routes/, src/middleware/, src/services/auth.service.ts, src/db/, or any path containing auth/, secrets/ or payments/ (authorisation, schema, secrets handling)
actions: Post one advisory comment summarising impact, suggested tests and reviewers
---

# Sensitive change summary

When a pull request modifies files under sensitive paths such as `routes/`, `middleware`, `auth`, `secrets/`, `payments/`, or `src/db/` (authorisation logic, payment processing, database schema, secrets handling, cryptography), provide an advisory summary to help reviewers assess impact.

## Sensitive paths typically include

- Authentication and authorisation modules
- Payment and billing logic
- Database schema migrations
- Secrets handling and credential management
- Cryptographic operations
- Public API contracts

## Response

Post one advisory comment that:

- Summarises the change's impact on the sensitive area
- Lists specific behaviour changes (new endpoints, permission checks, schema changes, payment flows)
- Suggests tests to verify the change (unit tests for logic, integration tests for flows, manual testing for user-facing changes)
- Suggests reviewers with expertise in the affected area (security engineer, database expert, payments specialist)

This is an advisory comment only. It does not block approval or merge.
