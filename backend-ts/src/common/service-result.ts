export type ServiceResult<T> =
  | { kind: 'success'; value: T }
  | { kind: 'not_found'; message: string }
  | { kind: 'invalid'; message: string };

export function success<T>(value: T): ServiceResult<T> {
  return { kind: 'success', value };
}

export function notFound<T>(message: string): ServiceResult<T> {
  return { kind: 'not_found', message };
}

export function invalid<T>(message: string): ServiceResult<T> {
  return { kind: 'invalid', message };
}
