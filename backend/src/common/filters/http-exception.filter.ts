import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

export interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  details?: unknown;
  path: string;
  timestamp: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal Server Error';
    let message = 'An unexpected error occurred';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name.replace('Exception', '');
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const resObj = exceptionResponse as Record<string, unknown>;
        error =
          (resObj.error as string) || exception.name.replace('Exception', '');

        if (Array.isArray(resObj.message)) {
          message = 'Validation failed';
          details = resObj.message;
        } else if (typeof resObj.message === 'string') {
          message = resObj.message;
        }
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002': {
          statusCode = HttpStatus.CONFLICT;
          error = 'Conflict';
          const target =
            (exception.meta?.target as string[])?.join(', ') || 'field';
          message = `A resource with this ${target} already exists.`;
          break;
        }
        case 'P2025': {
          statusCode = HttpStatus.NOT_FOUND;
          error = 'Not Found';
          message = (exception.meta?.cause as string) || 'Record not found.';
          break;
        }
        case 'P2003': {
          statusCode = HttpStatus.BAD_REQUEST;
          error = 'Bad Request';
          const field = (exception.meta?.field_name as string) || 'relation';
          message = `Foreign key constraint failed on ${field}.`;
          break;
        }
        default: {
          statusCode = HttpStatus.BAD_REQUEST;
          error = 'Bad Request';
          message = `Database request error (${exception.code}).`;
          break;
        }
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      statusCode = HttpStatus.BAD_REQUEST;
      error = 'Bad Request';
      message = 'Invalid query parameters provided to the database.';
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
    }

    const errorResponse: ErrorResponse = {
      statusCode,
      error,
      message,
      ...(details ? { details } : {}),
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(errorResponse);
  }
}
