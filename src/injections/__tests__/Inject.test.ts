import 'reflect-metadata';

import Inject from '../Inject';
import InjectionsRepository from '../InjectionsRepository';
import { Injector } from '../interfaces';
import { AMQPLIB_ACTION_PARAMS_INJECTIONS } from '../../constants';

const pass01: Injector = (message) => message;
const pass02: Injector = (message) => message;

class Test {
  public test01(@Inject(pass01) _: any) {}
  public test02(@Inject(pass02) @Inject(pass01) _: any) {}
}

test('Injected argument stored in repository', () => {
  const repo: InjectionsRepository = Reflect.getOwnMetadata(AMQPLIB_ACTION_PARAMS_INJECTIONS, Test.prototype);
  expect(repo.getInjectors('test01')).toEqual([pass01]);
});

test('Only last injection (most top and most left) decorator will be applied', () => {
  const repo: InjectionsRepository = Reflect.getOwnMetadata(AMQPLIB_ACTION_PARAMS_INJECTIONS, Test.prototype);
  expect(repo.getInjectors('test02')).toEqual([pass02]);
});
