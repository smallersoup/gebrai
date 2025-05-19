import dotenv from 'dotenv';
import { startServer } from './server';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

// Start the server
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

startServer(port)
  .then(() => {
    logger.info(`Server started on port ${port}`);
  })
  .catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });

