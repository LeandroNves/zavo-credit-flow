import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleAdminSession } from "../_lib/adminHttp.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET");
    res.end();
    return;
  }
  await handleAdminSession(process.env, req, res);
}
