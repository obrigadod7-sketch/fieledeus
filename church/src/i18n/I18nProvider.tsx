import React, { createContext, useContext, useMemo, useState } from "react";

export type Language = "pt" | "en" | "fr";

type I18nContextValue = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const DICT: Record<Language, Record<string, string>> = {
  pt: {
    menu: "MENU",
    live: "AO VIVO",
    mute: "Silenciar",
    unmute: "Ativar som",
    radio_play: "Tocar rádio",
    radio_pause: "Pausar rádio",

    nav_home: "INÍCIO",
    nav_estudo: "ESTUDO",
    nav_cultos: "CULTOS AO VIVO",
    nav_missoes: "MISSÕES",
    nav_ministerios: "MINISTÉRIOS",
    nav_oracao: "PEDIDOS DE ORAÇÃO",
    nav_infantil: "INFANTIL",
    nav_dashboard_kids: "PAINEL INFANTIL",
    nav_cantina: "CANTINA",
    nav_celulas: "CÉLULAS",
    nav_familia_pastoral: "FAMÍLIA PASTORAL",

    home_hero_aria: "Hero",
    home_hero_alt: "Banner da Missão Evangélica Lusitana",
    home_title: "Missão Evangélica\nLusitana",
    home_subtitle: "UMA IGREJA UMA FAMÍLIA!",

    home_study_desktop_aria: "Estudo e oração",
    home_study_mobile_aria: "Estudo bíblico",
    home_participe_estudo: "PARTICIPE DO\nESTUDO BÍBLICO",
    home_peca_oracao: "PEÇA\nORAÇÃO",
    home_estudo_btn: "CLIQUE AQUI",
    home_peca_oracao_btn: "CLIQUE AQUI",

    home_cards_aria: "Cultos e células",
    home_cultos: "CULTOS AO VIVO",
    home_celulas: "CÉLULAS",
    home_informacoes: "INFORMAÇÕES",

    home_pastoral_aria: "Família pastoral",
    home_familia_pastoral: "Família pastoral",

    live_title: "Cultos ao Vivo",
    live_subtitle: "Assista cultos, pregações, louvor e estudos — tudo dentro do Website.",
    live_kicker_live: "Ao vivo e replays",
    live_kicker_sermons: "Pregações",
    live_kicker_worship: "Louvor",
    live_kicker_studies: "Estudos",
    watch_now: "ASSISTIR AGORA",
    see_categories: "VER CATEGORIAS",
    catalog: "Catálogo",
    videos_count: "vídeos",
    cat_live: "Cultos ao Vivo",
    cat_sermons: "Pregações",
    cat_worship: "Louvor e Adoração",
    cat_study_romans: "Estudo de Romanos",

    page_estudo_title: "Estudo",
    page_cultos_title: "Cultos ao Vivo",
    page_cantina_title: "Cantina",
    page_missoes_title: "Missões",
    page_ministerios_title: "Ministérios da Igreja",
    page_kids_title: "Infantil",
    page_jovens_title: "Ministério dos Jovens",

    footer_rights: "Todos os direitos reservados.",
  },
  en: {
    menu: "MENU",
    live: "LIVE",
    mute: "Mute",
    unmute: "Unmute",
    radio_play: "Play radio",
    radio_pause: "Pause radio",

    nav_home: "HOME",
    nav_estudo: "STUDY",
    nav_cultos: "SERVICES",
    nav_missoes: "MISSIONS",
    nav_ministerios: "MINISTRIES",
    nav_oracao: "REQUEST PRAYER",
    nav_infantil: "KIDS",
    nav_dashboard_kids: "KIDS DASHBOARD",
    nav_cantina: "CAFETERIA",
    nav_celulas: "HOME GROUPS",
    nav_familia_pastoral: "PASTORAL FAMILY",

    home_hero_aria: "Hero",
    home_hero_alt: "Missão Evangélica Lusitana banner",
    home_title: "Missão Evangélica\nLusitana",
    home_subtitle: "ONE CHURCH ONE FAMILY!",

    home_study_desktop_aria: "Study and prayer",
    home_study_mobile_aria: "Bible study",
    home_participe_estudo: "JOIN THE\nBIBLE STUDY",
    home_peca_oracao: "REQUEST\nPRAYER",
    home_estudo_btn: "CLICK HERE",
    home_peca_oracao_btn: "CLICK HERE",

    home_cards_aria: "Services and groups",
    home_cultos: "LIVE SERVICES",
    home_celulas: "HOME GROUPS",
    home_informacoes: "DETAILS",

    home_pastoral_aria: "Pastoral family",
    home_familia_pastoral: "Pastoral family",

    live_title: "Live Services",
    live_subtitle: "Watch services, sermons, worship and studies — all inside the Website.",
    live_kicker_live: "Live & replays",
    live_kicker_sermons: "Sermons",
    live_kicker_worship: "Worship",
    live_kicker_studies: "Studies",
    watch_now: "WATCH NOW",
    see_categories: "SEE CATEGORIES",
    catalog: "Catalog",
    videos_count: "videos",
    cat_live: "Live Services",
    cat_sermons: "Sermons",
    cat_worship: "Worship",
    cat_study_romans: "Study of Romans",

    page_estudo_title: "Study",
    page_cultos_title: "Live Services",
    page_cantina_title: "Cafeteria",
    page_missoes_title: "Missions",
    page_ministerios_title: "Church ministries",
    page_kids_title: "Kids",
    page_jovens_title: "Youth ministry",

    footer_rights: "All rights reserved.",
  },
  fr: {
    menu: "MENU",
    live: "LIVE",
    mute: "Couper le son",
    unmute: "Activer le son",
    radio_play: "Lire la radio",
    radio_pause: "Pause",

    nav_home: "HOME",
    nav_estudo: "ÉTUDE",
    nav_cultos: "CULTE",
    nav_missoes: "MISSIONS",
    nav_ministerios: "MINISTÈRES",
    nav_oracao: "PRIÈRE",
    nav_infantil: "ENFANTS",
    nav_dashboard_kids: "TABLEAU ENFANTS",
    nav_cantina: "CAFÉTÉRIA",
    nav_celulas: "GROUPES",
    nav_familia_pastoral: "FAMILLE PASTORALE",

    home_hero_aria: "Hero",
    home_hero_alt: "Bannière Missão Evangélica Lusitana",
    home_title: "Missão Evangélica\nLusitana",
    home_subtitle: "UNE ÉGLISE UNE FAMILLE !",

    home_study_desktop_aria: "Étude et prière",
    home_study_mobile_aria: "Étude biblique",
    home_participe_estudo: "PARTICIPEZ À\nL'ÉTUDE BIBLIQUE",
    home_peca_oracao: "DEMANDEZ\nPRIÈRE",
    home_estudo_btn: "CLIQUEZ ICI",
    home_peca_oracao_btn: "CLIQUEZ ICI",

    home_cards_aria: "Culte et groupes",
    home_cultos: "CULTE EN DIRECT",
    home_celulas: "GROUPES",
    home_informacoes: "INFOS",

    home_pastoral_aria: "Famille pastorale",
    home_familia_pastoral: "Famille pastorale",

    live_title: "Culte en direct",
    live_subtitle: "Regardez cultes, prédications, louange et études — tout sur le site.",
    live_kicker_live: "Live & replays",
    live_kicker_sermons: "Prédications",
    live_kicker_worship: "Louange",
    live_kicker_studies: "Études",
    watch_now: "REGARDER",
    see_categories: "VOIR CATÉGORIES",
    catalog: "Catalogue",
    videos_count: "vidéos",
    cat_live: "Culte en direct",
    cat_sermons: "Prédications",
    cat_worship: "Louange",
    cat_study_romans: "Étude de Romains",

    page_estudo_title: "Étude",
    page_cultos_title: "Culte en direct",
    page_cantina_title: "Cafétéria",
    page_missoes_title: "Missions",
    page_ministerios_title: "Ministères",
    page_kids_title: "Enfants",
    page_jovens_title: "Jeunes",

    footer_rights: "Tous droits réservés.",
  },
};

const STORAGE_KEY = "mel-language";

function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "pt";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === "en" || saved === "fr" ? saved : "pt";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>(getInitialLanguage);

  const value = useMemo<I18nContextValue>(() => {
    const t = (key: string) => DICT[lang]?.[key] ?? DICT.pt[key] ?? key;
    return { lang, setLang, t };
  }, [lang]);

  const setLangPersisted = (next: Language) => {
    setLang(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage indisponível — segue sem persistir
    }
  };

  return <I18nContext.Provider value={{ lang, setLang: setLangPersisted, t: value.t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
