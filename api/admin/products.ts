import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleAdminProductsPost } from "../_lib/adminProductsHttp.js";

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
  await handleAdminProductsPost(process.env, req, res);
}
