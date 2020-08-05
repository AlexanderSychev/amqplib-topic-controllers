import { Message } from 'amqplib';

export type Injector = (message: Message) => any;

export default class InjectionsRepository {
  protected injectionsByProps: Map<string, Injector[]> = new Map<string, Injector[]>();

  public addInjector(propertyKey: string, parameterIndex: number, injector: Injector): void {
    if (!this.injectionsByProps.has(propertyKey)) {
      this.injectionsByProps.set(propertyKey, []);
    }
    const list = this.injectionsByProps.get(propertyKey);
    list![parameterIndex] = injector;
  }

  public getInjectedArguments(propertyKey: string, message: Message): any[] {
    if (this.injectionsByProps.has(propertyKey)) {
      const list = this.injectionsByProps.get(propertyKey);
      return list!.map((injector) => (injector ? injector(message) : undefined));
    } else {
      return [];
    }
  }

  public getInjectors(propertyKey: string): Injector[] | undefined {
    return this.injectionsByProps.get(propertyKey);
  }
}
