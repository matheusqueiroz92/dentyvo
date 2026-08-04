import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import type { RateLimitPort } from "../../application/ports/RateLimitPort";

/**
 * Rate limit via Upstash Redis (mesmo ecossistema do QStash).
 * Env: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`.
 */
export class UpstashRateLimitAdapter implements RateLimitPort {
  private readonly ratelimit: Ratelimit;

  constructor(
    redis: Redis = Redis.fromEnv(),
    limitePorMinuto: number = 30,
  ) {
    this.ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limitePorMinuto, "1 m"),
      prefix: "dentyvo:agendar-publico",
    });
  }

  async permitir(chave: string): Promise<boolean> {
    const { success } = await this.ratelimit.limit(chave);
    return success;
  }

  static fromEnv(
    env: NodeJS.ProcessEnv = process.env,
  ): UpstashRateLimitAdapter | null {
    if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
      return null;
    }
    return new UpstashRateLimitAdapter(
      new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      }),
    );
  }
}
