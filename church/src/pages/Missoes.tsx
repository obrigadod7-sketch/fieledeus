import heroImage from "@/assets/missoes-africa-criancas-01.jpeg";
import { ElementorHeader } from "@/components/site/ElementorHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PageHero, HeroButton, HeroGhostButton } from "@/components/site/PageHero";
import { Card } from "@/components/ui/card";
import { Globe2, HandHeart, Users } from "lucide-react";

const CAMPOS = [
  {
    local: "África",
    desc: "Apoio a crianças, distribuição de alimentos e evangelização em comunidades locais.",
  },
  {
    local: "Portugal e Brasil",
    desc: "Plantação de igrejas, apoio a pastores e envio de materiais bíblicos.",
  },
  {
    local: "França",
    desc: "Evangelismo urbano, acolhimento de imigrantes e apoio social às famílias.",
  },
];

const FORMAS = [
  { icon: HandHeart, titulo: "Ofertas missionárias", desc: "Contribua mensalmente para sustentar os campos e os missionários." },
  { icon: Users, titulo: "Vá conosco", desc: "Participe das viagens missionárias e das ações locais da igreja." },
  { icon: Globe2, titulo: "Interceda", desc: "Junte-se ao grupo de oração pelos missionários e pelos povos alcançados." },
];

export default function Missoes() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ElementorHeader />

      <main>
        <PageHero
          image={heroImage}
          kickers={["África", "Europa", "América do Sul"]}
          title="Missões"
          subtitle="“Ide por todo o mundo e pregai o evangelho a toda criatura.” Conheça os campos que apoiamos e participe."
        >
          <HeroButton href="https://missionevangeliquelusitana.com/pedidos-de-oracao/">Interceder</HeroButton>
          <HeroGhostButton href="#participar">Como participar</HeroGhostButton>
        </PageHero>

        <section aria-label="Campos missionários" className="bg-background">
          <div className="container space-y-6 py-10 md:py-16">
            <h2 className="font-display text-[20px] font-semibold text-foreground md:text-[24px]">Campos que apoiamos</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {CAMPOS.map((c) => (
                <Card key={c.local} className="p-6">
                  <h3 className="font-display text-[18px] font-semibold text-foreground">{c.local}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="participar" aria-label="Como participar" className="bg-card">
          <div className="container space-y-6 py-10 md:py-16">
            <h2 className="font-display text-[20px] font-semibold text-foreground md:text-[24px]">Como participar</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {FORMAS.map(({ icon: Icon, titulo, desc }) => (
                <Card key={titulo} className="p-6">
                  <Icon className="h-5 w-5 text-mel-blue-700" aria-hidden />
                  <h3 className="mt-3 font-display text-[18px] font-semibold text-foreground">{titulo}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
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
