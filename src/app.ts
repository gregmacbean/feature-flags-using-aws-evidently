import createLogger from '@seek/logger';
import { SQSEvent, SQSHandler } from 'aws-lambda';

const logger = createLogger({
  name: 'hirer-analytics-feature-flags',
});

export const handler: SQSHandler = (_: SQSEvent) => {
  logger.info('Hello World!');
};
