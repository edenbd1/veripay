/**
 * Vérification d'un bulletin : comparaison des montants extraits vs recalculés
 */

import type { BulletinDetaille } from "../types/bulletin-detaille.js";
import type { BulletinClarifie } from "../types/bulletin-clarifie.js";
import type { ErreurVerification, ResultatVerification } from "../types/verification.js";
import type { StatutSalarie } from "../types/convention.js";
import { calculerBulletin, comparerAvecBulletin } from "./calcul.service.js";
import { conventionCCNT66 } from "../config/convention-ccnt66.js";

function detecterStatut(bulletin: BulletinDetaille | BulletinClarifie): StatutSalarie {
  const qualif = bulletin.salarie?.qualificationConventionnelle ?? "";
  if (/\bCADRE\b/i.test(qualif)) return "cadre";
  if (bulletin.type === "detaille") {
    const codes = new Set((bulletin as BulletinDetaille).cotisations.map((c) => c.code));
    if (codes.has("46500") || codes.has("46550") || codes.has("51005")) return "cadre";
    if (codes.has("51000") || codes.has("30002")) return "non_cadre";
  }
  return "cadre";
}

function verifierBulletinDetaille(bulletin: BulletinDetaille): ResultatVerification {
  const erreurs: ErreurVerification[] = [];
  const statut = detecterStatut(bulletin);
  const tauxPAS = bulletin.impôtSurLeRevenu?.tauxPersonnalise ?? 0;
  const remboursements = bulletin.remboursements.reduce((s, r) => s + r.montant, 0);

  const calcul = calculerBulletin(bulletin.brutCotisation, conventionCCNT66, {
    statut,
    remboursements,
    tauxPAS,
  });

  const ecarts = comparerAvecBulletin(calcul, {
    cotisations: bulletin.cotisations,
    totalRetenues: bulletin.totalRetenues,
    netSocial: bulletin.netSocial,
    netAPayerAvantImpot: bulletin.netAPayerAvantImpôt,
    netImposable: bulletin.cumuls?.netImposable,
    netPaye: bulletin.netPaye,
  });

  for (const e of ecarts) {
    erreurs.push({
      type: "ecart_montant",
      message: `${e.champ}: bulletin=${e.attendu} calculé=${e.calcule} (écart ${e.ecart})`,
      valeurBulletin: e.attendu,
      valeurCalculee: e.calcule,
      ecart: e.ecart,
    });
  }

  const resume: Record<string, number> = {};
  for (const e of erreurs) resume[e.type] = (resume[e.type] ?? 0) + 1;
  return { valide: erreurs.length === 0, erreurs, resume };
}

function verifierBulletinClarifie(bulletin: BulletinClarifie): ResultatVerification {
  const erreurs: ErreurVerification[] = [];
  const statut = detecterStatut(bulletin);
  const tauxPAS = bulletin.impôtSurLeRevenu?.tauxPersonnalise ?? 0;
  const remboursements = bulletin.remboursements?.reduce((s, r) => s + r.montant, 0) ?? 0;

  const calcul = calculerBulletin(bulletin.brutCotisation, conventionCCNT66, {
    statut,
    remboursements,
    tauxPAS,
  });

  const allCotisations = bulletin.blocsCotisations.flatMap((b) => b.lignes);
  const ecarts = comparerAvecBulletin(calcul, {
    cotisations: allCotisations,
    totalRetenues: bulletin.totalRetenues,
    netSocial: bulletin.netSocial,
    netAPayerAvantImpot: bulletin.netAPayerAvantImpôt,
    netImposable: bulletin.cumuls?.netImposable,
    netPaye: bulletin.netPaye,
  });

  for (const e of ecarts) {
    erreurs.push({
      type: "ecart_montant",
      message: `${e.champ}: bulletin=${e.attendu} calculé=${e.calcule} (écart ${e.ecart})`,
      valeurBulletin: e.attendu,
      valeurCalculee: e.calcule,
      ecart: e.ecart,
    });
  }

  const resume: Record<string, number> = {};
  for (const e of erreurs) resume[e.type] = (resume[e.type] ?? 0) + 1;
  return { valide: erreurs.length === 0, erreurs, resume };
}

export function verifierBulletin(
  bulletin: import("../types/verification.js").BulletinExtrait,
): ResultatVerification {
  if (bulletin.type === "detaille") return verifierBulletinDetaille(bulletin);
  return verifierBulletinClarifie(bulletin);
}
