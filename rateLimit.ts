import { createClient } from 'redis';
import { isIpBlocked, blockIp } from './db';

// Antispam submission limiter for public comment/testimonial endpoints.
// Rules (per client IP):
//   - at most 1 submission every 10 minutes
//   - at most 3 submissions per 24 hours; exceeding that permanently blocks the IP
//
// Rolling attempt timestamps live in Redis when REDIS_URL is configured (shared
// across instances, survives restarts) and fall back to an in-memory store
// otherwise. Permanent bans are always persisted in PostgreSQL (blocked_ips),
// so they survive regardless of the rolling store.

const WINDOW_24H_MS = 24 * 60 * 60 * 1000;
const MIN_INTERVAL_MS = 10 * 60 * 1000;
const MAX_PER_24H = 3;

let redis: any = null;
let redisReady = false;

// In-memory fallback: ip -> array of attempt timestamps (ms).
const memStore = new Map<string, number[]>();

export async function initRateLimiter(): Promise<void> {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.log('Rate limiter: REDIS_URL not set, using in-memory store.');
    return;
  }
  try {
    redis = createClient({ url });
    redis.on('error', (e: any) => {
      redisReady = false;
      console.error('Redis error:', e?.message || e);
    });
    redis.on('ready', () => { redisReady = true; });
    await redis.connect();
    redisReady = true;
    console.log('Rate limiter: connected to Redis.');
  } catch (e: any) {
    console.error('Rate limiter: Redis connection failed, falling back to memory.', e?.message || e);
    redis = null;
    redisReady = false;
  }
}

// Record the current attempt and return all attempt timestamps within the last
// 24h (including the one just recorded).
async function recordAndGet(ip: string, now: number): Promise<number[]> {
  const cutoff = now - WINDOW_24H_MS;
  if (redisReady && redis) {
    try {
      const key = `rl:${ip}`;
      await redis.zRemRangeByScore(key, 0, cutoff);
      await redis.zAdd(key, { score: now, value: `${now}-${Math.random()}` });
      await redis.pExpire(key, WINDOW_24H_MS);
      const scores = await redis.zRangeByScoreWithScores(key, cutoff, now);
      return scores.map((m: any) => Number(m.score));
    } catch (e: any) {
      console.error('Redis rate-limit op failed, using memory for this call:', e?.message || e);
      // fall through to memory
    }
  }
  const arr = (memStore.get(ip) || []).filter((t) => t > cutoff);
  arr.push(now);
  memStore.set(ip, arr);
  return arr;
}

export interface RateResult {
  allowed: boolean;
  reason?: 'blocked' | 'too_soon';
  retryAfterSeconds?: number;
}

export async function checkSubmissionRate(ip: string): Promise<RateResult> {
  if (!ip) return { allowed: true };

  // Already permanently blocked?
  try {
    if (await isIpBlocked(ip)) return { allowed: false, reason: 'blocked' };
  } catch (e) {
    // If the block lookup fails, fail open so legitimate users aren't punished.
  }

  const now = Date.now();
  const times = await recordAndGet(ip, now); // includes the current attempt

  // 24h cap exceeded → permanent ban.
  if (times.length > MAX_PER_24H) {
    try { await blockIp(ip, `Excedeu ${MAX_PER_24H} envios em 24h (antispam)`); } catch {}
    return { allowed: false, reason: 'blocked' };
  }

  // 10-minute spacing between submissions.
  const prior = times.filter((t) => t < now);
  const lastPrior = prior.length ? Math.max(...prior) : 0;
  if (lastPrior && now - lastPrior < MIN_INTERVAL_MS) {
    const retryAfterSeconds = Math.ceil((MIN_INTERVAL_MS - (now - lastPrior)) / 1000);
    return { allowed: false, reason: 'too_soon', retryAfterSeconds };
  }

  return { allowed: true };
}
