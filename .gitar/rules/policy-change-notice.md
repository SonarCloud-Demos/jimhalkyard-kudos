---
title: Policy change notice
description: Changes to review policy require human review
type: automation
when: Changes affect files under .gitar/ directory
actions: Post one advisory comment that review policy has changed and needs human review
---

# Policy change notice

When a pull request modifies files under `.gitar/` (review instructions, rules, skills, configuration), post an advisory comment to ensure the policy change receives human review.

## Changes that trigger this rule

- New or modified review instructions in `.gitar/review/`
- New or modified rules in `.gitar/rules/`
- New or modified skills in `.gitar/skills/`
- Changes to risk, approval, merge or apply configuration in `.gitar/config/`
- Changes to cross-repository analysis configuration in `.gitar/cross-repo.md`

## Response

Post one advisory comment that:

- Notes that review policy has changed
- Lists the affected files or configuration
- Recommends human review by the team lead, security engineer or repository owner
- Reminds that policy changes affect all future reviews in this repository

This is an advisory comment only. It does not block approval or merge, but it ensures the change is visible.

No automatic approval or automatic merge should be applied to changes under `.gitar/`.
