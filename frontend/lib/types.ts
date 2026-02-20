export interface ErreurBulletin {
  type: "TIAFM" | "AAICO" | "RGDUB" | "autre";
  message: string;
}

export interface ResultatBulletin {
  salarie: string;
  periode: string;
  valide: boolean;
  erreurs: ErreurBulletin[];
}

export interface ResultatAnalyse {
  nombreBulletins: number;
  nombrePages: number;
  bulletins: ResultatBulletin[];
}

export interface SamplePDF {
  name: string;
  label: string;
  hasErrors: boolean;
}

export interface ErrorInfoEntry {
  label: string;
  description: string;
  color: string;
}
