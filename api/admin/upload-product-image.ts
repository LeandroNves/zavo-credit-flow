import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleAdminUploadProductImagePost } from "../_lib/adminProductImagesHttp.js";

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
  await handleAdminUploadProductImagePost(process.env, req, res);
}

