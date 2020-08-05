import 'reflect-metadata';
import { Channel } from 'amqplib';
import { METADATA, EXCHANGE_NAME, SUMM_BODY, SUMM_RESPONSE } from '../data';
import Connector from '../Connector';

let connection: Connector = new Connector('localhost');
let channel!: Channel;

beforeAll(async () => {
  await connection.connect();
  channel = await connection.createChannel();
});

afterAll(async () => {
  if (channel) {
    await channel.close();
  }
  await connection.disconnect();
});

describe('Returnable action testing', () => {
  test('Returnable action replies to producer', async (done) => {
    const correlationId = String(Date.now());
    const { queue } = await channel.assertQueue('', { exclusive: true });

    await channel.consume(queue, (message) => {
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
    const correlationId = String(Date.now());
    const { queue } = await channel.assertQueue('', { exclusive: true });

    await channel.consume(queue, (message) => {
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
    const correlationId = String(Date.now());
    const { queue } = await channel.assertQueue('', { exclusive: true });

    await channel.consume(queue, (message) => {
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
});
