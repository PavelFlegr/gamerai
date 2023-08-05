import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  logger = new Logger(AllExceptionsFilter.name)
  constructor() {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()

    this.logger.error(exception['message'], exception['stack'])

    ctx.getNext()(exception)
  }
}
