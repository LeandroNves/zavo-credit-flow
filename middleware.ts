import { NextResponse, type NextRequest } from "next/server";

function unauthorized() {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Zavo Admin", charset="UTF-8"',
    },
  });
}

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

function parseBasicAuth(header: string | null): { user: string; pass: string } | null {
  if (!header) return null;
  const [scheme, encoded] = header.split(" ");
  if (!scheme || !encoded) return null;
  if (scheme.toLowerCase() !== "basic") return null;
  try {
    const decoded = atob(encoded);
    const idx = decoded.indexOf(":");
    if (idx < 0) return null;
    return { user: decoded.slice(0, idx), pass: decoded.slice(idx + 1) };
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow non-admin routes without auth.
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  // Force logout by returning 401 always. Browser will re-prompt.
  if (pathname.startsWith("/admin/logout")) return unauthorized();

  const expectedUser = (process.env.ADMIN_USERNAME ?? "").trim();
  const expectedPass = process.env.ADMIN_PASSWORD ?? "";

  if (!expectedUser || !expectedPass) {
    // Misconfiguration: fail closed in prod (protect admin anyway).
    return unauthorized();
  }

  const auth = parseBasicAuth(req.headers.get("authorization"));
  if (!auth) return unauthorized();

  const okUser = timingSafeEqualStr(auth.user.trim(), expectedUser);
  const okPass = timingSafeEqualStr(auth.pass, expectedPass);

  if (!okUser || !okPass) return unauthorized();

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

