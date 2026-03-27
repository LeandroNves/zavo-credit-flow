import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { hashIpForRateLimit } from "./cryptoUtil";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 8;
const LOCKOUT_MS = 60 * 60 * 1000;

export type RateOutcome =
  | { ok: true }
  | { ok: false; reason: "locked"; retryAfterSec: number };

const memory = new Map<
  string,
  { fails: number; windowStart: number; lockedUntil: number }
>();

function checkMemory(ipHash: string): RateOutcome {
  const now = Date.now();
  const row = memory.get(ipHash);
  if (!row) return { ok: true };
  if (row.lockedUntil > now) {
    return {
      ok: false,
      reason: "locked",
      retryAfterSec: Math.ceil((row.lockedUntil - now) / 1000),
    };
  }
  if (now - row.windowStart > WINDOW_MS) {
    memory.delete(ipHash);
  }
  return { ok: true };
}

function recordMemoryFailure(ipHash: string): void {
  const now = Date.now();
  let row = memory.get(ipHash);
  if (!row || now - row.windowStart > WINDOW_MS) {
    row = { fails: 0, windowStart: now, lockedUntil: 0 };
  }
  row.fails += 1;
  if (row.fails >= MAX_FAILS) {
    row.lockedUntil = now + LOCKOUT_MS;
    row.fails = 0;
    row.windowStart = now;
  }
  memory.set(ipHash, row);
}

function clearMemory(ipHash: string): void {
  memory.delete(ipHash);
}

export async function checkLoginRate(
  supabase: SupabaseClient | null,
  ipHash: string,
): Promise<RateOutcome> {
  if (!supabase) {
    return checkMemory(ipHash);
  }

  const { data, error } = await supabase
    .from("admin_login_rate")
    .select("failed_count, window_start, locked_until")
    .eq("ip_hash", ipHash)
    .maybeSingle();

  if (error) {
    console.error("[admin login] rate read:", error.message);
    return checkMemory(ipHash);
  }

  if (!data) return { ok: true };

  const nowMs = Date.now();
  const lockedUntil = data.locked_until
    ? new Date(data.locked_until).getTime()
    : 0;
  if (lockedUntil > nowMs) {
    return {
      ok: false,
      reason: "locked",
      retryAfterSec: Math.ceil((lockedUntil - nowMs) / 1000),
    };
  }

  const ws = data.window_start ? new Date(data.window_start).getTime() : 0;
  if (ws && nowMs - ws > WINDOW_MS) {
    await supabase.from("admin_login_rate").delete().eq("ip_hash", ipHash);
  }

  return { ok: true };
}

export async function recordFailedAttempt(
  supabase: SupabaseClient | null,
  ipHash: string,
): Promise<void> {
  if (!supabase) {
    recordMemoryFailure(ipHash);
    return;
  }

  try {
    await recordFailedAttemptDb(supabase, ipHash);
  } catch (e) {
    console.error("[admin login] rate write:", e);
    recordMemoryFailure(ipHash);
  }
}

async function recordFailedAttemptDb(
  supabase: SupabaseClient,
  ipHash: string,
): Promise<void> {
  const { data: row } = await supabase
    .from("admin_login_rate")
    .select("failed_count, window_start")
    .eq("ip_hash", ipHash)
    .maybeSingle();

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  if (!row) {
    await supabase.from("admin_login_rate").insert({
      ip_hash: ipHash,
      failed_count: 1,
      window_start: nowIso,
      locked_until: null,
    });
    return;
  }

  const ws = row.window_start ? new Date(row.window_start).getTime() : nowMs;
  if (nowMs - ws > WINDOW_MS) {
    await supabase
      .from("admin_login_rate")
      .update({
        failed_count: 1,
        window_start: nowIso,
        locked_until: null,
      })
      .eq("ip_hash", ipHash);
    return;
  }

  const fails = (row.failed_count ?? 0) + 1;
  if (fails >= MAX_FAILS) {
    await supabase
      .from("admin_login_rate")
      .update({
        failed_count: 0,
        window_start: nowIso,
        locked_until: new Date(nowMs + LOCKOUT_MS).toISOString(),
      })
      .eq("ip_hash", ipHash);
    return;
  }

  await supabase
    .from("admin_login_rate")
    .update({ failed_count: fails })
    .eq("ip_hash", ipHash);
}


export async function clearRateOnSuccess(
  supabase: SupabaseClient | null,
  ipHash: string,
): Promise<void> {
  if (!supabase) {
    clearMemory(ipHash);
    return;
  }
  try {
    await supabase.from("admin_login_rate").delete().eq("ip_hash", ipHash);
  } catch (e) {
    console.error("[admin login] rate clear:", e);
    clearMemory(ipHash);
  }
}

export function makeIpHash(ip: string, pepper: string): string {
  return hashIpForRateLimit(ip, pepper);
}

export function createRateLimitClient(
  url: string,
  serviceKey: string,
): SupabaseClient | null {
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
