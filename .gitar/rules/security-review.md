---
title: "Security Review"
description: "Add security-review for sensitive changes"
slug: "security_review"
type: "check"
when: "PRs modifying authentication or encryption code"
actions: "Add label, Post comment"
---

# Security Review

When sensitive code is modified:
- Add "security-review" label
- Post a comment containing this checklist:
  - [ ] Secrets/keys are read from env, never hardcoded (e.g. `JWT_SECRET`)
  - [ ] Token expiry, signature algorithm, and audience are validated
  - [ ] Session cookies stay `httpOnly`, `secure`, and `sameSite`
  - [ ] Password hashing parameters are unchanged or strengthened
  - [ ] Authorization/role checks cover every new or changed route
  - [ ] Errors do not leak credentials, tokens, or hashes to logs/responses