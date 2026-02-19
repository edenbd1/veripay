/**
 * Routes API : upload PDF, extraction JSON, vérification
 */

import { Router, type Request, type Response } from "express";
import multer from "multer";
import { z } from "zod";
import { extraireBulletinsDepuisPdf, analyserBulletinsPdf } from "../services/bulletin.service.js";
import { streamChatResponse } from "../services/chat.service.js";
import { verifierBulletin } from "../services/verification.service.js";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Seuls les fichiers PDF sont acceptés"));
      return;
    }
    cb(null, true);
  },
});

/**
 * POST /bulletins/upload
 * Body: multipart/form-data, champ "pdf" = fichier PDF
 * Query optionnel: ?type=detaille ou ?type=clarifie (futur toggle frontend, prioritaire sur le nom du fichier)
 * Réponse: { bulletins: [...], nombreBulletins, nombrePages }
 */
router.post("/upload", upload.single("pdf"), async (req: Request, res: Response) => {
  try {
    if (!req.file?.buffer) {
      res.status(400).json({ erreur: "Aucun fichier PDF fourni (attendu: champ 'pdf')" });
      return;
    }
    const typeForce = req.query.type === "detaille" || req.query.type === "clarifie"
      ? req.query.type
      : undefined;
    const resultat = await extraireBulletinsDepuisPdf(req.file.buffer, {
      nomFichier: req.file.originalname,
      typeForce,
    });
    res.json(resultat);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      erreur: err instanceof Error ? err.message : "Erreur lors de l'extraction des bulletins",
    });
  }
});

/**
 * POST /bulletins/analyser
 * Body: multipart/form-data, champ "pdf" = fichier PDF
 * Réponse: { nombreBulletins, nombrePages, bulletins: [{ salarie, periode, valide, erreurs }] }
 */
router.post("/analyser", upload.single("pdf"), async (req: Request, res: Response) => {
  try {
    if (!req.file?.buffer) {
      res.status(400).json({ erreur: "Aucun fichier PDF fourni (attendu: champ 'pdf')" });
      return;
    }
    const typeForce = req.query.type === "detaille" || req.query.type === "clarifie"
      ? req.query.type
      : undefined;
    const resultat = await analyserBulletinsPdf(req.file.buffer, {
      nomFichier: req.file.originalname,
      typeForce,
    });
    res.json(resultat);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      erreur: err instanceof Error ? err.message : "Erreur lors de l'analyse des bulletins",
    });
  }
});

/**
 * POST /bulletins/verifier
 * Body: { bulletin } avec un objet bulletin (détaillé ou clarifié) au format JSON
 * Réponse: { valide, erreurs, resume }
 */
const bodyVerifier = z.object({
  bulletin: z.record(z.unknown()),
});

router.post("/verifier", (req: Request, res: Response) => {
  try {
    const parsed = bodyVerifier.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ erreur: "Body invalide", details: parsed.error.flatten() });
      return;
    }
    const bulletin = parsed.data.bulletin as unknown as Parameters<typeof verifierBulletin>[0];
    if (!bulletin?.type || (bulletin.type !== "detaille" && bulletin.type !== "clarifie")) {
      res.status(400).json({ erreur: "Objet 'bulletin' doit avoir type 'detaille' ou 'clarifie'" });
      return;
    }
    const resultat = verifierBulletin(bulletin);
    res.json(resultat);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      erreur: err instanceof Error ? err.message : "Erreur lors de la vérification",
    });
  }
});

/**
 * POST /bulletins/chat
 * Body: { errorType, message, history[], bulletinContext? }
 * Réponse: text/event-stream (SSE)
 */
const bodyChat = z.object({
  errorType: z.string().min(1),
  message: z.string().min(1),
  history: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string(),
  })).default([]),
  bulletinContext: z.object({
    salarie: z.string().optional(),
    periode: z.string().optional(),
    brut: z.number().optional(),
  }).optional(),
});

router.post("/chat", async (req: Request, res: Response) => {
  try {
    const parsed = bodyChat.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ erreur: "Body invalide", details: parsed.error.flatten() });
      return;
    }
    await streamChatResponse(parsed.data, res);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({
        erreur: err instanceof Error ? err.message : "Erreur lors du chat",
      });
    }
  }
});

/**
 * GET /bulletins/sante
 */
router.get("/sante", (_req: Request, res: Response) => {
  res.json({ statut: "ok", message: "API VeriPay bulletins" });
});

export default router;
