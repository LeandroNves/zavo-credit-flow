/**
 * Valida sessão admin via API. Não confie só em r.ok: o rewrite SPA pode devolver
 * index.html com 200 para /api/* se a rota de servidor não existir.
 */
export async function isAdminSessionValid(): Promise<boolean> {
  const r = await fetch("/api/admin/session", { credentials: "include" });
  const ct = r.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    return false;
  }
  const data = (await r.json().catch(() => null)) as { ok?: boolean } | null;
  return r.status === 200 && data?.ok === true;
}
