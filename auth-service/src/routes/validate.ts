import { FastifyPluginAsync } from "fastify";
import { UserRow } from "../service/dbService";

const root: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.post("/validate", async function (request, reply) {
    const cfAccessJwt = request.headers["cf-access-jwt-assertion"] as
      | string
      | undefined;

    if (!cfAccessJwt) {
      return reply.status(401).send({
        error: "Missing Cf-Access-Jwt-Assertion header",
      });
    }

    const userEmail = await fastify.cfToken.validateToken(cfAccessJwt);

    if (userEmail === undefined) {
      return reply.status(401).send({
        error: "Access token is not valid",
      });
    }

    const result = await fastify.db.query<UserRow>(
      "SELECT id, email FROM users WHERE email = $1 LIMIT 1",
      [userEmail]
    );

    const user = result.rows[0];

    if (!user) {
      return reply.status(404).send({
        error: "User does not exist",
      });
    }

    return reply
      .status(200)
      .header("Internal-User-Id", user.id)
      .send({
        token: cfAccessJwt,
        validated: true,
        user: {
          id: user.id,
          email: user.email,
        },
      });
  });
};

export default root;
