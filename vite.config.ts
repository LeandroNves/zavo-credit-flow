import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { defineConfig, loadEnv } from "vite";
import type { ViteDevServer } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import { createAdminApiMiddleware } from "./api/_lib/viteAdminMiddleware";

/** Parse simples de .env (sem multilinha); evita depender do merge do loadEnv com process.env. */
function parseEnvFile(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  const text = content.replace(/^\uFEFF/g, "");
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    const key = t.slice(0, eq).trim().replace(/^\uFEFF/g, "");
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

/**
 * Valores de admin lidos só do arquivo — o loadEnv do Vite sobrescreve com process.env
 * e variáveis vazias no Windows podem apagar o que está no .env.local.
 */
function readAdminEnvFromFiles(cwd: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of [".env", ".env.local"]) {
    const p = join(cwd, name);
    if (!existsSync(p)) continue;
    const parsed = parseEnvFile(readFileSync(p, "utf8"));
    for (const [k, v] of Object.entries(parsed)) {
      if (k.startsWith("ADMIN_") || k.startsWith("VITE_ADMIN_")) {
        out[k] = v;
      }
    }
  }
  return out;
}

export default defineConfig(({ mode }) => {
  const cwd = process.cwd();
  const adminFromFile = readAdminEnvFromFiles(cwd);
  const env = {
    ...loadEnv(mode, cwd, "VITE_"),
    ...loadEnv(mode, cwd, "ADMIN_"),
    ...loadEnv(mode, cwd, "SUPABASE_"),
    ...adminFromFile,
  };
  if (mode === "development") {
    console.log(
      "[vite] admin: chaves carregadas do .env / .env.local →",
      Object.keys(adminFromFile),
    );
  }
  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      {
        name: "zavo-admin-api",
        configureServer(server: ViteDevServer) {
          server.middlewares.use(createAdminApiMiddleware(env));
        },
      },
      react(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",
        devOptions: {
          enabled: false,
        },
        workbox: {
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
              handler: "NetworkOnly",
            },
          ],
        },
        includeAssets: [
          "favicon.svg",
          "robots.txt",
          "apple-touch-icon.png",
          "pwa-192x192.png",
          "pwa-512x512.png",
          "pwa-1024x1024.png",
        ],
        manifest: {
          name: "Zavo",
          short_name: "Zavo",
          description: "Zavo — crédito, parcelas e gestão de contratos.",
          theme_color: "#134e4a",
          background_color: "#ffffff",
          display: "standalone",
          scope: "/",
          start_url: "/",
          icons: [
            {
              src: "/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
            {
              src: "/pwa-1024x1024.png",
              sizes: "1024x1024",
              type: "image/png",
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
    },
  };
});
