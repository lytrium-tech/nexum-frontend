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

## Workspace Model

Nexum frontend now uses three distinct operational layers:

1. **Local frontend workspace**
   - Used for active development, tests, builds, runtime validation, and temporary uncommitted code changes.
   - Expected project path:

```text
C:\Users\Lytrium\Documents\Projects\Nexum\frontend
```

2. **Argos frontend documentation workspace**
   - Canonical location for all frontend documentation, audits, reports, handoffs, contracts, context, architecture, and agent-generated written outputs.
   - Mounted in Windows as:

```text
W:\Lytrium\Nexum\frontend\docs
```

3. **Git repository**
   - Used as the versioned backup and collaboration history for approved frontend code.
   - Code should only be committed and pushed after local validation and explicit approval.
   - Argos documentation is not automatically part of the frontend Git working tree.

The local frontend project is for code and runtime assets.

The Argos workspace is for documentation.

Do not mix these responsibilities.

## Canonical Documentation Policy

All new frontend documentation must be written directly to the Argos documentation workspace.

Canonical frontend documentation root:

```text
W:\Lytrium\Nexum\frontend\docs
```

Do not create new frontend documentation under the local project path.

Do not use the local repository as the permanent home for:

- audits;
- cleanup reports;
- debug reports;
- implementation reports;
- sprint reports;
- architecture documents;
- frontend context;
- OpenAPI contract documentation;
- frontend handoffs;
- project documentation;
- temporary agent notes;
- copied backend documentation.

Do not create a local fallback copy if the `W:` drive is unavailable.

If the Argos workspace cannot be reached:

1. Stop the documentation write.
2. Preserve code changes locally.
3. Report that the network documentation workspace is unavailable.
4. Wait for Steven to restore the mount or provide another approved destination.

Never silently write the document into the local project as a substitute.

## Argos Frontend Documentation Destinations

Use these exact destinations:

### Audits

```text
W:\Lytrium\Nexum\frontend\docs\agent\audits
```

### Cleanup reports

```text
W:\Lytrium\Nexum\frontend\docs\agent\cleanup
```

### Debug reports

```text
W:\Lytrium\Nexum\frontend\docs\agent\debug
```

### Reports

```text
W:\Lytrium\Nexum\frontend\docs\agent\reports
```

### Sprint reports

```text
W:\Lytrium\Nexum\frontend\docs\agent\sprint-reports
```

### Architecture

```text
W:\Lytrium\Nexum\frontend\docs\architecture
```

### Context

```text
W:\Lytrium\Nexum\frontend\docs\context
```

### Contracts

```text
W:\Lytrium\Nexum\frontend\docs\contracts
```

### Frontend handoffs

```text
W:\Lytrium\Nexum\frontend\docs\handoff\frontend
```

### Project documentation

```text
W:\Lytrium\Nexum\frontend\docs\project
```

Do not invent parallel documentation roots.

Do not write frontend documents into backend documentation directories.

## Network Workspace Availability

Before writing documentation, verify that the destination exists and is writable.

Recommended checks:

```powershell
Test-Path "W:\Lytrium\Nexum\frontend\docs"
Test-Path "W:\Lytrium\Nexum\frontend\docs\agent"
```

For a target directory, verify the exact path before creating a file.

Do not:

- remap the drive;
- modify SMB credentials;
- change Argos permissions;
- create a different network share;
- write to an inferred UNC path;
- write to another drive;
- repair the Homelab connection;

unless Steven explicitly authorizes it.

If a required frontend documentation subfolder is missing but the root workspace is available, report it before creating new top-level structure unless the task explicitly authorizes creating the missing approved subfolder.

## Documentation Write Safety

When updating an existing document on Argos:

1. Read the existing file first.
2. Preserve relevant content and history.
3. Make the smallest coherent update.
4. Avoid replacing the entire file unless the task requires a rewrite.
5. Verify the written file after saving.
6. Report the exact Argos path modified.

For important context, architecture, contract, and handoff files:

- avoid partial or corrupted writes;
- prefer writing a temporary file in the same approved Argos directory and replacing the destination safely when tooling permits;
- never create the temporary file in the local frontend project;
- remove approved temporary write artifacts after successful replacement.

Do not store secrets, tokens, credentials, database dumps, backups, or private customer data in frontend documentation.

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

If backend behavior is needed, inspect backend source, approved backend documentation, or backend OpenAPI directly.

## Backend Read Permissions

The frontend agent may read backend source, backend documentation, and backend OpenAPI for context only when the required location is available and the task requires it.

Do not infer or guess the backend documentation path on Argos.

Do not write to any backend documentation tree.

Do not modify backend files from the frontend workspace.

Do not execute backend scripts, migrations, tests, deploy commands, database commands, or production operations unless Steven explicitly approves them.

When frontend work discovers a backend issue, document the finding only in the approved frontend Argos context or handoff destination.

## Shared Project Documentation

Project-level frontend documentation belongs in:

```text
W:\Lytrium\Nexum\frontend\docs\project
```

Use it only for frontend-owned project context and approved cross-team handoffs.

Do not use frontend project documentation to duplicate backend truth.

Do not write to a shared or backend project tree unless Steven explicitly provides the exact destination and authorizes the write.

## Legacy Frontend Reference

You may read the legacy frontend only when explicitly instructed.

Allowed read-only paths may include:

```text
C:\Users\Lytrium\Documents\Projects\Nexum\legacy\frontend-n8n-legacy
```

Legacy frontend is visual and historical reference only.

Do not modify it.

Do not copy obsolete n8n integrations.

Do not copy legacy backend assumptions.

Current FastAPI/OpenAPI contracts override legacy behavior.

## Frontend Scope

Work only inside the frontend code workspace unless explicitly approved.

Approved local frontend workspace:

```text
C:\Users\Lytrium\Documents\Projects\Nexum\frontend
```

Approved external write scope:

```text
W:\Lytrium\Nexum\frontend\docs
```

Do not touch backend source code.

Do not touch backend documentation.

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

## Local Root Cleanliness

The local project root should contain only approved code, runtime assets, configuration, and essential repository files.

Allowed local root entries include:

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
branding/        local-only if present
```

The local `docs/` directory is no longer the canonical documentation workspace.

Do not create new documentation there.

Existing local documentation may remain temporarily during the migration period, but it is read-only unless Steven explicitly authorizes migration, cleanup, or deletion.

Do not create reports, prompts, dumps, screenshots, temporary scripts, copied backend docs, or agent outputs in the project root.

## Canonical Documentation Structure

The canonical frontend documentation structure on Argos is:

```text
W:\Lytrium\Nexum\frontend\docs\
  context\
  contracts\
  project\
  architecture\
  handoff\
    frontend\
  agent\
    audits\
    cleanup\
    debug\
    reports\
    sprint-reports\
```

Do not create a second canonical structure inside the local repository.

## Documentation Rules

Use the Argos context directory for living frontend state:

```text
W:\Lytrium\Nexum\frontend\docs\context
```

Recommended living files include:

```text
frontend-current-state.md
frontend-known-issues.md
frontend-backend-findings.md
```

Use the Argos architecture directory for frontend architecture:

```text
W:\Lytrium\Nexum\frontend\docs\architecture
```

Recommended files include:

```text
frontend-architecture.md
auth-flow.md
frontend-backend-map.md
```

Use the Argos contracts directory for frontend-owned contract artifacts:

```text
W:\Lytrium\Nexum\frontend\docs\contracts
```

Use the Argos project directory for frontend project documentation:

```text
W:\Lytrium\Nexum\frontend\docs\project
```

Use the Argos handoff directory for frontend handoffs:

```text
W:\Lytrium\Nexum\frontend\docs\handoff\frontend
```

Use the correct Argos agent folder for audits, cleanup, debugging, reports, and sprint reports.

Do not recreate backend-copy documents such as:

```text
00-backend-overview.md
02-domain-map.md
03-api-contracts.md
12-backend-changelog.md
```

## Documentation And Git

Argos documentation and frontend Git commits are separate workflows.

Do not run `git add`, `git commit`, or `git push` for a document written only to:

```text
W:\Lytrium\Nexum\frontend\docs
```

When a task includes both code and documentation:

1. Implement and validate code locally.
2. Write the required report or handoff directly to Argos.
3. Verify the Argos document.
4. Inspect the local Git diff.
5. Commit only approved local code and repository files.
6. Do not attempt to include the network document in the frontend Git commit.

In commit reports, list Argos documentation separately from committed files.

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

The canonical frontend OpenAPI contract artifact lives at:

```text
W:\Lytrium\Nexum\frontend\docs\contracts\openapi.json
```

Before using or updating it, confirm that the frontend generation workflow supports the network path.

Inspect `package.json` and the official type-generation command.

Do not change generation paths, scripts, or package configuration without explicit approval.

If the current generation command still requires a local contract file:

1. Report the incompatibility.
2. Do not create a permanent local documentation copy.
3. Request approval for a controlled build-input strategy.
4. Keep the Argos contract as the canonical source.

Do not regenerate generated API types unless explicitly approved.

Do not hand-edit generated API types.

If backend OpenAPI differs from the canonical frontend OpenAPI, record the gap in:

```text
W:\Lytrium\Nexum\frontend\docs\context\frontend-backend-findings.md
```

## Generated Files

Do not hand-edit generated files.

Generated API types may only be changed by the official generation command defined in `package.json`.

If generated types appear stale, report the mismatch first.

Do not regenerate types unless explicitly approved.

Generated source files that are required by the application remain in the local code workspace and may be versioned when approved.

Documentation about generated files belongs on Argos.

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

Create local files only when they are application code, runtime assets, tests, configuration, generated source required by the app, or explicitly approved repository files.

Create documentation only in the approved Argos frontend documentation destination.

Do not create loose reports in the local project root.

Do not create temporary scripts in the local project root.

Do not create local docs that duplicate backend truth.

Do not write to the backend documentation tree.

## Deletion Policy

Cleanup is allowed when approved.

Clear temporary, generated, duplicate, or accidental documentation noise may be deleted with approval.

Historical or ambiguous files should be migrated, archived, or reported before deletion.

Never delete these local project files without explicit approval:

```text
src/
public/
.env.example
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
next.config.ts
tsconfig.json
AGENTS.md
```

Never delete or overwrite Argos documentation in bulk without:

1. an inventory;
2. a migration or cleanup plan;
3. Steven's approval;
4. a verification step.

## Testing And Validation

For frontend code changes, prefer targeted validation:

```text
pnpm lint
pnpm build
```

Run broader checks only when appropriate and approved.

For Argos documentation-only changes, validation should include:

- target path exists;
- file was written successfully;
- file can be read back;
- no local Git files changed unintentionally.

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

Do not stage or commit network documentation.

## Handoff To Backend

If frontend work reveals a backend issue, record it in:

```text
W:\Lytrium\Nexum\frontend\docs\context\frontend-backend-findings.md
```

Each finding should include:

- issue summary;
- impacted frontend route;
- expected behavior;
- observed behavior;
- evidence;
- status.

Do not write the finding into backend documentation.

Do not fix backend behavior from frontend unless explicitly instructed.

## Implementation Reporting

For implementation tasks, keep the response concise.

Use this format:

```text
Changed
Argos Documentation
Validation
Git State
Risks
Next Step
```

For `Argos Documentation`, report:

- exact file path;
- created or updated;
- verification status.

Do not paste long logs unless requested.

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
