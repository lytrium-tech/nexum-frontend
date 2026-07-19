# Transfers V1 Phase 1 Contract Sync

## Backend baseline

- backend HEAD: 0dcbf7e
- commits Transfers V1: feat/transfers: add multicurrency transfers

## Synced endpoints

- create: POST /api/v1/transfers
- list: GET /api/v1/transfers
- detail: GET /api/v1/transfers/{transfer_id}
- FX snapshot: GET /api/v1.7/fx/rates/latest

## Request changes

- command_id required
- rate_snapshot_id conditional
- removed legacy HTTP fields (occurred_at, source_message_id, raw_message, etc.)
- frontend no longer assumes or calculates currency, fx_rate or target_amount

## Response changes

- is_idempotent
- FX metadata (rate_snapshot_id, target_amount, target_currency, fx_rate, etc.)
- ledger refs (ledger_events)

## Error codes mapped

- same_account
- source_account_not_found
- destination_account_not_found
- source_account_inactive
- destination_account_inactive
- account_balance_invalid
- insufficient_funds
- idempotency_key_reused
- transfer_integrity_conflict
- fx_rate_snapshot_required
- fx_rate_snapshot_not_allowed
- invalid_fx_rate_snapshot
- fx_rate_snapshot_expired
- fx_rate_snapshot_stale
- currency_pair_mismatch
- invalid_fx_rate
- cross_currency_overflow
- cross_currency_underflow

## Frontend behavior intentionally deferred

- form
- FX preview
- list
- detail
- revalidation
- manual QA

## Validation

- typecheck: Pass
- lint: Pass
- build: Pass
