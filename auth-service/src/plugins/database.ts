import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { DatabaseService } from "../service/dbService";

declare module "fastify" {
  interface FastifyInstance {
    db: DatabaseService;
  }
}

const databasePlugin: FastifyPluginAsync = async (fastify, opts) => {
  const db = new DatabaseService(fastify.config.DB_URL, fastify.log);

  fastify.decorate("db", db);

  fastify.addHook("onClose", async () => {
    await db.close();
  });
};

export default fp(databasePlugin, {
  name: "database",
  dependencies: ["@fastify/env"],
});
