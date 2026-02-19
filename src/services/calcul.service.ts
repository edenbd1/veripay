/**
 * Moteur de recalcul des cotisations à partir du brut et de la convention collective.
 *
 * Gère les profils cadre et non-cadre (prévoyance, CET, APEC, codes Assedic/AGS).
 *
 * Flux de calcul :
 *   1. Filtrer les règles par statut (cadre / non-cadre)
 *   2. Déterminer les bases : brut, T1 (plafonnée), T2 (au-dessus du plafond)
 *   3. Calculer chaque cotisation (pourcentage ou forfait)
 *   4. Calculer la base CSG = brut × 98,25 % + patronale prévoyance + patronale mutuelle
 *   5. Calculer CSG/CRDS et forfait social
 *   6. Sommer : total retenues salarié, total patronal
 *   7. Net social = brut − total retenues
 *   8. Net imposable = brut − retenues déductibles + patronale mutuelle
 *   9. Net à payer avant PAS = net social + remboursements
 *  10. Net payé = net à payer − PAS
 */

import type { ConventionCollective } from "../types/convention.js";
import type { StatutSalarie } from "../types/convention.js";
import type { LigneCotisation } from "../types/common.js";

/* ────────────────────── TYPES ────────────────────── */

export interface LigneCalculee {
  code?: string;
  libelle: string;
  base: number;
  tauxSalarie: number;
  montantSalarie: number;
  tauxEmployeur: number;
  montantEmployeur: number;
  categorie?: string;
}

export interface ResultatCalcul {
  statut: StatutSalarie;
  lignes: LigneCalculee[];
  baseCSG: number;
  totalRetenues: number;
  totalPatronal: number;
  netSocial: number;
  netImposable: number;
  netAPayerAvantPAS: number;
  pas: { base: number; taux: number; montant: number };
  netPaye: number;
}

/* ────────────────────── ARRONDI ────────────────────── */

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

/* ────────────────────── CALCUL PRINCIPAL ────────────────────── */

export function calculerBulletin(
  brut: number,
  convention: ConventionCollective,
  options: {
    statut?: StatutSalarie;
    remboursements?: number;
    tauxPAS?: number;
    /** Si fourni, ne calcule que les cotisations dont le code est dans cet ensemble */
    codesPresents?: Set<string>;
    /** PMSS proraté (mois incomplet, temps partiel). Détecté depuis base Vieillesse TA. */
    plafondProrrate?: number;
    /** Taux AT réel de l'établissement (code 57100), varie par établissement/risque */
    tauxAT?: number;
    /** Apprenti : base non exonérée (= plafondProrrate) remplace le brut pour toutes les cotisations */
    isApprenti?: boolean;
  } = {},
): ResultatCalcul {
  const statut = options.statut ?? "cadre";
  const pmss = options.plafondProrrate ?? convention.plafondSecuriteSociale;
  const t1 = Math.min(brut, pmss);
  const t2 = Math.max(0, r2(brut - pmss));
  // Pour les apprentis, la base non exonérée (= PMSS proraté) remplace le brut dans les calculs de cotisations
  const brutCotisations = (options.isApprenti && options.plafondProrrate) ? options.plafondProrrate : brut;

  const lignes: LigneCalculee[] = [];
  let patronalePrevoyanceMutuelle = 0;

  let reglesActives: typeof convention.regles;

  if (options.codesPresents) {
    // Mode adaptatif : ne garder que les règles dont le code est sur le bulletin.
    // Pas de filtre par statut car les codes reflètent déjà la situation exacte du salarié
    // (un cadre peut avoir des codes non-cadre et inversement).
    const codes = new Set(options.codesPresents);

    // Si le bulletin a le Forfait Social (73355), les CSG/CRDS s'appliquent forcément
    // SAUF si : non-résident fiscal FR (code 20065) ou apprenti (exonéré de CSG/CRDS)
    if (codes.has("73355") && !codes.has("20065") && !options.isApprenti) {
      codes.add("73000");
      codes.add("75050");
      codes.add("75060");
    }

    reglesActives = convention.regles.filter(
      (r) => r.code !== undefined && codes.has(r.code),
    );
  } else {
    // Mode standard : filtrer par statut (cadre / non-cadre)
    reglesActives = convention.regles.filter(
      (r) => r.statut === undefined || r.statut === statut,
    );
  }

  /* ── Pass 1 : cotisations hors CSG/CRDS et forfait social ── */

  for (const regle of reglesActives) {
    if (regle.base === "csg") continue;
    if (regle.code === "73355") continue;

    let base: number;
    let montantSal: number;
    let montantEmpl: number;

    // Taux effectifs (override possible pour AT)
    let txSal = regle.tauxSalarie;
    let txEmpl = regle.tauxEmployeur;
    if (regle.code === "57100" && options.tauxAT !== undefined) {
      txEmpl = options.tauxAT;
    }

    if (regle.base === "forfait") {
      base = 0;
      montantSal = regle.forfaitSalarie ?? 0;
      montantEmpl = regle.forfaitEmployeur ?? 0;
    } else {
      switch (regle.base) {
        case "T1": base = t1; break;
        case "T2": base = t2; break;
        default: base = brutCotisations;
      }
      // Apprenti : prévoyance (51xxx, 52xxx) calculée sur le brut réel, pas la base non exonérée
      if (options.isApprenti && (regle.code?.startsWith("51") || regle.code?.startsWith("52"))) {
        base = Math.min(brut, convention.plafondSecuriteSociale);
      }
      montantSal = -r2(base * txSal / 100);
      montantEmpl = r2(base * txEmpl / 100);
    }

    lignes.push({
      code: regle.code,
      libelle: regle.libelle,
      base,
      tauxSalarie: txSal,
      montantSalarie: montantSal,
      tauxEmployeur: txEmpl,
      montantEmployeur: montantEmpl,
      categorie: regle.categorie,
    });

    if (regle.code?.startsWith("51") || regle.code?.startsWith("52") || regle.code === "58000") {
      patronalePrevoyanceMutuelle += montantEmpl;
    }
  }

  /* ── Pass 2 : base CSG ── */

  const baseCSG = r2(brut * convention.tauxAssietteCSG / 100 + patronalePrevoyanceMutuelle);

  for (const regle of reglesActives) {
    if (regle.base !== "csg") continue;
    const montantSal = -r2(baseCSG * regle.tauxSalarie / 100);
    const montantEmpl = r2(baseCSG * regle.tauxEmployeur / 100);
    lignes.push({
      code: regle.code,
      libelle: regle.libelle,
      base: baseCSG,
      tauxSalarie: regle.tauxSalarie,
      montantSalarie: montantSal,
      tauxEmployeur: regle.tauxEmployeur,
      montantEmployeur: montantEmpl,
      categorie: regle.categorie,
    });
  }

  /* ── Pass 3 : forfait social (8 % sur patronale prévoyance + mutuelle) ── */
  // Seulement si le code 73355 est dans les règles actives (ou mode standard)
  const aForfaitSocial = reglesActives.some((r) => r.code === "73355");
  if (aForfaitSocial) {
    const baseForfaitSocial = r2(patronalePrevoyanceMutuelle);
    const montantForfaitSocial = r2(baseForfaitSocial * 8 / 100);
    lignes.push({
      code: "73355",
      libelle: "Forfait Social 8%",
      base: baseForfaitSocial,
      tauxSalarie: 0,
      montantSalarie: 0,
      tauxEmployeur: 8,
      montantEmployeur: montantForfaitSocial,
      categorie: "AUTRES",
    });
  }

  /* ── Totaux ── */

  let totalRetenues = 0;
  let totalPatronal = 0;
  for (const l of lignes) {
    totalRetenues += Math.abs(l.montantSalarie);
    totalPatronal += l.montantEmployeur;
  }
  totalRetenues = r2(totalRetenues);
  totalPatronal = r2(totalPatronal);

  const netSocial = r2(brut - totalRetenues);

  const csgNonDed = Math.abs(lignes.find((l) => l.code === "75050")?.montantSalarie ?? 0);
  const crds = Math.abs(lignes.find((l) => l.code === "75060")?.montantSalarie ?? 0);
  const patronaleMutuelle = lignes.find((l) => l.code === "58000")?.montantEmployeur ?? 0;
  const netImposable = r2(brut - (totalRetenues - csgNonDed - crds) + patronaleMutuelle);

  const remboursements = options.remboursements ?? 0;
  const netAPayerAvantPAS = r2(netSocial + remboursements);

  const tauxPAS = options.tauxPAS ?? 0;
  const montantPAS = r2(netImposable * tauxPAS / 100);
  const netPaye = r2(netAPayerAvantPAS - montantPAS);

  return {
    statut,
    lignes,
    baseCSG,
    totalRetenues,
    totalPatronal,
    netSocial,
    netImposable,
    netAPayerAvantPAS,
    pas: { base: netImposable, taux: tauxPAS, montant: montantPAS },
    netPaye,
  };
}

/* ────────────────────── COMPARAISON ────────────────────── */

export interface Ecart {
  champ: string;
  attendu: number;
  calcule: number;
  ecart: number;
}

export function comparerAvecBulletin(
  calcul: ResultatCalcul,
  bulletin: {
    cotisations: LigneCotisation[];
    totalRetenues?: number;
    netSocial?: number;
    netAPayerAvantImpot?: number;
    netImposable?: number;
    netPaye?: number;
  },
  tolerance = 0.005,
): Ecart[] {
  const ecarts: Ecart[] = [];

  function check(champ: string, calcule: number, attendu: number | undefined) {
    if (attendu === undefined) return;
    const diff = Math.abs(calcule - attendu);
    if (diff > tolerance) {
      ecarts.push({ champ, attendu, calcule, ecart: r2(calcule - attendu) });
    }
  }

  for (const lc of calcul.lignes) {
    if (!lc.code) continue;
    const lb = bulletin.cotisations.find((c) => c.code === lc.code);
    if (!lb) continue;
    if (lb.montantSalarie !== undefined && lb.montantSalarie !== 0) {
      check(`[${lc.code}] ${lc.libelle} mtSal`, lc.montantSalarie, lb.montantSalarie);
    }
    if (lb.montantEmployeur !== undefined && lb.montantEmployeur !== 0) {
      check(`[${lc.code}] ${lc.libelle} mtEmpl`, lc.montantEmployeur, lb.montantEmployeur);
    }
  }

  check("totalRetenues", calcul.totalRetenues, bulletin.totalRetenues);
  check("netSocial", calcul.netSocial, bulletin.netSocial);
  check("netAPayerAvantPAS", calcul.netAPayerAvantPAS, bulletin.netAPayerAvantImpot);
  check("netImposable", calcul.netImposable, bulletin.netImposable);
  check("netPaye", calcul.netPaye, bulletin.netPaye);

  return ecarts;
}
