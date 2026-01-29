import { join } from "node:path";
import AutoLoad, { AutoloadPluginOptions } from "@fastify/autoload";
import { FastifyPluginAsync, FastifyServerOptions } from "fastify";
import fastifyEnv from "@fastify/env";
import Fastify from "fastify";

export interface AppOptions
  extends FastifyServerOptions, Partial<AutoloadPluginOptions> {}

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
  opts,
): Promise<void> => {
  await fastify.register(fastifyEnv, {
    schema: envSchema,
    dotenv: true,
  });

  /*
    By default NGINX will not forward the body of the requests, so we need to avoid
    'application/json' requests that have empty body

    If we need to inspect the body, we will need to make changes in NGINX
  */
  fastify.addContentTypeParser(
    "application/json",
    { parseAs: "string" },
    (req, body, done) => {
      try {
        const bodyStr = typeof body === "string" ? body : String(body);
        const json = bodyStr === "" ? {} : JSON.parse(bodyStr);
        done(null, json);
      } catch (err: any) {
        err.statusCode = 400;
        done(err, undefined);
      }
    },
  );

  // load plugins from the /plugins folder
  void fastify.register(AutoLoad, {
    dir: join(__dirname, "plugins"),
    options: opts,
  });

  // load routes from /routes
  void fastify.register(AutoLoad, {
    dir: join(__dirname, "routes"),
    options: opts,
  });
};

export default app;
export { app, options };

// Check if this file is being run directly (not imported as a module)
if (require.main === module) {
  const start = async () => {
    const fastify = Fastify({
      logger: true,
      ...options,
    });

    try {
      await fastify.register(app, options);

      const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
      const host = process.env.HOST || "0.0.0.0";

      await fastify.listen({ port, host });

      fastify.log.info(`Server is running on http://${host}:${port}`);
    } catch (err) {
      fastify.log.error(err);
      process.exit(1);
    }
  };

  start();
}
