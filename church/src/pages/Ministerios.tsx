import ministeriosImg from "@/assets/ministerios.jpeg";
import { SimplePage } from "@/pages/_shared/SimplePage";
import { useI18n } from "@/i18n/I18nProvider";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

const MINISTERIOS = [
  {
    title: "DIACONATO",
    desc: "Serviço, cuidado e apoio à igreja.",
    slug: "diaconato",
  },
  {
    title: "INTERSECÇÃO",
    desc: "Oração e intercessão pela igreja e pela cidade.",
    slug: "interseccao",
  },
  {
    title: "IRMÃOS A OBRA",
    desc: "Mãos à obra para servir em cada necessidade.",
    slug: "irmaos-a-obra",
  },
  {
    title: "CANTINA",
    desc: "Convivência e apoio às ações da igreja.",
    slug: "cantina",
  },
  {
    title: "MINISTÉRIO DE CASAIS",
    desc: "Fortalecendo famílias e alianças.",
    slug: "ministerio-de-casais",
  },
  {
    title: "GRUPO DE SENHORAS",
    desc: "Comunhão, oração e crescimento.",
    slug: "grupo-de-senhoras",
  },
];

export default function Ministerios() {
  const { t } = useI18n();
  return (
    <SimplePage title={t("page_ministerios_title")}>
      <p className="text-muted-foreground">
        Acompanhe os ministérios e participe. (As fotos oficiais serão adicionadas quando importarmos todos os assets do ZIP.)
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MINISTERIOS.map((m) => (
          <Card key={m.slug} className="overflow-hidden">
            <div className="relative">
              <img src={ministeriosImg} alt="" aria-hidden className="h-36 w-full object-cover" loading="lazy" />
              <div aria-hidden className="absolute inset-0 bg-mel-blue-700/25" />
            </div>
            <div className="p-5">
              <h2 className="font-display text-sm font-semibold uppercase tracking-[0.22em]">{m.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{m.desc}</p>
              <Link
                to={`/ministerios/${m.slug}`}
                className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-md bg-mel-blue-700 px-4 font-display text-[10px] font-semibold uppercase tracking-[0.28em] text-primary-foreground"
              >
                Ver detalhes
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </SimplePage>
  );
}
