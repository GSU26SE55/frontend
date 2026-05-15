import { toast } from 'sonner';
import type { UseFormSetError } from 'react-hook-form';
import type { ErrorEntity } from '@/shared/types/api.types';

export class HttpError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}

export class EntityError extends HttpError {
  readonly errors: ErrorEntity[];

  constructor(errors: ErrorEntity[]) {
    super(422, 'Validation error');
    this.name = 'EntityError';
    this.errors = errors;
  }
}

interface HandleErrorParams {
  error: unknown;
  setError?: UseFormSetError<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export const handleErrorApi = ({ error, setError }: HandleErrorParams) => {
  if (error instanceof EntityError) {
    if (setError) {
      error.errors.forEach(err =>
        setError(err.field, { type: 'server', message: err.detail })
      );
    }
    return;
  }
  if (error instanceof HttpError) {
    toast.error(error.message);
    return;
  }
  toast.error('Có lỗi không xác định xảy ra');
};
