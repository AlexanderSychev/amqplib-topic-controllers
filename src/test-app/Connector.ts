import { connect, Connection, Channel, Options } from 'amqplib';
import sleep from './sleep';

export default class Connector {
  private connection: Connection | null = null;

  private options: Options.Connect;

  public constructor(hostname: string = 'amqp_server') {
    this.options = {
      hostname,
      port: 5672,
      username: 'guest',
      password: 'guest',
    };
  }

  public get isConnected(): boolean {
    return Boolean(this.connection);
  }

  public async connect() {
    if (!this.connection) {
      const ATTEMPTS_COUNT = 60;
      let attempts = ATTEMPTS_COUNT;

      while (attempts > 0) {
        try {
          this.connection = await connect(this.options);
          break;
        } catch (error) {
          console.error(error);
          console.info('Next attempt will be till 1000 seconds');
          attempts--;
          await sleep(1000);
        }
      }

      if (!this.connection && attempts <= 0) {
        throw new Error('Cannot establish connection to AMQP server');
      } else {
        console.info(`Connection established on ${ATTEMPTS_COUNT - attempts + 1} time.`);
      }
    }
  }

  public async disconnect() {
    if (this.connection) {
      await this.connection.close();
    }
  }

  public createChannel(): Promise<Channel> {
    if (!this.connection) {
      throw new Error('No connection to AMQP server');
    }
    return this.connection.createChannel();
  }
}
