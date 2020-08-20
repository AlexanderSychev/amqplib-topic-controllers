import { Message } from 'amqplib';

const createTestMessage = (contentEncoding?: any, body?: any): Message => ({
  properties: {
    contentEncoding,
    contentType: 'application/json',
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
  content: Buffer.from(JSON.stringify(body ? body : { foo: 'bar' })),
});

export default createTestMessage;
