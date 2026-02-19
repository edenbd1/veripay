/**
 * Parser bulletin CLARIFIÉ : texte PDF -> BulletinClarifie (JSON)
 *
 * IMPORTANT : pdf-parse extrait les colonnes dans l'ordre inversé :
 *   - Éléments salaire : Montant | Taux | Base | Libellé
 *   - Cotisations (4 nums) : Montant_Empl | Montant_Sal | Taux_Sal | Base | Libellé
 *   - Cotisations (3 nums, 1er négatif) : Montant_Sal | Taux | Base | Libellé
 *   - Cotisations (2 nums positifs) : Montant_Empl | Base | Libellé
 *   - Cotisations (2 nums, 1 négatif) : Base | Montant_Sal | Libellé
 */

import type { BulletinClarifie, BlocCotisationsClarifie } from "../types/bulletin-clarifie.js";
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
  extraireNombres,
  extraireLibelle,
  extraireNombresEtLibelle,
  trouverToutesDates,
  extraireConges,
} from "./parser-commun.js";

/* ────────────────────── POINT D'ENTRÉE ────────────────────── */

export function parserBulletinClarifie(texte: string): BulletinClarifie {
  const lines = lignes(texte);
  const employeur = extraireEmployeur(lines, texte);
  const salarie = extraireSalarie(lines, texte);
  const periode = extrairePeriode(lines);
  const { elementsSalaire, brutCotisation } = extraireElementsSalaire(lines);
  const blocsCotisations = extraireBlocsCotisations(lines);
  const remboursements = extraireRemboursements(lines);
  const totaux = extraireTotaux(lines);
  const impot = extraireImpot(lines);
  const netPaye = extraireNetPaye(lines);
  const cumuls = extraireCumuls(lines, texte);
  const allegements = extraireAllegements(lines);
  const conges = extraireConges(lines);

  return {
    type: "clarifie",
    numeroBulletin: extraireNumeroBulletin(lines),
    employeur,
    salarie,
    periode,
    elementsSalaire,
    brutCotisation: brutCotisation ?? 0,
    blocsCotisations,
    remboursements,
    totalRetenues: totaux.totalRetenues ?? 0,
    totalCotisationsPatronales: totaux.totalPatronal ?? 0,
    netSocial: totaux.netSocial ?? 0,
    "netAPayerAvantImpôt": totaux.netAPayerAvantImpot ?? 0,
    "impôtSurLeRevenu": impot,
    netPaye,
    cumuls,
    allegements,
    conges: conges.length > 0 ? conges : undefined,
  };
}

/* ────────────────────── EMPLOYEUR ────────────────────── */

function extraireEmployeur(lines: string[], texte: string): Employeur {
  // SIRET et APE : chercher "Siret : XXXXXXXXX APE : XXXX" (ou "Siret : XXX" + "APE : XXX")
  const siretMatch = texte.match(/Siret\s*:\s*(\d{10,14})/i);
  const apeMatch = texte.match(/APE\s*:\s*([A-Z0-9]{4,5})/i);

  // Code postal + ville : "67100 STRASBOURG" (5 chiffres + ville en majuscules)
  const cpVilleLine = lines.find((l) => /^\d{5}\s+[A-ZÀ-Ÿ]/.test(l));
  const cpVilleMatch = cpVilleLine?.match(/^(\d{5})\s+(.+)$/);

  // Adresse : première ligne du texte (ex: "204 BESSIERE")
  const adresse = lines[0] && /^\d+\s+[A-ZÀ-Ÿ]/.test(lines[0]) ? lines[0] : undefined;

  // Nom employeur : ligne après "du au" ou "duau" (souvent en majuscules, nom de la société)
  const idxDuAu = lines.findIndex((l) => /^du\s*au$/i.test(l));
  let nom = "";
  if (idxDuAu >= 0 && idxDuAu + 1 < lines.length) {
    const candidat = lines[idxDuAu + 1];
    if (candidat && /^[A-ZÀ-Ÿ]/.test(candidat) && !/^(Mme|M\.|Monsieur|Madame)\s/i.test(candidat)) {
      nom = candidat;
    }
  }

  // URSSAF
  const urssaf = lines.find((l) => /URSSAF\s*:/i.test(l))?.replace(/URSSAF\s*:\s*/i, "").trim();
  const numeroCotisant = lines.find((l) => /N° de cotisant/i.test(l))?.replace(/N° de cotisant\s*:\s*/i, "").trim();

  return {
    nom,
    adresse,
    codePostal: cpVilleMatch?.[1],
    ville: cpVilleMatch?.[2]?.replace(/\s+Siret.*$/i, "").trim(),
    siret: siretMatch?.[1] ?? "",
    ape: apeMatch?.[1],
    urssaf,
    numeroCotisant,
  };
}

/* ────────────────────── SALARIÉ ────────────────────── */

function extraireSalarie(lines: string[], texte: string): Salarie {
  // Nom : ligne commençant par "Mme ", "M. ", "Monsieur ", "Madame "
  const nomLine = lines.find((l) => /^(Mme|M\.|Monsieur|Madame)\s/i.test(l));
  const nom = nomLine ?? "";

  // Matricule et coefficient : entre "Matricule :" et "du au"
  // Le matricule est un entier seul (ex: "4050"), le coefficient a une virgule (ex: "977,5")
  const idxMatricule = lines.findIndex((l) => /Matricule\s*:/i.test(l));
  const idxDuAu = lines.findIndex((l) => /^du\s*au$/i.test(l));
  let matricule = "";
  let coefficient: number | undefined;
  const searchEnd = idxDuAu >= 0 ? idxDuAu : Math.min((idxMatricule >= 0 ? idxMatricule : 0) + 8, lines.length);
  if (idxMatricule >= 0) {
    for (let i = idxMatricule + 1; i < searchEnd; i++) {
      if (!lines[i]) continue;
      if (!matricule && /^\d{1,6}$/.test(lines[i])) {
        matricule = lines[i];
        continue;
      }
      if (!coefficient && /^\d{2,4},\d{1,2}$/.test(lines[i])) {
        coefficient = parseNombre(lines[i]);
      }
    }
  }

  // Convention (pdf-parse peut insérer des espaces : "Convent ion collect ive")
  const conventionLine = lines.find((l) => /Convent?\s*ion\s+collect?\s*ive\s+du/i.test(l));
  let convention = conventionLine?.replace(/\s+/g, " ").trim();
  if (convention) {
    convention = convention
      .replace(/Convent\s*ion/gi, "Convention")
      .replace(/collect\s*ive/gi, "collective");
  }

  // Echelon : le chiffre peut être sur la même ligne (détaillé) ou sur une ligne séparée (clarifié)
  // Ex clarifié : ligne 19 "Echelon :", ligne 20 "AP RES 15 ANS", ligne 22 "6"
  // Ex détaillé : "Echelon :AP RES 15 ANSRESP ONSABLE QUALIT E6" (chiffre à la fin)
  const idxEchelon = lines.findIndex((l) => /Echelon\s*:/i.test(l));
  let echelon: string | undefined;
  if (idxEchelon >= 0) {
    const valOnLine = lines[idxEchelon].replace(/Echelon\s*:\s*/i, "").trim();
    const trailingDigit = valOnLine.match(/(\d+)\s*$/);
    if (trailingDigit && !/ANS\s*$/i.test(valOnLine)) {
      echelon = trailingDigit[1];
    } else {
      for (let j = idxEchelon + 1; j < Math.min(idxEchelon + 6, lines.length); j++) {
        if (/^\d{1,2}$/.test(lines[j].trim())) {
          echelon = lines[j].trim();
          break;
        }
      }
    }
  }

  // Emploi : ligne entre "Echelon" et "Coefficient" contenant un titre de poste
  const emploiLine = lines.find((l) =>
    /RESP\s*ONSABLE|DIRECTEUR|EDUCATEUR|AIDE|CHEF|INFIRMIER/i.test(l)
  );
  let emploi = emploiLine?.replace(/\s*\d+\s*$/, "").trim();
  if (emploi) emploi = emploi.replace(/RESP\s*ONSABLE/gi, "RESPONSABLE").replace(/QUALIT\s*E/gi, "QUALITE");

  // Qualification conventionnelle
  const qualifLine = lines.find((l) => /CADRE\s+CLASSE|EMPLOYE|OUVRIER|TECHNICIEN|AGENT/i.test(l));
  const qualification = qualifLine
    ?.replace(/\s*D[ée]but\s+de\s+contrat.*$/i, "")
    .replace(/ADMINIST\s*RAT\s*IF/gi, "ADMINISTRATIF")
    .replace(/\s+/g, " ")
    .trim();

  // Date d'entrée / début de contrat
  const dateEntreeMatch = texte.match(/D[ée]but\s+de\s+contrat\s*:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
  const dateEntree = dateEntreeMatch ? parseDate(dateEntreeMatch[1]) : undefined;

  // Taux d'emploi
  const tauxEmploiLine = lines.find((l) => /Taux d'emploi|T aux d'emploi/i.test(l));
  const tauxNums = tauxEmploiLine ? extraireNombres(tauxEmploiLine) : [];
  const tauxEmploi = tauxNums.length > 0 ? tauxNums[0] : undefined;

  return {
    nom,
    matricule,
    dateEntree,
    emploi,
    qualificationConventionnelle: qualification,
    coefficient,
    echelon,
    conventionCollective: convention,
    tauxEmploi,
  };
}

/* ────────────────────── PÉRIODE ────────────────────── */

function extrairePeriode(lines: string[]): Periode {
  // Les dates apparaissent sur une ligne avec deux dates : "31/01/2026 01/01/2026"
  // L'ordre dans le texte extrait est : dateFin dateDebut (inversé)
  for (const l of lines.slice(0, 10)) {
    const dates = trouverToutesDates(l);
    if (dates.length >= 2) {
      // Trier : la plus petite est le début, la plus grande est la fin
      const parsed = dates.map((d) => {
        const [jour, mois, annee] = d.split("/");
        return { raw: d, iso: `${annee}-${mois.padStart(2, "0")}-${jour.padStart(2, "0")}` };
      });
      parsed.sort((a, b) => a.iso.localeCompare(b.iso));
      return {
        dateDebut: parsed[0].iso,
        dateFin: parsed[parsed.length - 1].iso,
      };
    }
  }
  return { dateDebut: "", dateFin: "" };
}

/* ────────────────────── ÉLÉMENTS DE SALAIRE ────────────────────── */
/*
 * Ordre des colonnes dans le texte extrait (inversé) :
 *   3 nums : Montant | Taux | Base | Libellé
 *   2 nums : Montant | Base | Libellé
 *   1 num  : Montant | Libellé
 */

function extraireElementsSalaire(lines: string[]): {
  elementsSalaire: LigneElementSalaire[];
  brutCotisation: number | undefined;
} {
  const elements: LigneElementSalaire[] = [];
  let brutCotisation: number | undefined;

  // Trouver la zone des éléments de salaire
  const startIdx = lines.findIndex((l) =>
    /Salaire indiciaire|Taux d.emploi|T\s*aux d.emploi|Indemnit/i.test(l)
  );
  if (startIdx < 0) return { elementsSalaire: elements, brutCotisation };

  for (let i = startIdx; i < Math.min(startIdx + 20, lines.length); i++) {
    const l = lines[i];
    const { nombres: nums, libelle } = extraireNombresEtLibelle(l);

    // "B rut soumis à cotisation" → nums[0] = montant brut (pdf-parse met parfois un espace)
    if (/B\s*rut\s+soumis/i.test(l)) {
      if (nums.length >= 1) brutCotisation = nums[0];
      break;
    }

    // Remboursement = fin de la zone éléments
    if (/Remboursement/i.test(l)) break;
    // Cotisations = fin de la zone éléments
    if (/Cotisations et contributions/i.test(l) || /^\s*SANTE\s*$/i.test(l)) break;

    if (nums.length === 0 || !libelle || /El[ée]ments|Salari[ée]|B\s*aseTaux/i.test(libelle)) continue;

    if (/Taux d.emploi|T\s*aux d.emploi/i.test(l)) {
      elements.push({ libelle: "Taux d'emploi", base: nums[0], montant: nums[0] });
      continue;
    }

    // Nettoyage libellé (artefacts pdf-parse)
    const cleanLib = libelle
      .replace(/CCNT\s*66/gi, "CCNT66")
      .replace(/\s+/g, " ");

    if (nums.length >= 3) {
      // Montant | Taux | Base
      elements.push({ libelle: cleanLib, base: nums[2], taux: nums[1], montant: nums[0] });
    } else if (nums.length === 2) {
      elements.push({ libelle: cleanLib, base: nums[1], montant: nums[0] });
    } else {
      elements.push({ libelle: cleanLib, montant: nums[0] });
    }
  }

  return { elementsSalaire: elements, brutCotisation };
}

/* ────────────────────── COTISATIONS (BLOCS) ────────────────────── */
/*
 * Ordre des colonnes dans le texte extrait (inversé) :
 *   4 nums : Montant_Empl | Montant_Sal | Taux_Sal | Base
 *   3 nums (1er < 0) : Montant_Sal | Taux | Base
 *   2 nums (2ème < 0) : Base/Forfait | Montant_Sal
 *   2 nums (tous > 0) : Montant_Empl | Base
 *   1 num  : Montant_Empl ou Montant_Sal (selon signe)
 */

const SECTIONS_STANDALONE = /^\s*(SANTE|RETRAITE|ASSURANCE\s+CH[OÔ]MAG?\s*E)\s*$/i;
const FIN_COTISATIONS = /TOTAL DES COTISATIONS|TOTAL DES CONTRIB|^NET SOCIAL|NET A PAYER/i;

/** Nettoie les artefacts pdf-parse dans les libellés (espaces insérés dans les mots) */
function nettoyerLibelle(lib: string): string {
  return lib
    .replace(/CONTRIB\s+UTIONS/gi, "CONTRIBUTIONS")
    .replace(/ALLEG\s*EMENTS/gi, "ALLEGEMENTS")
    .replace(/ADMINIST\s*RAT\s*IF/gi, "ADMINISTRATIF")
    .replace(/RESP\s*ONSABLE/gi, "RESPONSABLE")
    .replace(/QUALIT\s*E\b/gi, "QUALITE")
    .replace(/CH[OÔ]MAG?\s*E/gi, "CHÔMAGE")
    .replace(/\s+/g, " ")
    .trim();
}

function parseLigneCotisation(nums: number[], libelle: string): LigneCotisation {
  libelle = nettoyerLibelle(libelle);
  if (nums.length >= 4) {
    return {
      libelle,
      base: nums[3],
      tauxSalarie: nums[2],
      montantSalarie: nums[1],
      montantEmployeur: nums[0],
    };
  }
  if (nums.length === 3) {
    if (nums[0] < 0) {
      // Salarié uniquement (ex: CSG) : Montant_Sal | Taux | Base
      return { libelle, base: nums[2], tauxSalarie: nums[1], montantSalarie: nums[0] };
    }
    // Employeur avec taux : Montant_Empl | Taux | Base
    return { libelle, base: nums[2], tauxEmployeur: nums[1], montantEmployeur: nums[0], montantSalarie: 0 };
  }
  if (nums.length === 2) {
    if (nums[1] < 0) {
      // Employeur + Salarié sans base (forfait ex: Complémentaire Santé)
      return { libelle, montantEmployeur: nums[0], montantSalarie: nums[1] };
    }
    // Montant_Empl | Base (ex: Accidents du travail, Chômage)
    return { libelle, base: nums[1], montantEmployeur: nums[0], montantSalarie: 0 };
  }
  if (nums.length === 1) {
    if (nums[0] < 0) return { libelle, montantSalarie: nums[0] };
    return { libelle, montantEmployeur: nums[0], montantSalarie: 0 };
  }
  return { libelle, montantSalarie: 0 };
}

function extraireBlocsCotisations(lines: string[]): BlocCotisationsClarifie[] {
  const blocs: BlocCotisationsClarifie[] = [];
  let currentBloc: BlocCotisationsClarifie | null = null;

  // Trouver le début des cotisations (après "Cotisations et contributions" ou "SANTE")
  const startIdx = lines.findIndex(
    (l) => /Cotisations et contributions sociales/i.test(l) || /^SANTE$/i.test(l)
  );
  if (startIdx < 0) return blocs;

  function pushCurrentBloc() {
    if (currentBloc && currentBloc.lignes.length > 0) blocs.push(currentBloc);
    currentBloc = null;
  }

  for (let i = startIdx; i < lines.length; i++) {
    const l = lines[i];

    // Fin de la zone cotisations
    if (FIN_COTISATIONS.test(l)) {
      pushCurrentBloc();
      break;
    }

    // Exonérations → on s'arrête (traité séparément)
    if (/EXONERATION|ALLEGEMENT|ECRETEMENT/i.test(l) && /\d/.test(l)) {
      pushCurrentBloc();
      continue;
    }

    // "Cotisations et contributions sociales" → juste un titre, on skip
    if (/Cotisations et contributions sociales/i.test(l)) continue;

    const { nombres: nums, libelle } = extraireNombresEtLibelle(l);

    // Section standalone (texte seul, pas de nombres) : SANTE, RETRAITE, ASSURANCE CHÔMAGE
    if (nums.length === 0 && SECTIONS_STANDALONE.test(l.trim())) {
      pushCurrentBloc();
      const nom = l.trim().toUpperCase()
        .replace(/ASSURANCE\s+CH[OÔ]MAG?\s*E/i, "ASSURANCE_CHOMAGE");
      currentBloc = { nom, lignes: [] };
      continue;
    }

    // Lignes avec nombres
    if (nums.length > 0 && libelle.length > 1) {
      // Section-total (FAMILLE, AUTRES CONTRIBUTIONS) : crée un bloc avec une seule ligne
      if (/^FAMILLE$/i.test(libelle)) {
        pushCurrentBloc();
        const ligne = parseLigneCotisation(nums, libelle);
        blocs.push({ nom: "FAMILLE", lignes: [ligne] });
        continue;
      }
      if (/AUTRES\s+CONTRIB\s*UTIONS/i.test(libelle)) {
        pushCurrentBloc();
        const ligne = parseLigneCotisation(nums, libelle);
        blocs.push({ nom: "AUTRES_CONTRIBUTIONS", lignes: [ligne] });
        continue;
      }

      // CSG / CRDS : crée un bloc dédié si on n'est pas dans un bloc nommé
      if (/CSG|CRDS/i.test(libelle)) {
        if (!currentBloc || !/CSG/i.test(currentBloc.nom)) {
          pushCurrentBloc();
          currentBloc = { nom: "CSG_CRDS", lignes: [] };
        }
        currentBloc.lignes.push(parseLigneCotisation(nums, libelle));
        continue;
      }

      // Ligne de cotisation standard
      if (currentBloc) {
        currentBloc.lignes.push(parseLigneCotisation(nums, libelle));
      } else {
        // Orphelin : créer un bloc générique
        currentBloc = { nom: "AUTRES", lignes: [] };
        currentBloc.lignes.push(parseLigneCotisation(nums, libelle));
      }
    }
  }
  pushCurrentBloc();
  return blocs;
}

/* ────────────────────── REMBOURSEMENTS ────────────────────── */

function extraireRemboursements(lines: string[]): LigneRemboursement[] {
  const remboursements: LigneRemboursement[] = [];
  const rembLine = lines.find((l) => /Remboursement transport/i.test(l));
  if (rembLine) {
    const nums = extraireNombres(rembLine);
    if (nums.length > 0) {
      remboursements.push({ libelle: "Remboursement transport", montant: nums[0] });
    }
  }
  return remboursements;
}

/* ────────────────────── TOTAUX ────────────────────── */

function extraireTotaux(lines: string[]): {
  totalRetenues?: number;
  totalPatronal?: number;
  netSocial?: number;
  netAPayerAvantImpot?: number;
} {
  let totalRetenues: number | undefined;
  let totalPatronal: number | undefined;
  let netSocial: number | undefined;
  let netAPayerAvantImpot: number | undefined;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];

    // "2 605,381 057,87  TOTAL DES COTISATIONS ET CONTRIBUTIONS"
    if (/TOTAL DES COTIS|TOTAL DES CONTRIB/i.test(l)) {
      const nums = extraireNombres(l);
      if (nums.length >= 2) {
        totalPatronal = nums[0];
        totalRetenues = nums[1];
      }
    }

    // "3 296,81  NET SOCIAL" ou sur ligne séparée
    if (/NET SOCIAL/i.test(l) && !/Cumul/i.test(l) && !/Annuel|Mensuel/i.test(l)) {
      const nums = extraireNombres(l);
      if (nums.length >= 1) netSocial = nums[0];
    }

    // "3 324,81" puis "NET A PAYER AVANT IMPOT" (souvent 2 lignes séparées)
    if (/NET A PAYER AVANT IMP[OÔ]T/i.test(l)) {
      const nums = extraireNombres(l);
      if (nums.length >= 1) {
        netAPayerAvantImpot = nums[0];
      } else if (i > 0) {
        const prevNums = extraireNombres(lines[i - 1]);
        if (prevNums.length >= 1) netAPayerAvantImpot = prevNums[0];
      }
    }
  }

  return { totalRetenues, totalPatronal, netSocial, netAPayerAvantImpot };
}

/* ────────────────────── IMPÔT SUR LE REVENU (PAS) ────────────────────── */

function extraireImpot(lines: string[]): BulletinClarifie["impôtSurLeRevenu"] {
  // PAS : souvent réparti sur 2-3 lignes dans le texte pdf-parse :
  //   "Impôt sur le revenu prélevé à la source"
  //   "3 445,671,50"
  //   "-51,69"
  const pasIdx = lines.findIndex((l) =>
    /Imp[oô]t sur le revenu pr[ée]lev/i.test(l) || /Pr[ée]l[eè]vement [àa] la source/i.test(l)
  );
  if (pasIdx < 0) return undefined;

  // Collecter les nombres sur la ligne PAS et les 2 suivantes
  const allNums: number[] = [];
  for (let j = pasIdx; j < Math.min(pasIdx + 3, lines.length); j++) {
    allNums.push(...extraireNombres(lines[j]));
    if (allNums.length >= 3) break;
  }
  if (allNums.length < 2) return undefined;
  return {
    base: allNums[0],
    tauxPersonnalise: allNums[1],
    montant: allNums.length >= 3 ? allNums[2] : -(allNums[0] * allNums[1]) / 100,
  };
}

/* ────────────────────── NET PAYÉ ────────────────────── */

function extraireNetPaye(lines: string[]): number | undefined {
  // "Net payé en euros" suivi d'un montant (parfois sur la même ligne, parfois la suivante)
  for (let i = 0; i < lines.length; i++) {
    if (/Net pay[ée] en euros/i.test(lines[i])) {
      const nums = extraireNombres(lines[i]);
      if (nums.length > 0) return nums[0];
      // Chercher sur la ligne suivante
      if (i + 1 < lines.length) {
        const numsNext = extraireNombres(lines[i + 1]);
        if (numsNext.length > 0) return numsNext[0];
      }
    }
  }
  // Fallback : chercher un montant après "Net payé"
  const netLine = lines.find((l) => /Net pay[ée]/i.test(l));
  if (netLine) {
    const nums = extraireNombres(netLine);
    if (nums.length > 0) return nums[0];
  }
  return undefined;
}

/* ────────────────────── CUMULS ────────────────────── */

function extraireCumuls(lines: string[], texte: string): BulletinClarifie["cumuls"] {
  let brut: number | undefined;
  let heures: number | undefined;
  let netImposable: number | undefined;
  let netSocial: number | undefined;

  // "Cumul Net Imposable3 445,67" (concaténé dans le texte brut)
  const netImpMatch = texte.match(/Cumul\s+Net\s+Imposable\s*(\d[\d\s]*,\d{2,3})/i);
  if (netImpMatch) netImposable = parseNombre(netImpMatch[1]);

  // Fallback : "Net Imposable mensuel3 445,67"
  if (!netImposable) {
    const mensuelMatch = texte.match(/Net\s+Imposable\s+mensuel\s*(\d[\d\s]*,\d{2,3})/i);
    if (mensuelMatch) netImposable = parseNombre(mensuelMatch[1]);
  }

  // Cumul Net Social : chercher la ligne avec "Cumul Net Social"
  for (const l of lines) {
    if (/Cumul\s+Net\s+Social/i.test(l)) {
      const nums = extraireNombres(l);
      if (nums.length > 0) netSocial = nums[0];
    }
  }

  // Cumul Brut : valeur souvent plusieurs lignes après le label (mélangée avec congés)
  const cumulBrutMatch = texte.match(/Cumul\s+Brut[\s\S]*?(\d[\d\s]*,\d{2})/i);
  if (cumulBrutMatch) brut = parseNombre(cumulBrutMatch[1]);

  // Cumul Heures : essai direct (détaillé: "Cumul Heures151,67") puis fallback
  const heuresDirectMatch = texte.match(/Cumul\s+Heures\s*(\d[\d\s]*,\d{2})/i);
  if (heuresDirectMatch) {
    heures = parseNombre(heuresDirectMatch[1]);
  } else {
    // Fallback clarifié : la valeur est souvent collée après "N-1" en fin de ligne
    for (const l of lines) {
      const m = l.match(/N-1(\d{2,3},\d{2})\s*$/);
      if (m) {
        const v = parseNombre(m[1]);
        if (v !== undefined && v > 100 && v < 300) { heures = v; break; }
      }
    }
  }

  return { brut, heures, netImposable, netSocial };
}

/* ────────────────────── ALLÈGEMENTS ────────────────────── */

function extraireAllegements(lines: string[]): BulletinClarifie["allegements"] {
  const allegements: { libelle: string; montant: number }[] = [];

  for (const l of lines) {
    if (/EXONERATION|ALL[ÉE]GEMENT|ECRETEMENT/i.test(l)) {
      const nums = extraireNombres(l);
      const libelle = extraireLibelle(l);
      if (nums.length > 0 && libelle.length > 2) {
        allegements.push({ libelle, montant: nums[0] });
      }
    }
  }

  // "Allégement de cotisations employeur" avec montant
  for (const l of lines) {
    if (/All[ée]gement de cotisations employeur/i.test(l)) {
      const nums = extraireNombres(l);
      if (nums.length > 0) {
        allegements.push({ libelle: "Allégement cotisations employeur", montant: nums[0] });
      }
    }
  }

  return allegements.length > 0 ? allegements : undefined;
}

/* ────────────────────── NUMÉRO BULLETIN ────────────────────── */

function extraireNumeroBulletin(lines: string[]): string | undefined {
  const line = lines.find((l) => /Bulletin n[°o]\s*:/i.test(l));
  if (line) {
    const val = line.replace(/.*Bulletin n[°o]\s*:\s*/i, "").trim();
    if (val.length > 0 && val.length < 20) return val;
  }
  // Chercher un nombre seul après la ligne "Bulletin n°"
  const idx = lines.findIndex((l) => /Bulletin n[°o]/i.test(l));
  if (idx >= 0) {
    for (let i = idx + 1; i < Math.min(idx + 3, lines.length); i++) {
      if (/^\d{1,6}$/.test(lines[i])) return lines[i];
    }
  }
  return undefined;
}
