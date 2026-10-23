import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Language, useI18n } from "@/i18n/I18nProvider";

const LANGS: Array<{ key: Language; label: string }> = [
  { key: "pt", label: "PT" },
  { key: "en", label: "EN" },
  { key: "fr", label: "FR" },
];

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();

  return (
    <div className="inline-flex items-center gap-1 rounded-md bg-card/80 p-1 ring-1 ring-border backdrop-blur">
      {LANGS.map((l) => (
        <Button
          key={l.key}
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setLang(l.key)}
          className={cn(
            "h-8 px-2 font-display text-[10px] font-semibold uppercase tracking-[0.22em]",
            l.key === lang && "bg-accent",
          )}
        >
          {l.label}
        </Button>
      ))}
    </div>
  );
}
