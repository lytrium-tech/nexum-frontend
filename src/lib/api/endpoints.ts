import { apiClient } from './client';
import type { components } from './types.generated';

type UserOnboardingRequest = components['schemas']['UserOnboardingRequest'];
type UserOnboardingResponse = components['schemas']['UserOnboardingResponse'];
type UserRead = components['schemas']['UserRead'];
type AccountRead = components['schemas']['AccountRead'];
type AccountCreate = components['schemas']['AccountCreate'];
type CategoryRead = components['schemas']['CategoryRead'];
type CategoryCreate = components['schemas']['CategoryCreate'];
type IntelligenceSnapshotRead = components['schemas']['IntelligenceSnapshotRead'];
type CashIncomeCreate = components['schemas']['CashIncomeCreate'];
type CashExpenseCreate = components['schemas']['CashExpenseCreate'];
type CashOperationResult = components['schemas']['CashOperationResult'];
type GoalRead = components['schemas']['GoalRead'];
type GoalCreate = components['schemas']['GoalCreate'];
type GoalUpdate = components['schemas']['GoalUpdate'];
type GoalContributionCreate = components['schemas']['GoalContributionCreate'];
type GoalContributionResult = components['schemas']['GoalContributionResult'];

export const api = {
  cash: {
    createIncome: (data: CashIncomeCreate, idempotencyKey: string, isServer = false) =>
      apiClient<CashOperationResult>('/api/v1/cash/income', {
        method: 'POST',
        headers: {
          'idempotency-key': idempotencyKey,
        },
        body: JSON.stringify(data),
      }, isServer),
    createExpense: (data: CashExpenseCreate, idempotencyKey: string, isServer = false) =>
      apiClient<CashOperationResult>('/api/v1/cash/expense', {
        method: 'POST',
        headers: {
          'idempotency-key': idempotencyKey,
        },
        body: JSON.stringify(data),
      }, isServer),
  },
  users: {
    me: (isServer = false) => 
      apiClient<UserRead>('/api/v1/users/me', { method: 'GET' }, isServer),
    bootstrap: (data: UserOnboardingRequest, isServer = false) =>
      apiClient<UserOnboardingResponse>('/api/v1/users/me/bootstrap', {
        method: 'POST',
        body: JSON.stringify(data),
      }, isServer),
  },
  accounts: {
    list: (isServer = false) => 
      apiClient<AccountRead[]>('/api/v1/accounts', { method: 'GET' }, isServer),
    summary: (isServer = false) =>
      apiClient<components['schemas']['AccountSummary']>('/api/v1/accounts/summary', { method: 'GET' }, isServer),
    get: (id: string, isServer = false) =>
      apiClient<AccountRead>(`/api/v1/accounts/${id}`, { method: 'GET' }, isServer),
    create: (data: AccountCreate, isServer = false) =>
      apiClient<AccountRead>('/api/v1/accounts', {
        method: 'POST',
        body: JSON.stringify(data),
      }, isServer),
    update: (id: string, data: components['schemas']['AccountUpdate'], isServer = false) =>
      apiClient<AccountRead>(`/api/v1/accounts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }, isServer),
    delete: (id: string, isServer = false) =>
      apiClient<unknown>(`/api/v1/accounts/${id}`, { method: 'DELETE' }, isServer),
  },
  categories: {
    list: (isServer = false) => 
      apiClient<CategoryRead[]>('/api/v1/categories', { method: 'GET' }, isServer),
    create: (data: CategoryCreate, isServer = false) =>
      apiClient<CategoryRead>('/api/v1/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }, isServer),
    update: (id: string, data: components['schemas']['CategoryUpdate'], isServer = false) =>
      apiClient<CategoryRead>(`/api/v1/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }, isServer),
    delete: (id: string, isServer = false) =>
      apiClient<void>(`/api/v1/categories/${id}`, { method: 'DELETE' }, isServer),
  },
  goals: {
    list: (isServer = false) =>
      apiClient<GoalRead[]>('/api/v1/goals', { method: 'GET' }, isServer),
    create: (data: GoalCreate, isServer = false) =>
      apiClient<GoalRead>('/api/v1/goals', {
        method: 'POST',
        body: JSON.stringify(data),
      }, isServer),
    update: (id: string, data: GoalUpdate, isServer = false) =>
      apiClient<GoalRead>(`/api/v1/goals/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }, isServer),
    contribute: (id: string, data: GoalContributionCreate, idempotencyKey: string, isServer = false) =>
      apiClient<GoalContributionResult>(`/api/v1/goals/${id}/contributions`, {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(data),
      }, isServer),
  },
  intelligence: {
    snapshot: (isServer = false) => 
      apiClient<IntelligenceSnapshotRead>('/api/v1/intelligence/snapshot', { method: 'GET' }, isServer),
    balance: (isServer = false) => 
      apiClient<unknown>('/api/v1/intelligence/balance', { method: 'GET' }, isServer),
    freeMoney: (isServer = false) => 
      apiClient<unknown>('/api/v1/intelligence/free-money', { method: 'GET' }, isServer),
    cashflow: (isServer = false) => 
      apiClient<unknown>('/api/v1/intelligence/cashflow', { method: 'GET' }, isServer),
    goals: (isServer = false) => 
      apiClient<unknown>('/api/v1/intelligence/goals', { method: 'GET' }, isServer),
    obligations: (isServer = false) => 
      apiClient<unknown>('/api/v1/intelligence/obligations', { method: 'GET' }, isServer),
    creditCards: (isServer = false) => 
      apiClient<unknown>('/api/v1/intelligence/credit-cards', { method: 'GET' }, isServer),
  },
  ledger: {
    events: (params?: Record<string, string | number | boolean>, isServer = false) => {
      const qsObj: Record<string, string> = {};
      if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null) qsObj[k] = String(v); });
      const qs = Object.keys(qsObj).length > 0 ? '?' + new URLSearchParams(qsObj).toString() : '';
      return apiClient<components['schemas']['LedgerEventsResponse']>(`/api/v1/ledger/events${qs}`, { method: 'GET' }, isServer);
    },
    summary: (params?: Record<string, string | number | boolean>, isServer = false) => {
      const qsObj: Record<string, string> = {};
      if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null) qsObj[k] = String(v); });
      const qs = Object.keys(qsObj).length > 0 ? '?' + new URLSearchParams(qsObj).toString() : '';
      return apiClient<components['schemas']['LedgerSummaryResponse']>(`/api/v1/ledger/summary${qs}`, { method: 'GET' }, isServer);
    },
    timeline: (params?: Record<string, string | number | boolean>, isServer = false) => {
      const qsObj: Record<string, string> = {};
      if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null) qsObj[k] = String(v); });
      const qs = Object.keys(qsObj).length > 0 ? '?' + new URLSearchParams(qsObj).toString() : '';
      return apiClient<components['schemas']['LedgerTimelineResponse']>(`/api/v1/ledger/timeline${qs}`, { method: 'GET' }, isServer);
    }
  },
  conversations: {
    message: (data: { message: string; channel?: string; external_message_id?: string | null }, isServer = false) =>
      apiClient<{
        response_text: string;
        intent?: string;
        status: 'completed' | 'awaiting_clarification' | 'awaiting_confirmation' | 'cancelled' | 'error';
        trace_id?: string;
        pending_action_id?: string | null;
        structured_data?: unknown;
      }>('/api/v1/conversations/message', {
        method: 'POST',
        body: JSON.stringify(data),
      }, isServer),
  }
};
