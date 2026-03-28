import type { IncomingMessage, ServerResponse } from "node:http";
import type { Connect } from "vite";
import { handleAdminLogin, handleAdminLogout, handleAdminSession } from "./adminHttp.js";

/**
 * Dev server only: expõe /api/admin/* com a mesma lógica das funções na Vercel.
 */
export function createAdminApiMiddleware(
  env: Record<string, string>,
): Connect.NextHandleFunction {
  /** env do Vite por último: valores do .env.local sobrescrevem process.env (ex.: Windows). */
  const merged = { ...process.env, ...env } as NodeJS.ProcessEnv;

  return (req, res, next) => {
    const url = req.url?.split("?")[0] ?? "";
    if (!url.startsWith("/api/admin")) {
      next();
      return;
    }

    const method = req.method ?? "GET";
    const ireq = req as IncomingMessage;
    const ires = res as ServerResponse;

    if (url === "/api/admin/session" && method === "GET") {
      void handleAdminSession(merged, ireq, ires);
      return;
    }
    if (url === "/api/admin/logout" && method === "POST") {
      void handleAdminLogout(merged, ireq, ires);
      return;
    }
    if (url === "/api/admin/login" && method === "POST") {
      console.log("[admin api] POST /api/admin/login (middleware)");
      console.log(
        "[admin api] merged env (só comprimentos):",
        JSON.stringify({
          ADMIN_USERNAME_len: String(merged.ADMIN_USERNAME ?? "").length,
          VITE_ADMIN_USERNAME_len: String(merged.VITE_ADMIN_USERNAME ?? "")
            .length,
          ADMIN_PASSWORD_len: String(merged.ADMIN_PASSWORD ?? "").length,
          ADMIN_SESSION_SECRET_len: String(merged.ADMIN_SESSION_SECRET ?? "")
            .length,
        }),
      );
      void handleAdminLogin(merged, ireq, ires);
      return;
    }

    res.statusCode = 404;
    res.end();
  };
}
