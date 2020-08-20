import 'reflect-metadata';
import { MessageFields as AmqpMessageFields } from 'amqplib';

import InjectionsRepository from '../InjectionsRepository';
import createTestMessage from './createTestMessage';
import { AMQPLIB_ACTION_PARAMS_INJECTIONS } from '../../constants';
import {
  InjectionDecoratorFactory,
  MessageDecoratorFactory,
  RawMessageContentDecoratorFactory,
  StringMessageContentDecoratorFactory,
  MessagePropertiesDecoratorFactory,
  MessagePropertyDecoratorFactory,
  MessageFieldsDecoratorFactory,
  MessageFieldDecoratorFactory,
} from '../injectionDecoratorFactories';

const ENCODING_CASES: ReadonlyArray<BufferEncoding | null | undefined> = [undefined, null, 'utf-8'];

describe('"MessageDecoratorFactory" class test', () => {
  test.each(ENCODING_CASES)('message with encoding "%s"', (encoding) => {
    const factory = new MessageDecoratorFactory();
    const message = createTestMessage(encoding);
    expect(factory.injector(message)).toEqual(message);
  });
});

describe('"RawMessageContentDecoratorFactory" class test', () => {
  test.each(ENCODING_CASES)('message with encoding "%s"', (encoding) => {
    const factory = new RawMessageContentDecoratorFactory();
    const message = createTestMessage(encoding);
    expect(factory.injector(message)).toEqual(message.content);
  });
});

describe('"StringMessageContentDecoratorFactory" class test', () => {
  test.each(ENCODING_CASES)('message with encoding "%s"', (encoding) => {
    const factory = new StringMessageContentDecoratorFactory(encoding);
    const message = createTestMessage(encoding);
    expect(factory.injector(message)).toEqual(message.content.toString(encoding ? encoding : undefined));
  });

  test.each([undefined, null])('use "contentEncoding" when source encoding is "%s"', (encoding) => {
    const factory = new StringMessageContentDecoratorFactory(encoding);
    const message = createTestMessage('utf-8');
    expect(factory.injector(message)).toEqual(message.content.toString('utf-8'));
  });
});

describe('"MessagePropertiesDecoratorFactory" class test', () => {
  test.each(ENCODING_CASES)('message with encoding "%s"', (encoding) => {
    const factory = new MessagePropertiesDecoratorFactory();
    const message = createTestMessage(encoding);
    expect(factory.injector(message)).toEqual(message.properties);
  });
});

describe('"MessagePropertyDecoratorFactory" class test', () => {
  describe.each(ENCODING_CASES)('message with encoding "%s"', (encoding) => {
    test('"correlationId" property injection testing', () => {
      const factory = new MessagePropertyDecoratorFactory('correlationId');
      const message = createTestMessage(encoding);
      expect(factory.injector(message)).toBe(message.properties.correlationId);
    });

    test('"headers" property injection testing', () => {
      const factory = new MessagePropertyDecoratorFactory('headers');
      const message = createTestMessage(encoding);
      expect(factory.injector(message)).toEqual(message.properties.headers);
    });
  });
});

describe('"MessageFieldsDecoratorFactory" class test', () => {
  test.each(ENCODING_CASES)('message with encoding "%s"', (encoding) => {
    const factory = new MessageFieldsDecoratorFactory();
    const message = createTestMessage(encoding);
    expect(factory.injector(message)).toEqual(message.fields);
  });
});

describe('"MessageFieldDecoratorFactory" class test', () => {
  describe.each(ENCODING_CASES)('message with encoding "%s"', (encoding) => {
    const FIELDS_CASES: ReadonlyArray<[keyof AmqpMessageFields, any]> = [
      ['deliveryTag', 0],
      ['redelivered', false],
      ['exchange', 'test'],
      ['routingKey', 'foo.bar'],
    ];
    test.each(FIELDS_CASES)('MessageFieldDecoratorFactory("%s") maps value %p', (fieldName, fieldValue) => {
      const factory = new MessageFieldDecoratorFactory(fieldName);
      const message = createTestMessage(encoding);
      expect(factory.injector(message)).toBe(fieldValue);
    });
  });
});

describe('"decorate" method tests', () => {
  const CASES: ReadonlyArray<InjectionDecoratorFactory> = [
    new MessageDecoratorFactory(),
    new RawMessageContentDecoratorFactory(),
    new StringMessageContentDecoratorFactory(),
    new MessagePropertiesDecoratorFactory(),
    new MessagePropertyDecoratorFactory('correlationId'),
    new MessageFieldsDecoratorFactory(),
    new MessageFieldDecoratorFactory('redelivered'),
  ];
  test.each(CASES)('%p stores "injector" method in repository', (factory) => {
    const decorator = factory.decorate();

    const target = {};
    const propertyKey = 'test';
    const argumentIndex = 0;
    decorator(target, propertyKey, argumentIndex);

    const repo: InjectionsRepository = Reflect.getOwnMetadata(AMQPLIB_ACTION_PARAMS_INJECTIONS, target);
    const injectors = repo.getInjectors(propertyKey);
    expect(injectors![0]).toBe(factory.injector);
  });
});
