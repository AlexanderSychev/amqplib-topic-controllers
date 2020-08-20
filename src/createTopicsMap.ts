import { Message } from 'amqplib';
import { InjectionsRepository } from './injections';
import {
  AMQPLIB_ACTION_NAME,
  AMQPLIB_ACTION_PARAMS_INJECTIONS,
  AMQPLIB_ACTION_TYPE,
  AMQPLIB_CONTROLLER_NAME,
} from './constants';
import { ActionType } from './actions';

interface Newable {
  new (...args: any[]): any;
}

export type MessageHandler = (message: Message) => Promise<any>;

export default function createTopicsMap(
  controllers: (Function | [Function, ...any[]])[],
): Map<ActionType, Map<string, MessageHandler>> {
  const topicsMap = new Map<ActionType, Map<string, MessageHandler>>();

  for (const controllerData of controllers) {
    let ControllerConstructor: Newable;
    let args: any[] = [];

    if (Array.isArray(controllerData)) {
      [ControllerConstructor, ...args] = <[Newable, ...any[]]>controllerData;
    } else {
      ControllerConstructor = <Newable>controllerData;
    }

    const controller = new ControllerConstructor(...args);

    if (Reflect.hasOwnMetadata(AMQPLIB_CONTROLLER_NAME, ControllerConstructor.prototype)) {
      const controllerName: string = Reflect.getOwnMetadata(AMQPLIB_CONTROLLER_NAME, ControllerConstructor.prototype);
      const propNames = Object.getOwnPropertyNames(ControllerConstructor.prototype);

      for (const propName of propNames) {
        const prop = ControllerConstructor.prototype[propName];
        const actionInjections: InjectionsRepository | null | undefined = Reflect.getOwnMetadata(
          AMQPLIB_ACTION_PARAMS_INJECTIONS,
          ControllerConstructor.prototype,
        );
        if (Reflect.hasOwnMetadata(AMQPLIB_ACTION_NAME, prop) && Reflect.hasOwnMetadata(AMQPLIB_ACTION_TYPE, prop)) {
          const actionName: string = Reflect.getOwnMetadata(AMQPLIB_ACTION_NAME, prop);
          const actionType: ActionType = Reflect.getOwnMetadata(AMQPLIB_ACTION_TYPE, prop);

          if (!topicsMap.has(actionType)) {
            topicsMap.set(actionType, new Map<string, MessageHandler>());
          }

          const handler: MessageHandler = async (message: Message) => {
            let args: any[] = [];
            if (actionInjections) {
              args = await actionInjections.getInjectedArguments(propName, message);
            }
            const result = await controller[propName](...args);
            return result;
          };

          topicsMap.get(actionType)!.set(`${controllerName}.${actionName}`, handler);
        }
      }
    }
  }

  return topicsMap;
}
