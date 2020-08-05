import { Channel, ConfirmChannel, Options } from 'amqplib';

import createTopicsMap, { MessageHandler } from './createTopicsMap';
import { ActionType } from './actions';

export interface BindToChannelParams {
  controllers: (Function | [Function, ...any[]])[];
  channel: Channel | ConfirmChannel;
  exchangeName: string;
  exchangeParams?: Options.AssertExchange;
}

async function consume(
  channel: Channel | ConfirmChannel,
  queue: string,
  handlers: Map<string, MessageHandler>,
  options?: Options.Consume,
) {
  await channel.consume(
    queue,
    async (message) => {
      if (message && handlers.has(message.fields.routingKey)) {
        const handler = handlers.get(message.fields.routingKey);
        await handler!(message);
        if (options && !options.noAck) {
          channel.ack(message);
        }
      }
    },
    options,
  );
}

async function consumeAndReply(
  channel: Channel | ConfirmChannel,
  queue: string,
  handlers: Map<string, MessageHandler>,
  actionType: ActionType,
  options?: Options.Consume,
) {
  await channel.consume(
    queue,
    async (message) => {
      if (message && handlers.has(message.fields.routingKey)) {
        const handler = handlers.get(message.fields.routingKey);
        const result = await handler!(message);
        const { correlationId, replyTo } = message.properties;
        const response = Buffer.from(
          actionType === ActionType.RETURNABLE_JSON ? JSON.stringify(result) : String(result),
        );
        channel.sendToQueue(replyTo, response, { correlationId });
        channel.ack(message);
      }
    },
    options,
  );
}

export default async function bindToChannel({
  controllers,
  channel,
  exchangeName,
  exchangeParams = { durable: true },
}: BindToChannelParams): Promise<void> {
  const topicsMap = createTopicsMap(controllers);

  const { exchange } = await channel.assertExchange(exchangeName, 'topic', exchangeParams);

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
      await consumeAndReply(channel, queue, handlers, actionType);
    } else {
      await consume(channel, queue, handlers, options);
    }
  }
}
