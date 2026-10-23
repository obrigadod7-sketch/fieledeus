import { useI18n } from "@/i18n/I18nProvider";

export function SiteFooter() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-8 text-center">
        <p className="font-display text-xs uppercase tracking-[0.22em] text-muted-foreground">
          © {new Date().getFullYear()} — {t("footer_rights")}
        </p>
      </div>
    </footer>
  );
}
