import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { CfTokenService } from "../service/certService";

declare module "fastify" {
  interface FastifyInstance {
    cfToken: CfTokenService;
  }
}

const cfTokenPlugin: FastifyPluginAsync = async (fastify, opts) => {
  const cfToken = new CfTokenService(
    fastify.config.CF_TEAM_DOMAIN,
    fastify.config.CF_POLICY_AUD,
    fastify.log
  );

  fastify.decorate("cfToken", cfToken);
};

export default fp(cfTokenPlugin, {
  name: "cfToken",
  dependencies: ["@fastify/env"],
});
