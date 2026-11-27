# Automatic fix application policy

Do not apply review fixes automatically while review quality is being scored.

Fixes should only be applied when a developer explicitly requests one (such as by asking for `gitar fix` in a pull request comment).

Automatic fix application is disabled during the evaluation period to ensure:

- Review suggestions can be assessed independently of fix quality
- Fix accuracy and safety can be tested separately after review scores are locked
- Developers retain control over what changes are applied to their pull requests

After the evaluation period, this policy can be revised to allow automatic fix application for low-risk, high-confidence suggestions.
