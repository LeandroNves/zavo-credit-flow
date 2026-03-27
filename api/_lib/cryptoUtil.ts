import { createHash } from "node:crypto";

export function hashIpForRateLimit(ip: string, pepper: string): string {
  return createHash("sha256")
    .update(`${ip}\0${pepper}`, "utf8")
    .digest("hex");
}

export function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  const max = Math.max(ab.length, bb.length);
  let diff = ab.length !== bb.length ? 1 : 0;
  for (let i = 0; i < max; i++) {
    const ac = i < ab.length ? ab[i]! : 0;
    const bc = i < bb.length ? bb[i]! : 0;
    diff |= ac ^ bc;
  }
  return diff === 0;
}
