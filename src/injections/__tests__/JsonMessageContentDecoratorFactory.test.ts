import { IsString, IsNotEmpty, IsPositive } from 'class-validator';

import JsonMessageContentDecoratorFactory, {
  TRANSFORMATION_ENABLED_WITHOUT_TARGET_CLASS,
  VALIDATION_ENABLED_WITHOUT_TRANSFORMATION_OR_TARGET_CLASS,
} from '../JsonMessageContentDecoratorFactory';
import createTestMessage from './createTestMessage';
import { JsonMessageContentOptions, TargetClass } from '../interfaces';

class TestContent {
  @IsNotEmpty()
  @IsString()
  public str!: string;

  @IsPositive()
  public positive!: number;
}

const GOOD_BODY = {
  str: 'foo',
  positive: 5,
};

const BAD_BODIES = [
  {
    str: 11,
    positive: '',
  },
  {
    str: '',
    positive: 5,
  },
  {
    str: 'aa',
    positive: -5,
  },
];

describe('Options parsing tests', () => {
  const CASES: ReadonlyArray<[
    BufferEncoding | JsonMessageContentOptions | null | undefined,
    boolean,
    boolean,
    TargetClass | null | undefined,
  ]> = [
    [undefined, false, false, undefined],
    [null, false, false, undefined],
    ['utf-8', false, false, undefined],
    [
      {
        encoding: 'utf-8',
        transform: true,
        validate: true,
        targetClass: TestContent,
      },
      true,
      true,
      TestContent,
    ],
  ];
  test.each(CASES)(
    'If options === %p then transform === %p, validate === %p, targetClass === %p',
    (options, transform, validate, targetClass) => {
      const factory = new JsonMessageContentDecoratorFactory(options);
      expect(factory.transform).toBe(transform);
      expect(factory.validate).toBe(validate);
      expect(factory.targetClass).toBe(targetClass);
    },
  );

  const ERROR_CASES: ReadonlyArray<[JsonMessageContentOptions, string]> = [
    [{ transform: true }, TRANSFORMATION_ENABLED_WITHOUT_TARGET_CLASS],
    [{ validate: true }, VALIDATION_ENABLED_WITHOUT_TRANSFORMATION_OR_TARGET_CLASS],
    [{ validate: true, transform: true }, TRANSFORMATION_ENABLED_WITHOUT_TARGET_CLASS],
    [{ validate: true, targetClass: TestContent }, VALIDATION_ENABLED_WITHOUT_TRANSFORMATION_OR_TARGET_CLASS],
  ];
  test.each(ERROR_CASES)('If options === %p then throws error "%s"', (options, error) => {
    expect(() => new JsonMessageContentDecoratorFactory(options)).toThrow(error);
  });
});

describe('Transformation tests', () => {
  const CORRECT_CASES: ReadonlyArray<[
    BufferEncoding | null | undefined,
    BufferEncoding | null | undefined,
    boolean,
  ]> = [
    [undefined, undefined, true],
    [undefined, undefined, false],
    [null, undefined, true],
    [null, undefined, false],
    ['utf-8', undefined, true],
    ['utf-8', undefined, false],
    [undefined, null, true],
    [undefined, null, false],
    [null, null, true],
    [null, null, false],
    ['utf-8', null, true],
    ['utf-8', null, false],
    [undefined, 'utf-8', true],
    [undefined, 'utf-8', false],
    [null, 'utf-8', true],
    [null, 'utf-8', false],
    ['utf-8', 'utf-8', true],
    ['utf-8', 'utf-8', false],
  ];
  test.each(CORRECT_CASES)(
    'Transformation works correctly (encoding=%p, contentEncoding=%p validation === %p)',
    async (encoding, contentEncoding, validate) => {
      const factory = new JsonMessageContentDecoratorFactory({
        encoding,
        validate,
        transform: true,
        targetClass: TestContent,
      });
      const message = createTestMessage(contentEncoding, GOOD_BODY);
      await expect(factory.injector(message)).resolves.toBeInstanceOf(TestContent);
    },
  );

  test.each(BAD_BODIES)('body %p is invalid and throws array of validation errors', async (badBody) => {
    const factory = new JsonMessageContentDecoratorFactory({
      transform: true,
      validate: true,
      targetClass: TestContent,
    });
    const message = createTestMessage('utf-8', badBody);
    try {
      await factory.injector(message);
    } catch (error) {
      expect(error).toBeInstanceOf(Array);
      expect(error.length).toBeGreaterThan(0);
    }
  });
});
