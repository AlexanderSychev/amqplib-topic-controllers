import { Message } from 'amqplib';
import { Injector } from './interfaces';

export default class InjectionsRepository {
  protected injectionsByProps: Map<string, (Injector | undefined)[]> = new Map<string, (Injector | undefined)[]>();

  public addInjector(propertyKey: string, parameterIndex: number, injector: Injector): void {
    if (!this.injectionsByProps.has(propertyKey)) {
      this.injectionsByProps.set(propertyKey, []);
    }
    const list = this.injectionsByProps.get(propertyKey);
    list![parameterIndex] = injector;
  }

  public async getInjectedArguments(propertyKey: string, message: Message): Promise<any[]> {
    if (this.injectionsByProps.has(propertyKey)) {
      const list = this.injectionsByProps.get(propertyKey);
      const result = [];
      for (const injector of list!) {
        if (injector) {
          result.push(await injector(message));
        } else {
          result.push(undefined);
        }
      }
      return result;
    } else {
      return [];
    }
  }

  public getInjectors(propertyKey: string): (Injector | undefined)[] | undefined {
    return this.injectionsByProps.get(propertyKey);
  }
}
