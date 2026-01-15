import { Pool, QueryResult, QueryResultRow } from "pg";
import { FastifyBaseLogger } from "fastify";

export interface UserRow {
  id: string;
  email: string;
}

export class DatabaseService {
  private pool: Pool;
  private logger: FastifyBaseLogger;

  constructor(connectionString: string, logger: FastifyBaseLogger) {
    this.pool = new Pool({
      connectionString,
    });
    this.logger = logger;

    this.pool.on("error", (err) => {
      this.logger.error({ err }, "Unexpected database error");
    });
  }

  async query<T extends QueryResultRow>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
