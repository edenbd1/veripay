/**
 * Convention collective : règles et taux pour recalculer les cotisations
 */

export type BaseType = "brut" | "T1" | "T2" | "csg" | "forfait";
export type StatutSalarie = "cadre" | "non_cadre";

/** Une règle de cotisation */
export interface RegleCotisation {
  code?: string;
  libelle: string;
  tauxSalarie: number;
  tauxEmployeur: number;
  base: BaseType;
  forfaitSalarie?: number;
  forfaitEmployeur?: number;
  categorie?: string;
  /** À qui s'applique cette règle : "cadre", "non_cadre", ou undefined = tous */
  statut?: StatutSalarie;
}

export interface ConventionCollective {
  id: string;
  nom: string;
  /** Plafond mensuel sécurité sociale */
  plafondSecuriteSociale: number;
  /** Taux CSG assiette = % du brut servant de base (98.25% standard) */
  tauxAssietteCSG: number;
  /** Règles de cotisation dans l'ordre d'application */
  regles: RegleCotisation[];
}
