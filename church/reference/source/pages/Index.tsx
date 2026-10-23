import heroBanner from "@/assets/oficial-2-1.png";
import pastoralImage from "@/assets/familia-pastoral.png";
import paperTexture from "@/assets/texture-paper-fine.png";
import { ElementorHeader } from "@/components/site/ElementorHeader";
import { PastorsCarousel } from "@/components/site/PastorsCarousel";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useI18n } from "@/i18n/I18nProvider";

const Index = () => {
  const { t } = useI18n();

  const renderMultiline = (text: string) => {
    const parts = text.split("\\n");
    return (
      <>
        {parts.map((p, idx) => (
          <span key={idx}>
            {p}
            {idx < parts.length - 1 ? <br /> : null}
          </span>
        ))}
      </>
    );
  };

  const PhotoOverlay = () => (
    <>
      {/* OVERLAY AZUL (deve ficar acima da imagem e abaixo da textura) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-10 bg-mel-banner3/65 mix-blend-multiply" />
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header sobre o hero (como Elementor) */}
      <ElementorHeader />

      <main>
        {/* HERO (imagem + overlay) */}
         <section
           aria-label={t("home_hero_aria")}
            className="relative w-full overflow-hidden bg-mel-banner3"
         >
           {/*
            * Height strategy:
            * - mobile/tablet: fill the visible viewport (minus the fixed header spacing applied by <main>)
            * - desktop: full screen hero
            */}
            <div className="relative w-full bg-mel-banner3 aspect-[2/1] max-h-[52svh] sm:max-h-[58svh] lg:h-screen lg:max-h-none lg:min-h-[775px] lg:aspect-auto">
           {/*
            * Mobile/Tablet: keep the whole banner (contain) and fill the remaining area with a blurred cover background
            * to avoid black letterbox bars.
            */}
           <img
             src={heroBanner}
             alt=""
             aria-hidden
             className="absolute inset-0 h-full w-full bg-mel-banner3 object-cover object-center opacity-70 blur-xl scale-110 lg:hidden"
             loading="eager"
             decoding="async"
             fetchPriority="high"
           />
           <img
             src={heroBanner}
             alt="Banner da Missão Evangélica Lusitana"
              className="absolute inset-0 h-full w-full object-contain object-center saturate-75 contrast-95 brightness-105 grayscale-[10%] md:object-cover lg:object-cover"
             loading="eager"
             decoding="async"
             fetchPriority="high"
           />

          {/* overlay mais claro (mantém a identidade azul sem escurecer) */}
          <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-mel-overlay/30 to-mel-overlay/30" />

          {/* textura (papel/tecido) — sutil, sentida e não vista */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-20 mix-blend-soft-light"
            style={{ backgroundImage: `url(${paperTexture})`, backgroundRepeat: "repeat" }}
          />

           {/* Conteúdo do hero (sem texto/CTA) - apenas garante o espaçamento/altura */}
           <div className="relative z-30 h-full" />
           </div>
         </section>

        {/* Bloco (desktop) - Estudo bíblico + Oração (como Elementor) */}
        <section aria-label={t("home_study_desktop_aria")} className="hidden bg-mel-blue800 md:block">
          <div className="mx-auto w-full max-w-[1155px] px-6 py-3">
            <div className="grid grid-cols-2 items-stretch gap-6">
              {/* Estudo */}
              <div className="flex h-full flex-col items-center text-center">
                <h2 className="font-display text-[20px] font-semibold uppercase leading-tight text-primary-foreground">
                  {renderMultiline(t("home_participe_estudo"))}
                </h2>
                <div className="mt-auto flex justify-center pt-4">
                  <a
                    className="inline-flex h-11 w-full max-w-[420px] items-center justify-center bg-mel-blue700 px-6 font-display text-[10px] font-semibold uppercase tracking-[0.28em] text-primary-foreground"
                    href="https://missionevangeliquelusitana.com/reunioes-pelo-zoom/"
                  >
                    {t("home_estudo_btn")}
                  </a>
                </div>
              </div>

              {/* Oração */}
              <div className="flex h-full flex-col items-center text-center">
                <h2 className="font-display text-[20px] font-semibold uppercase leading-tight text-primary-foreground">
                  {renderMultiline(t("home_peca_oracao"))}
                </h2>
                <div className="mt-auto flex justify-center pt-4">
                  <a
                    className="inline-flex h-11 w-full max-w-[420px] items-center justify-center bg-mel-blue700 px-6 font-display text-[10px] font-semibold uppercase tracking-[0.28em] text-primary-foreground"
                    href="https://missionevangeliquelusitana.com/pedidos-de-oracao/"
                  >
                    {t("home_peca_oracao_btn")}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bloco (mobile only) - Estudo Bíblico stretched com gradiente e animação */}
        <section
          aria-label={t("home_study_mobile_aria")}
          id="estudo"
          className="relative w-full overflow-hidden bg-mel-blue800 md:hidden"
        >
          <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent to-mel-overlay/20" />
          
           <div className="relative">
              <div className="bg-gradient-to-b from-mel-blue600 to-mel-blue800 px-[20px] py-[18px]">
              <h2 className="animate-fade-in text-center font-display text-[20px] font-semibold uppercase leading-tight text-primary-foreground">
                {renderMultiline(t("home_participe_estudo"))}
              </h2>
              <div className="mt-4 flex justify-center">
                <a
                  className="inline-flex h-11 w-full items-center justify-center bg-mel-blue700 px-6 font-display text-[10px] font-semibold uppercase tracking-[0.28em] text-primary-foreground"
                  href="https://missionevangeliquelusitana.com/reunioes-pelo-zoom/"
                >
                  {t("home_estudo_btn")}
                </a>
              </div>
            </div>
          </div>
        </section>


        {/* 2 cards (Cultos ao vivo / Células) */}
        <section aria-label="Cultos e células" className="bg-gradient-to-br from-mel-blueA to-mel-blueB p-px">
          <div className="grid w-full items-stretch md:grid-cols-2">
            {/* Coluna 1 - Cultos */}
            <div className="relative overflow-hidden bg-mel-banner3">
              {/* Fundo sem imagem (mantém identidade visual) */}
              <div
                aria-hidden
                className="absolute inset-0 z-0 bg-gradient-to-br from-mel-banner2/60 via-mel-banner3/85 to-mel-banner1/60"
              />

              {/* OVERLAY AZUL */}
              <PhotoOverlay />

              {/* CONTEÚDO */}
               <div className="relative z-30 flex min-h-[220px] flex-col items-center justify-center gap-4 px-6 text-center sm:min-h-[240px] md:min-h-[280px] md:px-8">
                <h2 className="font-display text-[24px] font-semibold uppercase tracking-[0.11em] text-mel-ice drop-shadow-md animate-fade-in md:text-[26px]">
                  <a href="/cultos-ao-vivo">{t("home_cultos")}</a>
                </h2>

                <a
                  className="inline-flex h-10 min-w-[180px] items-center justify-center rounded-md bg-card/75 px-7 font-display text-[10px] font-semibold uppercase tracking-[0.32em] text-foreground shadow-elev ring-1 ring-border backdrop-blur-md"
                  href="/cultos-ao-vivo"
                >
                  {t("home_informacoes")}
                </a>
              </div>

              {/* TEXTURA (deve ficar por cima de tudo) */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-20 opacity-24 mix-blend-overlay"
                style={{ backgroundImage: `url(${paperTexture})`, backgroundRepeat: "repeat" }}
              />
            </div>

            {/* Coluna 2 - Células */}
            <div className="relative overflow-hidden bg-mel-banner3">
              {/* Fundo sem imagem (mantém identidade visual) */}
              <div
                aria-hidden
                className="absolute inset-0 z-0 bg-gradient-to-br from-mel-banner2/60 via-mel-banner3/85 to-mel-banner1/60"
              />

              {/* OVERLAY AZUL */}
              <PhotoOverlay />

              {/* CONTEÚDO */}
               <div className="relative z-30 flex min-h-[220px] flex-col items-center justify-center gap-4 px-6 text-center sm:min-h-[240px] md:min-h-[280px] md:px-8">
                <h2 className="font-display text-[24px] font-semibold uppercase tracking-[0.11em] text-mel-ice drop-shadow-md animate-fade-in md:text-[26px]">
                  <a href="https://missionevangeliquelusitana.com/celular-nas-casas/">{t("home_celulas")}</a>
                </h2>

                <a
                  className="inline-flex h-10 min-w-[180px] items-center justify-center rounded-md bg-card/75 px-7 font-display text-[10px] font-semibold uppercase tracking-[0.32em] text-foreground shadow-elev ring-1 ring-border backdrop-blur-md"
                  href="https://missionevangeliquelusitana.com/celular-nas-casas/"
                >
                  {t("home_informacoes")}
                </a>
              </div>

              {/* TEXTURA (deve ficar por cima de tudo) */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-20 opacity-24 mix-blend-overlay"
                style={{ backgroundImage: `url(${paperTexture})`, backgroundRepeat: "repeat" }}
              />
            </div>
          </div>
        </section>

        {/* Família pastoral */}
        <section id="pastoral" aria-label="Família pastoral" className="bg-card p-px">
          <div className="container py-10 text-center">
            <h2 className="font-display text-[2.2em] text-mel-blue800">{t("home_familia_pastoral")}</h2>

            <div className="mt-6">
              <PastorsCarousel />
            </div>

            <img
              src={pastoralImage}
              alt="Família pastoral"
              loading="lazy"
              className="mx-auto mt-6 w-[30%] max-w-[420px] max-[980px]:w-[70%]"
            />
          </div>
        </section>

        {/* Rádio removida a pedido */}
      </main>

      <SiteFooter />
    </div>
  );
};

export default Index;
