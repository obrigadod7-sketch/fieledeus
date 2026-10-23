import { NavLink, Outlet } from "react-router-dom";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="container flex items-center justify-between py-4">
          <p className="font-display text-sm uppercase tracking-[0.22em]">Dashboard</p>
          <nav className="flex items-center gap-4 text-sm">
            <NavLink to="/dashboard" end className="underline-offset-4 hover:underline">
              Home
            </NavLink>
            <NavLink to="/dashboard/assistant" className="underline-offset-4 hover:underline">
              Assistant
            </NavLink>
            <NavLink to="/dashboard/membros" className="underline-offset-4 hover:underline">
              Membros
            </NavLink>
            <NavLink to="/dashboard/aluno" className="underline-offset-4 hover:underline">
              Aluno
            </NavLink>
            <NavLink to="/dashboard/kids" className="underline-offset-4 hover:underline">
              Kids
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="container py-8">
        <Outlet />
      </main>
    </div>
  );
}
