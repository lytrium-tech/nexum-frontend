# Transfers V1 Phase 3 — Cross Currency

## Scope

- COP → USD
- USD → COP
- FX snapshot
- expiry
- refresh
- definitive backend result

## Invariants

- backend calculates final target amount
- frontend never calls external FX provider
- snapshot id required
- command id stable

## QA

- both currency directions
- expiration
- retries
- revalidation
- no duplicates

## Deferred

- full transfer detail
- advanced pagination
- final module closure
