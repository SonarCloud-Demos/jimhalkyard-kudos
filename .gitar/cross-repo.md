# Cross-repository analysis

When cross-repository analysis is available, describe the relationships in natural language below.

## Repositories that depend on this one

`[[ORG]]/[[FRONTEND_REPO]]` and `[[ORG]]/[[MOBILE_REPO]]` call the APIs this repository publishes. `[[ORG]]/[[CLIENT_SDK_REPO]]` wraps this service's endpoints.

## Data consumers

`[[ORG]]/[[DATA_JOBS_REPO]]` reads the database tables this repository owns. `[[ORG]]/[[ANALYTICS_REPO]]` consumes events this service publishes.

## Repositories to exclude

Ignore `[[ORG]]/[[ARCHIVED_REPO]]` (archived), third-party open-source libraries and vendored or generated code.
