import 'reflect-metadata';
import { Message as AmqpMessage } from 'amqplib';
import InjectionsRepository from '../InjectionsRepository';

import { Message, StringMessageContent, JsonMessageContent } from '../injections';
import { AMQPLIB_ACTION_PARAMS_INJECTIONS } from '../constants';

class Test01 {
  public handle(@Message() _1: AmqpMessage) {}
}

test('Injection decorator successfully evaluates', () => {
  const repo: InjectionsRepository = Reflect.getOwnMetadata(AMQPLIB_ACTION_PARAMS_INJECTIONS, Test01.prototype);
  const injectors = repo.getInjectors('handle');
  expect(injectors).not.toBeUndefined();
  expect(typeof injectors![0]).toBe('function');
});

const TEST_MESSAGE: AmqpMessage = {
  properties: {
    contentType: 'application/json',
    contentEncoding: 'utf-8',
    headers: {},
    deliveryMode: undefined,
    priority: undefined,
    clusterId: undefined,
    correlationId: 'dc3d44ff-72a4-4ddb-963c-0d9b5d33c4ce',
    replyTo: undefined,
    expiration: undefined,
    messageId: undefined,
    appId: undefined,
    timestamp: undefined,
    type: undefined,
    userId: undefined,
  },
  fields: {
    deliveryTag: 0,
    redelivered: false,
    exchange: 'test',
    routingKey: 'foo.bar',
  },
  content: Buffer.from(JSON.stringify({ foo: 'bar' })),
};

class Test02 {
  public handle(@StringMessageContent() _1: string, @JsonMessageContent() _2: Object) {}
}

test('Message content decodes correctly', () => {
  const repo: InjectionsRepository = Reflect.getOwnMetadata(AMQPLIB_ACTION_PARAMS_INJECTIONS, Test02.prototype);
  const args = repo.getInjectedArguments('handle', TEST_MESSAGE);
  expect(args).toEqual([TEST_MESSAGE.content.toString('utf-8'), JSON.parse(TEST_MESSAGE.content.toString('utf-8'))]);
});
