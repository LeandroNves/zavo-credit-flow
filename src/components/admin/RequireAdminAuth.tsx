import type { ReactNode } from "react";

export function RequireAdminAuth({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
