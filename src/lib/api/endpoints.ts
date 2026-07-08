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
type ObligationRead = components['schemas']['ObligationRead'];
type ObligationCreate = components['schemas']['ObligationCreate'];
// type ObligationUpdate = components['schemas']['ObligationUpdate'];
type ObligationPaymentCreate = components['schemas']['ObligationPaymentCreate'];
type ObligationPaymentResult = components['schemas']['ObligationPaymentRead'];
type ObligationPeriodRead = components['schemas']['ObligationPeriodRead'];
type ObligationPeriodAmountUpdate = components['schemas']['ObligationPeriodAmountUpdate'];
type CreditCardRead = components['schemas']['CreditCardRead'];
type CreditCardCreate = components['schemas']['CreditCardCreate'];
type CreditCardPurchaseCreate = components['schemas']['CreditCardPurchaseCreate'];
type CreditCardPurchaseResult = components['schemas']['CreditCardPurchaseResult'];
type CreditCardPaymentCreate = components['schemas']['CreditCardPaymentCreate'];
type CreditCardPaymentResult = components['schemas']['CreditCardPaymentResult'];
type TransferCreate = components['schemas']['TransferCreate'];
type TransferResult = components['schemas']['TransferResult'];

// V1.7 Obligations Types
type ObligationV17Response = components['schemas']['ObligationV17Response'];
type ObligationV17CreateRequest = components['schemas']['ObligationV17CreateRequest'];
type ObligationsV17SummaryResponse = components['schemas']['ObligationsV17SummaryResponse'];
type ObligationsV17IntelligenceContextResponse = components['schemas']['ObligationsV17IntelligenceContextResponse'];
type ObligationPeriodV17Response = components['schemas']['ObligationPeriodV17Response'];
type ObligationPaymentV17Response = components['schemas']['ObligationPaymentV17Response'];
type ObligationPeriodAmountDefineRequest = components['schemas']['ObligationPeriodAmountDefineRequest'];
type ObligationPeriodPaymentCreateRequest = components['schemas']['ObligationPeriodPaymentCreateRequest'];
type ObligationPeriodPaymentResultResponse = components['schemas']['ObligationPeriodPaymentResultResponse'];
type ObligationFIFOPaymentCreateRequest = components['schemas']['ObligationFIFOPaymentCreateRequest'];
type ObligationFIFOPaymentResultResponse = components['schemas']['ObligationFIFOPaymentResultResponse'];
type ObligationPeriodRefreshOverdueResponse = components['schemas']['ObligationPeriodRefreshOverdueResponse'];

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
    list: (isServer = false, params?: { include_archived?: boolean }) => {
      const qs = params?.include_archived ? '?include_archived=true' : '';
      return apiClient<AccountRead[]>(`/api/v1/accounts${qs}`, { method: 'GET' }, isServer);
    },
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
    createBalanceAdjustment: (id: string, data: components['schemas']['BalanceAdjustmentCreate'], isServer = false) =>
      apiClient<AccountRead>(`/api/v1/accounts/${id}/balance-adjustments`, {
        method: 'POST',
        body: JSON.stringify(data),
      }, isServer),
  },
  categories: {
    list: (params?: { include_inactive?: boolean }, isServer = false) => {
      const qs = params?.include_inactive ? '?include_inactive=true' : '';
      return apiClient<CategoryRead[]>(`/api/v1/categories${qs}`, { method: 'GET' }, isServer);
    },
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
  obligations: {
    list: (isServer = false, params?: { include_archived?: boolean }) => {
      const qs = params?.include_archived ? '?include_archived=true' : '';
      return apiClient<ObligationRead[]>(`/api/v1/obligations${qs}`, { method: 'GET' }, isServer);
    },
    create: (data: ObligationCreate, isServer = false) =>
      apiClient<ObligationRead>('/api/v1/obligations', {
        method: 'POST',
        body: JSON.stringify(data),
      }, isServer),
    // update: (id: string, data: ObligationUpdate, isServer = false) =>
    //   apiClient<ObligationRead>(`/api/v1/obligations/${id}`, {
    //     method: 'PATCH',
    //     body: JSON.stringify(data),
    //   }, isServer),
      pay: (id: string, data: ObligationPaymentCreate, idempotencyKey: string, isServer = false) =>
        apiClient<ObligationPaymentResult>(`/api/v1/obligations/${id}/pay`, {
          method: 'POST',
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify(data),
        }, isServer),
      periods: (id: string, isServer = false) =>
        apiClient<ObligationPeriodRead[]>(`/api/v1/obligations/${id}/periods`, { method: 'GET' }, isServer),
      syncPeriods: (id: string, isServer = false) =>
        apiClient<ObligationPeriodRead[]>(`/api/v1/obligations/${id}/sync-periods`, { method: 'POST' }, isServer),
      updatePeriodAmount: (periodId: string, data: ObligationPeriodAmountUpdate, isServer = false) =>
        apiClient<ObligationPeriodRead>(`/api/v1/obligations/periods/${periodId}/amount`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        }, isServer),
      payPeriod: (periodId: string, data: ObligationPaymentCreate, idempotencyKey: string, isServer = false) =>
        apiClient<ObligationPaymentResult>(`/api/v1/obligations/periods/${periodId}/pay`, {
          method: 'POST',
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify(data),
        }, isServer),
      skipPeriod: (periodId: string, isServer = false) =>
        apiClient<ObligationPeriodRead>(`/api/v1/obligations/periods/${periodId}/skip`, { method: 'POST' }, isServer),
      payPeriodPreview: (periodId: string, data: components['schemas']['ObligationPaymentPreviewCreate'], isServer = false) =>
        apiClient<components['schemas']['ObligationPaymentPreviewRead']>(`/api/v1/obligations/periods/${periodId}/pay/preview`, {
          method: 'POST',
          body: JSON.stringify(data),
        }, isServer),
    },
    obligationsV17: {
      list: (isServer = false) =>
        apiClient<ObligationV17Response[]>('/api/v1.7/obligations', { method: 'GET' }, isServer),
      create: (data: ObligationV17CreateRequest, isServer = false) =>
        apiClient<ObligationV17Response>('/api/v1.7/obligations', {
          method: 'POST',
          body: JSON.stringify(data),
        }, isServer),
      summary: (month?: string, isServer = false) => {
        const qs = month ? `?month=${month}` : '';
        return apiClient<ObligationsV17SummaryResponse>(`/api/v1.7/obligations/summary${qs}`, { method: 'GET' }, isServer);
      },
      intelligenceContext: (month?: string, isServer = false) => {
        const qs = month ? `?month=${month}` : '';
        return apiClient<ObligationsV17IntelligenceContextResponse>(`/api/v1.7/obligations/intelligence-context${qs}`, { method: 'GET' }, isServer);
      },
      get: (id: string, isServer = false) =>
        apiClient<ObligationV17Response>(`/api/v1.7/obligations/${id}`, { method: 'GET' }, isServer),
      periods: (id: string, isServer = false) =>
        apiClient<ObligationPeriodV17Response[]>(`/api/v1.7/obligations/${id}/periods`, { method: 'GET' }, isServer),
      updatePeriodAmount: (id: string, periodId: string, data: ObligationPeriodAmountDefineRequest, isServer = false) =>
        apiClient<ObligationPeriodV17Response>(`/api/v1.7/obligations/${id}/periods/${periodId}/amount`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        }, isServer),
      payPeriod: (id: string, periodId: string, data: ObligationPeriodPaymentCreateRequest, idempotencyKey: string, isServer = false) =>
        apiClient<ObligationPeriodPaymentResultResponse>(`/api/v1.7/obligations/${id}/periods/${periodId}/payments`, {
          method: 'POST',
          headers: { 'Idempotency-Key': idempotencyKey },
          body: JSON.stringify(data),
        }, isServer),
      payFifo: (id: string, data: ObligationFIFOPaymentCreateRequest, idempotencyKey: string, isServer = false) =>
        apiClient<ObligationFIFOPaymentResultResponse>(`/api/v1.7/obligations/${id}/payments`, {
          method: 'POST',
          headers: { 'Idempotency-Key': idempotencyKey },
          body: JSON.stringify(data),
        }, isServer),
      skipPeriod: (id: string, periodId: string, isServer = false) =>
        apiClient<ObligationPeriodV17Response>(`/api/v1.7/obligations/${id}/periods/${periodId}/skip`, { method: 'POST' }, isServer),
      cancelPeriod: (id: string, periodId: string, isServer = false) =>
        apiClient<ObligationPeriodV17Response>(`/api/v1.7/obligations/${id}/periods/${periodId}/cancel`, { method: 'POST' }, isServer),
      refreshOverdue: (id: string, isServer = false) =>
        apiClient<ObligationPeriodRefreshOverdueResponse>(`/api/v1.7/obligations/${id}/periods/refresh-overdue`, { method: 'POST' }, isServer),
      getPayment: (paymentId: string, isServer = false) =>
        apiClient<ObligationPaymentV17Response>(`/api/v1.7/obligations/payments/${paymentId}`, { method: 'GET' }, isServer),
    },
    transfers: {
      list: (isServer = false) =>
        apiClient<TransferResult[]>('/api/v1/transfers', { method: 'GET' }, isServer),
      create: (data: TransferCreate, idempotencyKey: string, isServer = false) =>
        apiClient<TransferResult>('/api/v1/transfers', {
          method: 'POST',
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify(data),
        }, isServer),
      get: (id: string, isServer = false) =>
        apiClient<TransferResult>(`/api/v1/transfers/${id}`, { method: 'GET' }, isServer),
    },
    credit: {
    cards: {
      list: (isServer = false) =>
        apiClient<CreditCardRead[]>('/api/v1/credit/cards', { method: 'GET' }, isServer),
      create: (data: CreditCardCreate, isServer = false) =>
        apiClient<CreditCardRead>('/api/v1/credit/cards', {
          method: 'POST',
          body: JSON.stringify(data),
        }, isServer),
      get: (id: string, isServer = false) =>
        apiClient<CreditCardRead>(`/api/v1/credit/cards/${id}`, { method: 'GET' }, isServer),
      status: (id: string, isServer = false) =>
        apiClient<components['schemas']['CreditCardStatusRead']>(`/api/v1/credit/cards/${id}/status`, { method: 'GET' }, isServer),
      installments: (id: string, isServer = false) =>
        apiClient<components['schemas']['CreditCardInstallmentRead'][]>(`/api/v1/credit/cards/${id}/installments`, { method: 'GET' }, isServer),
      statements: (id: string, isServer = false) =>
        apiClient<components['schemas']['CreditCardStatementRead'][]>(`/api/v1/credit/cards/${id}/statements`, { method: 'GET' }, isServer),
      statement: (id: string, period: string, isServer = false) =>
        apiClient<components['schemas']['CreditCardStatementRead']>(`/api/v1/credit/cards/${id}/statements/${period}`, { method: 'GET' }, isServer),
    },
    summary: (isServer = false) =>
      apiClient<components['schemas']['CreditSummaryRead']>('/api/v1/credit/summary', { method: 'GET' }, isServer),
    purchases: {
      create: (cardId: string, data: CreditCardPurchaseCreate, idempotencyKey: string, isServer = false) =>
        apiClient<CreditCardPurchaseResult>(`/api/v1/credit/cards/${cardId}/purchases`, {
          method: 'POST',
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify(data),
        }, isServer),
      payEarly: (cardId: string, purchaseId: string, data: components['schemas']['CreditCardEarlyPaymentCreate'], idempotencyKey: string, isServer = false) =>
        apiClient<components['schemas']['CreditCardEarlyPaymentResult']>(`/api/v1/credit/cards/${cardId}/purchases/${purchaseId}/pay_early`, {
          method: 'POST',
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify(data),
        }, isServer),
      payEarlyPreview: (cardId: string, purchaseId: string, data: components['schemas']['CreditCardEarlyPaymentPreviewCreate'], isServer = false) =>
        apiClient<components['schemas']['PaymentPreviewResult']>(`/api/v1/credit/cards/${cardId}/purchases/${purchaseId}/pay_early/preview`, {
          method: 'POST',
          body: JSON.stringify(data),
        }, isServer),
    },
    payments: {
      create: (cardId: string, data: CreditCardPaymentCreate, idempotencyKey: string, isServer = false) =>
        apiClient<CreditCardPaymentResult>(`/api/v1/credit/cards/${cardId}/payments`, {
          method: 'POST',
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify(data),
        }, isServer),
    },
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
    message: (data: { message: string; channel?: string; external_message_id?: string | null; pending_action_id?: string | null }, isServer = false) =>
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
