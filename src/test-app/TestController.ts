import { IsNumber } from 'class-validator';

import Controller from '../Controller';
import { Returnable, Task } from '../actions';
import { JsonMessageContent, ValidInstanceContent } from '../injections';
import sleep from './sleep';

interface Metadata {
  name: string;
  createdAt: string;
}

export interface SummBody {
  a: number;
  b: number;
}

export class SummBodyClass implements SummBody {
  @IsNumber()
  public a!: number;

  @IsNumber()
  public b!: number;
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

  @Returnable()
  public validatableSymm(@ValidInstanceContent(SummBodyClass) body: SummBodyClass) {
    return {
      summ: body.a + body.b,
    };
  }

  @Returnable()
  public throwable() {
    throw new Error(`Test error`);
  }
}
