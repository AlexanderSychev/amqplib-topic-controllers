import { MessageProperties as AmqpMessageProperties, MessageFields as AmqpMessageFields } from 'amqplib';

import {
  MessageDecoratorFactory,
  RawMessageContentDecoratorFactory,
  StringMessageContentDecoratorFactory,
  MessagePropertiesDecoratorFactory,
  MessagePropertyDecoratorFactory,
  MessageFieldsDecoratorFactory,
  MessageFieldDecoratorFactory,
} from './injectionDecoratorFactories';
import JsonMessageContentDecoratorFactory from './JsonMessageContentDecoratorFactory';
import { JsonMessageContentOptions, TargetClass } from './interfaces';

export function Message(): ParameterDecorator {
  const factory = new MessageDecoratorFactory();
  return factory.decorate();
}

export function RawMessageContent(): ParameterDecorator {
  const factory = new RawMessageContentDecoratorFactory();
  return factory.decorate();
}

export function StringMessageContent(encoding?: BufferEncoding | null | undefined): ParameterDecorator {
  const factory = new StringMessageContentDecoratorFactory(encoding);
  return factory.decorate();
}

export function MessageProperties(): ParameterDecorator {
  const factory = new MessagePropertiesDecoratorFactory();
  return factory.decorate();
}

export function MessageProperty(name: keyof AmqpMessageProperties): ParameterDecorator {
  const factory = new MessagePropertyDecoratorFactory(name);
  return factory.decorate();
}

export function MessageFields(): ParameterDecorator {
  const factory = new MessageFieldsDecoratorFactory();
  return factory.decorate();
}

export function MessageField(name: keyof AmqpMessageFields): ParameterDecorator {
  const factory = new MessageFieldDecoratorFactory(name);
  return factory.decorate();
}

export function JsonMessageContent(options?: BufferEncoding | JsonMessageContentOptions | null | undefined) {
  const factory = new JsonMessageContentDecoratorFactory(options);
  return factory.decorate();
}

export function ValidInstanceContent(targetClass: TargetClass, encoding?: BufferEncoding | null | undefined) {
  return JsonMessageContent({ validate: true, transform: true, targetClass, encoding });
}
