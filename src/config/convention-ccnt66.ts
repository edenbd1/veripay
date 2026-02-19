/**
 * Convention collective du 15 mars 1966 (CCNT 66)
 * Taux 2026 — extraits des bulletins détaillés de référence.
 *
 * PMSS 2026 = 4 005 €
 * Assiette CSG = 98,25 % du brut + patronale prévoyance/mutuelle
 *
 * Bases :
 *   brut      = totalité du salaire brut
 *   T1        = min(brut, PMSS)           (tranche 1 / plafonnée)
 *   T2        = max(0, brut − PMSS)       (tranche 2 / au-dessus du plafond)
 *   csg       = brut × 98,25 % + patronale prévoyance + patronale mutuelle
 *   forfait   = montant fixe (ex : mutuelle)
 *
 * Statut :
 *   undefined = s'applique à tous (cadre + non-cadre)
 *   "cadre"   = cadre uniquement
 *   "non_cadre" = non-cadre uniquement
 */

import type { ConventionCollective, RegleCotisation } from "../types/convention.js";

const PMSS = 4_005;
const ASSIETTE_CSG = 98.25; // %

const REGLES: RegleCotisation[] = [
  /* ──────── MALADIE (tous) ──────── */
  { code: "20000", libelle: "Cotisation Maladie sur Totalité", base: "brut", tauxSalarie: 0, tauxEmployeur: 7, categorie: "SANTE" },
  { code: "20002", libelle: "Majo Alsace Moselle/Maladie Totalité", base: "brut", tauxSalarie: 1.3, tauxEmployeur: 0, categorie: "SANTE" },
  { code: "20082", libelle: "Cotisation Maladie Sup.", base: "brut", tauxSalarie: 0, tauxEmployeur: 6, categorie: "SANTE" },
  { code: "20085", libelle: "Cotisation Maladie Sup. édition BS", base: "brut", tauxSalarie: 0, tauxEmployeur: 6, categorie: "SANTE" },

  /* ──────── MALADIE NON-RÉSIDENT (remplace CSG/CRDS pour non-résidents fiscaux FR) ──────── */
  { code: "20065", libelle: "Cotisation Maladie sup non résident FR", base: "brut", tauxSalarie: 5.5, tauxEmployeur: 0, categorie: "SANTE" },

  /* ──────── MALADIE APPRENTI (variante Alsace-Moselle, code 20003 au lieu de 20002) ──────── */
  { code: "20003", libelle: "Majo Alsace Moselle/Maladie Appr non exo", base: "brut", tauxSalarie: 1.3, tauxEmployeur: 0, categorie: "SANTE" },

  /* ──────── VIEILLESSE (tous) ──────── */
  { code: "20200", libelle: "Cotisation Vieillesse Tranche A", base: "T1", tauxSalarie: 6.9, tauxEmployeur: 8.55, categorie: "RETRAITE" },
  { code: "20300", libelle: "Cotisation Vieillesse déplafonnée", base: "brut", tauxSalarie: 0.4, tauxEmployeur: 2.11, categorie: "RETRAITE" },

  /* ──────── ALLOCATIONS FAMILIALES (tous) ──────── */
  { code: "20400", libelle: "Allocations familiales Totalité", base: "brut", tauxSalarie: 0, tauxEmployeur: 3.45, categorie: "FAMILLE" },
  { code: "20700", libelle: "Allocations familiales sup", base: "brut", tauxSalarie: 0, tauxEmployeur: 1.8, categorie: "FAMILLE" },

  /* ──────── SOLIDARITÉ (tous) ──────── */
  { code: "21000", libelle: "Contribution de Solidarité", base: "brut", tauxSalarie: 0, tauxEmployeur: 0.3, categorie: "AUTRES" },

  /* ──────── CHÔMAGE — CADRE ──────── */
  { code: "30005", libelle: "Assedic Tranche A Cadre", base: "T1", tauxSalarie: 0, tauxEmployeur: 4, categorie: "CHOMAGE", statut: "cadre" },
  { code: "30205", libelle: "Assedic Tranche B Cadre", base: "T2", tauxSalarie: 0, tauxEmployeur: 4, categorie: "CHOMAGE", statut: "cadre" },
  { code: "30405", libelle: "A.G.S. sur T A Cadre", base: "T1", tauxSalarie: 0, tauxEmployeur: 0.25, categorie: "CHOMAGE", statut: "cadre" },
  { code: "30455", libelle: "A.G.S. sur T B Cadre", base: "T2", tauxSalarie: 0, tauxEmployeur: 0.25, categorie: "CHOMAGE", statut: "cadre" },

  /* ──────── CHÔMAGE — NON-CADRE ──────── */
  { code: "30002", libelle: "Assedic Tranche A NC", base: "T1", tauxSalarie: 0, tauxEmployeur: 4, categorie: "CHOMAGE", statut: "non_cadre" },
  { code: "30202", libelle: "Assedic Tranche B NC", base: "T2", tauxSalarie: 0, tauxEmployeur: 4, categorie: "CHOMAGE", statut: "non_cadre" },
  { code: "30402", libelle: "A.G.S. sur T A NC", base: "T1", tauxSalarie: 0, tauxEmployeur: 0.25, categorie: "CHOMAGE", statut: "non_cadre" },
  { code: "30450", libelle: "A.G.S. sur T B Non Cadre", base: "T2", tauxSalarie: 0, tauxEmployeur: 0.25, categorie: "CHOMAGE", statut: "non_cadre" },

  /* ──────── RETRAITE COMPLÉMENTAIRE (tous) ──────── */
  { code: "46000", libelle: "Retraite sur T 1", base: "T1", tauxSalarie: 3.81, tauxEmployeur: 6.35, categorie: "RETRAITE" },
  { code: "46100", libelle: "Retraite sur T 2 NC", base: "T2", tauxSalarie: 8.10, tauxEmployeur: 13.49, categorie: "RETRAITE", statut: "non_cadre" },
  { code: "46150", libelle: "Retraite sur T 2 Cadre", base: "T2", tauxSalarie: 8.64, tauxEmployeur: 12.95, categorie: "RETRAITE", statut: "cadre" },

  /* ──────── CEG (tous) ──────── */
  { code: "46350", libelle: "Contrib. d'Equil. Général T 1", base: "T1", tauxSalarie: 0.86, tauxEmployeur: 1.29, categorie: "RETRAITE" },
  { code: "46400", libelle: "Contrib. d'Equil. Général T 2", base: "T2", tauxSalarie: 1.08, tauxEmployeur: 1.62, categorie: "RETRAITE", statut: "cadre" },

  /* ──────── CET (cadre uniquement) ──────── */
  { code: "46500", libelle: "Contrib. d'Equil. Technique T 1", base: "T1", tauxSalarie: 0.14, tauxEmployeur: 0.21, categorie: "RETRAITE", statut: "cadre" },
  { code: "46530", libelle: "Contrib. d'Equil. Technique T 2", base: "T2", tauxSalarie: 0.14, tauxEmployeur: 0.21, categorie: "RETRAITE", statut: "cadre" },

  /* ──────── APEC (cadre uniquement) ──────── */
  { code: "46550", libelle: "APEC sur T 1 Cadre", base: "T1", tauxSalarie: 0.024, tauxEmployeur: 0.036, categorie: "CHOMAGE", statut: "cadre" },
  { code: "46600", libelle: "APEC sur T 2 Cadre", base: "T2", tauxSalarie: 0.024, tauxEmployeur: 0.036, categorie: "CHOMAGE", statut: "cadre" },

  /* ──────── PRÉVOYANCE — CADRE ──────── */
  { code: "51005", libelle: "Prévoyance sur Tranche A Cadre", base: "T1", tauxSalarie: 0.65, tauxEmployeur: 1.84, categorie: "SANTE", statut: "cadre" },
  { code: "52005", libelle: "Prévoyance sur Tranche B Cadre", base: "T2", tauxSalarie: 1.875, tauxEmployeur: 1.875, categorie: "SANTE", statut: "cadre" },

  /* ──────── PRÉVOYANCE — NON-CADRE ──────── */
  { code: "51000", libelle: "Prévoyance sur Tranche A Non cadre", base: "T1", tauxSalarie: 1.245, tauxEmployeur: 1.245, categorie: "SANTE", statut: "non_cadre" },
  { code: "51052", libelle: "Prévoyance Apprenti non exo", base: "T1", tauxSalarie: 1.245, tauxEmployeur: 1.245, categorie: "SANTE" },
  { code: "52000", libelle: "Prévoyance sur Tranche B Non cadre", base: "T2", tauxSalarie: 1.245, tauxEmployeur: 1.245, categorie: "SANTE", statut: "non_cadre" },

  /* ──────── ACCIDENT DU TRAVAIL (tous) ──────── */
  { code: "57100", libelle: "Accident du travail", base: "brut", tauxSalarie: 0, tauxEmployeur: 3.02, categorie: "SANTE" },

  /* ──────── FNAL (tous) ──────── */
  { code: "57200", libelle: "FNAL sur brut", base: "brut", tauxSalarie: 0, tauxEmployeur: 0.5, categorie: "AUTRES" },

  /* ──────── DIALOGUE SOCIAL (tous) ──────── */
  { code: "57500", libelle: "Contribution au dialogue social", base: "brut", tauxSalarie: 0, tauxEmployeur: 0.016, categorie: "AUTRES" },

  /* ──────── MUTUELLE (tous, forfait) ──────── */
  { code: "58000", libelle: "Mutuelle CPM Régime local", base: "forfait", tauxSalarie: 0, tauxEmployeur: 0, forfaitSalarie: -21.83, forfaitEmployeur: 21.83, categorie: "SANTE" },

  /* ──────── FORMATION PROFESSIONNELLE (tous) ──────── */
  { code: "60710", libelle: "Contribution Formation Pro", base: "brut", tauxSalarie: 0, tauxEmployeur: 1, categorie: "AUTRES" },
  // Taux affiché 1,303% — taux réel 1,3033% (vérifié sur 3 bulletins : 56.75, 35.19, 182.89)
  { code: "60720", libelle: "Contribution supplé. Formation Pro", base: "brut", tauxSalarie: 0, tauxEmployeur: 1.3033, categorie: "AUTRES" },
  { code: "60730", libelle: "Formation supp. CDD", base: "brut", tauxSalarie: 0, tauxEmployeur: 1, categorie: "AUTRES" },

  /* ──────── CSG / CRDS (tous) ──────── */
  { code: "73000", libelle: "C.S.G. Déductible", base: "csg", tauxSalarie: 6.8, tauxEmployeur: 0, categorie: "CSG_CRDS" },
  { code: "75050", libelle: "C.S.G. non Déductible", base: "csg", tauxSalarie: 2.4, tauxEmployeur: 0, categorie: "CSG_CRDS" },
  { code: "75060", libelle: "C.R.D.S.", base: "csg", tauxSalarie: 0.5, tauxEmployeur: 0, categorie: "CSG_CRDS" },

  /* ──────── FORFAIT SOCIAL (tous) ──────── */
  // Calculé dynamiquement sur la base prévoyance+mutuelle patronale
  { code: "73355", libelle: "Forfait Social 8%", base: "forfait", tauxSalarie: 0, tauxEmployeur: 0, categorie: "AUTRES" },
];

export const conventionCCNT66: ConventionCollective = {
  id: "ccnt66",
  nom: "Convention collective du 15 mars 1966",
  plafondSecuriteSociale: PMSS,
  tauxAssietteCSG: ASSIETTE_CSG,
  regles: REGLES,
};

export const PLAFOND_SECURITE_SOCIALE = PMSS;
