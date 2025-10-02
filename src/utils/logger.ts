import winston from 'winston';

interface LogInfo {
  timestamp: string;
  level: string;
  message: string;
  stack?: string;
  [key: string]: unknown;
}

// Check if we're in MCP mode (stdio communication)
// When piping input, process.stdin.isTTY is undefined, not false
const isMcpMode = !process.stdin.isTTY;

// Color codes for different log levels
const colors = {
  error: '\x1b[31m',   // Red
  warn: '\x1b[33m',    // Yellow
  info: '\x1b[36m',     // Cyan
  debug: '\x1b[90m',    // Gray
  reset: '\x1b[0m'      // Reset
};

// Create logger instance
const logger = winston.createLogger({
  level: isMcpMode ? 'error' : (process.env['LOG_LEVEL'] || 'info'),
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.printf((info) => {
      const { timestamp, level, message, stack, ...meta } = info as unknown as LogInfo;
      const color = colors[level as keyof typeof colors] || colors.reset;
      const reset = colors.reset;
      
      // Format: [时间] [级别] 详情
      let log = `${color}[${timestamp}] [${level.toUpperCase()}] ${message}${reset}`;
      
      if (Object.keys(meta).length > 0) {
        log += ` ${JSON.stringify(meta)}`;
      }
      
      if (stack) {
        log += `\n${stack}`;
      }
      
      return log;
    })
  ),
  defaultMeta: { service: 'geogebra-mcp-server' },
  transports: [
    // Use stderr instead of stdout to avoid interfering with MCP JSON-RPC communication
    new winston.transports.Console({
      stderrLevels: ['error', 'warn', 'info', 'debug'],
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.printf((info) => {
          const { timestamp, level, message, stack, ...meta } = info as unknown as LogInfo;
          const color = colors[level as keyof typeof colors] || colors.reset;
          const reset = colors.reset;
          
          // Format: [时间] [级别] 详情
          let log = `${color}[${timestamp}] [${level.toUpperCase()}] ${message}${reset}`;
          
          if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
          }
          
          if (stack) {
            log += `\n${stack}`;
          }
          
          return log;
        })
      )
    })
  ]
});

// Add file transport in production
if (process.env['NODE_ENV'] === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error'
  }));
  
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log'
  }));
}

export default logger; 