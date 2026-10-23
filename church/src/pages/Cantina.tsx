import heroImage from "@/assets/bg-celulas-hero-match.jpg";
import { ElementorHeader } from "@/components/site/ElementorHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PageHero, HeroGhostButton } from "@/components/site/PageHero";
import { Card } from "@/components/ui/card";
import { Clock, Coffee, HeartHandshake } from "lucide-react";

const MENU = [
  { item: "Salgados e pastéis", desc: "Feitos pela equipa da cantina, servidos após os cultos." },
  { item: "Café, chá e sumos", desc: "Para acompanhar a conversa e a comunhão entre irmãos." },
  { item: "Doces e bolos", desc: "Preparados pelas famílias da igreja a cada semana." },
];

export default function Cantina() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ElementorHeader />

      <main>
        <PageHero
          image={heroImage}
          kickers={["Comunhão", "Domingos", "Após os cultos"]}
          title="Cantina"
          subtitle="Um espaço de convívio depois dos cultos. Toda a receita apoia os projetos e os ministérios da igreja."
        >
          <HeroGhostButton href="#horarios">Horários</HeroGhostButton>
        </PageHero>

        <section id="horarios" aria-label="Horários da cantina" className="bg-background">
          <div className="container grid gap-4 py-10 md:grid-cols-3 md:py-16">
            <Card className="p-6">
              <Clock className="h-5 w-5 text-mel-blue-700" aria-hidden />
              <h2 className="mt-3 font-display text-[18px] font-semibold">Domingo</h2>
              <p className="mt-2 text-sm text-muted-foreground">Aberta após o culto da família, a partir das 12h30.</p>
            </Card>
            <Card className="p-6">
              <Coffee className="h-5 w-5 text-mel-blue-700" aria-hidden />
              <h2 className="mt-3 font-display text-[18px] font-semibold">Eventos especiais</h2>
              <p className="mt-2 text-sm text-muted-foreground">Funciona também em batismos, santas ceias e encontros.</p>
            </Card>
            <Card className="p-6">
              <HeartHandshake className="h-5 w-5 text-mel-blue-700" aria-hidden />
              <h2 className="mt-3 font-display text-[18px] font-semibold">Para que serve</h2>
              <p className="mt-2 text-sm text-muted-foreground">O valor arrecadado apoia missões e as obras da igreja.</p>
            </Card>
          </div>
        </section>

        <section aria-label="O que servimos" className="bg-card">
          <div className="container space-y-6 py-10 md:py-16">
            <h2 className="font-display text-[20px] font-semibold md:text-[24px]">O que servimos</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {MENU.map((m) => (
                <Card key={m.item} className="p-6">
                  <h3 className="font-display text-[18px] font-semibold">{m.item}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{m.desc}</p>
                </Card>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Quer servir na cantina? Fale com a liderança ao domingo — sempre há lugar para mais uma família.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
