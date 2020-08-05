import { AMQPLIB_ACTION_NAME, AMQPLIB_ACTION_TYPE } from './constants';

export const enum ActionType {
  DEFAULT = 'DEFAULT',
  TASK = 'TASK',
  RETURNABLE_SIMPLE = 'RETURNABLE_SIMPLE',
  RETURNABLE_JSON = 'RETURNABLE_JSON',
}

const ActionMethod = (type: ActionType, name?: string): MethodDecorator => (
  _,
  propertyKey,
  descriptor: PropertyDescriptor,
) => {
  const fn: Function = descriptor.value;

  if (!Reflect.hasOwnMetadata(AMQPLIB_ACTION_NAME, fn)) {
    Reflect.defineMetadata(AMQPLIB_ACTION_NAME, name || String(propertyKey), fn);
  }

  if (!Reflect.hasOwnMetadata(AMQPLIB_ACTION_TYPE, fn)) {
    Reflect.defineMetadata(AMQPLIB_ACTION_TYPE, type, fn);
  }

  return descriptor;
};

/** Default action - receives message and acknowledges it */
export const Action = (name?: string): MethodDecorator => ActionMethod(ActionType.DEFAULT, name);

/** Task action - no acknowledges action, usefull for heavy tasks */
export const Task = (name?: string): MethodDecorator => ActionMethod(ActionType.TASK, name);

/** "@Returnable()" decorator parameters */
export interface ReturnableParams {
  /** Should return value will be parsed as JSON ("true" by default) */
  json?: boolean;
  /** Name of action */
  name?: string;
}

/** Returnable action - should reply to sender by returned value */
export const Returnable = (params?: string | ReturnableParams): MethodDecorator => {
  let json = true;
  let name: string | undefined;

  if (params) {
    if (typeof params === 'string') {
      name = params;
    } else {
      name = params.name;
      if (typeof params.json === 'boolean') {
        json = params.json;
      }
    }
  }

  return ActionMethod(json ? ActionType.RETURNABLE_JSON : ActionType.RETURNABLE_SIMPLE, name);
};
