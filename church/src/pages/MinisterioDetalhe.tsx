import { useParams, Link } from "react-router-dom";
import ministeriosImg from "@/assets/ministerios.jpeg";
import { ElementorHeader } from "@/components/site/ElementorHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PageHero, HeroGhostButton } from "@/components/site/PageHero";
import { Card } from "@/components/ui/card";

type Ministerio = {
  title: string;
  subtitle: string;
  sobre: string;
  encontros: string;
  servir: string;
};

const MINISTERIOS: Record<string, Ministerio> = {
  diaconato: {
    title: "Diaconato",
    subtitle: "Servir com excelência para que ninguém fique desamparado.",
    sobre:
      "Os diáconos cuidam da ordem dos cultos, do acolhimento das visitas e do apoio prático às famílias da igreja.",
    encontros: "Reunião de planeamento no primeiro sábado do mês.",
    servir: "Disponibilidade aos domingos e coração para servir em silêncio.",
  },
  interseccao: {
    title: "Intercessão",
    subtitle: "Sustentando a igreja em oração.",
    sobre: "Grupo dedicado à oração pela igreja, pelos missionários, pelos enfermos e pela cidade.",
    encontros: "Vigílias mensais e correntes de oração durante a semana.",
    servir: "Basta querer orar — juntamo-lo à corrente de oração.",
  },
  "irmaos-a-obra": {
    title: "Irmãos a Obra",
    subtitle: "Mãos à obra em cada necessidade.",
    sobre: "Equipa responsável pela manutenção, montagem e apoio logístico dos eventos da igreja.",
    encontros: "Mutirões aos sábados conforme a agenda de obras.",
    servir: "Qualquer habilidade é bem-vinda: pintura, elétrica, limpeza, transporte.",
  },
  cantina: {
    title: "Cantina",
    subtitle: "Comunhão à mesa.",
    sobre: "Prepara e serve a cantina após os cultos, apoiando financeiramente as ações da igreja.",
    encontros: "Domingos, a partir das 12h30.",
    servir: "Escalas rotativas por família.",
  },
  "ministerio-de-casais": {
    title: "Ministério de Casais",
    subtitle: "Fortalecendo famílias e alianças.",
    sobre: "Encontros, estudos e aconselhamento para casais em todas as fases do casamento.",
    encontros: "Jantar de casais a cada dois meses.",
    servir: "Casais dispostos a acolher e acompanhar outros casais.",
  },
  "grupo-de-senhoras": {
    title: "Grupo de Senhoras",
    subtitle: "Comunhão, oração e crescimento.",
    sobre: "Reúne as irmãs para estudo da Palavra, oração e projetos sociais.",
    encontros: "Encontro mensal ao sábado à tarde.",
    servir: "Aberto a todas as irmãs da igreja.",
  },
  "ministerio-infantil": {
    title: "Ministério Infantil",
    subtitle: "Ensinando a próxima geração.",
    sobre: "Cuida das crianças durante os cultos com aulas por faixa etária e check-in seguro.",
    encontros: "Todos os domingos, durante o culto da família.",
    servir: "Voluntários passam por entrevista e orientação antes de servir.",
  },
};

export default function MinisterioDetalhe() {
  const { slug } = useParams();
  const m = (slug && MINISTERIOS[slug]) || null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ElementorHeader />

      <main>
        <PageHero
          image={ministeriosImg}
          kickers={["Ministérios"]}
          title={m?.title ?? "Ministério"}
          subtitle={m?.subtitle ?? "Este ministério ainda não tem página detalhada."}
        >
          <HeroGhostButton href="/igreja/#/ministerios">Todos os ministérios</HeroGhostButton>
        </PageHero>

        <section aria-label="Sobre o ministério" className="bg-background">
          <div className="container grid gap-4 py-10 md:grid-cols-3 md:py-16">
            <Card className="p-6">
              <h2 className="font-display text-[18px] font-semibold">Sobre</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {m?.sobre ?? "Em breve publicaremos os detalhes deste ministério."}
              </p>
            </Card>
            <Card className="p-6">
              <h2 className="font-display text-[18px] font-semibold">Encontros</h2>
              <p className="mt-2 text-sm text-muted-foreground">{m?.encontros ?? "Consulte a liderança da igreja."}</p>
            </Card>
            <Card className="p-6">
              <h2 className="font-display text-[18px] font-semibold">Como servir</h2>
              <p className="mt-2 text-sm text-muted-foreground">{m?.servir ?? "Fale conosco após o culto."}</p>
            </Card>
          </div>

          <div className="container pb-12">
            <Link to="/ministerios" className="text-sm underline underline-offset-4">
              Voltar para ministérios
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
