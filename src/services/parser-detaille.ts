/**
 * Parser bulletin DÉTAILLÉ : texte PDF -> BulletinDetaille (JSON)
 *
 * Chaque ligne de données se termine par un code à 5 chiffres (ex: 20000, 46000).
 * On utilise ces codes pour identifier le type de ligne (plus fiable que le texte
 * qui contient des artefacts pdf-parse comme "Cot isat ion").
 *
 * Codes :
 *   00xxx       Éléments de salaire
 *   01xxx       Sous-totaux salaire
 *   10000       Brut soumis à cotisation
 *   2xxxx-6xxxx Cotisations sociales
 *   7xxxx       CSG/CRDS/PAS/Allègements
 *   8xxxx       Remboursements
 *   9xxxx       Totaux / Net
 *
 * Colonnes inversées dans le texte extrait (pdf-parse) :
 *   Salaire (3 nums) : Montant | Taux | Base
 *   Cotisation (5 nums) : Mont_Empl | Taux_Empl | Mont_Sal | Taux_Sal | Base
 *   Cotisation (3 nums) : Mont | Taux | Base
 *   Cotisation (2 nums) : Mont | Base
 */

import type { BulletinDetaille } from "../types/bulletin-detaille.js";
import type {
  Employeur,
  Salarie,
  Periode,
  LigneElementSalaire,
  LigneCotisation,
  LigneRemboursement,
} from "../types/common.js";
import {
  parseNombre,
  parseDate,
  lignes,
  extraireNombresEtLibelle,
  extraireNombres,
  trouverToutesDates,
  extraireConges,
} from "./parser-commun.js";

/* ────────────────────── HELPERS ────────────────────── */

/** Retire le code 5 chiffres en fin de ligne */
function stripCode(line: string): { stripped: string; code?: string } {
  const m = line.match(/(\d{5})\s*$/);
  if (!m) return { stripped: line };
  return { stripped: line.slice(0, line.length - m[0].length), code: m[1] };
}

/** Nettoie les artefacts pdf-parse dans les libellés */
function nettoyerLibelle(lib: string): string {
  return lib
    .replace(/Cot\s*isat\s*ion/gi, "Cotisation")
    .replace(/T\s*ot\s*alit\s*[ée]/gi, "Totalité")
    .replace(/Allocat\s*ions/gi, "Allocations")
    .replace(/Cont\s*ribut?\s*ion/gi, "Contribution")
    .replace(/Cont\s*rib\s*\./gi, "Contrib.")
    .replace(/Format\s*ion/gi, "Formation")
    .replace(/Ret\s*rait\s*e/gi, "Retraite")
    .replace(/Assedic\s*/gi, "Assedic ")
    .replace(/T\s*ranche/gi, "Tranche")
    .replace(/P\s*revoyance/gi, "Prévoyance")
    .replace(/P\s*rélèvement/gi, "Prélèvement")
    .replace(/Deduct\s*ible/gi, "Déductible")
    .replace(/Mut\s*uelle/gi, "Mutuelle")
    .replace(/Accident\s*/gi, "Accident ")
    .replace(/t\s*ravail/gi, "travail")
    .replace(/Indemnit\s*[ée]/gi, "Indemnité")
    .replace(/sujet\s*ion/gi, "sujétion")
    .replace(/permanent\s*e/gi, "permanente")
    .replace(/Forfait\s*/gi, "Forfait ")
    .replace(/Evolut\s*ion/gi, "Evolution")
    .replace(/Réduct\s*ion/gi, "Réduction")
    .replace(/AP\s*EC/g, "APEC")
    .replace(/Solidarit\s*[ée]/gi, "Solidarité")
    .replace(/deplafonnee/gi, "déplafonnée")
    .replace(/supplé\s*\./gi, "supplé.")
    .replace(/CCNT\s+66/gi, "CCNT66")
    .replace(/T\s*aux d.emploi/gi, "Taux d'emploi")
    .replace(/B\s*r\s*u\s*t\s*s\s*o\s*u\s*m\s*i\s*s/gi, "Brut soumis")
    .replace(/Allégement\s*/gi, "Allégement ")
    .replace(/RGDU/gi, "RGDU")
    .replace(/T\s+echnique/gi, "Technique")
    .replace(/P\s+ro\b/gi, "Pro")
    .replace(/t\s+ransport/gi, "transport")
    .replace(/t\s+ous/gi, "tous")
    .replace(/édit\s+ion/gi, "édition")
    .replace(/\s+/g, " ")
    .trim();
}

/* ────────────────────── POINT D'ENTRÉE ────────────────────── */

export function parserBulletinDetaille(texte: string): BulletinDetaille {
  const lines = lignes(texte);
  const employeur = extraireEmployeur(lines, texte);
  const salarie = extraireSalarie(lines, texte);
  const periode = extrairePeriode(lines);
  const { elementsSalaire, brutCotisation } = extraireElementsSalaire(lines);
  const { cotisations, allegements } = extraireCotisationsDetaillees(lines);
  const remboursements = extraireRemboursements(lines);
  const conges = extraireConges(lines);
  const totaux = extraireTotaux(lines);
  const impot = extraireImpot(lines);
  const netPaye = extraireNetPaye(lines);
  const cumuls = extraireCumuls(lines, texte);

  return {
    type: "detaille",
    numeroBulletin: extraireNumeroBulletin(lines),
    employeur,
    salarie,
    periode,
    elementsSalaire,
    brutCotisation: brutCotisation ?? 0,
    cotisations,
    remboursements,
    totalRetenues: totaux.totalRetenues ?? Math.round(cotisations.reduce((s, c) => s + Math.abs(c.montantSalarie ?? 0), 0) * 100) / 100,
    totalCotisationsPatronales: totaux.totalPatronal ?? Math.round(cotisations.reduce((s, c) => s + (c.montantEmployeur ?? 0), 0) * 100) / 100,
    netSocial: totaux.netSocial ?? 0,
    netAPayerAvantImpôt: totaux.netAPayerAvantImpot ?? 0,
    impôtSurLeRevenu: impot,
    netPaye,
    cumuls,
    allegements,
    conges: conges.length > 0 ? conges : undefined,
  };
}

/* ────────────────────── EMPLOYEUR ────────────────────── */

function extraireEmployeur(lines: string[], texte: string): Employeur {
  const siretMatch = texte.match(/Siret\s*:\s*(\d{10,14})/i);

  // APE : chercher d'abord ligne par ligne (plus fiable que le texte joint)
  let ape: string | undefined;
  const idxApeLine = lines.findIndex((l) => /APE\s*:/i.test(l));
  if (idxApeLine >= 0) {
    const apeInLine = lines[idxApeLine].match(/APE\s*:\s*([A-Z0-9]{4,5})\s*$/i);
    if (apeInLine) {
      ape = apeInLine[1];
    } else {
      for (let j = idxApeLine + 1; j < Math.min(idxApeLine + 4, lines.length); j++) {
        if (/^[A-Z0-9]{4,5}$/i.test(lines[j].trim())) {
          ape = lines[j].trim();
          break;
        }
      }
    }
  }

  const cpVilleLine = lines.find((l) => /^\d{5}\s+[A-ZÀ-Ÿ]/.test(l));
  const cpVilleMatch = cpVilleLine?.match(/^(\d{5})\s+(.+)$/);
  const adresse = lines[0] && /^\d+\s+[A-ZÀ-Ÿ]/.test(lines[0]) ? lines[0].trim() : undefined;

  const idxDuAu = lines.findIndex((l) => /^du\s*au$/i.test(l));
  let nom = "";
  if (idxDuAu >= 0 && idxDuAu + 1 < lines.length) {
    const candidat = lines[idxDuAu + 1];
    if (candidat && /^[A-ZÀ-Ÿ]/.test(candidat) && !/^(Mme|M\.|Monsieur|Madame)\s/i.test(candidat)) {
      nom = candidat;
    }
  }

  // URSSAF : ignorer la ligne label "URSSAF :", prendre celle avec le nom complet
  const urssafLine = lines.find((l) => /^URSSAF\s+[A-ZÀ-Ÿ]/i.test(l) && !/^URSSAF\s*:/i.test(l));
  const urssaf = urssafLine?.trim();
  const numeroCotisant = lines.find((l) => /^\d{15,20}$/.test(l))?.trim();

  return {
    nom,
    adresse,
    codePostal: cpVilleMatch?.[1],
    ville: cpVilleMatch?.[2]?.replace(/\s+Siret.*$/i, "").trim(),
    siret: siretMatch?.[1] ?? "",
    ape,
    urssaf,
    numeroCotisant,
  };
}

/* ────────────────────── SALARIÉ ────────────────────── */

function extraireSalarie(lines: string[], texte: string): Salarie {
  const nomLine = lines.find((l) => /^(Mme|M\.|Monsieur|Madame)\s/i.test(l));
  const nom = nomLine ?? "";

  const idxMatricule = lines.findIndex((l) => /Matricule\s*:/i.test(l));
  const idxDuAu = lines.findIndex((l) => /^du\s*au$/i.test(l));
  let matricule = "";
  let coefficient: number | undefined;
  const searchEnd = idxDuAu >= 0 ? idxDuAu : Math.min((idxMatricule >= 0 ? idxMatricule : 0) + 10, lines.length);
  if (idxMatricule >= 0) {
    for (let i = idxMatricule + 1; i < searchEnd; i++) {
      if (!lines[i]) continue;
      if (!matricule && /^\d{1,6}$/.test(lines[i])) {
        matricule = lines[i];
        continue;
      }
      if (coefficient === undefined && /^\d{2,4},\d{1,2}$/.test(lines[i])) {
        coefficient = parseNombre(lines[i]);
      }
    }
  }

  const nssLine = lines.find((l) => /^\d{13,15}\s*\d{0,2}$/.test(l));
  const nss = nssLine?.replace(/\s/g, "").trim();

  const dateEntreeMatch = texte.match(/Date d.entr[ée]e?\s*:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
  const dateEntree = dateEntreeMatch ? parseDate(dateEntreeMatch[1]) : undefined;

  const conventionLine = lines.find((l) => /Convent?\s*ion\s+collect?\s*ive\s+du/i.test(l));
  let convention = conventionLine?.replace(/\s+/g, " ").trim();
  if (convention) {
    convention = convention.replace(/Convent\s*ion/gi, "Convention").replace(/collect\s*ive/gi, "collective");
  }

  // Echelon : "Echelon :AP RES 15 ANSRESP ONSABLE QUALIT E6"
  // Le chiffre d'échelon est à la fin (inversé par pdf-parse), on ignore "APRES x ANS"
  const echelonLine = lines.find((l) => /Echelon\s*:/i.test(l));
  let echelon: string | undefined;
  let emploi: string | undefined;
  if (echelonLine) {
    const val = echelonLine.replace(/Echelon\s*:\s*/i, "").trim();
    const digitMatch = val.match(/(\d+)\s*$/);
    if (digitMatch) {
      echelon = digitMatch[1];
    }
  }
  if (!emploi) {
    const emploiLine = lines.find((l) => /RESP\s*ONSABLE|DIRECTEUR|EDUCATEUR|AIDE|CHEF|INFIRMIER/i.test(l));
    emploi = emploiLine
      ?.replace(/RESP\s*ONSABLE/gi, "RESPONSABLE")
      .replace(/QUALIT\s*E/gi, "QUALITE")
      .replace(/\s*\d+\s*$/, "")
      .trim();
  }

  const qualifLine = lines.find((l) => /CADRE\s+CLASSE|EMPLOYE|OUVRIER|TECHNICIEN|AGENT/i.test(l));
  const qualification = qualifLine
    ?.replace(/ADMINIST\s*RAT\s*IF/gi, "ADMINISTRATIF")
    .replace(/\s+/g, " ")
    .trim();

  return {
    nom,
    matricule,
    numeroSecuriteSociale: nss,
    dateEntree,
    emploi,
    qualificationConventionnelle: qualification,
    coefficient,
    echelon,
    conventionCollective: convention,
  };
}

/* ────────────────────── PÉRIODE ────────────────────── */

function extrairePeriode(lines: string[]): Periode {
  for (const l of lines.slice(0, 10)) {
    const dates = trouverToutesDates(l);
    if (dates.length >= 2) {
      const parsed = dates.map((d) => {
        const [jour, mois, annee] = d.split("/");
        return { raw: d, iso: `${annee}-${mois.padStart(2, "0")}-${jour.padStart(2, "0")}` };
      });
      parsed.sort((a, b) => a.iso.localeCompare(b.iso));
      return { dateDebut: parsed[0].iso, dateFin: parsed[parsed.length - 1].iso };
    }
  }
  return { dateDebut: "", dateFin: "" };
}

/* ────────────────────── ÉLÉMENTS DE SALAIRE ────────────────────── */

function extraireElementsSalaire(lines: string[]): {
  elementsSalaire: LigneElementSalaire[];
  brutCotisation: number | undefined;
} {
  const elements: LigneElementSalaire[] = [];
  let brutCotisation: number | undefined;

  for (const l of lines) {
    const { stripped, code } = stripCode(l);
    if (!code) continue;
    const codeNum = parseInt(code, 10);

    // Codes 00001-09999 : éléments de salaire
    // Codes 01000-01999 : sous-totaux salaire
    if (codeNum >= 1 && codeNum < 10000) {
      const { nombres: nums, libelle: rawLib } = extraireNombresEtLibelle(stripped);
      const libelle = nettoyerLibelle(rawLib);
      if (nums.length === 0 || !libelle) continue;
      if (/N°|Li\s*be\s*l\s*l/i.test(libelle)) continue;

      if (nums.length >= 3) {
        elements.push({ libelle, base: nums[2], taux: nums[1], montant: nums[0], code });
      } else if (nums.length === 2) {
        elements.push({ libelle, base: nums[1], montant: nums[0], code });
      } else {
        elements.push({ libelle, montant: nums[0], code });
      }
    }

    // Code 10000 : Brut soumis à cotisation
    if (codeNum === 10000) {
      const { nombres: nums } = extraireNombresEtLibelle(stripped);
      if (nums.length >= 1) brutCotisation = nums[0];
    }
  }

  return { elementsSalaire: elements, brutCotisation };
}

/* ────────────────────── COTISATIONS DÉTAILLÉES ────────────────────── */
/*
 * 5 nums : [Mont_Empl, Taux_Empl, Mont_Sal, Taux_Sal, Base]
 * 3 nums (1er ≥ 0) : [Mont_Empl, Taux_Empl, Base]
 * 3 nums (1er < 0) : [Mont_Sal, Taux_Sal, Base]
 * 2 nums (2nd < 0) : [Base, Mont_Sal]
 * 2 nums (tous ≥ 0) : [Mont_Empl, Base]
 * 1 num : valeur unique
 */

function parseCotisationDetaille(nums: number[], libelle: string, code: string): LigneCotisation {
  if (nums.length >= 5) {
    return {
      libelle, code,
      base: nums[4],
      tauxSalarie: nums[3],
      montantSalarie: nums[2],
      tauxEmployeur: nums[1],
      montantEmployeur: nums[0],
    };
  }
  if (nums.length === 4) {
    // [Mont_Empl, Taux_Empl, Mont_Sal, Base] ou [Mont_Empl, Mont_Sal, Taux_Sal, Base]
    if (nums[2] < 0) {
      return {
        libelle, code,
        base: nums[3],
        montantSalarie: nums[2],
        tauxEmployeur: nums[1],
        montantEmployeur: nums[0],
      };
    }
    return {
      libelle, code,
      base: nums[3],
      tauxSalarie: nums[2],
      montantSalarie: 0,
      tauxEmployeur: nums[1],
      montantEmployeur: nums[0],
    };
  }
  if (nums.length === 3) {
    if (nums[0] < 0) {
      return { libelle, code, base: nums[2], tauxSalarie: nums[1], montantSalarie: nums[0] };
    }
    return { libelle, code, base: nums[2], tauxEmployeur: nums[1], montantEmployeur: nums[0], montantSalarie: 0 };
  }
  if (nums.length === 2) {
    if (nums[1] < 0) {
      // Employeur + Salarié sans base (forfait: mutuelle)
      return { libelle, code, montantEmployeur: nums[0], montantSalarie: nums[1] };
    }
    return { libelle, code, base: nums[1], montantEmployeur: nums[0], montantSalarie: 0 };
  }
  if (nums.length === 1) {
    if (nums[0] < 0) return { libelle, code, montantSalarie: nums[0] };
    return { libelle, code, montantEmployeur: nums[0], montantSalarie: 0 };
  }
  return { libelle, code, montantSalarie: 0 };
}

function extraireCotisationsDetaillees(lines: string[]): {
  cotisations: LigneCotisation[];
  allegements: { libelle: string; montant: number }[];
} {
  const cotisations: LigneCotisation[] = [];
  const allegements: { libelle: string; montant: number }[] = [];

  for (const l of lines) {
    const { stripped, code } = stripCode(l);
    if (!code) continue;
    const codeNum = parseInt(code, 10);

    // Codes 20000-69999 : cotisations sociales
    if (codeNum >= 20000 && codeNum < 70000) {
      const { nombres: nums, libelle: rawLib } = extraireNombresEtLibelle(stripped);
      const libelle = nettoyerLibelle(rawLib);
      if (nums.length === 0 || libelle.length < 2) continue;
      cotisations.push(parseCotisationDetaille(nums, libelle, code));
    }

    // Codes 73000-75999 : CSG / CRDS
    if (codeNum >= 73000 && codeNum < 76000) {
      const { nombres: nums, libelle: rawLib } = extraireNombresEtLibelle(stripped);
      const libelle = nettoyerLibelle(rawLib);
      if (nums.length === 0) continue;

      // Allègement (ex: 73576)
      if (/All[ée]gement/i.test(rawLib) || /RGDU/i.test(rawLib)) {
        allegements.push({ libelle, montant: nums[0] });
        continue;
      }

      // Forfait social (ex: 73355) - patronale
      if (/Forfait/i.test(rawLib)) {
        cotisations.push(parseCotisationDetaille(nums, libelle, code));
        continue;
      }

      // CSG/CRDS standard
      cotisations.push(parseCotisationDetaille(nums, libelle, code));
    }
  }

  return { cotisations, allegements };
}

/* ────────────────────── REMBOURSEMENTS ────────────────────── */

function extraireRemboursements(lines: string[]): LigneRemboursement[] {
  const remboursements: LigneRemboursement[] = [];
  for (const l of lines) {
    const { stripped, code } = stripCode(l);
    if (!code) continue;
    const codeNum = parseInt(code, 10);
    if (codeNum >= 80000 && codeNum < 90000) {
      const { nombres: nums, libelle: rawLib } = extraireNombresEtLibelle(stripped);
      const libelle = nettoyerLibelle(rawLib);
      if (nums.length > 0 && libelle) {
        remboursements.push({ libelle, montant: nums[0], code });
      }
    }
  }
  return remboursements;
}

/* ────────────────────── TOTAUX ────────────────────── */

function extraireTotaux(lines: string[]): {
  netSocial?: number;
  netAPayerAvantImpot?: number;
  totalRetenues?: number;
  totalPatronal?: number;
} {
  let netSocial: number | undefined;
  let netAPayerAvantImpot: number | undefined;

  for (const l of lines) {
    const { stripped, code } = stripCode(l);
    if (!code) continue;
    const codeNum = parseInt(code, 10);

    // Code 94142 : Net social
    if (codeNum === 94142) {
      const nums = extraireNombres(stripped);
      if (nums.length >= 1) netSocial = nums[nums.length - 1]; // Dernier nombre = net social
    }

    // Code 90010 : Net à payer BS (avant PAS)
    if (codeNum === 90010) {
      const nums = extraireNombres(stripped);
      if (nums.length >= 1) netAPayerAvantImpot = nums[0];
    }
  }

  // Calculer totaux à partir des cotisations si nécessaire
  return { netSocial, netAPayerAvantImpot };
}

/* ────────────────────── IMPÔT SUR LE REVENU (PAS) ────────────────────── */

function extraireImpot(lines: string[]): BulletinDetaille["impôtSurLeRevenu"] {
  for (const l of lines) {
    const { stripped, code } = stripCode(l);
    if (code === "76041") {
      const nums = extraireNombres(stripped);
      // 3 nums salarié only : [Montant_Sal, Taux, Base]
      if (nums.length >= 3) {
        return { base: nums[2], tauxPersonnalise: nums[1], montant: nums[0] };
      }
      if (nums.length >= 2) {
        return { base: nums[1], tauxPersonnalise: nums[0], montant: 0 };
      }
    }
  }
  return undefined;
}

/* ────────────────────── NET PAYÉ ────────────────────── */

function extraireNetPaye(lines: string[]): number | undefined {
  // Stratégie 1 : chercher en arrière depuis la dernière occurrence de "Euros"
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^Euros$/i.test(lines[i].trim())) {
      for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
        const trimmed = lines[j].trim();
        if (/^\d[\d\s]*,\d{2}$/.test(trimmed)) {
          const val = parseNombre(trimmed);
          if (val !== undefined && val > 0) return val;
        }
      }
    }
  }
  // Stratégie 2 : net à payer avant PAS - PAS = net payé
  return undefined;
}

/* ────────────────────── CUMULS ────────────────────── */

function extraireCumuls(lines: string[], texte: string): BulletinDetaille["cumuls"] {
  let brut: number | undefined;
  let heures: number | undefined;
  let netImposable: number | undefined;
  let netSocial: number | undefined;

  // Net Imposable : priorité au "mensuel" (valeur individuelle) puis fallback sur le cumul
  // Pour les salariés multi-contrats, le Cumul Net Imposable inclut tous les contrats,
  // tandis que le Net Imposable mensuel correspond au bulletin courant.
  const mensuelMatch = texte.match(/Net\s+Imposable\s+mensuel\s*(\d[\d\s]*,\d{2,3})/i);
  if (mensuelMatch) netImposable = parseNombre(mensuelMatch[1]);
  if (!netImposable) {
    const netImpMatch = texte.match(/Cumul\s+Net\s+Imposable\s*(\d[\d\s]*,\d{2,3})/i);
    if (netImpMatch) netImposable = parseNombre(netImpMatch[1]);
  }

  // Heures : "Cumul Heures151,67" (souvent collé)
  const heuresMatch = texte.match(/Cumul\s+Heures\s*(\d[\d\s]*,\d{2,3})/i);
  if (heuresMatch) heures = parseNombre(heuresMatch[1]);

  // Net Social
  for (const l of lines) {
    if (/Cumul\s+Net\s+Social/i.test(l)) {
      const nums = extraireNombres(l);
      if (nums.length > 0) netSocial = nums[0];
    }
  }

  // Cumul Brut : la valeur peut être collée au milieu d'un texte (ex: "SOLDE congés 25/26  N4 354,68")
  const cumulBrutMatch = texte.match(/Cumul\s+Brut[\s\S]*?(\d[\d\s]*,\d{2})/i);
  if (cumulBrutMatch) brut = parseNombre(cumulBrutMatch[1]);

  return { brut, heures, netImposable, netSocial };
}

/* ────────────────────── NUMÉRO BULLETIN ────────────────────── */

function extraireNumeroBulletin(lines: string[]): string | undefined {
  const idx = lines.findIndex((l) => /Bulletin n[°o]\s*:/i.test(l));
  if (idx >= 0) {
    const val = lines[idx].replace(/.*Bulletin n[°o]\s*:\s*/i, "").trim();
    if (val.length > 0 && val.length < 20) return val;
    for (let i = idx + 1; i < Math.min(idx + 3, lines.length); i++) {
      if (/^\d{1,6}$/.test(lines[i])) return lines[i];
    }
  }
  return undefined;
}
