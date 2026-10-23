import { ReactNode } from "react";
import { ElementorHeader } from "@/components/site/ElementorHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export function SimplePage({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ElementorHeader />
      <main className="container py-10">
        <h1 className="font-display text-4xl tracking-tight">{title}</h1>
        <div className="mt-6">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
