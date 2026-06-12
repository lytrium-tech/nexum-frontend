import { apiClient } from './client';
import type { components } from './types.generated';

type UserOnboardingRequest = components['schemas']['UserOnboardingRequest'];
type UserOnboardingResponse = components['schemas']['UserOnboardingResponse'];
type UserRead = components['schemas']['UserRead'];
type AccountRead = components['schemas']['AccountRead'];
type AccountCreate = components['schemas']['AccountCreate'];
type CategoryRead = components['schemas']['CategoryRead'];
type CategoryCreate = components['schemas']['CategoryCreate'];

export const api = {
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
    create: (data: AccountCreate, isServer = false) =>
      apiClient<AccountRead>('/api/v1/accounts', {
        method: 'POST',
        body: JSON.stringify(data),
      }, isServer),
  },
  categories: {
    list: (isServer = false) => 
      apiClient<CategoryRead[]>('/api/v1/categories', { method: 'GET' }, isServer),
    create: (data: CategoryCreate, isServer = false) =>
      apiClient<CategoryRead>('/api/v1/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }, isServer),
  },
  intelligence: {
    snapshot: (isServer = false) => 
      apiClient<unknown>('/api/v1/intelligence/snapshot', { method: 'GET' }, isServer),
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
  }
};
