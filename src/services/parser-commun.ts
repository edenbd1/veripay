/**
 * Utilitaires communs pour parser le texte des bulletins (nombres, dates, libellés)
 *
 * IMPORTANT : pdf-parse concatène souvent les nombres sans séparateur.
 * Ex: "3 841,583,930977,50Salaire indiciaire" → [3841.58, 3.930, 977.50]
 * On ne peut pas utiliser une simple regex globale. On utilise un tokenizer
 * basé sur les positions des virgules et les longueurs décimales connues
 * du format bulletin de salaire français.
 */

/** Remplace virgule par point et parse un nombre français (espace = milliers) */
export function parseNombre(str: string | undefined): number | undefined {
  if (str == null || str === "") return undefined;
  const n = str
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");
  const val = Number.parseFloat(n);
  return Number.isNaN(val) ? undefined : val;
}

/** Parse une date JJ/MM/AAAA ou JJ-MM-AAAA → AAAA-MM-JJ */
export function parseDate(str: string | undefined): string | undefined {
  if (str == null || str === "") return undefined;
  const m = str.trim().match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return str;
}

/** Cherche toutes les dates DD/MM/YYYY dans une chaîne */
export function trouverToutesDates(texte: string): string[] {
  return texte.match(/(\d{1,2}\/\d{1,2}\/\d{4})/g) ?? [];
}

/** Découpe le texte en lignes, normalise espaces (tabs → espace, multiple → un seul) */
export function lignes(texte: string): string[] {
  return texte
    .split(/\r?\n/)
    .map((l) => l.trim().replace(/\s+/g, " "))
    .filter((l) => l.length > 0);
}

/* ────────────────────── TOKENIZER NOMBRES ────────────────────── */

export interface NombresEtLibelle {
  nombres: number[];
  libelle: string;
}

/**
 * Longueurs décimales attendues selon le nombre de valeurs sur la ligne.
 * Dans un bulletin clarifié français :
 *   1 val  : [montant 2dec]
 *   2 vals : [montant 2dec, base 2dec]
 *   3 vals : [montant 2dec, taux 3dec, base 2dec]
 *   4 vals : [mt_empl 2dec, mt_sal 2dec, taux 3dec, base 2dec]
 */
function getDecimalLengths(numCommas: number): number[] {
  switch (numCommas) {
    case 1:
      return [2];
    case 2:
      return [2, 2];
    case 3:
      return [2, 3, 2];
    case 4:
      return [2, 2, 3, 2];
    case 5:
      return [2, 3, 2, 3, 2];
    default: {
      const r = Array<number>(numCommas).fill(2);
      if (numCommas >= 3) r[numCommas - 2] = 3; // taux = avant-dernier
      return r;
    }
  }
}

/**
 * Extrait les nombres et le libellé d'une ligne de bulletin.
 * Gère les nombres concaténés sans séparateur (artefact pdf-parse).
 */
export function extraireNombresEtLibelle(ligne: string): NombresEtLibelle {
  // 1. Trouver la dernière "virgule-nombre" (digit avant ET digit après)
  let lastNumberComma = -1;
  for (let i = 1; i < ligne.length - 1; i++) {
    if (ligne[i] === "," && /\d/.test(ligne[i - 1]) && /\d/.test(ligne[i + 1])) {
      lastNumberComma = i;
    }
  }
  if (lastNumberComma < 0) return { nombres: [], libelle: ligne.trim() };

  // 2. Fin de la partie décimale du dernier nombre (2-3 chiffres consécutifs après la virgule)
  let decEnd = lastNumberComma + 1;
  while (decEnd < ligne.length && /\d/.test(ligne[decEnd])) decEnd++;

  // 3. Séparer portion nombres / libellé
  const numPortion = ligne.slice(0, decEnd);
  const libelle = ligne.slice(decEnd).replace(/\s+/g, " ").trim();

  // 4. Trouver toutes les virgules-nombre dans la portion nombres
  const commas: number[] = [];
  for (let i = 1; i < numPortion.length - 1; i++) {
    if (numPortion[i] === "," && /\d/.test(numPortion[i - 1]) && /\d/.test(numPortion[i + 1])) {
      commas.push(i);
    }
  }
  if (commas.length === 0) return { nombres: [], libelle: ligne.trim() };

  // 5. Longueurs décimales
  const decLens = getDecimalLengths(commas.length);

  // 6. Extraire chaque nombre
  const nombres: number[] = [];
  let pos = 0;
  for (let c = 0; c < commas.length; c++) {
    const cp = commas[c];
    const intPart = numPortion.slice(pos, cp);
    const dl = decLens[c];
    const decPart = numPortion.slice(cp + 1, cp + 1 + dl);
    const numStr = (intPart + "," + decPart).trim();
    const val = parseNombre(numStr);
    if (val !== undefined) nombres.push(val);
    pos = cp + 1 + dl;
  }

  return { nombres, libelle };
}

/** Raccourci : extrait uniquement les nombres */
export function extraireNombres(ligne: string): number[] {
  return extraireNombresEtLibelle(ligne).nombres;
}

/** Raccourci : extrait uniquement le libellé (texte sans les nombres) */
export function extraireLibelle(ligne: string): string {
  return extraireNombresEtLibelle(ligne).libelle;
}

/* ────────────────────── CONGÉS ────────────────────── */

import type { CompteurConges } from "../types/common.js";

/**
 * Extrait les compteurs de congés (solde N, N-1, N-2) depuis les lignes du bulletin.
 *
 * Gère 3 situations pdf-parse :
 *  1. Valeur collée après le label : "SOLDE congés 25/26  N16,64"
 *  2. Valeur collée avant le label : "2,50SOLDE congés 23/24 N-2"
 *  3. Valeur sur une ligne séparée : "SOLDE congés 24/25 N-1" + lignes "16,64" / "29,00"
 */
export function extraireConges(lines: string[]): CompteurConges[] {
  const result: CompteurConges[] = [];
  const pendingLabels: { periode: string; type: "N" | "N-1" | "N-2"; idx: number }[] = [];
  const usedLineIndices = new Set<number>();

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];

    // Tester N-2 en premier (sinon "N-2" match aussi le pattern N)
    const m2 = l.match(/SOLDE\s+congés\s+(\d{2}\/\d{2})\s+N-2/i);
    if (m2) {
      const afterLabel = l.slice(l.indexOf(m2[0]) + m2[0].length);
      const afterVal = afterLabel.match(/^(\d[\d\s]*,\d{2})/);
      if (afterVal) {
        const v = parseNombre(afterVal[1]);
        if (v !== undefined && v < 100) {
          result.push({ periode: m2[1], type: "N-2", solde: v });
          usedLineIndices.add(i);
          continue;
        }
      }
      const beforeLabel = l.slice(0, l.indexOf(m2[0]));
      const beforeVal = beforeLabel.match(/(\d[\d\s]*,\d{2})\s*$/);
      if (beforeVal) {
        const v = parseNombre(beforeVal[1]);
        if (v !== undefined && v < 100) {
          result.push({ periode: m2[1], type: "N-2", solde: v });
          usedLineIndices.add(i);
          continue;
        }
      }
      pendingLabels.push({ periode: m2[1], type: "N-2", idx: i });
      continue;
    }

    // Tester N-1
    const m1 = l.match(/SOLDE\s+congés\s+(\d{2}\/\d{2})\s+N-1/i);
    if (m1) {
      const afterLabel = l.slice(l.indexOf(m1[0]) + m1[0].length);
      const afterVal = afterLabel.match(/^(\d[\d\s]*,\d{2})/);
      if (afterVal) {
        const v = parseNombre(afterVal[1]);
        if (v !== undefined && v < 100) {
          result.push({ periode: m1[1], type: "N-1", solde: v });
          usedLineIndices.add(i);
          continue;
        }
      }
      pendingLabels.push({ periode: m1[1], type: "N-1", idx: i });
      continue;
    }

    // Tester N (sans -1 ni -2)
    const m0 = l.match(/SOLDE\s+congés\s+(\d{2}\/\d{2})\s+N(?!-)/i);
    if (m0) {
      const afterLabel = l.slice(l.indexOf(m0[0]) + m0[0].length);
      const afterVal = afterLabel.match(/^(\d[\d\s]*,\d{2})/);
      if (afterVal) {
        const v = parseNombre(afterVal[1]);
        if (v !== undefined && v < 100) {
          result.push({ periode: m0[1], type: "N", solde: v });
          usedLineIndices.add(i);
          continue;
        }
      }
      pendingLabels.push({ periode: m0[1], type: "N", idx: i });
      continue;
    }
  }

  if (pendingLabels.length === 0) {
    return result.sort(triConges);
  }

  // Pass 2 : chercher des nombres autonomes (lignes "16,64") APRÈS les labels pending
  const startSearch = Math.min(...pendingLabels.map((p) => p.idx));
  const standaloneValues: { lineIdx: number; value: number }[] = [];
  for (let j = startSearch + 1; j < Math.min(startSearch + 12, lines.length); j++) {
    if (usedLineIndices.has(j)) continue;
    const trimmed = lines[j].trim();
    if (/^\d[\d\s]*,\d{2}$/.test(trimmed)) {
      const v = parseNombre(trimmed);
      if (v !== undefined && v < 100) {
        standaloneValues.push({ lineIdx: j, value: v });
      }
    }
  }

  // Assigner les valeurs autonomes aux labels pending dans l'ordre
  let sIdx = 0;
  const stillPending: typeof pendingLabels = [];
  for (const pending of pendingLabels) {
    if (sIdx < standaloneValues.length) {
      result.push({ periode: pending.periode, type: pending.type, solde: standaloneValues[sIdx].value });
      usedLineIndices.add(standaloneValues[sIdx].lineIdx);
      sIdx++;
    } else {
      stillPending.push(pending);
    }
  }

  // Pass 3 : fallback — chercher en arrière (nombre en fin de ligne précédente)
  const usedValues = new Set(result.map((r) => `${r.solde}`));
  for (const pending of stillPending) {
    for (let j = pending.idx - 1; j >= Math.max(0, pending.idx - 5); j--) {
      if (usedLineIndices.has(j)) continue;
      const endNum = lines[j].match(/(\d[\d\s]*,\d{2})\s*$/);
      if (endNum) {
        const v = parseNombre(endNum[1]);
        if (v !== undefined && v < 100 && !usedValues.has(`${v}`)) {
          result.push({ periode: pending.periode, type: pending.type, solde: v });
          usedValues.add(`${v}`);
          break;
        }
      }
    }
  }

  return result.sort(triConges);
}

function triConges(a: CompteurConges, b: CompteurConges): number {
  const order: Record<string, number> = { N: 0, "N-1": 1, "N-2": 2 };
  return (order[a.type] ?? 99) - (order[b.type] ?? 99);
}
