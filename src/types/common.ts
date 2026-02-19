/**
 * Types communs aux bulletins détaillés et clarifiés
 */

export interface Employeur {
  nom: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  siret: string;
  ape?: string;
  urssaf?: string;
  numeroCotisant?: string;
}

export interface Salarie {
  nom: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  matricule: string;
  numeroSecuriteSociale?: string;
  dateEntree?: string; // ISO date
  emploi?: string;
  qualificationConventionnelle?: string;
  coefficient?: number;
  echelon?: string;
  conventionCollective?: string;
  tauxEmploi?: number; // ex: 100 = 100%
}

export interface Periode {
  dateDebut: string; // ISO ou JJ/MM/AAAA
  dateFin: string;
}

/** Une ligne de rémunération (salaire de base, indemnité, etc.) */
export interface LigneElementSalaire {
  libelle: string;
  base?: number;
  taux?: number;
  montant: number;
  montantEmployeur?: number;
  code?: string; // code interne (détaillé)
}

/** Une ligne de cotisation (retenue salariale et/ou part patronale) */
export interface LigneCotisation {
  libelle: string;
  base?: number;
  tauxSalarie?: number;
  montantSalarie: number; // retenue (négatif)
  tauxEmployeur?: number;
  montantEmployeur?: number;
  code?: string; // ex: 20000, 20200 (détaillé)
}

/** Remboursements / éléments non soumis à cotisation */
export interface LigneRemboursement {
  libelle: string;
  montant: number;
  code?: string;
}

/** Compteur de congés (solde N, N-1, N-2) */
export interface CompteurConges {
  /** Période de référence, ex: "25/26" */
  periode: string;
  /** Type : "N" (année en cours), "N-1" (précédente), "N-2" */
  type: "N" | "N-1" | "N-2";
  /** Solde en jours */
  solde: number;
}
