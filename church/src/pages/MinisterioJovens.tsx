import heroImage from "@/assets/jovens-banner.jpg";
import { ElementorHeader } from "@/components/site/ElementorHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PageHero, HeroButton, HeroGhostButton } from "@/components/site/PageHero";
import { Card } from "@/components/ui/card";
import { Flame, Music4, Users } from "lucide-react";

const ATIVIDADES = [
  { icon: Flame, titulo: "Culto de jovens", desc: "Sábado, 19h30 — louvor, palavra e comunhão." },
  { icon: Users, titulo: "Pequenos grupos", desc: "Encontros durante a semana nas casas, por bairro." },
  { icon: Music4, titulo: "Louvor e mídia", desc: "Equipas de música, som e transmissão abertas a novos voluntários." },
];

export default function MinisterioJovens() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ElementorHeader />

      <main>
        <PageHero
          image={heroImage}
          kickers={["Sábados", "Pequenos grupos", "Louvor"]}
          title="Ministério dos Jovens"
          subtitle="Uma geração que ama a Deus, serve a igreja e alcança amigos. Venha como está — há lugar para si."
        >
          <HeroButton href="/igreja/#/cultos-ao-vivo">Ver cultos</HeroButton>
          <HeroGhostButton href="#atividades">Atividades</HeroGhostButton>
        </PageHero>

        <section id="atividades" aria-label="Atividades" className="bg-background">
          <div className="container space-y-6 py-10 md:py-16">
            <h2 className="font-display text-[20px] font-semibold md:text-[24px]">O que acontece</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {ATIVIDADES.map(({ icon: Icon, titulo, desc }) => (
                <Card key={titulo} className="p-6">
                  <Icon className="h-5 w-5 text-mel-blue-700" aria-hidden />
                  <h3 className="mt-3 font-display text-[18px] font-semibold">{titulo}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section aria-label="Participar" className="bg-card">
          <div className="container py-10 md:py-16">
            <h2 className="font-display text-[20px] font-semibold md:text-[24px]">Quero participar</h2>
            <p className="mt-3 max-w-[680px] text-sm text-muted-foreground">
              Fale com a liderança de jovens no próximo culto ou envie um pedido de oração — respondemos e ajudamos a
              encontrar o pequeno grupo mais próximo de si.
            </p>
            <a
              href="https://missionevangeliquelusitana.com/pedidos-de-oracao/"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-mel-blue-700 px-6 font-display text-[10px] font-semibold uppercase tracking-[0.28em] text-primary-foreground"
            >
              Falar conosco
            </a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
