/**
 * Extraction du contenu texte des PDF (bulletins de salaire)
 */

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse") as (buffer: Buffer) => Promise<{ text: string; numpages: number; info?: unknown }>;

export interface ExtractionPdfResultat {
  texte: string;
  nombrePages: number;
  metadata?: Record<string, unknown>;
}

/**
 * Extrait tout le texte d'un PDF (une ou plusieurs pages).
 */
export async function extraireTextePdf(buffer: Buffer): Promise<ExtractionPdfResultat> {
  const data = await pdfParse(buffer);
  return {
    texte: data.text,
    nombrePages: data.numpages,
    metadata: data.info ? (data.info as Record<string, unknown>) : undefined,
  };
}

/**
 * Détecte si le texte correspond à un bulletin détaillé ou clarifié.
 * Bulletin clarifié : blocs "SANTE", "RETRAITE", "FAMILLE" (souvent en titres de section).
 * Bulletin détaillé : "N° Libellés" / "Patronale s" et codes à 5 chiffres en fin de ligne (20000, 20200...).
 */
export function detecterTypeBulletin(texte: string): "detaille" | "clarifie" {
  const normalise = texte.replace(/\s+/g, " ").toUpperCase();
  const aBlocsClarifie =
    (normalise.includes("SANTE") && normalise.includes("RETRAITE") && normalise.includes("FAMILLE")) ||
    /ASSURANCE\s+CH[OÔ]MAGE/.test(normalise);
  const aTableDetaille = /N°\s*Libe\s*llé\s*s|Montants\s+Re\s*te\s*nue\s*s\s+Patronale\s*s/i.test(texte);
  const aCodesDetaille = /\s\d{5}\s*$/.test(texte.replace(/\d[\d\s]*,\d{2}/g, "")); // code 5 chiffres en fin de ligne (hors montants)
  if (aTableDetaille && aCodesDetaille) return "detaille";
  if (aBlocsClarifie) return "clarifie";
  return aCodesDetaille ? "detaille" : "clarifie";
}

/* ────────────────────── DÉCOUPAGE MULTI-BULLETINS ────────────────────── */

/**
 * Vérifie si un segment de texte contient des éléments de salaire,
 * ce qui indique le DÉBUT d'un nouveau bulletin (pas une page de continuation).
 *
 * Détaillé : codes 5 chiffres 0[01]xxx en fin de ligne (éléments de rémunération)
 *            Le lookbehind (?<!\d) évite les faux positifs sur des nombres plus longs (ex: 0000458)
 * Clarifié : lignes "Salaire" ou "ELEMENTS DE REMUNERATION"
 */
function segmentContientElementsSalaire(segment: string): boolean {
  const lines = segment.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Détaillé : code 00xxx ou 01xxx en fin de ligne (éléments de salaire / sous-totaux salaire)
    // Le lookbehind négatif empêche de matcher dans un nombre plus long (ex: "0000458")
    if (/(?<!\d)0[01]\d{3}\s*$/.test(trimmed)) return true;
    // Clarifié : ligne contenant "Salaire" (indiciaire, base, etc.)
    if (/Salaire\s+(indiciaire|de\s+base|brut)/i.test(trimmed)) return true;
    // Clarifié : section "ELEMENTS DE REMUNERATION"
    if (/ELEMENTS?\s+DE\s+R[EÉ]MUN[EÉ]RATION/i.test(trimmed)) return true;
    // Générique : "Indemnité" comme élément de salaire (pas cotisation)
    if (/^Indemnit[eé]\s+/i.test(trimmed) && !/cotis/i.test(trimmed)) return true;
  }
  return false;
}

/**
 * Découpe le texte extrait d'un PDF en blocs correspondant chacun à un bulletin complet.
 *
 * Stratégie :
 * 1. Split sur chaque occurrence de "Entreprise :" (marqueur de début de page)
 * 2. Un segment contenant des éléments de salaire = début d'un nouveau bulletin
 * 3. Un segment sans éléments de salaire = page de continuation (fusionné au bulletin précédent)
 *
 * @returns Tableau de textes, un par bulletin
 */
export function decouperEnBulletins(texte: string): string[] {
  // Séparer sur "Entreprise :" en gardant le délimiteur avec chaque segment
  const segments = texte.split(/(?=Entreprise\s*:)/);

  if (segments.length <= 1) {
    return [texte];
  }

  const bulletins: string[] = [];
  let blocCourant = "";

  for (const segment of segments) {
    const trimmed = segment.trim();
    if (!trimmed) continue;

    if (segmentContientElementsSalaire(segment)) {
      // Ce segment commence un nouveau bulletin
      if (blocCourant.trim()) {
        // Ne sauvegarder que si le bloc contient un vrai en-tête de bulletin
        // (sinon c'est du pré-texte/pied de page à fusionner avec le nouveau segment)
        if (/Entreprise\s*:/i.test(blocCourant) && segmentContientElementsSalaire(blocCourant)) {
          bulletins.push(blocCourant);
        }
        // Si le bloc courant est du pré-texte (pas de "Entreprise :" ou pas de salaire),
        // on le préfixe au nouveau segment
        else {
          blocCourant = blocCourant + "\n" + segment;
          continue;
        }
      }
      blocCourant = segment;
    } else {
      // Continuation du bulletin courant (ou pré-texte avant le premier bulletin)
      blocCourant += "\n" + segment;
    }
  }

  // Dernier bloc en cours
  if (blocCourant.trim()) {
    bulletins.push(blocCourant);
  }

  return bulletins.length > 0 ? bulletins : [texte];
}
