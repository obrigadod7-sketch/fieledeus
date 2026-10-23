import { ReactNode } from "react";
import paperTexture from "@/assets/texture-paper-fine.png";

type PageHeroProps = {
  image: string;
  kickers?: string[];
  title: string;
  subtitle?: string;
  children?: ReactNode;
};

export function PageHero({ image, kickers = [], title, subtitle, children }: PageHeroProps) {
  return (
    <section aria-label={title} className="relative overflow-hidden">
      <div className="relative w-full min-h-[360px] sm:min-h-[440px] md:min-h-[520px]">
        <img
          src={image}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />

        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_20%,hsl(var(--primary-foreground)/0.14),transparent_60%),linear-gradient(to_bottom,hsl(var(--mel-overlay)/0.78),hsl(var(--mel-overlay)/0.38),hsl(var(--background)))]"
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-25 mix-blend-soft-light"
          style={{ backgroundImage: `url(${paperTexture})`, backgroundRepeat: "repeat" }}
        />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background to-transparent" />

        <div className="relative z-10 container flex min-h-[360px] flex-col justify-end pb-10 sm:min-h-[440px] sm:pb-12 md:min-h-[520px] md:pb-14">
          {kickers.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-primary-foreground/85">
              {kickers.map((k) => (
                <span
                  key={k}
                  className="inline-flex items-center rounded-full border border-primary-foreground/20 bg-mel-overlay/45 px-3 py-1 backdrop-blur"
                >
                  {k}
                </span>
              ))}
            </div>
          )}

          <h1 className="mt-4 max-w-[820px] font-display text-[38px] font-semibold leading-[1.04] text-primary-foreground drop-shadow md:text-[62px]">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-4 max-w-[720px] text-sm text-primary-foreground/90 md:text-base">{subtitle}</p>
          )}

          {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
        </div>
      </div>
    </section>
  );
}

export function HeroButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex h-12 items-center justify-center rounded-md bg-card/90 px-6 font-display text-[12px] font-semibold uppercase tracking-[0.32em] text-foreground shadow-elev ring-1 ring-border backdrop-blur transition-transform duration-200 hover:-translate-y-0.5"
    >
      {children}
    </a>
  );
}

export function HeroGhostButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex h-12 items-center justify-center rounded-md border border-primary-foreground/35 bg-mel-overlay/25 px-6 font-display text-[12px] font-semibold uppercase tracking-[0.32em] text-primary-foreground backdrop-blur transition-colors hover:bg-primary-foreground/10"
    >
      {children}
    </a>
  );
}
