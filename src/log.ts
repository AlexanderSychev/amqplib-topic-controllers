import { Message } from 'amqplib';

/** ILogger - interface for object which provides logging for AMQP */
export interface ILogger {
  /** Log incoming message */
  consume(queue: string, message: Message): void;
  /** Log reply */
  reply(queue: string, corellationId: unknown): void;
  /** Log error */
  error(queue: string, message: Message, err: unknown): void;
}

export class ConsoleLogger implements ILogger {
  public consume(
    queue: string,
    { fields: { routingKey, exchange }, properties: { correlationId, replyTo } }: Message,
  ): void {
    let message = `[${new Date()}] Consuming "${routingKey}" from exchange "${exchange}", queue "${queue}".`;
    if (correlationId && replyTo) {
      message = `${message} Corellation ID: "${correlationId}", queue to reply: "${replyTo}".`;
    }
    console.info(message);
  }

  public reply(queue: string, corellationId: unknown): void {
    console.info(`[${new Date()}] Reply message to queue "${queue}" with. Corellation ID: ${corellationId}`);
  }

  public error(
    queue: string,
    { fields: { routingKey, exchange }, properties: { correlationId, replyTo } }: Message,
    err: unknown,
  ): void {
    let message = `[${new Date()}] Error while consuming "${routingKey}" from exchange "${exchange}", queue "${queue}": ${err}`;
    if (correlationId && replyTo) {
      message = `${message} Corellation ID: "${correlationId}", queue to reply: "${replyTo}".`;
    }
    console.error(message);
  }
}
