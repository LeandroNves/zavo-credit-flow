/**
 * Credenciais e segredos só no servidor (nunca prefixo VITE_).
 * Em dev local, aceita fallback VITE_ADMIN_* para o mesmo .env.local do Vite.
 */
function cleanEnvValue(s: string): string {
  return s.replace(/\r/g, "").trim();
}

export function getAdminUsername(env: NodeJS.ProcessEnv): string {
  return cleanEnvValue(
    env.ADMIN_USERNAME ?? env.VITE_ADMIN_USERNAME ?? "",
  );
}

export function getAdminPassword(env: NodeJS.ProcessEnv): string {
  return cleanEnvValue(
    env.ADMIN_PASSWORD ?? env.VITE_ADMIN_PASSWORD ?? "",
  );
}

export function getSessionSecret(env: NodeJS.ProcessEnv): string {
  return cleanEnvValue(env.ADMIN_SESSION_SECRET ?? "");
}

export function getSupabaseUrl(env: NodeJS.ProcessEnv): string {
  return (env.SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? "").trim();
}

export function getSupabaseServiceRole(env: NodeJS.ProcessEnv): string {
  return (env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
}
