---
name: trace-contract
description: Trace the producer, consumers and tests of a changed contract
---

# Trace contract procedure

This skill provides a read-only procedure for tracing the producer, consumers and tests of a changed contract (API endpoint, serialised payload, database schema exposed through APIs).

## Purpose

When a pull request changes a contract (removes a field, changes a type, changes semantics), this skill helps identify:

- Where the contract is produced (the endpoint or serialisation code)
- Where the contract is consumed (client code, tests, documentation)
- What tests cover the contract

## Steps

1. **Identify the contract change**
   - Locate the specific field, endpoint or schema element that changed
   - Note the change type (removed, renamed, type change, semantic change)
   - Record the file and line number

2. **Find the producer**
   - Search for the function, class or handler that produces the contract
   - Identify the serialisation code (JSON encoder, Protocol Buffer definition, GraphQL resolver)
   - Note the file and line number

3. **Find consumers in this repository**
   - Search for code that reads or deserialises the contract
   - Look for field access, destructuring, parsing code or tests that reference the field
   - Check for type definitions, interfaces or schemas that reference the contract
   - Record each consumer's file and line number

4. **Find consumers in other repositories (if cross-repository analysis is available)**
   - Search dependent services, client libraries or SDKs for references to the contract
   - Look for API client code, integration tests or documentation that references the endpoint or field
   - Record each consumer's repository, file and line number

5. **Find tests**
   - Search for unit tests, integration tests or end-to-end tests that exercise the contract
   - Look for tests that assert on the field's presence, type or value
   - Check for tests that would catch the breaking change
   - Record each test's file and line number

6. **Report findings**
   - Summarise the contract change (what changed, file and line)
   - List the producer (file and line)
   - List all consumers (file and line for each)
   - List all tests that cover the contract (file and line for each)
   - State whether any consumer would break (based on the change type)
   - State whether tests would catch the breaking change

## Output format

The report should include:

- **Contract change**: describe the change and its location
- **Producer**: file and line where the contract is produced
- **Consumers**: list of files and lines where the contract is consumed
- **Tests**: list of files and lines where the contract is tested
- **Impact assessment**: which consumers would break, whether tests would catch it
