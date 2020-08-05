import { AMQPLIB_CONTROLLER_NAME } from './constants';

const Controller = (name?: string): ClassDecorator => (target: Function) => {
  let controllerName: string;

  if (name) {
    controllerName = name;
  } else if ((<any>target).displayName) {
    controllerName = (<any>target).displayName;
  } else if (target.name) {
    controllerName = target.name;
  } else {
    throw new Error(`Controller's name must be defined by argument, by "displayName" static property or by class name`);
  }

  if (!Reflect.hasOwnMetadata(AMQPLIB_CONTROLLER_NAME, target.prototype)) {
    Reflect.defineMetadata(AMQPLIB_CONTROLLER_NAME, controllerName, target.prototype);
  }
};

export default Controller;
