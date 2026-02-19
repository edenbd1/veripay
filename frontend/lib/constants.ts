import type { SamplePDF, ErrorInfoEntry } from "./types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const SAMPLE_PDFS: SamplePDF[] = [
  { name: "bulletin_1_sans_erreur_detaille.pdf", label: "1 bulletin sans erreur", hasErrors: false },
  { name: "bulletin_3_sans_erreur_detaille.pdf", label: "3 bulletins sans erreur", hasErrors: false },
  { name: "bulletin_4_5_sans_erreur_detaille.pdf", label: "4-5 bulletins sans erreur", hasErrors: false },
  { name: "bulletin_sans_erreur_version_detaille.pdf", label: "31 bulletins sans erreur", hasErrors: false },
  { name: "bulletin_en_erreur_version_detaille.pdf", label: "12 bulletins avec erreurs", hasErrors: true },
];

export const ERROR_INFO: Record<string, ErrorInfoEntry> = {
  TIAFM: {
    label: "PMSS incorrect",
    description: "Le plafond mensuel de la Sécurité sociale est resté à la valeur 2025 (3 925 €) au lieu de 4 005 € en 2026.",
    color: "amber",
  },
  AAICO: {
    label: "SMIC erroné",
    description: "Erreur de frappe sur le SMIC mensuel (1 832,03 € au lieu de 1 823,03 €).",
    color: "orange",
  },
  RGDUB: {
    label: "Coefficient RGDU",
    description: "Le coefficient T delta de la RGDU est mal paramétré (0,3241 au lieu de 0,3821).",
    color: "red",
  },
};

export const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/analyser", label: "Analyser" },
  { href: "/documentation", label: "Documentation" },
  { href: "/contact", label: "Contact" },
] as const;
