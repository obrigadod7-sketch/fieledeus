import { NavLink, Outlet } from "react-router-dom";

export default function KidsDashboardLayout({ basePath = "/kids/dashboard" }: { basePath?: string }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="container flex items-center justify-between py-4">
          <p className="font-display text-sm uppercase tracking-[0.22em]">Kids Dashboard</p>
          <nav className="flex items-center gap-4 text-sm">
            <NavLink to={`${basePath}`} end className="underline-offset-4 hover:underline">
              Home
            </NavLink>
            <NavLink to={`${basePath}/criancas`} className="underline-offset-4 hover:underline">
              Crianças
            </NavLink>
            <NavLink to={`${basePath}/eventos`} className="underline-offset-4 hover:underline">
              Eventos
            </NavLink>
            <NavLink to={`${basePath}/checkin`} className="underline-offset-4 hover:underline">
              Check-in
            </NavLink>
            <NavLink to={`${basePath}/leads`} className="underline-offset-4 hover:underline">
              Leads
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
