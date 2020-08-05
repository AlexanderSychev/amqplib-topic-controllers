import 'reflect-metadata';
import createTopicsMap from '../createTopicsMap';
import Controller from '../Controller';
import { Action, Task, Returnable, ActionType } from '../actions';
import { StringMessageContent } from '../injections';

@Controller('test01')
class Test01 {
  @Action()
  public log(@StringMessageContent() _: string) {}

  @Task()
  public async long() {
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  @Returnable()
  public greet() {
    return { hello: 'Hello World' };
  }

  @Returnable({ json: false })
  public foo() {
    return 'bar';
  }
}

describe('Actions divided by type', () => {
  const map = createTopicsMap([Test01]);
  test.each([ActionType.DEFAULT, ActionType.RETURNABLE_JSON, ActionType.RETURNABLE_SIMPLE, ActionType.TASK])(
    `Map has action type "%%s"`,
    (type) => {
      expect(map.has(type)).toBe(true);
    },
  );
});

@Controller('test02')
class Test02 {
  private foo: string;

  public constructor(foo: string) {
    this.foo = foo;
  }

  @Returnable({ json: false })
  public getFoo() {
    return this.foo;
  }

  @Returnable({ json: false })
  public echo(@StringMessageContent('utf-8') message: string) {
    return message;
  }
}

describe('Constructor and action arguments tests', () => {
  const map = createTopicsMap([[Test02, 'bar']]);

  test('Constructor argument used in controller', () => {
    const result = map.get(ActionType.RETURNABLE_SIMPLE)!.get('test02.getFoo')!(<any>{});
    expect(result).toBe('bar');
  });

  test('Action argument test', () => {
    const result = map.get(ActionType.RETURNABLE_SIMPLE)!.get('test02.echo')!(<any>{
      content: Buffer.from('Hello world!'),
    });
    expect(result).toBe('Hello world!');
  });
});

class NotController {
  @Returnable({ json: false })
  public echo(@StringMessageContent('utf-8') message: string) {
    return message;
  }
}

test('Class skipped if it is not decorated as controller', () => {
  const map = createTopicsMap([NotController]);
  expect(map.has(ActionType.RETURNABLE_SIMPLE)).toBe(false);
});
