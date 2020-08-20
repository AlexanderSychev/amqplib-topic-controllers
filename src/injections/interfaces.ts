import { Message } from 'amqplib';

/** Injector - function which maps some value from raw AMQP message */
export interface Injector {
  (message: Message): any;
}

/** Class to transform JSON response by "class-transformer" */
export interface TargetClass {
  new (...args: any[]): any;
}

/** "JsonMessageContent" decorator additional options */
export interface JsonMessageContentOptions {
  /** Encoding of message content */
  encoding?: BufferEncoding | null | undefined;
  /** Should content will be transformed by "class-transformer" */
  transform?: boolean | null | undefined;
  /** Should content will be validated by "class-validator" */
  validate?: boolean | null | undefined;
  /** Class to transform JSON response by "class-transformer" */
  targetClass?: TargetClass | null | undefined;
}
