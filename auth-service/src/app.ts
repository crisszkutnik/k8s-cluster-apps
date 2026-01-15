import { join } from "node:path";
import AutoLoad, { AutoloadPluginOptions } from "@fastify/autoload";
import { FastifyPluginAsync, FastifyServerOptions } from "fastify";
import fastifyEnv from "@fastify/env";

export interface AppOptions
  extends FastifyServerOptions,
    Partial<AutoloadPluginOptions> {}

declare module "fastify" {
  interface FastifyInstance {
    config: {
      DB_URL: string;
      CF_TEAM_DOMAIN: string;
      CF_POLICY_AUD: string;
      PORT: number;
    };
  }
}

// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {};

const envSchema = {
  type: "object",
  required: ["DB_URL", "CF_POLICY_AUD"],
  properties: {
    DB_URL: {
      type: "string",
    },
    CF_TEAM_DOMAIN: {
      type: "string",
      default: "https://cristobalszk.cloudflareaccess.com",
    },
    CF_POLICY_AUD: {
      type: "string",
    },
    PORT: {
      type: "number",
      default: 3000,
    },
  },
};

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts
): Promise<void> => {
  // Load environment variables
  await fastify.register(fastifyEnv, {
    schema: envSchema,
    dotenv: true,
  });

  // Place here your custom code!

  // Do not touch the following lines

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  // eslint-disable-next-line no-void
  void fastify.register(AutoLoad, {
    dir: join(__dirname, "plugins"),
    options: opts,
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  // eslint-disable-next-line no-void
  void fastify.register(AutoLoad, {
    dir: join(__dirname, "routes"),
    options: opts,
  });
};

export default app;
export { app, options };
