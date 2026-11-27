# Automatic merge policy

Automatic merge is withheld for every pull request.

No pull request should be merged automatically while review quality is being assessed. This includes:

- Low-risk changes (documentation, comments, test-only changes)
- Changes that pass all checks and receive approval
- Changes from trusted contributors

## Never automatically merge

Never automatically merge pull requests that affect:

- CI, build or release configuration (pipeline definitions, deploy scripts, GitHub Actions workflows)
- Dependency manifests (package.json, requirements.txt, go.mod, Cargo.toml, pom.xml, build.gradle)
- Files under `.gitar/` (review policy, rules, skills, configuration)

After the evaluation period, this policy can be revised to allow automatic merge for low-risk changes that meet quality and approval criteria.
