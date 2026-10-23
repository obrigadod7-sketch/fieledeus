import heroImage from "@/assets/banner-cultos-ao-vivo-1920.jpg";
import { ElementorHeader } from "@/components/site/ElementorHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PageHero, HeroButton, HeroGhostButton } from "@/components/site/PageHero";
import { Card } from "@/components/ui/card";
import { BookOpen, CalendarDays, Video } from "lucide-react";

const ENCONTROS = [
  {
    dia: "Terça-feira",
    hora: "20h00",
    titulo: "Estudo bíblico pelo Zoom",
    desc: "Estudo expositivo semanal, aberto a toda a igreja e aos amigos que estão longe.",
  },
  {
    dia: "Quinta-feira",
    hora: "20h00",
    titulo: "Escola de discipulado",
    desc: "Fundamentos da fé cristã para novos convertidos e para quem quer aprofundar.",
  },
  {
    dia: "Domingo",
    hora: "10h00",
    titulo: "Escola bíblica dominical",
    desc: "Classes por faixa etária antes do culto da família, presencialmente na igreja.",
  },
];

const SERIES = [
  { titulo: "Carta aos Romanos", desc: "Série completa em vídeo, capítulo a capítulo.", href: "/cultos-ao-vivo" },
  { titulo: "Fundamentos da fé", desc: "Salvação, batismo, Espírito Santo e vida em comunhão.", href: "/cultos-ao-vivo" },
  { titulo: "Família segundo a Bíblia", desc: "Estudos para casais, pais e jovens.", href: "/cultos-ao-vivo" },
];

export default function Estudo() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ElementorHeader />

      <main>
        <PageHero
          image={heroImage}
          kickers={["Zoom", "Presencial", "Séries em vídeo"]}
          title="Estudo Bíblico"
          subtitle="Cresça no conhecimento da Palavra: encontros semanais online e presenciais, e séries completas para estudar quando quiser."
        >
          <HeroButton href="https://missionevangeliquelusitana.com/reunioes-pelo-zoom/">Entrar no Zoom</HeroButton>
          <HeroGhostButton href="#agenda">Ver agenda</HeroGhostButton>
        </PageHero>

        <section id="agenda" aria-label="Agenda de estudos" className="bg-background">
          <div className="container space-y-6 py-10 md:py-16">
            <h2 className="font-display text-[20px] font-semibold text-foreground md:text-[24px]">Encontros semanais</h2>

            <div className="grid gap-4 md:grid-cols-3">
              {ENCONTROS.map((e) => (
                <Card key={e.titulo} className="p-6">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    <CalendarDays className="h-4 w-4" aria-hidden />
                    {e.dia} · {e.hora}
                  </div>
                  <h3 className="mt-3 font-display text-[18px] font-semibold text-foreground">{e.titulo}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{e.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section aria-label="Séries de estudo" className="bg-card">
          <div className="container space-y-6 py-10 md:py-16">
            <h2 className="font-display text-[20px] font-semibold text-foreground md:text-[24px]">Séries em vídeo</h2>

            <div className="grid gap-4 md:grid-cols-3">
              {SERIES.map((s) => (
                <Card key={s.titulo} className="flex flex-col p-6">
                  <BookOpen className="h-5 w-5 text-mel-blue-700" aria-hidden />
                  <h3 className="mt-3 font-display text-[18px] font-semibold text-foreground">{s.titulo}</h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{s.desc}</p>
                  <a
                    href={s.href}
                    className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-mel-blue-700 px-4 font-display text-[10px] font-semibold uppercase tracking-[0.28em] text-primary-foreground"
                  >
                    <Video className="h-4 w-4" aria-hidden />
                    Assistir
                  </a>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
