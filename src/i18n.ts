import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// French resources
import frCommon from "@/locales/fr/common.json";
import frHome from "@/locales/fr/home.json";
import frFoundations from "@/locales/fr/foundations.json";
import frSession from "@/locales/fr/session.json";
import frResults from "@/locales/fr/results.json";
import frSwipecard from "@/locales/fr/swipecard.json";
import frData from "@/locales/fr/data.json";

// English resources
import enCommon from "@/locales/en/common.json";
import enHome from "@/locales/en/home.json";
import enFoundations from "@/locales/en/foundations.json";
import enSession from "@/locales/en/session.json";
import enResults from "@/locales/en/results.json";
import enSwipecard from "@/locales/en/swipecard.json";
import enData from "@/locales/en/data.json";

// German resources
import deCommon from "@/locales/de/common.json";
import deHome from "@/locales/de/home.json";
import deFoundations from "@/locales/de/foundations.json";
import deSession from "@/locales/de/session.json";
import deResults from "@/locales/de/results.json";
import deSwipecard from "@/locales/de/swipecard.json";
import deData from "@/locales/de/data.json";

export const LOCALES = ["fr", "en", "de"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";

// Guard: only initialise once (handles HMR and module re-imports)
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      fr: {
        common: frCommon,
        home: frHome,
        foundations: frFoundations,
        session: frSession,
        results: frResults,
        swipecard: frSwipecard,
        data: frData,
      },
      en: {
        common: enCommon,
        home: enHome,
        foundations: enFoundations,
        session: enSession,
        results: enResults,
        swipecard: enSwipecard,
        data: enData,
      },
      de: {
        common: deCommon,
        home: deHome,
        foundations: deFoundations,
        session: deSession,
        results: deResults,
        swipecard: deSwipecard,
        data: deData,
      },
    },
    lng: DEFAULT_LOCALE,
    fallbackLng: DEFAULT_LOCALE,
    defaultNS: "common",
    ns: ["common", "home", "foundations", "session", "results", "swipecard", "data"],
    interpolation: {
      escapeValue: false, // React already escapes output
    },
    initAsync: false, // Synchronous init — critical for SSR
  });
}

export default i18n;
