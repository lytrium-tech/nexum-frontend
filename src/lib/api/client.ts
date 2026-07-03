import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { ApiError } from './errors';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function getSessionToken(isServer: boolean): Promise<string | undefined> {
  try {
    if (isServer) {
      const supabase = await createServerClient();
      const { data } = await supabase.auth.getSession();
      return data?.session?.access_token;
    } else {
      const supabase = createBrowserClient();
      const { data } = await supabase.auth.getSession();
      return data?.session?.access_token;
    }
  } catch (error) {
    console.error('Failed to get session token:', error);
    return undefined;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
  isServer = false
): Promise<T> {
  const token = await getSessionToken(isServer);

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${API_BASE_URL}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      cache: 'no-store', // Disable Next.js aggressive caching for backend API
      ...options,
      headers,
    });
  } catch (error) {
    throw new ApiError('Error de red: No se pudo conectar al servidor', 0, { error });
  }

  if (!response.ok) {
    let errorData = null;
    try {
      errorData = await response.json();
    } catch {
      // Ignore if not JSON
    }

    const status = response.status;
    let message = 'Ocurrió un error inesperado';

    if (status === 401) message = 'No autorizado';
    else if (status === 403) message = 'Acceso denegado';
    else if (status === 404) message = 'Recurso no encontrado';
    else if (status === 422) message = 'Error de validación';
    else if (status === 429) message = 'Demasiadas peticiones';
    else if (status >= 500) message = 'Error interno del servidor';

    let errorCode: string | undefined;

    if (errorData) {
      if (typeof errorData.error_code === 'string' && errorData.error_code) {
        errorCode = errorData.error_code;
      }

      if (typeof errorData.message === 'string' && errorData.message.trim() !== '') {
        message = errorData.message;
      } else if (errorData.detail && typeof errorData.detail.message === 'string' && errorData.detail.message.trim() !== '') {
        message = errorData.detail.message;
      } else if (typeof errorData.detail === 'string' && errorData.detail.trim() !== '') {
        message = errorData.detail;
      } else if (typeof errorData.error === 'string' && errorData.error.trim() !== '') {
        message = errorData.error;
      } else if (errorData.detail && typeof errorData.detail === 'object' && Object.keys(errorData.detail).length > 0) {
        message = JSON.stringify(errorData.detail);
      }
    }

    throw new ApiError(message, status, errorData, errorCode);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
