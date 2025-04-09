import winston from "winston";
import { format } from "logform";

export function createLogger(serviceName: string) {
  return winston.createLogger({
    level: "silly",
    defaultMeta: { service: serviceName },
    transports: [new winston.transports.Console()],
    format: format.combine(
      format.timestamp(),
      format.errors({ stack: true }),
      format.json()
    ),
  });
}

export function prepareErrorForLog(err: Error) {
  return {
    message: err.message,
    name: err.name,
    stack: err.stack,
  };
}
