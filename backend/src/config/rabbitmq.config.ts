import { registerAs } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';

export default registerAs('rabbitmq', () => ({
  transport: Transport.RMQ,
  options: {
    urls: [process.env.RABBITMQ_URL || 'amqp://admin:password@localhost:5672'],
    queue: 'taskflow_queue',
    queueOptions: {
      durable: true,
    },
    prefetchCount: 10,
    noAck: false,
  },
}));
