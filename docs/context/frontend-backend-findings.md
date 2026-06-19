# Frontend Backend Findings

This file is the handoff surface for backend issues discovered while working on the frontend.

Backend behavior itself is documented in the backend repository. Do not duplicate backend architecture, domain maps, changelogs, or roadmap details here.

## Open Findings

| Finding | Source | Impact | Status |
|---|---|---|---|
| Frontend OpenAPI cache may lag backend OpenAPI. | Frontend docs audit | New backend fields cannot be consumed safely until the cache and generated types are synced. | Open |
| Public `/openapi.json` and `/docs` are unavailable from the public backend URL. | Frontend contract sync attempt | Frontend contract sync requires local/exported backend OpenAPI. | Open |

## Handoff Rules

- Record only backend bugs, contract gaps, or integration blockers detected from frontend work.
- Include reproduction context and impacted frontend route when possible.
- Once handed off, backend resolution should be tracked in backend docs or issues, not copied here.
- Once resolved, update this file with a short resolution note and remove stale implementation details.
