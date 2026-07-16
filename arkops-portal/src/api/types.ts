/**
 * Unified API response types for AllMall portal.
 *
 * Provides standardized response wrappers, pagination, and error codes
 * to ensure consistency across all API endpoints.
 *
 * Author: AI Optimization
 * Created: 2026-07-16
 */

/** Standard API response envelope */
export interface ApiResponse<T> {
  /** Whether the request succeeded */
  success: boolean;
  /** Response data (present when success is true) */
  data?: T;
  /** Error information (present when success is false) */
  error?: ApiError;
  /** Server timestamp */
  timestamp: string;
}

/** Standardized error structure */
export interface ApiError {
  /** Machine-readable error code */
  code: ApiErrorCode;
  /** Human-readable error message */
  message: string;
  /** Additional error details (field-level validation errors, etc.) */
  details?: Record<string, string[]>;
}

/** Standardized API error codes */
export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'DEPENDENCY_NOT_MET'
  | 'INTERNAL_ERROR';

/** Standard pagination parameters */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/** Standard paginated response */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Wrap a value in a success response.
 */
export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create an error response.
 */
export function errorResponse(code: ApiErrorCode, message: string, details?: Record<string, string[]>): ApiResponse<never> {
  return {
    success: false,
    error: { code, message, details },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a 404 not found response.
 */
export function notFoundResponse(entity: string, id: unknown): ApiResponse<never> {
  return errorResponse('NOT_FOUND', `${entity} with id '${id}' not found`);
}

/**
 * Create a validation error response.
 */
export function validationErrorResponse(details: Record<string, string[]>): ApiResponse<never> {
  return errorResponse('VALIDATION_ERROR', 'Validation failed', details);
}
