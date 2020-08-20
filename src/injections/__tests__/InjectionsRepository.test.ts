import 'reflect-metadata';
import { Message as AmqpMessage } from 'amqplib';

import InjectionsRepository from '../InjectionsRepository';
import { MessageProperty, JsonMessageContent } from '../decorators';
import { AMQPLIB_ACTION_PARAMS_INJECTIONS } from '../../constants';

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

class Test {
  public handle(
    @MessageProperty('correlationId') _1: string,
    _2: boolean,
    @MessageProperty('contentType') _3: string,
    _4: Object,
    @JsonMessageContent('utf-8') _5: string,
  ) {}

  public other(_: number) {}
}

test('Injection decorator succesfully maps arguments', async () => {
  const repo: InjectionsRepository = Reflect.getOwnMetadata(AMQPLIB_ACTION_PARAMS_INJECTIONS, Test.prototype);
  const args = await repo.getInjectedArguments('handle', TEST_MESSAGE);
  expect(args).toEqual([
    TEST_MESSAGE.properties.correlationId,
    undefined,
    TEST_MESSAGE.properties.contentType,
    undefined,
    JSON.parse(TEST_MESSAGE.content.toString('utf-8')),
  ]);
});

test('Injections repository returns empty arguments list for method without injection decorators', async () => {
  const repo: InjectionsRepository = Reflect.getOwnMetadata(AMQPLIB_ACTION_PARAMS_INJECTIONS, Test.prototype);
  const args = await repo.getInjectedArguments('other', TEST_MESSAGE);
  expect(args).toEqual([]);
});
