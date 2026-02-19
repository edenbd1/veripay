/**
 * Structure JSON complète d'un bulletin de salaire DÉTAILLÉ
 * Chaque cotisation est une ligne avec code (ex. 20000, 20200)
 */

import type { Employeur, Salarie, Periode, LigneElementSalaire, LigneCotisation, LigneRemboursement, CompteurConges } from "./common.js";

export interface BulletinDetaille {
  type: "detaille";
  /** Numéro du bulletin (ex. 00035) */
  numeroBulletin?: string;
  employeur: Employeur;
  salarie: Salarie;
  periode: Periode;

  /** Éléments de salaire (salaire indiciaire, indemnités, etc.) */
  elementsSalaire: LigneElementSalaire[];

  /** Brut total soumis à cotisation */
  brutCotisation: number;

  /** Toutes les lignes de cotisations (avec code) */
  cotisations: LigneCotisation[];

  /** Remboursements (transport, etc.) */
  remboursements: LigneRemboursement[];

  /** Totaux */
  totalRetenues: number;
  totalCotisationsPatronales: number;
  netSocial: number;
  netAPayerAvantImpôt: number;

  /** Impôt sur le revenu (PAS) */
  impôtSurLeRevenu?: {
    base: number;
    tauxPersonnalise?: number;
    montant: number;
  };

  /** Net payé (après PAS) */
  netPaye?: number;

  /** Cumuls (optionnel) */
  cumuls?: {
    brut?: number;
    heures?: number;
    netImposable?: number;
    netSocial?: number;
  };

  /** Allègements / exonérations (ligne globale ou détaillée) */
  allegements?: { libelle: string; montant: number }[];

  /** Compteurs de congés (solde N, N-1, N-2) */
  conges?: CompteurConges[];
}
