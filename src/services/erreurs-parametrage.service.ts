/**
 * Détection d'erreurs de paramétrage dans les bulletins de paie.
 *
 * Erreurs connues à détecter :
 *   1. TIAFM — Plafond mensuel de la sécurité sociale (PMSS)
 *   2. AAICO — Smic mensuel 151,67 h
 *   3. RGDUB — Coefficient RGDU T delta
 *
 * Le PMSS est détectable directement via les bases T1 des cotisations.
 * Le SMIC et le coefficient RGDU sont détectés indirectement via le montant
 * de la RGDU, en comparant avec un recalcul utilisant les paramètres attendus.
 */

import type { BulletinDetaille } from "../types/bulletin-detaille.js";
import type { BulletinExtrait } from "../types/verification.js";

/* ────────────────────── VALEURS DE RÉFÉRENCE 2026 ────────────────────── */

const PARAMS_ATTENDUS = {
  pmss: 4_005,
  smicMensuel: 1_823.03,
  rgduTDelta: 0.3821,
  rgduTMin: 0.02,
  rgduP: 1.75,
  rgduMultiplicateurSmic: 3,
} as const;

const ERREURS_CONNUES = {
  TIAFM: { valeurAttendue: 4_005, valeurErronee: 3_925 },
  AAICO: { valeurAttendue: 1_823.03, valeurErronee: 1_832.03 },
  RGDUB: { valeurAttendue: 0.3821, valeurErronee: 0.3241 },
} as const;

/* ────────────────────── TYPES ────────────────────── */

export interface ErreurBulletin {
  type: "TIAFM" | "AAICO" | "RGDUB" | "autre";
  message: string;
}

export interface ResultatBulletin {
  salarie: string;
  periode: string;
  valide: boolean;
  erreurs: ErreurBulletin[];
}

export interface ResultatAnalyse {
  nombreBulletins: number;
  nombrePages: number;
  bulletins: ResultatBulletin[];
}

/* ────────────────────── MESSAGES D'ERREUR ────────────────────── */

const MESSAGES: Record<string, string> = {
  TIAFM: "Plafond de SS laissé au montant 2025",
  AAICO: "Erreur de frappe sur le smic",
  RGDUB: "Coef de RGDU T delta mal renseigné",
};

/* ────────────────────── CALCUL RGDU ────────────────────── */

/**
 * Calcule le coefficient RGDU 2026 selon la formule :
 *   C = T_min + T_delta × [(1/2) × (3 × SMIC / brut − 1)]^P
 *
 * Retourne 0 si brut ≥ 3 × SMIC (pas de réduction).
 */
function calculerCoefficientRGDU(
  brut: number,
  smicMensuel: number,
  tDelta: number,
  tMin = PARAMS_ATTENDUS.rgduTMin,
  p = PARAMS_ATTENDUS.rgduP,
): number {
  if (brut <= 0) return 0;

  const seuilMax = PARAMS_ATTENDUS.rgduMultiplicateurSmic * smicMensuel;
  if (brut >= seuilMax) return 0;

  const inner = 0.5 * (3 * smicMensuel / brut - 1);
  if (inner <= 0) return 0;

  const coeff = tMin + tDelta * Math.pow(Math.min(inner, 1), p);
  return Math.min(coeff, tMin + tDelta);
}

function calculerMontantRGDU(brut: number, smicMensuel: number, tDelta: number): number {
  return Math.round(brut * calculerCoefficientRGDU(brut, smicMensuel, tDelta) * 100) / 100;
}

/* ────────────────────── HELPERS D'EXTRACTION ────────────────────── */

function extraireTauxEmploi(bulletin: BulletinExtrait): number {
  if (bulletin.type !== "detaille") return 100;
  const b = bulletin as BulletinDetaille;
  return b.elementsSalaire.find((e) => e.code === "00035")?.montant ?? 100;
}

const CODES_T1 = new Set([
  "20200", "30005", "30002", "30405", "30402",
  "46000", "46350", "46500", "46550", "51005", "51000",
]);

function extrairePmssUtilise(bulletin: BulletinExtrait): number | undefined {
  if (bulletin.type !== "detaille") return undefined;
  const b = bulletin as BulletinDetaille;
  for (const cot of b.cotisations) {
    if (!cot.code || !cot.base) continue;
    if (!CODES_T1.has(cot.code)) continue;
    if (cot.base < b.brutCotisation - 0.01) return cot.base;
  }
  return undefined;
}

function extraireMontantRGDU(bulletin: BulletinExtrait): number {
  if (bulletin.type !== "detaille") return 0;
  const b = bulletin as BulletinDetaille;
  const allegement = b.allegements?.find((a) => /RGDU/i.test(a.libelle));
  return allegement ? Math.abs(allegement.montant) : 0;
}

function formaterPeriode(bulletin: BulletinExtrait): string {
  const p = bulletin.periode;
  if (!p?.dateDebut) return "";
  const mois = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
  ];
  const d = new Date(p.dateDebut + "T00:00:00");
  if (isNaN(d.getTime())) return `${p.dateDebut} → ${p.dateFin}`;
  return `${mois[d.getMonth()]} ${d.getFullYear()}`;
}

/* ────────────────────── DÉTECTION PER-BULLETIN ────────────────────── */

/**
 * Détecte les erreurs de paramétrage sur UN bulletin.
 * Retourne la liste des erreurs trouvées (vide si le bulletin est valide).
 */
function detecterErreursSurBulletin(
  bulletin: BulletinExtrait,
  erreursGlobales: Set<string>,
): ErreurBulletin[] {
  const erreurs: ErreurBulletin[] = [];
  if (bulletin.type !== "detaille") return erreurs;

  /* ── TIAFM : Plafond SS ── */
  const pmssDetecte = extrairePmssUtilise(bulletin);
  if (pmssDetecte !== undefined && Math.abs(pmssDetecte - PARAMS_ATTENDUS.pmss) > 0.01) {
    erreursGlobales.add("TIAFM");
    erreurs.push({ type: "TIAFM", message: MESSAGES.TIAFM });
  } else if (erreursGlobales.has("TIAFM") && bulletin.brutCotisation > ERREURS_CONNUES.TIAFM.valeurErronee + 0.01) {
    erreurs.push({ type: "TIAFM", message: MESSAGES.TIAFM });
  }

  /* ── AAICO + RGDUB : SMIC et T delta (via RGDU) ── */
  const montantRGDU = extraireMontantRGDU(bulletin);
  if (montantRGDU > 0) {
    const tauxEmploi = extraireTauxEmploi(bulletin) / 100;
    const smicProrate = PARAMS_ATTENDUS.smicMensuel * tauxEmploi;
    const smicProrateErr = ERREURS_CONNUES.AAICO.valeurErronee * tauxEmploi;

    const rgduCorrecte = calculerMontantRGDU(bulletin.brutCotisation, smicProrate, PARAMS_ATTENDUS.rgduTDelta);
    const rgduSmicErr = calculerMontantRGDU(bulletin.brutCotisation, smicProrateErr, PARAMS_ATTENDUS.rgduTDelta);
    const rgduTErr = calculerMontantRGDU(bulletin.brutCotisation, smicProrate, ERREURS_CONNUES.RGDUB.valeurErronee);
    const rgduToutErr = calculerMontantRGDU(bulletin.brutCotisation, smicProrateErr, ERREURS_CONNUES.RGDUB.valeurErronee);

    const ecartOK = Math.abs(montantRGDU - rgduCorrecte);
    const ecartSmicErr = Math.abs(montantRGDU - rgduSmicErr);
    const ecartTErr = Math.abs(montantRGDU - rgduTErr);
    const ecartToutErr = Math.abs(montantRGDU - rgduToutErr);
    const ecartMinErr = Math.min(ecartSmicErr, ecartTErr, ecartToutErr);

    if (ecartOK > 3 && ecartMinErr < ecartOK * 0.8) {
      // Trouver quel scénario d'erreur explique le mieux le montant RGDU observé
      if (ecartSmicErr <= ecartTErr && ecartSmicErr <= ecartToutErr) {
        // Seul le SMIC est erroné
        erreursGlobales.add("AAICO");
        erreurs.push({ type: "AAICO", message: MESSAGES.AAICO });
      } else if (ecartTErr <= ecartSmicErr && ecartTErr <= ecartToutErr) {
        // Seul le T delta est erroné
        erreursGlobales.add("RGDUB");
        erreurs.push({ type: "RGDUB", message: MESSAGES.RGDUB });
      } else {
        // Les deux sont erronés
        erreursGlobales.add("AAICO");
        erreursGlobales.add("RGDUB");
        erreurs.push({ type: "AAICO", message: MESSAGES.AAICO });
        erreurs.push({ type: "RGDUB", message: MESSAGES.RGDUB });
      }
    }
  }

  return erreurs;
}

/* ────────────────────── POINT D'ENTRÉE ────────────────────── */

/**
 * Analyse un ensemble de bulletins et retourne le résultat formalisé :
 * pour chaque bulletin, un booléen de validité et la liste des erreurs détectées.
 */
export function analyserBulletins(
  bulletins: BulletinExtrait[],
  nombrePages: number,
): ResultatAnalyse {
  const erreursGlobales = new Set<string>();

  // Deux passes : la première détecte les erreurs globales (ex : PMSS visible
  // uniquement sur les bulletins à haut salaire), la seconde propage aux bulletins
  // qui ne peuvent pas les détecter directement mais qui en subissent l'impact.
  const erreursParBulletin = bulletins.map((b) => detecterErreursSurBulletin(b, erreursGlobales));

  // Seconde passe : propager les erreurs globales RGDU aux bulletins qui ont une RGDU
  // mais dont la différence était trop faible pour la détecter seuls.
  for (let i = 0; i < bulletins.length; i++) {
    const bulletin = bulletins[i];
    const erreurs = erreursParBulletin[i];
    const montantRGDU = extraireMontantRGDU(bulletin);
    if (montantRGDU <= 0) continue;

    if (erreursGlobales.has("AAICO") && !erreurs.some((e) => e.type === "AAICO")) {
      erreurs.push({ type: "AAICO", message: MESSAGES.AAICO });
    }
    if (erreursGlobales.has("RGDUB") && !erreurs.some((e) => e.type === "RGDUB")) {
      erreurs.push({ type: "RGDUB", message: MESSAGES.RGDUB });
    }
  }

  const resultats: ResultatBulletin[] = bulletins.map((b, i) => ({
    salarie: b.salarie?.nom ?? "Inconnu",
    periode: formaterPeriode(b),
    valide: erreursParBulletin[i].length === 0,
    erreurs: erreursParBulletin[i],
  }));

  return {
    nombreBulletins: bulletins.length,
    nombrePages,
    bulletins: resultats,
  };
}
