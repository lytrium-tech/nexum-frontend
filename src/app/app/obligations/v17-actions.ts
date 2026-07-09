'use server';

import { api } from '@/lib/api/endpoints';
import { components } from '@/lib/api/types.generated';
import { handleFinancialError } from '@/lib/api/errors';
import { isObligationsV17Enabled } from '@/lib/features';
import { ApiError } from '@/lib/api/errors';

/**
 * Helper to ensure the feature is enabled before executing V1.7 actions.
 * If disabled, returns a controlled error structure instead of crashing.
 */
function checkV17FeatureFlag() {
  if (!isObligationsV17Enabled()) {
    throw new Error('FEATURE_DISABLED_403');
  }
}

/**
 * Specialized error handler for V1.7 actions to catch standard api errors,
 * feature flag rejections, and unauthorized sessions.
 */
function handleV17Error(err: unknown, defaultMessage: string) {
  if (err instanceof Error && err.message === 'FEATURE_DISABLED_403') {
    return 'Obligaciones V1.7 no está habilitado todavía.';
  }

  if (err instanceof ApiError) {
    if (err.status === 401) {
      return 'Tu sesión expiró. Vuelve a iniciar sesión.';
    }
    if (err.status === 403) {
      return 'Obligaciones V1.7 no está habilitado todavía.';
    }
  }

  return handleFinancialError(err, defaultMessage);
}

export async function getObligationsSummaryV17Action(month?: string) {
  try {
    checkV17FeatureFlag();
    const result = await api.obligationsV17.summary(month, true);
    return { success: true, result };
  } catch (err: unknown) {
    console.error('V1.7 get summary error:', err);
    return { success: false, error: handleV17Error(err, 'No pudimos cargar el resumen de obligaciones.') };
  }
}

export async function getObligationsIntelligenceContextV17Action(month?: string) {
  try {
    checkV17FeatureFlag();
    const result = await api.obligationsV17.intelligenceContext(month, true);
    return { success: true, result };
  } catch (err: unknown) {
    console.error('V1.7 get intelligence context error:', err);
    return { success: false, error: handleV17Error(err, 'No pudimos cargar el contexto de inteligencia.') };
  }
}

export async function listObligationsV17Action() {
  try {
    checkV17FeatureFlag();
    const result = await api.obligationsV17.list(true);
    return { success: true, result };
  } catch (err: unknown) {
    console.error('V1.7 list obligations error:', err);
    return { success: false, error: handleV17Error(err, 'No pudimos cargar la lista de obligaciones.') };
  }
}

export async function createObligationV17Action(data: components['schemas']['ObligationV17CreateRequest']) {
  try {
    checkV17FeatureFlag();
    const result = await api.obligationsV17.create(data, true);
    // Not calling revalidatePath yet since V1.7 is not connected to UI
    return { success: true, result };
  } catch (err: unknown) {
    console.error('V1.7 create obligation error:', err);
    return { success: false, error: handleV17Error(err, 'Ocurrió un error al crear la obligación. Intenta nuevamente.') };
  }
}

export async function getObligationPeriodsV17Action(id: string) {
  try {
    checkV17FeatureFlag();
    const result = await api.obligationsV17.periods(id, true);
    return { success: true, result };
  } catch (err: unknown) {
    console.error('V1.7 get periods error:', err);
    return { success: false, error: handleV17Error(err, 'No encontramos los periodos de esta obligación.') };
  }
}

export async function updateObligationPeriodAmountV17Action(id: string, periodId: string, data: components['schemas']['ObligationPeriodAmountDefineRequest']) {
  try {
    checkV17FeatureFlag();
    const result = await api.obligationsV17.updatePeriodAmount(id, periodId, data, true);
    return { success: true, result };
  } catch (err: unknown) {
    console.error('V1.7 update period amount error:', err);
    return { success: false, error: handleV17Error(err, 'No pudimos definir el monto del periodo.') };
  }
}

export async function payObligationPeriodV17Action(id: string, periodId: string, data: components['schemas']['ObligationPeriodPaymentCreateRequest'], idempotencyKey: string) {
  try {
    checkV17FeatureFlag();
    const result = await api.obligationsV17.payPeriod(id, periodId, data, idempotencyKey, true);
    return { success: true, result };
  } catch (err: unknown) {
    console.error('V1.7 pay period error:', err);
    return { success: false, error: handleV17Error(err, 'Ocurrió un error al registrar el pago específico.') };
  }
}

export async function payObligationFifoV17Action(id: string, data: components['schemas']['ObligationFIFOPaymentCreateRequest'], idempotencyKey: string) {
  try {
    checkV17FeatureFlag();
    const result = await api.obligationsV17.payFifo(id, data, idempotencyKey, true);
    return { success: true, result };
  } catch (err: unknown) {
    console.error('V1.7 pay fifo error:', err);
    return { success: false, error: handleV17Error(err, 'Ocurrió un error al registrar el pago general.') };
  }
}

export async function skipObligationPeriodV17Action(id: string, periodId: string) {
  try {
    checkV17FeatureFlag();
    const result = await api.obligationsV17.skipPeriod(id, periodId, true);
    return { success: true, result };
  } catch (err: unknown) {
    console.error('V1.7 skip period error:', err);
    return { success: false, error: handleV17Error(err, 'Este periodo no permite ser saltado.') };
  }
}

export async function cancelObligationPeriodV17Action(id: string, periodId: string) {
  try {
    checkV17FeatureFlag();
    const result = await api.obligationsV17.cancelPeriod(id, periodId, true);
    return { success: true, result };
  } catch (err: unknown) {
    console.error('V1.7 cancel period error:', err);
    return { success: false, error: handleV17Error(err, 'Este periodo no permite ser cancelado.') };
  }
}

export async function refreshOverduePeriodsV17Action(id: string) {
  try {
    checkV17FeatureFlag();
    const result = await api.obligationsV17.refreshOverdue(id, true);
    return { success: true, result };
  } catch (err: unknown) {
    console.error('V1.7 refresh overdue error:', err);
    return { success: false, error: handleV17Error(err, 'No pudimos procesar esta operación en este momento.') };
  }
}

export async function getObligationPaymentV17Action(paymentId: string) {
  try {
    checkV17FeatureFlag();
    const result = await api.obligationsV17.getPayment(paymentId, true);
    return { success: true, result };
  } catch (err: unknown) {
    console.error('V1.7 get payment error:', err);
    return { success: false, error: handleV17Error(err, 'No encontramos este pago.') };
  }
}

export async function previewObligationPeriodV17Action(id: string, periodId: string, data: components['schemas']['ObligationPaymentPreviewV17Request']) {
  try {
    checkV17FeatureFlag();
    const result = await api.obligationsV17.previewPeriod(id, periodId, data, true);
    return { success: true, result };
  } catch (err: unknown) {
    console.error('V1.7 preview period error:', err);
    return { success: false, error: handleV17Error(err, 'No pudimos calcular la conversión en este momento.') };
  }
}

export async function getAccountsV17Action() {
  try {
    checkV17FeatureFlag();
    const result = await api.accounts.list(true, { include_archived: true });
    return { success: true, result };
  } catch (err: unknown) {
    console.error('V1.7 get accounts error:', err);
    return { success: false, error: handleV17Error(err, 'No pudimos cargar las cuentas.') };
  }
}
