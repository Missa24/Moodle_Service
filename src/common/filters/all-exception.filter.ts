import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const method = request.method;
    const url = request.url;

    // Log SIEMPRE el error real en el servidor
    if (exception instanceof Error) {
      this.logger.error(
        `${method} ${url} | ${exception.name}: ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.error(
        `${method} ${url} | Error no estándar`,
        JSON.stringify(exception, null, 2),
      );
    }

    // Errores HTTP controlados
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      let message: string | string[];
      let error: string;

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else {
        const body = exceptionResponse as {
          message?: string | string[];
          error?: string;
        };

        message = body.message ?? exception.message;
        error = body.error ?? exception.name;
      }

      response.status(status).json({
        success: false,
        message,
        error,
        statusCode: status,
      });

      return;
    }

    // Error 500
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error interno del servidor',
      data: null,
      statusCode: 500,
    });
  }
}
