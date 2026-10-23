import React from "react";

/**
 * Placeholder de proteção (UI + rotas).
 * Quando você quiser login real, a gente troca por autenticação.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
