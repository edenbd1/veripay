/**
 * Orchestration : extraction PDF -> détection type -> parsing -> calcul -> vérification
 */

import { extraireTextePdf, detecterTypeBulletin, decouperEnBulletins } from "./pdf.service.js";
import { parserBulletinDetaille } from "./parser-detaille.js";
import { parserBulletinClarifie } from "./parser-clarifie.js";
import { calculerBulletin } from "./calcul.service.js";
import { conventionCCNT66 } from "../config/convention-ccnt66.js";
import { analyserBulletins, type ResultatAnalyse } from "./erreurs-parametrage.service.js";
import type { StatutSalarie } from "../types/convention.js";
import type { BulletinExtrait } from "../types/verification.js";
import type { BulletinDetaille } from "../types/bulletin-detaille.js";
import type { BulletinClarifie } from "../types/bulletin-clarifie.js";

export interface ResultatExtraction {
  typeDetecte: "detaille" | "clarifie";
  bulletin: BulletinExtrait;
  verification: {
    statutDetecte: "cadre" | "non_cadre";
    calcul: {
      baseCSG: number;
      totalRetenues: number;
      totalPatronal: number;
      netSocial: number;
      netImposable: number;
      netAPayerAvantPAS: number;
      pas: { base: number; taux: number; montant: number };
      netPaye: number;
    };
    ecarts: { champ: string; pdf: number; calcul: number; ecart: number }[];
    /** Cohérence interne : les montants du PDF sont-ils mathématiquement cohérents entre eux ? */
    coherence: {
      valide: boolean;
      ecarts: { champ: string; attendu: number; extrait: number; ecart: number }[];
    };
    /** true si la vérification convention OU la cohérence interne est parfaite */
    valide: boolean;
  };
  nombrePages: number;
}

export interface ResultatExtractionMultiple {
  bulletins: ResultatExtraction[];
  nombreBulletins: number;
  nombrePages: number;
}

/**
 * Détermine le type de bulletin à partir du nom du fichier.
 * Cherche "detaille" ou "clarifie" dans le nom (insensible à la casse).
 * Retourne undefined si le nom ne contient aucun des deux mots.
 */
function detecterTypeParNomFichier(nomFichier?: string): "detaille" | "clarifie" | undefined {
  if (!nomFichier) return undefined;
  const nom = nomFichier.toLowerCase();
  if (nom.includes("detaille")) return "detaille";
  if (nom.includes("clarifie") || nom.includes("simplifie")) return "clarifie";
  return undefined;
}

/**
 * Extrait TOUS les bulletins d'un PDF (un ou plusieurs).
 * Découpe le texte en blocs, parse et vérifie chaque bulletin indépendamment.
 *
 * @param buffer  Le contenu du PDF
 * @param options.nomFichier  Nom du fichier uploadé (utilisé pour détecter le type)
 * @param options.typeForce   Type forcé ("detaille" | "clarifie"), prioritaire sur tout le reste
 */
export async function extraireBulletinsDepuisPdf(
  buffer: Buffer,
  options?: { nomFichier?: string; typeForce?: "detaille" | "clarifie" }
): Promise<ResultatExtractionMultiple> {
  const { texte, nombrePages } = await extraireTextePdf(buffer);

  const blocs = decouperEnBulletins(texte);

  const bulletins: ResultatExtraction[] = [];

  for (const bloc of blocs) {
    // Priorité : typeForce > nom du fichier > auto-détection par bloc
    const typeDetecte =
      options?.typeForce
      ?? detecterTypeParNomFichier(options?.nomFichier)
      ?? detecterTypeBulletin(bloc);

    const bulletin = typeDetecte === "detaille"
      ? parserBulletinDetaille(bloc)
      : parserBulletinClarifie(bloc);

    const verification = verifierBulletinExtrait(bulletin);

    bulletins.push({ typeDetecte, bulletin, verification, nombrePages });
  }

  return {
    bulletins,
    nombreBulletins: bulletins.length,
    nombrePages,
  };
}

/**
 * Analyse un PDF de bulletins et retourne un résultat formalisé :
 * pour chaque bulletin, un booléen valide/invalide et la liste des erreurs détectées.
 */
export async function analyserBulletinsPdf(
  buffer: Buffer,
  options?: { nomFichier?: string; typeForce?: "detaille" | "clarifie" },
): Promise<ResultatAnalyse> {
  const { texte, nombrePages } = await extraireTextePdf(buffer);
  const blocs = decouperEnBulletins(texte);

  const bulletins = blocs.map((bloc) => {
    const typeDetecte =
      options?.typeForce
      ?? detecterTypeParNomFichier(options?.nomFichier)
      ?? detecterTypeBulletin(bloc);
    return typeDetecte === "detaille"
      ? parserBulletinDetaille(bloc)
      : parserBulletinClarifie(bloc);
  });

  return analyserBulletins(bulletins, nombrePages);
}

/**
 * Extrait un seul bulletin (rétro-compatibilité).
 * Appelle la version multi-bulletins et retourne le premier résultat.
 */
export async function extraireBulletinDepuisPdf(
  buffer: Buffer,
  options?: { nomFichier?: string; typeForce?: "detaille" | "clarifie" }
): Promise<ResultatExtraction> {
  const { bulletins } = await extraireBulletinsDepuisPdf(buffer, options);
  return bulletins[0];
}

/* ────────────────────── VÉRIFICATION ────────────────────── */

/**
 * Détecte si le salarié est cadre ou non-cadre.
 * Heuristique : cherche "CADRE" dans la qualification,
 * ou la présence de codes spécifiques cadre (46500 CET, 46550 APEC, 51005 Prév cadre).
 */
function detecterStatut(bulletin: BulletinExtrait): StatutSalarie {
  const qualif = bulletin.salarie?.qualificationConventionnelle ?? "";
  if (/\bCADRE\b/i.test(qualif)) return "cadre";

  // Fallback : chercher des codes cadre dans les cotisations
  if (bulletin.type === "detaille") {
    const codes = new Set((bulletin as BulletinDetaille).cotisations.map((c) => c.code));
    if (codes.has("46500") || codes.has("46550") || codes.has("51005")) return "cadre";
    if (codes.has("51000") || codes.has("30002")) return "non_cadre";
  }

  return "cadre"; // défaut
}

function verifierBulletinExtrait(bulletin: BulletinExtrait): ResultatExtraction["verification"] {
  const r2 = (n: number) => Math.round(n * 100) / 100;

  const statut = detecterStatut(bulletin);
  const tauxPAS = bulletin.impôtSurLeRevenu?.tauxPersonnalise ?? 0;
  let remboursements = 0;

  // Extraire les codes cotisations présents sur ce bulletin spécifique
  let codesPresents: Set<string> | undefined;
  let plafondProrrate: number | undefined;
  let tauxAT: number | undefined;
  let isApprenti = false;

  if (bulletin.type === "detaille") {
    const b = bulletin as BulletinDetaille;
    remboursements = b.remboursements.reduce((s, r) => s + r.montant, 0);
    codesPresents = new Set(b.cotisations.map((c) => c.code).filter((c): c is string => !!c));

    // Détecter le PMSS proraté depuis la base Vieillesse TA (code 20200)
    // Si la base est < min(brut, PMSS standard), le PMSS est proraté (mois incomplet, temps partiel)
    const vieillesseTA = b.cotisations.find((c) => c.code === "20200");
    if (vieillesseTA?.base) {
      const pmssStd = conventionCCNT66.plafondSecuriteSociale;
      const t1Std = Math.min(bulletin.brutCotisation, pmssStd);
      if (vieillesseTA.base < t1Std - 0.01) {
        plafondProrrate = vieillesseTA.base;
      }
    }

    // Extraire le taux AT réel de l'établissement (code 57100)
    // Le taux AT est réglementaire (fixé par la CARSAT), pas conventionnel — il varie par établissement
    const at = b.cotisations.find((c) => c.code === "57100");
    if (at?.montantEmployeur && at.base) {
      tauxAT = r2(at.montantEmployeur / at.base * 10000) / 100;
    }

    // Détecter le statut apprenti (codes spécifiques App Exo)
    isApprenti = b.cotisations.some((c) =>
      c.code === "20020" || c.code === "20290" || c.code === "30300" || c.code === "46050"
    );
  } else {
    const b = bulletin as BulletinClarifie;
    remboursements = b.remboursements?.reduce((s, r) => s + r.montant, 0) ?? 0;
  }

  const calcul = calculerBulletin(bulletin.brutCotisation, conventionCCNT66, {
    statut,
    remboursements,
    tauxPAS,
    codesPresents,
    plafondProrrate,
    tauxAT,
    isApprenti,
  });

  const pdf = {
    totalRetenues: bulletin.totalRetenues,
    totalPatronal: bulletin.totalCotisationsPatronales,
    netSocial: bulletin.netSocial,
    netImposable: bulletin.cumuls?.netImposable,
    netAPayerAvantPAS: bulletin.netAPayerAvantImpôt,
    netPaye: bulletin.netPaye,
  };

  const ecarts: { champ: string; pdf: number; calcul: number; ecart: number }[] = [];
  function check(champ: string, pdfVal: number | undefined, calculVal: number) {
    if (pdfVal === undefined) return;
    const diff = r2(calculVal - pdfVal);
    if (Math.abs(diff) > 0.005) {
      ecarts.push({ champ, pdf: pdfVal, calcul: calculVal, ecart: diff });
    }
  }

  check("totalRetenues", pdf.totalRetenues, calcul.totalRetenues);
  check("totalPatronal", pdf.totalPatronal, calcul.totalPatronal);
  check("netSocial", pdf.netSocial, calcul.netSocial);

  // Ne vérifier netImposable que si la valeur extraite est cohérente (pas un cumul multi-contrats).
  // Deux heuristiques : (1) valeur > brut = forcément cumul, (2) valeur > calcul * 1.1 = probablement cumul
  const netImpPdf = pdf.netImposable;
  const netImpCalc = calcul.netImposable;
  const estCumulMultiContrat = netImpPdf !== undefined && (
    netImpPdf > bulletin.brutCotisation || netImpPdf > netImpCalc * 1.1
  );
  if (!estCumulMultiContrat) {
    check("netImposable", netImpPdf, netImpCalc);
  }

  check("netAPayerAvantPAS", pdf.netAPayerAvantPAS, calcul.netAPayerAvantPAS);
  check("netPaye", pdf.netPaye, calcul.netPaye);

  /* ── Contrôle de cohérence interne (indépendant de la convention) ── */
  const ecartsCoherence: { champ: string; attendu: number; extrait: number; ecart: number }[] = [];
  function checkCoherence(champ: string, attendu: number, extrait: number | undefined) {
    if (extrait === undefined) return;
    const diff = r2(attendu - extrait);
    if (Math.abs(diff) > 0.02) {
      ecartsCoherence.push({ champ, attendu, extrait, ecart: diff });
    }
  }

  if (bulletin.type === "detaille") {
    const b = bulletin as BulletinDetaille;
    // Somme des retenues salariales vs totalRetenues extrait
    const sumSal = r2(b.cotisations.reduce((s, c) => s + Math.abs(c.montantSalarie ?? 0), 0));
    const sumPat = r2(b.cotisations.reduce((s, c) => s + (c.montantEmployeur ?? 0), 0));
    checkCoherence("sumSalarié→totalRetenues", sumSal, b.totalRetenues);
    checkCoherence("sumPatronal→totalPatronal", sumPat, b.totalCotisationsPatronales);
  }

  // Brut - retenues = netSocial
  if (bulletin.totalRetenues !== undefined && bulletin.netSocial !== undefined) {
    checkCoherence("brut-retenues→netSocial", r2(bulletin.brutCotisation - bulletin.totalRetenues), bulletin.netSocial);
  }
  // NetSocial + remboursements = netAPayerAvantPAS
  if (bulletin.netSocial !== undefined && bulletin.netAPayerAvantImpôt !== undefined) {
    checkCoherence("netSocial+rembours→netAvantPAS", r2(bulletin.netSocial + remboursements), bulletin.netAPayerAvantImpôt);
  }
  // NetAPayerAvantPAS - PAS = netPaye
  if (bulletin.netAPayerAvantImpôt !== undefined && bulletin.netPaye !== undefined) {
    const montantPAS = Math.abs(bulletin.impôtSurLeRevenu?.montant ?? 0);
    checkCoherence("netAvantPAS-PAS→netPayé", r2(bulletin.netAPayerAvantImpôt - montantPAS), bulletin.netPaye);
  }

  const coherenceValide = ecartsCoherence.length === 0;

  return {
    statutDetecte: statut,
    calcul: {
      baseCSG: calcul.baseCSG,
      totalRetenues: calcul.totalRetenues,
      totalPatronal: calcul.totalPatronal,
      netSocial: calcul.netSocial,
      netImposable: calcul.netImposable,
      netAPayerAvantPAS: calcul.netAPayerAvantPAS,
      pas: calcul.pas,
      netPaye: calcul.netPaye,
    },
    ecarts,
    coherence: {
      valide: coherenceValide,
      ecarts: ecartsCoherence,
    },
    valide: ecarts.length === 0 || coherenceValide,
  };
}

/**
 * Parse un texte déjà extrait (pour tests ou chaînage).
 */
export function parserTexteBulletin(texte: string): ResultatExtraction["bulletin"] {
  const typeDetecte = detecterTypeBulletin(texte);
  if (typeDetecte === "detaille") return parserBulletinDetaille(texte);
  return parserBulletinClarifie(texte);
}
