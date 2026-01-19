import { createRemoteJWKSet, jwtVerify } from "jose";
import { FastifyBaseLogger } from "fastify";

export class CfTokenService {
  private readonly certs;
  private readonly cfTeamDomain: string;
  private readonly cfPolicyAud: string;
  private logger: FastifyBaseLogger;

  constructor(
    cfTeamDomain: string,
    cfPolicyAud: string,
    logger: FastifyBaseLogger
  ) {
    this.cfTeamDomain = cfTeamDomain;
    this.cfPolicyAud = cfPolicyAud;
    this.logger = logger;
    this.certs = createRemoteJWKSet(
      new URL(`${cfTeamDomain}/cdn-cgi/access/certs`),
      {
        cooldownDuration: 30000,
        // 5 days
        cacheMaxAge: 432000,
        timeoutDuration: 5000,
      }
    );
  }

  async validateToken(token: string) {
    try {
      const { payload } = await jwtVerify(token, this.certs, {
        issuer: this.cfTeamDomain,
        audience: this.cfPolicyAud,
      });

      return payload.email as string;
    } catch (e) {
      // token not valid
      this.logger.error({ err: e, token }, "Token is not valid");
      return undefined;
    }
  }
}
