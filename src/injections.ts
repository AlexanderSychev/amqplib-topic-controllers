import { MessageProperties as AmqpMessageProperties, MessageFields as AmqpMessageFields } from 'amqplib';

import InjectionsRepository, { Injector } from './InjectionsRepository';
import { AMQPLIB_ACTION_PARAMS_INJECTIONS } from './constants';

const Inject = (injector: Injector): ParameterDecorator => (target, propertyKey, argumentIndex) => {
  if (!Reflect.hasOwnMetadata(AMQPLIB_ACTION_PARAMS_INJECTIONS, target)) {
    Reflect.defineMetadata(AMQPLIB_ACTION_PARAMS_INJECTIONS, new InjectionsRepository(), target);
  }
  const repo: InjectionsRepository = Reflect.getOwnMetadata(AMQPLIB_ACTION_PARAMS_INJECTIONS, target);
  repo.addInjector(String(propertyKey), argumentIndex, injector);
};

export const Message = (): ParameterDecorator => Inject((message) => message);

export const RawMessageContent = (): ParameterDecorator => Inject(({ content }) => content);

export const StringMessageContent = (encoding?: BufferEncoding): ParameterDecorator =>
  Inject(({ content }) => content.toString(encoding));

export const JsonMessageContent = (encoding?: BufferEncoding): ParameterDecorator =>
  Inject(({ content }) => JSON.parse(content.toString(encoding)));

export const MessageProperties = (): ParameterDecorator => Inject(({ properties }) => properties);

export const MessageProperty = (name: keyof AmqpMessageProperties): ParameterDecorator =>
  Inject(({ properties }) => properties[name]);

export const MessageFields = (): ParameterDecorator => Inject(({ fields }) => fields);

export const MessageField = (name: keyof AmqpMessageFields): ParameterDecorator => Inject(({ fields }) => fields[name]);
