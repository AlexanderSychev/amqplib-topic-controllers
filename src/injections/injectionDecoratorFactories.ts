import {
  Message as AmqpMessage,
  MessageProperties as AmqpMessageProperties,
  MessageFields as AmqpMessageFields,
} from 'amqplib';

import Inject from './Inject';

/** Creates injection decorator by overriden "injector" method */
export abstract class InjectionDecoratorFactory {
  public constructor() {
    this.injector = this.injector.bind(this);
  }

  /** Maps needed data from raw AMQP message */
  public abstract injector(message: AmqpMessage): any;

  /** Creates parameter decorator */
  public decorate(): ParameterDecorator {
    return Inject(this.injector);
  }
}

/** "Message" decorator factory */
export class MessageDecoratorFactory extends InjectionDecoratorFactory {
  public injector(message: AmqpMessage) {
    return message;
  }
}

/** "RawMessageContent" decorator factory */
export class RawMessageContentDecoratorFactory extends InjectionDecoratorFactory {
  public injector({ content }: AmqpMessage): Buffer {
    return content;
  }
}

/** "StringMessageContent" decorator factory */
export class StringMessageContentDecoratorFactory extends InjectionDecoratorFactory {
  private encoding?: BufferEncoding | null | undefined;

  public constructor(encoding?: BufferEncoding | null | undefined) {
    super();
    this.encoding = encoding;
  }

  public injector({ content, properties: { contentEncoding } }: AmqpMessage): string {
    let encoding: BufferEncoding | undefined;
    if (this.encoding) {
      encoding = this.encoding;
    } else if (contentEncoding) {
      encoding = contentEncoding;
    }
    return content.toString(encoding);
  }
}

/** "MessageProperties" decorator factory */
export class MessagePropertiesDecoratorFactory extends InjectionDecoratorFactory {
  public injector({ properties }: AmqpMessage): AmqpMessageProperties {
    return properties;
  }
}

/** "MessageProperty" decorator factory */
export class MessagePropertyDecoratorFactory extends InjectionDecoratorFactory {
  private propertyName: keyof AmqpMessageProperties;

  public constructor(propertyName: keyof AmqpMessageProperties) {
    super();
    this.propertyName = propertyName;
  }

  public injector({ properties }: AmqpMessage): any {
    return properties[this.propertyName];
  }
}

/** "MessageFields" decorator property */
export class MessageFieldsDecoratorFactory extends InjectionDecoratorFactory {
  public injector({ fields }: AmqpMessage): AmqpMessageFields {
    return fields;
  }
}

/** "MessageField" decorator property */
export class MessageFieldDecoratorFactory extends InjectionDecoratorFactory {
  private fieldName: keyof AmqpMessageFields;

  public constructor(fieldName: keyof AmqpMessageFields) {
    super();
    this.fieldName = fieldName;
  }

  public injector({ fields }: AmqpMessage): any {
    return fields[this.fieldName];
  }
}
