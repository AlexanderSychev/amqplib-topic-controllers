import 'reflect-metadata';

import { Action, Returnable, Task, ActionType } from '../actions';
import { AMQPLIB_ACTION_NAME, AMQPLIB_ACTION_TYPE } from '../constants';

describe('Common decorators tests', () => {
  class Test {
    @Action()
    public action() {}

    @Action('named_action')
    public namedAction() {}

    @Returnable()
    public returnable() {}

    @Returnable('named_returnable')
    public namedReturnable() {}

    @Returnable({ json: true })
    public jsonReturnable() {}

    @Returnable({ json: false })
    public notJsonReturnable() {}

    @Task()
    public task() {}

    @Task('named_task')
    public namedTask() {}
  }

  test.each([
    [Test.prototype.action, 'action'],
    [Test.prototype.namedAction, 'named_action'],
    [Test.prototype.returnable, 'returnable'],
    [Test.prototype.namedReturnable, 'named_returnable'],
    [Test.prototype.task, 'task'],
    [Test.prototype.namedTask, 'named_task'],
  ])('"%p" action method has bounded name "%s"', (fn, name) => {
    expect(Reflect.getOwnMetadata(AMQPLIB_ACTION_NAME, fn)).toBe(name);
  });

  test.each([
    [Test.prototype.action, ActionType.DEFAULT],
    [Test.prototype.namedAction, ActionType.DEFAULT],
    [Test.prototype.returnable, ActionType.RETURNABLE_JSON],
    [Test.prototype.namedReturnable, ActionType.RETURNABLE_JSON],
    [Test.prototype.jsonReturnable, ActionType.RETURNABLE_JSON],
    [Test.prototype.notJsonReturnable, ActionType.RETURNABLE_SIMPLE],
    [Test.prototype.task, ActionType.TASK],
    [Test.prototype.namedTask, ActionType.TASK],
  ])('"%p" action method has action type "ActionType.%s"', (fn, type) => {
    expect(Reflect.getOwnMetadata(AMQPLIB_ACTION_TYPE, fn)).toBe(type);
  });
});

describe('@Returnable() decorator with object argument tests', () => {
  class Test {
    @Returnable({})
    public case01() {}

    @Returnable({ name: 'case_02' })
    public case02() {}

    @Returnable({ json: true })
    public case03() {}

    @Returnable({ json: false })
    public case04() {}

    @Returnable({ name: 'case_05', json: true })
    public case05() {}

    @Returnable({ name: 'case_06', json: false })
    public case06() {}
  }

  test.each([
    [Test.prototype.case01, 'case01', ActionType.RETURNABLE_JSON],
    [Test.prototype.case02, 'case_02', ActionType.RETURNABLE_JSON],
    [Test.prototype.case03, 'case03', ActionType.RETURNABLE_JSON],
    [Test.prototype.case04, 'case04', ActionType.RETURNABLE_SIMPLE],
    [Test.prototype.case05, 'case_05', ActionType.RETURNABLE_JSON],
    [Test.prototype.case06, 'case_06', ActionType.RETURNABLE_SIMPLE],
  ])('"%p" action method has name "%s" and action type "ActionType.%s"', (fn, name, type) => {
    expect(Reflect.getOwnMetadata(AMQPLIB_ACTION_NAME, fn)).toBe(name);
    expect(Reflect.getOwnMetadata(AMQPLIB_ACTION_TYPE, fn)).toBe(type);
  });
});

describe('Duplicate decoration tests', () => {
  class Test {
    @Action('name02')
    @Action('name01')
    public case01() {}

    @Action()
    @Task()
    public case02() {}
  }

  test("Only first (lowest and most right) decorator's name will be applied", () => {
    expect(Reflect.getOwnMetadata(AMQPLIB_ACTION_NAME, Test.prototype.case01)).toBe('name01');
  });

  test("Only first (lowest and most right) decorator's type will be applied", () => {
    expect(Reflect.getOwnMetadata(AMQPLIB_ACTION_TYPE, Test.prototype.case02)).toBe(ActionType.TASK);
  });
});
