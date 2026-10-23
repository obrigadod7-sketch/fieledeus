import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, PauseCircle, PlayCircle, Volume2, VolumeX } from "lucide-react";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";
import { useI18n } from "@/i18n/I18nProvider";

import topoBanner from "@/assets/banner-topo-dia-da-biblia.jpg";

export function ElementorHeader() {
  const { t } = useI18n();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const nav = [
    { href: "/", label: t("nav_home") },
    { href: "/estudo", label: t("nav_estudo") },
    { href: "/cultos-ao-vivo", label: t("nav_cultos") },
    { href: "/missoes", label: t("nav_missoes") },
    { href: "/ministerios", label: t("nav_ministerios") },
    { href: "https://missionevangeliquelusitana.com/pedidos-de-oracao/", label: t("nav_oracao") },
    { href: "/ministerios/ministerio-infantil", label: t("nav_infantil") },
    { href: "/kids/dashboard", label: t("nav_dashboard_kids") },
    { href: "/cantina", label: t("nav_cantina") },
    { href: "#celulas", label: t("nav_celulas") },
    { href: "#pastoral", label: t("nav_familia_pastoral") },
  ];

  useEffect(() => {
    audioRef.current = new Audio("https://igrejamissaolusitana.radiostream321.com/");
    audioRef.current.volume = 0.7;
    
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => {
        // browsers can block autoplay until user gesture; keep UI consistent
        setIsPlaying(false);
      });
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <header className="sticky top-0 z-50 py-4 md:py-3 relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={topoBanner}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-center opacity-60 blur-xl scale-110"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
        <img
          src={topoBanner}
          alt=""
          aria-hidden
          className="relative h-full w-full object-contain object-center"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
        <div aria-hidden className="absolute inset-0 bg-mel-blue700/70 backdrop-blur-sm" />
      </div>

      <div className="relative mx-auto w-full max-w-[1600px] px-6">
        {/* Mobile: barra azul + hamburger central */}
        <div className="flex items-center justify-center md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="h-12 w-12 rounded-md border-0 bg-card text-foreground shadow-elev"
                aria-label="Abrir menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className={
                "inset-0 h-[100dvh] w-screen max-w-none border-0 bg-primary p-0 text-primary-foreground " +
                // Reposiciona e estiliza o botão X padrão do Sheet (para ficar como no print)
                "[&>button]:left-1/2 [&>button]:right-auto [&>button]:top-3 [&>button]:h-12 [&>button]:w-12 [&>button]:-translate-x-1/2 " +
                "[&>button]:rounded-md [&>button]:bg-card [&>button]:opacity-100 [&>button]:shadow-elev " +
                "[&>button>svg]:h-7 [&>button>svg]:w-7 [&>button>svg]:text-foreground"
              }
            >
              <div className="mx-auto flex h-full w-full max-w-[420px] flex-col px-6 pb-10 pt-16">
                <SheetHeader className="items-center text-center">
                  <SheetTitle className="font-display uppercase tracking-[0.18em] text-primary-foreground">
                    {t("menu")}
                  </SheetTitle>
                </SheetHeader>

                <div className="mt-5 flex justify-center">
                  <LanguageSwitcher />
                </div>

                <nav className="mt-6 flex-1 overflow-y-auto" aria-label="Menu">
                  <ul className="grid gap-3">
                    {nav.map((item) => (
                      <li key={item.href}>
                        {item.href.startsWith("/") ? (
                          <Link
                            to={item.href}
                            className="block w-full rounded-none border border-primary/30 bg-card px-6 py-5 text-center font-display text-sm font-semibold uppercase tracking-[0.22em] text-foreground"
                          >
                            {item.label}
                          </Link>
                        ) : (
                          <a
                            href={item.href}
                            className="block w-full rounded-none border border-primary/30 bg-card px-6 py-5 text-center font-display text-sm font-semibold uppercase tracking-[0.22em] text-foreground"
                          >
                            {item.label}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop: rádio + menu */}
        <div className="hidden grid-cols-[15.39%_84.61%] items-center md:grid">
          {/* Rádio (esquerda) */}
          <div className="flex items-center justify-start">
            <div className="inline-flex items-center gap-2.5 rounded-lg bg-gradient-to-br from-card/95 to-card/90 px-3 py-2 shadow-lg ring-1 ring-mel-blue800/20 backdrop-blur-sm">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? t("radio_pause") : t("radio_play")}
                className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-mel-blue700 to-mel-blue800 text-primary-foreground transition-all hover:scale-105 hover:shadow-md active:scale-95"
              >
                {isPlaying ? (
                  <PauseCircle className="h-5 w-5" />
                ) : (
                  <PlayCircle className="h-5 w-5" />
                )}
              </button>

              <span className="inline-flex items-center rounded-sm bg-destructive px-2 py-1 font-display text-[9px] font-bold uppercase tracking-[0.25em] text-destructive-foreground shadow-sm">
                {t("live")}
              </span>

              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? t("unmute") : t("mute")}
                className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-mel-blue700/80 to-mel-blue800/80 text-primary-foreground transition-all hover:scale-105 hover:shadow-md active:scale-95"
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Menu (direita) */}
           <div className="grid grid-cols-[1fr_auto] items-center gap-3">
            <nav className="min-w-0 justify-center md:flex" aria-label="Menu">
              <ul className="flex flex-wrap items-center justify-center gap-y-2">
                {nav.map((item, idx) => (
                  <li key={item.href} className="relative px-[6px]">
                    {item.href.startsWith("/") ? (
                      <Link
                        to={item.href}
                        className="inline-flex items-center font-display text-[13px] font-normal uppercase tracking-[0.22em] text-primary-foreground hover:text-primary-foreground/80 2xl:text-[15px] 2xl:tracking-[0.28em]"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <a
                        href={item.href}
                        className="inline-flex items-center font-display text-[13px] font-normal uppercase tracking-[0.22em] text-primary-foreground hover:text-primary-foreground/80 2xl:text-[15px] 2xl:tracking-[0.28em]"
                      >
                        {item.label}
                      </a>
                    )}

                    {/* divisores */}
                    {idx !== nav.length - 1 && (
                      <span
                        aria-hidden
                        className="absolute right-[-1px] top-1/2 hidden h-[30px] w-[2px] -translate-y-1/2 border-l-2 border-double border-mel-divider xl:block"
                      />
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex justify-end">
              <LanguageSwitcher />
            </div>

            {/* Desktop: mantém hamburger escondido */}
            <div className="hidden justify-end" aria-hidden />
          </div>
        </div>
      </div>
    </header>
  );
}
