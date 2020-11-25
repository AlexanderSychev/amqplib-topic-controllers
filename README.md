# AMQP Lib Topic Controllers

Allows to create controller classes with methods as actions

Create structured, declarative and beautifully organized class-based controllers with heavy decorators usage for AMQP Lib using TypeScript.

## Installation

### Step #1 - Install package

By NPM:

```bash
npm install amqplib-topic-controllers --save
```

Or by Yarn:

```bash
yarn add amqplib-topic-controllers
```

### Step #2 - Install `reflect-metadata` shim package

By NPM:
```bash
npm install reflect-metadata --save
```

Or by Yarn:
```bash
yarn add reflect-metadata
```

And make sure to import it before you use `amqplib-topic-controllers`:
```typescript
import 'routing-controllers';
```

### Step #3 - Install `amqplib` package

By NPM:
```bash
npm install amqplib --save
```

Or by Yarn:
```bash
yarn add amqplib
```

### Step #4 - Code preparations

It's important to set these options in `tsconfig.json` file of your project:
```js
{
  "compilerOptions": {
    {
      "emitDecoratorMetadata": true,
      "experimentalDecorators": true
    }
  }
}
```

## Step #5 (optional) - install `class-validator` and `class-transformer` packages

If you want to use automatic transformations and validations for JSON message content, you should install `class-validator` and `class-transformer` packages:

By NPM:
```bash
npm install class-validator class-transformer --save
```

Or by Yarn:
```bash
yarn add class-validator class-transformer
```

## Example of usage

Create controller class:

```typescript
import { Controller, Returnable, Task, JsonMessageContent } from 'amqplib-topic-controllers';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface Metadata {
  name: string;
  createdAt: string;
}

export interface SummBody {
  a: number;
  b: number;
}

@Controller('test')
export default class TestController {
  private metadata: Metadata;

  public constructor(metadata: Metadata) {
    this.metadata = metadata;
  }

  @Task()
  public async longJob() {
    console.info('Long job started...');
    await sleep(5000);
    console.info('Long job done.');
  }

  @Returnable()
  public getMetadata() {
    return this.metadata;
  }

  @Returnable()
  public summ(@JsonMessageContent() { a, b }: SummBody) {
    return {
      summ: a + b,
    };
  }

  @Returnable()
  public async asyncSumm(@JsonMessageContent() { a, b }: SummBody) {
    await sleep(750);
    return {
      summ: a + b,
    };
  }
}
```

Create consumer application:
```typescript
import 'reflect-metadata';
import { connect } from 'amqplib';
import { bindToChannel } from 'amqplib-topic-controllers';

import TestController from './TestController';

export const METADATA = {
  name: 'testController',
  createdAt: '2020-08-05T20:55:36.103Z',
};

export const EXCHANGE_NAME = 'TestMicroservice';

async function main() {
  // Connect to AMQP server
  const connector = await connect({
    hostname: 'localhost',
    port: 5672,
    username: 'guest',
    password: 'guest',
  });

  // Create channel to consume messages
  const channel = await connector.createChannel();

  // Bind controller class with constructor arguments to channel
  bindToChannel({
    channel,
    exchangeName: EXCHANGE_NAME,
    controllers: [[TestController, METADATA]],
  });
}

main().then(
  () => {
    console.log('OK');
  },
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
```

Application is ready to receive messages. Let's try send something:

```typescript
import { connect } from 'amqplib';

async function main() {
  const correlationId = String(Date.now());
  const { queue } = await channel.assertQueue('', { exclusive: true });

  await channel.consume(queue, (message) => {
    if (message && message.properties.correlationId === correlationId) {
      const data = JSON.parse(message.content.toString());

      //
      // Must print object:
      // {
      //   name: 'testController',
      //   createdAt: '2020-08-05T20:55:36.103Z',
      // }
      //
      console.log(data);
    }
  });

  channel.publish('TestMicroservice', 'test.getMetadata', Buffer.from(''), {
    correlationId,
    replyTo: queue,
  });
}

main().then(
  () => {
    console.log('OK');
  },
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
```

Messages consuming is based on topics with template `<ControllerName>.<ActionName>`. Topics names calculated
by class and method decorators (see reference below).

You also can see example aplication [here](https://github.com/AlexanderSychev/amqplib-topic-controllers/tree/master/src/test-app).

## Main reference

### `bindToChannel(params: BindToChannelParams)`

Attaches controllers to existing AMQP connection channel. Asserts exchange with settled name and asserts all needed queues.

#### `interface BindToChannelParams`

`bindToChannel` function parameters. Fields:
* `controllers` (required, type `(Function | [Function, ...any[]])[]`) - list of controllers classes to bind. If controller need some constructor parameters, set array, where first item will be controller class and rest items - arguments for constructor. Otherwise, just set controller class.
* `channel` (required, type `Channel | ConfirmChannel`) - target channel to bind controllers consumers.
* `exchangeName` (required, type `string`) - target exchange for calculated controllers topics.
* `delayedExchange` (optional, type `boolean`) - should target exchange use [RabbitMQ Delayed Message Plugin](https://github.com/rabbitmq/rabbitmq-delayed-message-exchange). If `true` function will automatically fix some parameters and create exchange with special type;
* `exchangeParams` (optional, type `Options.AssertExchange`) - target exchange configuration (see `amqplib` "Channel" method ["assertExchange"](http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertExchange) documentation for details). By default, equals `{ durable: true }`.
* `logger` (optional, type `ILogger`) - object with methods to log all incoming and outcoming messages. Internal console logger using by default. See `interface ILogger` below for details.
* `errorHeaderName` (optional, type `string`) - name of header, which marks that remote service replied with error. Equals constant `AMQPLIB_TOPIC_CONTROLLERS_ERROR_HEADER_NAME` (`"X-Amqplib-Topic-Controller-Is-Error"`) by default. See **"Error handling"** section below for details.
* `transformError(error: unknown): any` (optional, type `Function`) - error response builder for producer. May be asynchronous. See **"Error handling"** section below for details.

#### `interface ILogger`

Logger - singature of object with methods to log all incoming and outcoming messages.

Methods to implement:
* `consume(queue: string, message: Message): void` - log incoming message;
* `reply(queue: string, corellationId: unknown): void` - log reply;
* `error(queue: string, message: Message, err: unknown)` - log error;

### Error handling

Package automatically catch all errors thrown by your actions. Every error will be logged. If action is returnable, error will be returned in content of reply message.

Reply message will be marked by special header. Header will contain stringified `true` value. Name of this header is value of constant `AMQPLIB_TOPIC_CONTROLLERS_ERROR_HEADER_NAME` (`"X-Amqplib-Topic-Controller-Is-Error"`) by default, but you can change it by `errorHeaderName` option of `bindToChannel` function.

Content of error message will be JSON string. By default it will maps into object like this:
```json
{
  "error": "Error: Some error"
}
```
But you can override this behavior by `transformError` option of `bindToChannel` function. Error builder must receive error as first argument and return any entity which can be stringified by `JSON.stringify` function. Error builder can be asynchronous (return `Promise`).

## Decorators reference

### Class decorators

#### `Controller(name?: string): ClassDecorator`

Decorator factory which marks class as controller. Every controller class must be marked by this decorator or it will be skipped.

Argument `name` defines name of controller (`<ControllerName>` in `<ControllerName>.<ActionName>` topic template). If it's not settled, decorator will try to get name from `displayName` static property or from name of class. Otherwise, error will be thrown.

### Method decorators

#### `Action(name): MethodDecorator`

Decorator factory which marks method as simple action - it's consumes message and acknowleges it.

Argument `name` defines name of action (`<ActionName>` in `<ControllerName>.<ActionName>` topic template). If it's not settled, decorator will try to get name for method name. Otherwise, error will be thrown.

#### `Task(name): MethodDecorator`

Decorator factory which marks method as task action - action which is not aknowleging (`{ noAck: true }`). This decorator may be usefull for some heavy activities which does not need to response.

Argument `name` defines name of action (`<ActionName>` in `<ControllerName>.<ActionName>` topic template). If it's not settled, decorator will try to get name for method name. Otherwise, error will be thrown.

#### `Returnable(params?: string | { json?: boolean, name?: string }): MethodDecorator`

Decorator factory which marks method as returnable action - action which replies to producer with it's result (or just to "say" that is done). This decorator can be used to build some RPC-like APIs based on AMQP.

Argument `params` is object with optional fields:
* `name` (type `string`, optional) - defines name of action (`<ActionName>` in `<ControllerName>.<ActionName>` topic template). If it's not settled, decorator will try to get name for method name. Otherwise, error will be thrown.
* `json` (type `boolean`, optional) - if `true`, result of method will be sended to producer as stringified JSON document. Otherwise, result of method will be just casted to `string`. Default value is `true`.

You can pass `string` value as argument. This will be equivalent of `{ name: string }` argument.

### Method arguments decorators (Injectors)

By default, `amqplib-topic-controllers` does not set arguments to method. Injectors allows you to pass message data to action methods.

#### `Message(): ParameterDecorator`

Injects full AMQP message to parameter, without any parsing.

#### `RawMessageContent(): ParameterDecorator`

Injects raw message content (type `Buffer`) to parameter, without any parsing and encoding.

#### `StringMessageContent(encoding?: BufferEncoding): ParameterDecorator`

Injects stringified message content (type `string`) to parameter - just decodes `Buffer`.

Argument `encoding` defines encoding of source message content. By default, content will be stringified by `contentEncoding` AMQP message property or "as-is" (`.toString()`);

#### `MessageProperties(): ParameterDecorator`

Injects message properties (see `amqplib` documentation for "Channel" method ["consume"](squaremobius.net/amqp.node/channel_api.html#channel_consume) for details).

#### `MessageProperty(name: keyof MessageProperties): ParameterDecorator`

Injects concrete message property (see `amqplib` documentation for "Channel" method ["consume"](squaremobius.net/amqp.node/channel_api.html#channel_consume) for details).

Argument `name` is required and defines name of property to inject.

#### `MessageFields(): ParameterDecorator`

Injects message fields (see `amqplib` documentation for "Channel" method ["consume"](squaremobius.net/amqp.node/channel_api.html#channel_consume) for details).

#### `MessageField(name: keyof MessageFields): ParameterDecorator`

Injects concrete message field (see `amqplib` documentation for "Channel" method ["consume"](squaremobius.net/amqp.node/channel_api.html#channel_consume) for details).

Argument `name` is required and defines name of field to inject.

#### `JsonMessageContent(options?: BufferEncoding | JsonMessageContentOptions | null | undefined): ParameterDecorator`

Inject message content as parsed JavaScript object (result of `JSON.parse`) - decodes `Buffer` and pass string to `JSON.parse`. Optionally, object can be transformed into instance of given class and validated.

Argument `options` is object with optional fields (`interface JsonMessageContentOptions`):
* `encoding` (type `BufferEncoding`, subtype of `string`) - defines encoding of source message content. By default, content will be stringified by `contentEncoding` AMQP message property or "as-is" (`.toString()`);
* `transform` (type `boolean`) - should content will be transformed by `class-transformer` package;
* `validate` (type `boolean`) - should content will be validated by `class-validator` package;
* `targetClass` (type `TargetClass`) - class to transform JSON response by `class-transformer`;

When `transform` is `true`, option `targetClass` is required (or error will be thrown).
When `validate` is `true`, options `transform` and `targetClass` are required (or error will be thrown).

You can pass `BufferEncoding`/`string` value as argument. This will be equivalent of `{ encoding: string }` argument.

#### `ValidInstanceContent(targetClass: TargetClass, encoding?: BufferEncoding | null | undefined)`

Alias for `JsonMessageContent({ targetClass: TargetClass, encoding, validate: true, transform: true })`. Injects instantiated and validated content body object.

#### `interface TargetClass`

Class of entity to transform and validate JSON body:
```typescript
interface TargetClass {
  new (...args: any[]): any;
}
```

## For developers

### Environment requirements:

To build and test package you need this:

* Node.JS v12.18.2+;
* Yarn v1.22.4+;
* Docker v19.03.12+;
* Docker Compose v1.26.2;
* GNU Make v4.2.1+;
* Python 3.8.2+;

### Package building

By lifecycle script:
```bash
yarn build
```

Or directly by GNU Make:
```bash
make
```

### Testing

Build package, start test Docker containers and run tests
```bash
yarn test
```

It runs `test.py` file with full testing cycle.
