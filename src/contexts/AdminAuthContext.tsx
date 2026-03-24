import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "zavo_admin_auth";
const ATTEMPTS_KEY = "zavo_admin_attempts";
const LOCKOUT_KEY = "zavo_admin_lockout_until";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 120_000;

type LoginResult =
  | { ok: true }
  | { ok: false; error: string };

type AdminAuthContextValue = {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

function getExpectedCredentials() {
  const username = (import.meta.env.VITE_ADMIN_USERNAME ?? "").trim();
  const password = import.meta.env.VITE_ADMIN_PASSWORD ?? "";
  return { username, password };
}

/** Reduz vazamento por tempo em comparações de string (melhor que === direto). */
function timingSafeEqualStr(a: string, b: string): boolean {
  const aLen = a.length;
  const bLen = b.length;
  const max = Math.max(aLen, bLen);
  let out = aLen !== bLen ? 1 : 0;
  for (let i = 0; i < max; i++) {
    const ac = i < aLen ? a.charCodeAt(i) : 0;
    const bc = i < bLen ? b.charCodeAt(i) : 0;
    out |= ac ^ bc;
  }
  return out === 0;
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  const login = useCallback(async (username: string, password: string) => {
    let lockUntil = 0;
    try {
      lockUntil = Number(sessionStorage.getItem(LOCKOUT_KEY) ?? "0");
    } catch {
      /* ignore */
    }
    if (Date.now() < lockUntil) {
      const secs = Math.ceil((lockUntil - Date.now()) / 1000);
      return { ok: false as const, error: `Muitas tentativas. Aguarde ${secs}s.` };
    }

    const { username: expUser, password: expPass } = getExpectedCredentials();
    if (!expUser || !expPass) {
      return {
        ok: false as const,
        error:
          "Acesso administrativo não configurado. Defina VITE_ADMIN_USERNAME e VITE_ADMIN_PASSWORD (por exemplo em .env.local).",
      };
    }

    const userOk = timingSafeEqualStr(username.trim(), expUser);
    const passOk = timingSafeEqualStr(password, expPass);

    if (!userOk || !passOk) {
      try {
        const raw = sessionStorage.getItem(ATTEMPTS_KEY);
        const attempts = (raw ? parseInt(raw, 10) : 0) + 1;
        sessionStorage.setItem(ATTEMPTS_KEY, String(attempts));
        if (attempts >= MAX_ATTEMPTS) {
          sessionStorage.setItem(LOCKOUT_KEY, String(Date.now() + LOCKOUT_MS));
          sessionStorage.removeItem(ATTEMPTS_KEY);
          return {
            ok: false as const,
            error: "Muitas tentativas incorretas. Tente novamente em alguns minutos.",
          };
        }
      } catch {
        /* ignore */
      }
      return { ok: false as const, error: "Usuário ou senha inválidos." };
    }

    try {
      sessionStorage.removeItem(ATTEMPTS_KEY);
      sessionStorage.removeItem(LOCKOUT_KEY);
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setIsAuthenticated(true);
    return { ok: true as const };
  }, []);

  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, login, logout }),
    [isAuthenticated, login, logout],
  );

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return ctx;
}
