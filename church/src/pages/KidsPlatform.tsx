import heroImage from "@/assets/cultos.jpeg";
import { ElementorHeader } from "@/components/site/ElementorHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PageHero, HeroButton, HeroGhostButton } from "@/components/site/PageHero";
import { Card } from "@/components/ui/card";
import { Baby, ShieldCheck, Sparkles } from "lucide-react";

const TURMAS = [
  { nome: "Bebés", idade: "0 – 3 anos", desc: "Acolhimento com berçário e cuidadoras durante o culto." },
  { nome: "Crianças", idade: "4 – 7 anos", desc: "Histórias bíblicas, música e atividades criativas." },
  { nome: "Juniores", idade: "8 – 12 anos", desc: "Estudo bíblico dinâmico, jogos e projetos em equipa." },
];

export default function KidsPlatform() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ElementorHeader />

      <main>
        <PageHero
          image={heroImage}
          kickers={["Ministério Infantil", "Check-in seguro", "Domingos"]}
          title="Kids"
          subtitle="Um espaço seguro e alegre onde as crianças conhecem Jesus na linguagem delas, enquanto os pais participam do culto."
        >
          <HeroButton href="/igreja/#/kids/dashboard">Área da equipa</HeroButton>
          <HeroGhostButton href="#turmas">Ver turmas</HeroGhostButton>
        </PageHero>

        <section id="turmas" aria-label="Turmas" className="bg-background">
          <div className="container space-y-6 py-10 md:py-16">
            <h2 className="font-display text-[20px] font-semibold md:text-[24px]">Turmas por idade</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {TURMAS.map((t) => (
                <Card key={t.nome} className="p-6">
                  <Baby className="h-5 w-5 text-mel-blue-700" aria-hidden />
                  <h3 className="mt-3 font-display text-[18px] font-semibold">{t.nome}</h3>
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{t.idade}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section aria-label="Segurança" className="bg-card">
          <div className="container grid gap-4 py-10 md:grid-cols-2 md:py-16">
            <Card className="p-6">
              <ShieldCheck className="h-5 w-5 text-mel-blue-700" aria-hidden />
              <h2 className="mt-3 font-display text-[18px] font-semibold">Check-in e check-out</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Cada criança recebe uma etiqueta com código; só é entregue ao responsável com o código correspondente.
              </p>
            </Card>
            <Card className="p-6">
              <Sparkles className="h-5 w-5 text-mel-blue-700" aria-hidden />
              <h2 className="mt-3 font-display text-[18px] font-semibold">Primeira visita?</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Chegue 10 minutos antes do culto e a equipa faz o registo da sua família na hora.
              </p>
            </Card>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
