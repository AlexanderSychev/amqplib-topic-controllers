import { Message } from 'amqplib';

import { JsonMessageContentOptions, TargetClass } from './interfaces';
import { InjectionDecoratorFactory } from './injectionDecoratorFactories';

export const TRANSFORMATION_ENABLED_WITHOUT_TARGET_CLASS =
  'When transformation is enabled (field "transform" is "true"), target class must be set (by "targetClass" field)';

export const VALIDATION_ENABLED_WITHOUT_TRANSFORMATION_OR_TARGET_CLASS =
  'When validation is enabled (field "validate" is "true), transformation must be enabled (field "transform" ' +
  'must be "true") and target class must be set (by "targetClass" field)';

export default class JsonMessageContentDecoratorFactory extends InjectionDecoratorFactory {
  public readonly encoding: BufferEncoding | undefined;

  public readonly transform: boolean;

  public readonly validate: boolean;

  public targetClass: TargetClass | undefined;

  public constructor(options?: JsonMessageContentOptions | BufferEncoding | undefined | null) {
    super();
    let encoding: BufferEncoding | undefined = undefined;
    let transform = false;
    let validate = false;
    let targetClass: TargetClass | undefined = undefined;

    if (options) {
      if (typeof options !== 'string') {
        encoding = options.encoding ? options.encoding : undefined;
        transform = Boolean(options.transform);
        validate = Boolean(options.validate);
        targetClass = options.targetClass ? options.targetClass : undefined;

        if (transform && !targetClass) {
          throw new Error(TRANSFORMATION_ENABLED_WITHOUT_TARGET_CLASS);
        }

        if (validate && (!transform || !targetClass)) {
          throw new Error(VALIDATION_ENABLED_WITHOUT_TRANSFORMATION_OR_TARGET_CLASS);
        }
      } else {
        encoding = options;
      }
    }

    this.encoding = encoding;
    this.transform = transform;
    this.validate = validate;
    this.targetClass = targetClass;
  }

  public async injector({ content, properties: { contentEncoding } }: Message): Promise<any> {
    let encoding: BufferEncoding | undefined;
    if (this.encoding) {
      encoding = this.encoding;
    } else if (contentEncoding) {
      encoding = contentEncoding;
    }

    const parsed = JSON.parse(content.toString(encoding));

    if (this.transform) {
      const { plainToClass } = await import('class-transformer');
      const transformed = plainToClass(this.targetClass!, parsed);

      if (this.validate) {
        const { validate: runValidator } = await import('class-validator');
        const errors = await runValidator(transformed);

        if (errors.length > 0) {
          throw errors;
        }
      }

      return transformed;
    } else {
      return parsed;
    }
  }
}
