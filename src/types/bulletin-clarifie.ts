/**
 * Structure JSON complète d'un bulletin de salaire CLARIFIÉ (simplifié)
 * Les cotisations sont regroupées par blocs (SANTE, RETRAITE, etc.)
 */

import type { Employeur, Salarie, Periode, LigneElementSalaire, LigneCotisation, LigneRemboursement, CompteurConges } from "./common.js";

export type BlocClarifie =
  | "SANTE"
  | "RETRAITE"
  | "FAMILLE"
  | "ASSURANCE_CHOMAGE"
  | "AUTRES_CONTRIBUTIONS"
  | "IMPOT_REVENU";

/** Un bloc de cotisations dans le bulletin clarifié (ex. SANTE avec plusieurs lignes) */
export interface BlocCotisationsClarifie {
  nom: BlocClarifie | string;
  lignes: LigneCotisation[];
  /** Somme des montants salarié du bloc (optionnel) */
  totalRetenues?: number;
  /** Somme des montants employeur du bloc (optionnel) */
  totalEmployeur?: number;
}

export interface BulletinClarifie {
  type: "clarifie";
  numeroBulletin?: string;
  employeur: Employeur;
  salarie: Salarie;
  periode: Periode;

  elementsSalaire: LigneElementSalaire[];

  brutCotisation: number;

  /** Cotisations regroupées par bloc */
  blocsCotisations: BlocCotisationsClarifie[];

  remboursements: LigneRemboursement[];

  totalRetenues: number;
  totalCotisationsPatronales: number;
  netSocial: number;
  netAPayerAvantImpôt: number;

  impôtSurLeRevenu?: {
    base: number;
    tauxPersonnalise?: number;
    montant: number;
  };

  netPaye?: number;

  cumuls?: {
    brut?: number;
    heures?: number;
    netImposable?: number;
    netSocial?: number;
  };

  allegements?: { libelle: string; montant: number }[];

  /** Compteurs de congés (solde N, N-1, N-2) */
  conges?: CompteurConges[];
}
