import type { Response } from 'express';
import type { ServiceResult } from './service-result';

export function sendResult<T>(res: Response, result: ServiceResult<T>): T {
  if (result.kind === 'not_found') {
    res.status(404);
    return { message: result.message } as unknown as T;
  }
  if (result.kind === 'invalid') {
    res.status(400);
    return { message: result.message } as unknown as T;
  }
  return result.value;
}
