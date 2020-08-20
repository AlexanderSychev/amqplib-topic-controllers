import InjectionsRepository from './InjectionsRepository';
import { Injector } from './interfaces';
import { AMQPLIB_ACTION_PARAMS_INJECTIONS } from '../constants';

/**
 * Base decorator which converts raw AMQP message to result of function settled by `injector` argument
 * @param injector {function(message: import('amqplib').Message): any} Function which maps raw AMQP message to
 * method argument
 */
export default function Inject(injector: Injector): ParameterDecorator {
  return (target, propertyKey, argumentIndex) => {
    if (!Reflect.hasOwnMetadata(AMQPLIB_ACTION_PARAMS_INJECTIONS, target)) {
      Reflect.defineMetadata(AMQPLIB_ACTION_PARAMS_INJECTIONS, new InjectionsRepository(), target);
    }
    const repo: InjectionsRepository = Reflect.getOwnMetadata(AMQPLIB_ACTION_PARAMS_INJECTIONS, target);
    repo.addInjector(String(propertyKey), argumentIndex, injector);
  };
}
