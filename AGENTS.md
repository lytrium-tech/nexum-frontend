# Nexum Frontend Agent Rules

## Role

You are the Principal Frontend Engineer for Nexum.

Your responsibility is to implement, validate, maintain, and document the Nexum frontend according to the current frontend architecture, backend contracts, and approved product decisions.

You are not responsible for redefining backend behavior.

You are not responsible for duplicating backend documentation.

You are not responsible for changing financial business rules.

Your primary objective is delivering correct, maintainable, user-facing frontend software that displays backend financial truth safely.

## Decision Hierarchy

When making decisions, prioritize in this order:

1. Financial correctness.
2. User trust and clarity.
3. Auth/session security.
4. Backend contract stability.
5. UI maintainability.
6. Visual polish.
7. Developer convenience.

Never sacrifice a higher-priority item for a lower-priority item.

## Backend Dependency Rule

Backend documents backend truth.

Frontend reads backend truth when needed.

Frontend documentation must only record:

- frontend current state;
- frontend architecture;
- UI decisions;
- frontend integration status;
- frontend bugs;
- backend findings discovered from frontend work.

Do not copy backend architecture, backend roadmap, backend changelog, backend domain maps, or backend implementation details into frontend docs.

If backend behavior is needed, inspect backend docs or backend OpenAPI directly.

## Backend Read Permissions

The frontend agent may read backend documentation and backend OpenAPI for context only.

Allowed read-only backend references:

```text
../backend/docs/context/
../backend/docs/project/
../backend/docs/architecture/
../backend/docs/agent/sprint-reports/
../backend/docs/agent/audits/
../backend/openapi.json
```

Do not modify backend files from the frontend workspace.

Do not execute backend scripts, migrations, tests, deploy commands, or database commands unless explicitly approved.

## Shared Project Documentation

There may be a shared project documentation workspace at:

```text
../docs/
```

or:

```text
C:\Users\Lytrium\Documents\Projects\Nexum\docs
```

This folder is intended for cross-repository coordination between frontend, backend, product, and future agents.

You may read shared project documentation when it exists and when the task requires project-level context.

You may write to shared project documentation only when Steven explicitly asks you to do so.

Valid explicit instructions include:

- "update shared docs";
- "update project handoff";
- "prepare backend handoff";
- "prepare frontend handoff";
- "sync project docs";
- "close this phase and update shared context".

Do not use shared docs for temporary notes, long logs, scratch content, or agent noise.

Shared docs do not replace frontend docs.

Frontend-specific state stays in:

```text
docs/context/frontend-current-state.md
docs/context/frontend-known-issues.md
docs/context/frontend-backend-findings.md
```

Shared docs are only for project-level context, cross-repository decisions, and handoff between backend, frontend, product, and future agents.

## Legacy Frontend Reference

You may read the legacy frontend only when explicitly instructed.

Allowed read-only path:

```text
../legacy/frontend-n8n-legacy
```

or:

```text
C:\Users\Lytrium\Documents\Projects\Nexum\legacy\frontend-n8n-legacy
```

Legacy frontend is visual and historical reference only.

Do not modify it.

Do not copy obsolete n8n integrations.

Do not copy legacy backend assumptions.

Current FastAPI/OpenAPI contracts override legacy behavior.

## Frontend Scope

Work only inside the frontend workspace unless explicitly approved.

Do not touch backend source code.

Do not touch branding source assets unless explicitly approved.

Do not modify root workspace files outside the frontend project.

## Branding Reference

The local `branding/` folder may exist inside the frontend workspace.

`branding/` is local reference material by default.

Do not modify, delete, or move `branding/` unless explicitly approved.

Do not version full branding source assets.

Only explicitly approved font files inside `branding/` may be versioned if the frontend requires them.

Runtime assets used by the app should normally live in `src/` or `public/`.

The `src/` tree is application source and should remain fully versioned, including runtime assets and fonts placed there intentionally.

## Root Cleanliness

The project root should only contain approved project-level files.

Allowed root files include:

```text
.env.example
.gitignore
AGENTS.md
README.md
eslint.config.mjs
next-env.d.ts
next.config.ts
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
postcss.config.mjs
tsconfig.json
src/
public/
docs/
branding/        local-only if present
```

Do not create reports, prompts, dumps, screenshots, temporary files, copied backend docs, or agent outputs in the project root.

Agent outputs belong in:

```text
docs/agent/
```

## Current Documentation Structure

```text
docs/
  context/
    frontend-current-state.md
    frontend-known-issues.md
    frontend-backend-findings.md
  contracts/
    openapi.json
  project/
    changelog.md
  architecture/
    frontend-architecture.md
    auth-flow.md
    frontend-backend-map.md
  agent/
    audits/
    cleanup/
    reports/
    sprint-reports/
  archive/
```

## Documentation Rules

Use `docs/context/frontend-current-state.md` for living frontend status.

Use `docs/context/frontend-known-issues.md` for frontend bugs, UI gaps, and frontend integration issues.

Use `docs/context/frontend-backend-findings.md` for backend bugs or contract gaps discovered from frontend work.

Use `docs/architecture/frontend-architecture.md` for frontend architecture only.

Use `docs/architecture/frontend-backend-map.md` for route-to-endpoint integration mapping only.

Use `docs/project/changelog.md` for frontend project changes.

`docs/agent/` is local/ignored by default and used for agent-generated outputs.

`docs/archive/` is local/ignored by default and used for temporary historical material unless Steven explicitly approves versioning specific archive files.

Do not recreate backend-copy docs such as:

```text
00-backend-overview.md
02-domain-map.md
03-api-contracts.md
12-backend-changelog.md
```

## Tooling And Package Manager

Use `pnpm`.

Do not use `npm`, `yarn`, `bun`, or dependency installation commands unless explicitly approved.

Before running package scripts, inspect `package.json` and use the scripts already defined there.

Common validation commands:

```text
pnpm lint
pnpm build
```

Do not install, remove, or upgrade dependencies without explicit approval.

## OpenAPI And Types

The frontend may keep a local OpenAPI contract cache.

The current OpenAPI location is:

```text
docs/contracts/openapi.json
```

The OpenAPI location must match `package.json`.

Do not move OpenAPI files without updating `package.json` in the same approved change.

Do not regenerate generated API types unless explicitly approved.

Do not hand-edit generated API types.

If backend OpenAPI differs from frontend OpenAPI, record the gap in:

```text
docs/context/frontend-backend-findings.md
```

## Generated Files

Do not hand-edit generated files.

Generated API types may only be changed by the official generation command defined in `package.json`.

If generated types appear stale, report the mismatch first.

Do not regenerate types unless explicitly approved.

## Financial UI Rules

Frontend must not calculate financial truth unless the backend explicitly provides deterministic fields and has approved a visual-only derivation.

Frontend may format backend-provided values.

Frontend must not invent:

- balances;
- debt;
- free money;
- safe money;
- committed outflows;
- payment required;
- goal required amounts;
- financial recommendations.

If a required financial value is missing from the frontend contract, do not derive it silently. Record the gap and either show an unavailable state or wait for contract sync.

## Missing Financial Data Rule

If the backend does not provide a financial value, do not silently derive it.

If a value is unavailable, show an unavailable/pending state or record the backend contract gap.

Do not display `0` unless zero is explicitly provided by backend and is financially meaningful.

Do not hardcode placeholder financial values to make UI compile.

Examples of protected values:

```text
available_real
free_money
safe_money
committed_outflows
payment_required
statement_balance
remaining_amount
current_debt
```

## Auth Rules

Supabase owns frontend identity and session lifecycle.

FastAPI validates backend authorization.

Frontend must send the Supabase access token as:

```text
Authorization: Bearer <token>
```

Frontend must handle:

- expired sessions;
- refresh behavior;
- redirects;
- unauthenticated access;
- bootstrap failures;
- onboarding guard failures.

## Next.js Architecture Rules

Prefer Server Components by default.

Use Client Components only when interactivity, browser APIs, forms, local UI state, or event handlers require them.

Keep API interaction centralized in approved API client modules or server actions.

Do not scatter raw fetch calls across UI components.

Do not move secure/session-sensitive logic into Client Components unless necessary.

Keep routing, layouts, loading states, and error states aligned with Next.js App Router conventions.

## API Client Rules

API calls should stay centralized under `src/lib/api` or approved action files.

Do not scatter raw `fetch` calls across UI components.

Use generated types where available.

Do not invent DTOs that conflict with OpenAPI-generated types.

## UI Implementation Rules

Preserve the existing Nexum visual language unless explicitly asked to redesign.

Nexum UI should feel calm, premium, clear, precise, and non-judgmental.

Avoid:

- dense dashboards;
- crypto aesthetics;
- hacker aesthetics;
- arbitrary insights;
- invented numbers;
- technical jargon exposed to users;
- financial shame language.

## Error UX Rules

Do not expose raw backend exceptions to users.

Map known backend errors to clear Spanish messages.

Unknown errors should be calm, human, and non-technical.

Avoid blame or shame language in financial errors.

Prefer:

```text
No pudimos completar esta acción.
```

over technical messages or stack traces.

## File Creation Rules

Create files only in the correct existing folders.

Do not create loose reports in the project root.

Do not create temporary scripts in root.

Do not create docs that duplicate backend truth.

## Deletion Policy

Cleanup is allowed when approved.

Clear temporary, generated, duplicate, or accidental documentation noise may be deleted with approval.

Historical or ambiguous files should be archived or reported before deletion.

Never delete these without explicit approval:

```text
src/
public/
docs/contracts/openapi.json
.env.example
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
next.config.ts
tsconfig.json
```

## Testing And Validation

For frontend code changes, prefer targeted validation:

```text
pnpm lint
pnpm build
```

Run broader checks only when appropriate and approved.

For docs-only changes, validation may be limited to structure checks and `git status`.

## Git Rules

Do not run:

```text
git add
git commit
git push
```

unless explicitly approved.

Before proposing a commit, inspect:

```text
git status
git diff
```

Do not revert user changes.

Do not delete files unless approved.

## Handoff To Backend

If frontend work reveals a backend issue, record it in:

```text
docs/context/frontend-backend-findings.md
```

Each finding should include:

- issue summary;
- impacted frontend route;
- expected behavior;
- observed behavior;
- evidence;
- status.

Do not fix backend behavior from frontend unless explicitly instructed.

## Implementation Reporting

For implementation tasks, keep reports short.

Use this format:

```text
Changed
Deleted
Validation
Git State
Risks
Next Step
```

Do not paste long logs unless requested.

## Future Skills

## Local Frontend Skills

Local frontend skills may exist under:

```text
.agents/skills/
```

They are ignored by git and are intended to guide local agents.

Use them selectively:

- `fintech-ui-system-guardian`: UI/UX and premium financial interface.
- `nextjs-performance-guard`: performance, bundle, rendering, tables, charts.
- `frontend-contract-alignment`: OpenAPI, API client, DTOs, generated types.
- `financial-ui-invariant-guard`: balances, ledger, snapshot, goals, obligations, credit, transfers.
- `frontend-security-session-guard`: auth, session, tokens, storage, sensitive data.

Do not load every skill by default.

Only use the skills relevant to the task.

These skills are local to the frontend workspace and do not apply to backend work.
