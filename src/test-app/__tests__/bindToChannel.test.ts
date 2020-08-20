import 'reflect-metadata';
import * as uuid from 'uuid';
import { Channel } from 'amqplib';
import { METADATA, EXCHANGE_NAME, SUMM_BODY, SUMM_RESPONSE } from '../data';
import Connector from '../Connector';
import { AMQPLIB_TOPIC_CONTROLLERS_ERROR_HEADER_NAME } from '../../bindToChannel';

let connection: Connector = new Connector('localhost');
let channel!: Channel;

beforeAll(async () => {
  console.info('Connecting to AMQP server...');
  await connection.connect();
  console.info('Done');

  console.info('Creating channel...');
  channel = await connection.createChannel();
  console.info('Done');

  console.info('Asserting exchange...');
  channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
  console.info('Done');
});

afterAll(async () => {
  if (channel) {
    await channel.close();
  }
  await connection.disconnect();
});

describe('Returnable action testing', () => {
  test('Returnable action replies to producer', async (done) => {
    const correlationId = uuid.v4();
    const { queue } = await channel.assertQueue('', { exclusive: true });

    await channel.consume(queue, (message) => {
      console.info(message);
      if (message && message.properties.correlationId === correlationId) {
        const data = JSON.parse(message.content.toString());
        try {
          expect(data).toEqual(METADATA);
          done();
        } catch (err) {
          done(err);
        }
      }
    });

    channel.publish(EXCHANGE_NAME, 'test.getMetadata', Buffer.from(''), {
      correlationId,
      replyTo: queue,
    });
  });

  test('Sync returnable route "test.summ" replies to producer with correct response', async (done) => {
    const correlationId = uuid.v4();
    const { queue } = await channel.assertQueue('', { exclusive: true });

    await channel.consume(queue, (message) => {
      console.info(message);
      if (message && message.properties.correlationId === correlationId) {
        const data = JSON.parse(message.content.toString());
        try {
          expect(data).toEqual(SUMM_RESPONSE);
          done();
        } catch (err) {
          done(err);
        }
      }
    });

    channel.publish(EXCHANGE_NAME, 'test.summ', Buffer.from(JSON.stringify(SUMM_BODY)), {
      correlationId,
      replyTo: queue,
    });
  });

  test('Async returnable route "test.asyncSumm" replies to producer with correct response', async (done) => {
    const correlationId = uuid.v4();
    const { queue } = await channel.assertQueue('', { exclusive: true });

    await channel.consume(queue, (message) => {
      console.info(message);
      if (message && message.properties.correlationId === correlationId) {
        const data = JSON.parse(message.content.toString());
        try {
          expect(data).toEqual(SUMM_RESPONSE);
          done();
        } catch (err) {
          done(err);
        }
      }
    });

    channel.publish(EXCHANGE_NAME, 'test.asyncSumm', Buffer.from(JSON.stringify(SUMM_BODY)), {
      correlationId,
      replyTo: queue,
    });
  });

  test('Returnable route "test.validatableSymm" replies to producer with validation errors array', async (done) => {
    const correlationId = uuid.v4();
    const { queue } = await channel.assertQueue('', { exclusive: true });

    await channel.consume(queue, (message) => {
      console.info(message);
      if (message && message.properties.correlationId === correlationId) {
        const isError = JSON.parse(message.properties.headers[AMQPLIB_TOPIC_CONTROLLERS_ERROR_HEADER_NAME]);
        const data = JSON.parse(message.content.toString());
        try {
          expect(isError).toBe(true);
          expect(data.error).toBeInstanceOf(Array);
          expect(data.error.length).toBeGreaterThan(0);
          done();
        } catch (err) {
          done(err);
        }
      }
    });

    channel.publish(EXCHANGE_NAME, 'test.validatableSymm', Buffer.from(JSON.stringify({ a: 'foo', b: 1 })), {
      correlationId,
      replyTo: queue,
    });
  });

  test('Returnable route "test.throwable" replies to producer with correct error message', async (done) => {
    const correlationId = uuid.v4();
    const { queue } = await channel.assertQueue('', { exclusive: true });

    await channel.consume(queue, (message) => {
      console.info(message);
      if (message && message.properties.correlationId === correlationId) {
        const data = JSON.parse(message.content.toString());
        try {
          expect(data.error).toBe('Error: Test error');
          done();
        } catch (err) {
          done(err);
        }
      }
    });

    channel.publish(EXCHANGE_NAME, 'test.throwable', Buffer.from(JSON.stringify(SUMM_BODY)), {
      correlationId,
      replyTo: queue,
    });
  });
});
