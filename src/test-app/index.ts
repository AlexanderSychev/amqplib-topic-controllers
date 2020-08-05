import 'reflect-metadata';

import bindToChannel from '../bindToChannel';
import TestController from './TestController';
import Connector from './Connector';
import { EXCHANGE_NAME, METADATA } from './data';

async function main() {
  const connector = new Connector();
  await connector.connect();
  const channel = await connector.createChannel();
  bindToChannel({
    channel,
    exchangeName: EXCHANGE_NAME,
    controllers: [[TestController, METADATA]],
  });
}

main().then(
  () => {
    console.log('OK');
  },
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
