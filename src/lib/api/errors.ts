export class ApiError extends Error {
  status: number;
  data: unknown;
  errorCode?: string;

  constructor(message: string, status: number, data?: unknown, errorCode?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.errorCode = errorCode;
  }
}
