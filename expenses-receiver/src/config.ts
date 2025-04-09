import "dotenv/config";

export const PORT = process.env.PORT || "3000";
export const KAFKA_CLIENT_ID =
  process.env.KAFKA_CLIENT_ID || "expenses-receiver";
export const KAFKA_BROKERS = process.env.KAFKA_BROKERS.split(",");
export const CLIENT_SECRET = process.env.CLIENT_SECRET;
