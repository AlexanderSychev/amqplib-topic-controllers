import 'reflect-metadata';
import Controller from '../Controller';
import { AMQPLIB_CONTROLLER_NAME } from '../constants';

@Controller()
class Test01 {}

@Controller('test_02')
class Test02 {}

@Controller()
class Test03 {
  public static displayName: string = 'test_03';
}

test.each([
  [Test01, 'Test01'],
  [Test02, 'test_02'],
  [Test03, 'test_03'],
])('Controller class "%s" has name "%s"', (cls, name) => {
  expect(Reflect.getOwnMetadata(AMQPLIB_CONTROLLER_NAME, cls.prototype)).toBe(name);
});
