/**
 * Résultat de la vérification d'un bulletin (comparaison extrait vs recalculé)
 */

export interface ErreurVerification {
  type: "ecart_montant" | "ligne_manquante" | "ligne_inattendue" | "base_incorrecte" | "taux_incorrect";
  message: string;
  /** Ligne ou code concerné */
  code?: string;
  libelle?: string;
  /** Valeur extraite du bulletin */
  valeurBulletin?: number;
  /** Valeur recalculée attendue */
  valeurCalculee?: number;
  ecart?: number;
}

export interface ResultatVerification {
  valide: boolean;
  erreurs: ErreurVerification[];
  /** Résumé : nombre d'erreurs par type */
  resume?: Record<string, number>;
}

import type { BulletinDetaille } from "./bulletin-detaille.js";
import type { BulletinClarifie } from "./bulletin-clarifie.js";

export type BulletinExtrait = BulletinDetaille | BulletinClarifie;
