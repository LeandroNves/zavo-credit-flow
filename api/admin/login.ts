import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleAdminLogin } from "../_lib/adminHttp";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    res.end();
    return;
  }
  await handleAdminLogin(process.env, req, res);
}
