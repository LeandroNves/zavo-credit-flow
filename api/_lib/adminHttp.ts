import type { IncomingMessage, ServerResponse } from "node:http";
import {
  getAdminPassword,
  getAdminUsername,
  getSessionSecret,
  getSupabaseServiceRole,
  getSupabaseUrl,
} from "./adminEnv.js";
import {
  checkLoginRate,
  clearRateOnSuccess,
  createRateLimitClient,
  makeIpHash,
  recordFailedAttempt,
} from "./rateLimit.js";
import { timingSafeEqualStr } from "./cryptoUtil.js";
import {
  buildSessionCookieValue,
  parseSessionCookie,
  serializeSessionClearCookie,
  serializeSessionSetCookie,
} from "./sessionCookie.js";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function getClientIp(req: IncomingMessage): string {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string") return xff.split(",")[0]!.trim();
  if (Array.isArray(xff) && xff[0]) return xff[0].split(",")[0]!.trim();
  const xr = req.headers["x-real-ip"];
  if (typeof xr === "string") return xr.trim();
  return req.socket?.remoteAddress ?? "0.0.0.0";
}

function isHttps(req: IncomingMessage): boolean {
  const proto = req.headers["x-forwarded-proto"];
  if (proto === "https") return true;
  if (process.env.VERCEL === "1") return true;
  return false;
}

async function readJsonBody(
  req: IncomingMessage & { body?: unknown },
): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body as Record<string, unknown>;
  }
  const raw = await new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c as Buffer));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function jitterDelay(): Promise<void> {
  await sleep(180 + Math.floor(Math.random() * 420));
}

export async function handleAdminSession(
  env: NodeJS.ProcessEnv,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const secret = getSessionSecret(env);
  const user = getAdminUsername(env);
  const pass = getAdminPassword(env);
  if (!secret || !user || !pass) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "admin_not_configured" }));
    return;
  }
  const cookie = req.headers.cookie;
  const { ok } = parseSessionCookie(secret, cookie);
  res.setHeader("Content-Type", "application/json");
  if (ok) {
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  res.statusCode = 401;
  res.end(JSON.stringify({ ok: false }));
}

export async function handleAdminLogout(
  env: NodeJS.ProcessEnv,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const secret = getSessionSecret(env);
  const secure = isHttps(req);
  res.statusCode = 204;
  if (secret) {
    res.setHeader(
      "Set-Cookie",
      serializeSessionClearCookie({ secure }),
    );
  }
  res.end();
}

export async function handleAdminLogin(
  env: NodeJS.ProcessEnv,
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
): Promise<void> {
  console.log(
    "[admin login] processando… (atraso aleatório de segurança em seguida)",
  );
  await jitterDelay();

  const expectedUser = getAdminUsername(env);
  const expectedPass = getAdminPassword(env);
  const secret = getSessionSecret(env);

  if (!expectedUser || !expectedPass || !secret) {
    console.warn(
      "[admin login] config incompleta no processo Node (comprimentos):",
      JSON.stringify({
        userLen: expectedUser.length,
        passLen: expectedPass.length,
        secretLen: secret.length,
      }),
    );
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        ok: false,
        error:
          "Configure ADMIN_USERNAME, ADMIN_PASSWORD e ADMIN_SESSION_SECRET (servidor).",
      }),
    );
    return;
  }

  const supabase = createRateLimitClient(
    getSupabaseUrl(env),
    getSupabaseServiceRole(env),
  );

  const ip = getClientIp(req);
  const ipHash = makeIpHash(ip, secret);

  const rate = await checkLoginRate(supabase, ipHash);
  if (rate.ok === false) {
    res.statusCode = 429;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Retry-After", String(rate.retryAfterSec));
    res.end(
      JSON.stringify({
        ok: false,
        error: "too_many_attempts",
        retryAfterSec: rate.retryAfterSec,
      }),
    );
    return;
  }

  const body = await readJsonBody(req);
  const username =
    typeof body.username === "string" ? body.username.replace(/\r/g, "") : "";
  const password =
    typeof body.password === "string" ? body.password.replace(/\r/g, "") : "";

  const userOk = timingSafeEqualStr(username.trim(), expectedUser);
  const passOk = timingSafeEqualStr(password.trim(), expectedPass);

  if (!userOk || !passOk) {
    console.warn(
      "[admin login] credenciais não batem (só comprimentos):",
      JSON.stringify({
        expectedUserLen: expectedUser.length,
        gotUserLen: username.trim().length,
        expectedPassLen: expectedPass.length,
        gotPassLen: password.trim().length,
        bodyKeys: Object.keys(body),
      }),
    );
    await sleep(120 + Math.floor(Math.random() * 280));
    await recordFailedAttempt(supabase, ipHash);
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "invalid_credentials" }));
    return;
  }

  await clearRateOnSuccess(supabase, ipHash);
  const token = buildSessionCookieValue(secret);
  const secure = isHttps(req);
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.setHeader(
    "Set-Cookie",
    serializeSessionSetCookie(token, {
      secure,
      maxAgeSec: 8 * 60 * 60,
    }),
  );
  res.end(JSON.stringify({ ok: true }));
}
