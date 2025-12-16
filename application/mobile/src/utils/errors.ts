/**
 * Structured error handling for the mobile app.
 * Provides typed errors and user-friendly messages for common API failures.
 */

// Error types for different failure scenarios
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

// Structured error class with type, code, and user message
export class AppError extends Error {
  type: ErrorType;
  code: number | null;
  userMessage: string;
  originalError?: unknown;

  constructor(
    type: ErrorType,
    message: string,
    userMessage: string,
    code: number | null = null,
    originalError?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.code = code;
    this.userMessage = userMessage;
    this.originalError = originalError;
  }
}

// User-friendly error messages for common scenarios
const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.NETWORK]: 'Unable to connect. Please check your internet connection.',
  [ErrorType.AUTH]: 'Your session has expired. Please log in again.',
  [ErrorType.VALIDATION]: 'Please check your input and try again.',
  [ErrorType.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorType.SERVER]: 'Something went wrong on our end. Please try again later.',
  [ErrorType.TIMEOUT]: 'The request took too long. Please try again.',
  [ErrorType.UNKNOWN]: 'An unexpected error occurred. Please try again.',
};

// HTTP status code specific messages
const STATUS_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input.',
  401: 'Please log in to continue.',
  403: 'You don\'t have permission to perform this action.',
  404: 'The requested item was not found.',
  409: 'This action conflicts with existing data.',
  422: 'The provided data is invalid.',
  429: 'Too many requests. Please wait a moment.',
  500: 'Server error. Please try again later.',
  502: 'Server temporarily unavailable. Please try again.',
  503: 'Service unavailable. Please try again later.',
  504: 'Server timeout. Please try again.',
};

interface AxiosErrorLike {
  response?: {
    status: number;
    data?: {
      message?: string;
      detail?: string;
      error?: string;
    };
  };
  request?: unknown;
  code?: string;
  message?: string;
}

/**
 * Convert an axios error (or any error) to a structured AppError.
 */
export function parseError(error: unknown): AppError {
  // Handle axios-like errors
  const axiosError = error as AxiosErrorLike;

  if (axiosError.response) {
    // Server responded with an error status
    const status = axiosError.response.status;
    const data = axiosError.response.data;
    const serverMessage = data?.message || data?.detail || data?.error;

    // Determine error type based on status code
    let type: ErrorType;
    if (status === 401 || status === 403) {
      type = ErrorType.AUTH;
    } else if (status === 400 || status === 422) {
      type = ErrorType.VALIDATION;
    } else if (status === 404) {
      type = ErrorType.NOT_FOUND;
    } else if (status >= 500) {
      type = ErrorType.SERVER;
    } else {
      type = ErrorType.UNKNOWN;
    }

    const userMessage = serverMessage || STATUS_MESSAGES[status] || ERROR_MESSAGES[type];

    return new AppError(
      type,
      `HTTP ${status}: ${serverMessage || 'Request failed'}`,
      userMessage,
      status,
      error
    );
  }

  if (axiosError.request) {
    // Request was made but no response received (network error)
    if (axiosError.code === 'ECONNABORTED') {
      return new AppError(
        ErrorType.TIMEOUT,
        'Request timeout',
        ERROR_MESSAGES[ErrorType.TIMEOUT],
        null,
        error
      );
    }

    return new AppError(
      ErrorType.NETWORK,
      axiosError.message || 'Network error',
      ERROR_MESSAGES[ErrorType.NETWORK],
      null,
      error
    );
  }

  // Something else went wrong
  const message = error instanceof Error ? error.message : 'Unknown error';
  return new AppError(
    ErrorType.UNKNOWN,
    message,
    ERROR_MESSAGES[ErrorType.UNKNOWN],
    null,
    error
  );
}

/**
 * Get a user-friendly message from any error.
 * Use this when you just need the message without the full AppError.
 */
export function getErrorMessage(error: unknown): string {
  const appError = parseError(error);
  return appError.userMessage;
}

/**
 * Check if an error is a specific type.
 */
export function isErrorType(error: unknown, type: ErrorType): boolean {
  if (error instanceof AppError) {
    return error.type === type;
  }
  return parseError(error).type === type;
}

/**
 * Check if error is an authentication error (401/403).
 */
export function isAuthError(error: unknown): boolean {
  return isErrorType(error, ErrorType.AUTH);
}

/**
 * Check if error is a network/connectivity error.
 */
export function isNetworkError(error: unknown): boolean {
  return isErrorType(error, ErrorType.NETWORK) || isErrorType(error, ErrorType.TIMEOUT);
}
