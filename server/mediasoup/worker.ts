import * as mediasoup from 'mediasoup';
import { config } from './config';

let worker: mediasoup.types.Worker;

export const createWorker = async () => {
  worker = await mediasoup.createWorker({
    logLevel: config.worker.logLevel as any,
    logTags: config.worker.logTags as any,
    rtcMinPort: config.worker.rtcMinPort,
    rtcMaxPort: config.worker.rtcMaxPort
  });

  worker.on('died', () => {
    console.error('mediasoup worker died, exiting in 2 seconds... [pid:%d]', worker.pid);
    setTimeout(() => process.exit(1), 2000);
  });

  return worker;
};

export const getWorker = () => worker;
