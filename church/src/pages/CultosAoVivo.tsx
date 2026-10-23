import paperTexture from "@/assets/texture-paper-fine.png";
import heroImage from "@/assets/banner-hero-cultos.jpg";
import { ElementorHeader } from "@/components/site/ElementorHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Play } from "lucide-react";
import { useMemo, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";

type VideoItem = {
  id: string;
  title: string;
  categoryKey: "cat_live" | "cat_sermons" | "cat_worship" | "cat_study_romans";
};

const VIDEOS: VideoItem[] = [
  { id: "XNEC_80MaPs", title: "CULTO DE SANTA CEIA E BATISMO", categoryKey: "cat_live" },
  { id: "L_KuaxI3gQU", title: "CULTO INFANTIL", categoryKey: "cat_live" },
  { id: "_hjwchFtLlU", title: "CULTO DA FAMILIA", categoryKey: "cat_live" },
  { id: "brP4xR5QYoA", title: "CULTO DE MISSOES", categoryKey: "cat_live" },
  { id: "W7SaeIuOLK8", title: "CULTO DA FAMILIA", categoryKey: "cat_live" },
  { id: "aUbYJM8IzQQ", title: "CULTO DE SANTA CEIA", categoryKey: "cat_live" },

  {
    id: "77re98C5M4w",
    title: "Batismo, a identificação do Cristão com Cristo! Romanos 6:1-5",
    categoryKey: "cat_sermons",
  },
  {
    id: "RCvX4gbw-S0",
    title: "Entendendo o perdão para perdoar! Mateus 18:21-35",
    categoryKey: "cat_sermons",
  },
  { id: "mUG8K1dOdKc", title: "O plano perfeito que muda vidas! Efésios 2:8", categoryKey: "cat_sermons" },
  { id: "v4ya0lOhpzc", title: "Maldição Hereditária… Será Mesmo? Êxodo 20:5-6 // Ezequiel 18", categoryKey: "cat_sermons" },
  { id: "Oa3VAsmGXTc", title: "Batalha Espiritual, como funciona? Efésios 6:10-18", categoryKey: "cat_sermons" },
  { id: "F9rB4g0npbQ", title: "Se alguém não ama o Senhor, seja anátema. Maranata! 1 Coríntios 16:22", categoryKey: "cat_sermons" },

  { id: "YpscpENRXG4", title: "Ministério de Louvor Pontault Combault 12/10/2025", categoryKey: "cat_worship" },
  { id: "mt-Sr8zOGwo", title: "Ministério de Louvor Pontault Combault 5/10/2025", categoryKey: "cat_worship" },
  { id: "EaNUkkV0ihQ", title: "Santo para sempre! Louvor e ministração", categoryKey: "cat_worship" },
  { id: "ucLdUy7KwNM", title: "Tu és digno de tudo!", categoryKey: "cat_worship" },
  { id: "8744B-OYl30", title: "Quem é esse!!", categoryKey: "cat_worship" },
  { id: "FTn9qupoGck", title: "Glorioso dia", categoryKey: "cat_worship" },

  { id: "JjIV4WGG9Xg", title: "Estudo da carta aos Romanos — cap. 6", categoryKey: "cat_study_romans" },
  { id: "v82ER-RnHNA", title: "Estudo da carta aos Romanos — cap. 5", categoryKey: "cat_study_romans" },
  { id: "bu37us09lBs", title: "Estudo da carta aos Romanos — cap. 4", categoryKey: "cat_study_romans" },
  { id: "AqAyCkrq3Ik", title: "Estudo da carta aos Romanos — cap. 3", categoryKey: "cat_study_romans" },
  { id: "x13b9SScRkE", title: "Estudo da carta aos Romanos — cap. 2", categoryKey: "cat_study_romans" },
  { id: "uITUueQwN0E", title: "Estudo da carta aos Romanos — introdução e cap. 1", categoryKey: "cat_study_romans" },
];

function getYoutubeThumb(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export default function CultosAoVivo() {
  const [selected, setSelected] = useState<VideoItem | null>(null);
  const { t } = useI18n();

  const categories = useMemo(() => {
    const map = new Map<VideoItem["categoryKey"], VideoItem[]>();
    for (const v of VIDEOS) {
      map.set(v.categoryKey, [...(map.get(v.categoryKey) ?? []), v]);
    }
    return Array.from(map.entries());
  }, []);

  const hero = categories[0]?.[1]?.[0] ?? VIDEOS[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ElementorHeader />

      <main>
        <section aria-label={t("live_title")} className="relative overflow-hidden">
          <div className="relative w-full min-h-[420px] sm:min-h-[520px] md:min-h-[640px] lg:min-h-[720px]">
            <img
              src={heroImage}
              alt="Cultos ao Vivo"
              className="absolute inset-0 h-full w-full object-cover object-[50%_35%] md:object-[50%_30%] lg:object-[50%_28%]"
              loading="eager"
            />

            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_20%,hsl(var(--primary-foreground)/0.14),transparent_60%),linear-gradient(to_bottom,hsl(var(--mel-overlay)/0.78),hsl(var(--mel-overlay)/0.32),hsl(var(--background)))]"
            />

            <div
              aria-hidden
              className="absolute inset-0 opacity-25 mix-blend-soft-light"
              style={{ backgroundImage: `url(${paperTexture})`, backgroundRepeat: "repeat" }}
            />

            <div aria-hidden className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />

            <div className="relative z-10 container flex min-h-[420px] flex-col justify-end pb-12 sm:min-h-[520px] sm:pb-14 md:min-h-[640px] md:pb-16 lg:min-h-[720px]">
              <div className="flex flex-wrap items-center gap-2 text-xs text-primary-foreground/80">
                <span className="inline-flex items-center rounded-full border border-primary-foreground/20 bg-mel-overlay/45 px-3 py-1 backdrop-blur">
                  {t("live_kicker_live")}
                </span>
                <span className="inline-flex items-center rounded-full border border-primary-foreground/20 bg-mel-overlay/45 px-3 py-1 backdrop-blur">
                  {t("live_kicker_sermons")}
                </span>
                <span className="inline-flex items-center rounded-full border border-primary-foreground/20 bg-mel-overlay/45 px-3 py-1 backdrop-blur">
                  {t("live_kicker_worship")}
                </span>
                <span className="inline-flex items-center rounded-full border border-primary-foreground/20 bg-mel-overlay/45 px-3 py-1 backdrop-blur">
                  {t("live_kicker_studies")}
                </span>
              </div>

              <h1 className="mt-4 max-w-[820px] font-display text-[44px] font-semibold leading-[1.02] text-primary-foreground drop-shadow md:text-[72px]">
                {t("live_title")}
              </h1>
              <p className="mt-4 max-w-[720px] text-sm text-primary-foreground/90 md:text-base">
                {t("live_subtitle")}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setSelected(hero)}
                  className="inline-flex h-12 items-center justify-center rounded-md bg-card/90 px-6 font-display text-[12px] font-semibold uppercase tracking-[0.35em] text-foreground shadow-elev ring-1 ring-border backdrop-blur transition-transform duration-200 hover:-translate-y-0.5"
                >
                  {t("watch_now")}
                </button>

                <a
                  href="#catalogo"
                  className="inline-flex h-12 items-center justify-center rounded-md border border-primary-foreground/35 bg-mel-overlay/25 px-6 font-display text-[12px] font-semibold uppercase tracking-[0.35em] text-primary-foreground backdrop-blur transition-colors hover:bg-primary-foreground/10"
                >
                  {t("see_categories")}
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="catalogo" aria-label={t("catalog")} className="bg-background">
          <div className="container space-y-12 py-10 md:py-16">
            {categories.map(([categoryKey, videos]) => (
              <div key={categoryKey} className="space-y-4">
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="font-display text-[18px] font-semibold text-foreground md:text-[20px]">{t(categoryKey)}</h2>
                  <span className="text-xs text-muted-foreground">
                    {videos.length} {t("videos_count")}
                  </span>
                </div>

                <Carousel opts={{ align: "start", dragFree: true }} className="relative">
                  <CarouselContent className="-ml-3">
                    {videos.map((video) => (
                      <CarouselItem
                        key={video.id}
                        className="basis-[72%] pl-3 sm:basis-[44%] md:basis-[28%] lg:basis-[22%]"
                      >
                        <button
                          type="button"
                          onClick={() => setSelected(video)}
                          className="group relative w-full overflow-hidden rounded-xl bg-card shadow-elev ring-1 ring-border transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={`Assistir: ${video.title}`}
                        >
                          <img
                            src={getYoutubeThumb(video.id)}
                            alt={`Miniatura do vídeo: ${video.title}`}
                            loading="lazy"
                            className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                          />

                          <div className="absolute inset-0 bg-gradient-to-t from-mel-overlay/80 via-mel-overlay/10 to-transparent" />

                          <div className="pointer-events-none absolute inset-0 grid place-items-center">
                            <span className="grid h-12 w-12 place-items-center rounded-full bg-mel-overlay/55 ring-1 ring-primary-foreground/15 opacity-0 backdrop-blur transition-opacity duration-200 group-hover:opacity-100">
                              <Play className="h-5 w-5 text-primary-foreground" aria-hidden />
                            </span>
                          </div>

                          <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                            <p className="line-clamp-2 text-sm font-semibold text-primary-foreground">{video.title}</p>
                          </div>
                        </button>
                      </CarouselItem>
                    ))}
                  </CarouselContent>

                  <CarouselPrevious className="-left-4 hidden md:inline-flex" />
                  <CarouselNext className="-right-4 hidden md:inline-flex" />
                </Carousel>
              </div>
            ))}
          </div>
        </section>

        <Dialog open={!!selected} onOpenChange={(open) => (!open ? setSelected(null) : null)}>
          <DialogContent className="max-w-[1000px] bg-background p-0 sm:rounded-xl">
            {selected ? (
              <div className="overflow-hidden rounded-xl">
                <div className="aspect-video w-full">
                  <iframe
                    title={selected.title}
                    className="h-full w-full"
                    src={`https://www.youtube.com/embed/${selected.id}?autoplay=1&rel=0`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
                <div className="p-5 md:p-6">
                  <h3 className="font-display text-[18px] font-semibold text-foreground md:text-[20px]">{selected.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{t(selected.categoryKey)}</p>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </main>

      <SiteFooter />
    </div>
  );
}
