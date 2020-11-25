import { Channel, ConfirmChannel, Options } from 'amqplib';

import createTopicsMap, { MessageHandler } from './createTopicsMap';
import { ActionType } from './actions';
import { ILogger, ConsoleLogger } from './log';

export interface BindToChannelParams {
  controllers: (Function | [Function, ...any[]])[];
  channel: Channel | ConfirmChannel;
  exchangeName: string;
  exchangeParams?: Options.AssertExchange;
  delayedExchange?: boolean;
  logger?: ILogger;
  errorHeaderName?: string;
  transformError?: (error: any) => any;
}

interface ConsumeParams {
  logger: ILogger;
  channel: Channel | ConfirmChannel;
  queue: string;
  handlers: Map<string, MessageHandler>;
  options?: Options.Consume;
}

async function consume({ logger, channel, queue, handlers, options = {} }: ConsumeParams) {
  await channel.consume(
    queue,
    async (message) => {
      if (message && handlers.has(message.fields.routingKey)) {
        logger.consume(queue, message);

        const handler = handlers.get(message.fields.routingKey);
        try {
          await handler!(message);
        } catch (error) {
          logger.error(queue, message, error);
        }

        if (!options.noAck) {
          channel.ack(message);
        }
      }
    },
    options,
  );
}

interface ConsumeAndReplyParams {
  logger: ILogger;
  channel: Channel | ConfirmChannel;
  queue: string;
  handlers: Map<string, MessageHandler>;
  errorHeaderName: string;
  transformError: (error: any) => any;
  actionType: ActionType;
  options?: Options.Consume;
}

async function consumeAndReply({
  logger,
  channel,
  queue,
  handlers,
  actionType,
  options,
  errorHeaderName,
  transformError,
}: ConsumeAndReplyParams) {
  await channel.consume(
    queue,
    async (message) => {
      if (message && handlers.has(message.fields.routingKey)) {
        logger.consume(queue, message);

        const handler = handlers.get(message.fields.routingKey);

        let result: unknown;
        let isError: boolean;
        try {
          result = await handler!(message);
          isError = false;
        } catch (error) {
          logger.error(queue, message, error);
          isError = true;
          result = await transformError(error);
        }

        const { correlationId, replyTo } = message.properties;

        let responseString: string;

        if (actionType === ActionType.RETURNABLE_JSON || isError) {
          responseString = result ? JSON.stringify(result) : '';
        } else {
          responseString = String(result);
        }

        const response = Buffer.from(responseString);

        const publishOptions: Options.Publish = { correlationId };
        if (isError) {
          publishOptions.headers = {
            [errorHeaderName]: JSON.stringify(true),
          };
        }

        channel.sendToQueue(replyTo, response, publishOptions);
        channel.ack(message);

        logger.reply(replyTo, correlationId);
      }
    },
    options,
  );
}

export const AMQPLIB_TOPIC_CONTROLLERS_ERROR_HEADER_NAME = 'X-Amqplib-Topic-Controller-Is-Error';

const defaultTransformError = (error: unknown) => ({
  error: error instanceof Error ? String(error) : error,
});

export default async function bindToChannel({
  controllers,
  channel,
  exchangeName,
  delayedExchange,
  exchangeParams = { durable: true },
  logger = new ConsoleLogger(),
  errorHeaderName = AMQPLIB_TOPIC_CONTROLLERS_ERROR_HEADER_NAME,
  transformError = defaultTransformError,
}: BindToChannelParams): Promise<void> {
  const topicsMap = createTopicsMap(controllers);

  if (delayedExchange) {
    if (exchangeParams.arguments) {
      exchangeParams.arguments['x-delayed-type'] = 'topic';
    } else {
      exchangeParams.arguments = {
        'x-delayed-type': 'topic',
      };
    }
  }

  const { exchange } = await channel.assertExchange(
    exchangeName,
    delayedExchange ? 'x-delayed-message' : 'topic',
    exchangeParams,
  );

  const [{ queue: defaultQueue }, { queue: taskQueue }, { queue: returnableQueue }] = await Promise.all([
    channel.assertQueue('', { exclusive: true }),
    channel.assertQueue('', { exclusive: true }),
    channel.assertQueue('', { exclusive: true }),
  ]);

  for (const [actionType, handlers] of topicsMap.entries()) {
    let queue: string;
    let options: Options.Consume | undefined;
    switch (actionType) {
      case ActionType.DEFAULT:
        queue = defaultQueue;
        break;
      case ActionType.TASK:
        queue = taskQueue;
        options = { noAck: true };
        break;
      case ActionType.RETURNABLE_JSON:
      case ActionType.RETURNABLE_SIMPLE:
        queue = returnableQueue;
        break;
    }

    for (const routeKey of handlers.keys()) {
      await channel.bindQueue(queue, exchange, routeKey);
    }

    if (actionType === ActionType.RETURNABLE_JSON || actionType === ActionType.RETURNABLE_SIMPLE) {
      await consumeAndReply({ logger, channel, queue, handlers, actionType, errorHeaderName, transformError });
    } else {
      await consume({ logger, channel, queue, handlers, options });
    }
  }
}
