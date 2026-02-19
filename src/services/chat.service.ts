/**
 * Service de chat IA (Mistral) pour l'explication des erreurs de paramétrage.
 *
 * Utilise l'API Mistral en streaming SSE pour une UX réactive.
 * Pas de dépendance externe : utilise fetch natif (Node 18+).
 */

import type { Response } from "express";

/* ────────────────────── TYPES ────────────────────── */

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface BulletinContext {
  salarie?: string;
  periode?: string;
  brut?: number;
}

export interface ChatRequest {
  errorType: string;
  message: string;
  history: ChatMessage[];
  bulletinContext?: BulletinContext;
}

/* ────────────────────── ERREURS CONNUES ────────────────────── */

const ERROR_DETAILS: Record<string, { label: string; description: string; valeurAttendue: string; valeurErronee: string }> = {
  TIAFM: {
    label: "PMSS incorrect",
    description: "Le plafond mensuel de la Sécurité sociale est resté à la valeur 2025 (3 925 €) au lieu de 4 005 € en 2026.",
    valeurAttendue: "4 005 €",
    valeurErronee: "3 925 €",
  },
  AAICO: {
    label: "SMIC erroné",
    description: "Erreur de frappe sur le SMIC mensuel (1 832,03 € au lieu de 1 823,03 €).",
    valeurAttendue: "1 823,03 €",
    valeurErronee: "1 832,03 €",
  },
  RGDUB: {
    label: "Coefficient RGDU",
    description: "Le coefficient T delta de la RGDU est mal paramétré (0,3241 au lieu de 0,3821).",
    valeurAttendue: "0,3821",
    valeurErronee: "0,3241",
  },
};

/* ────────────────────── SYSTEM PROMPT ────────────────────── */

function buildSystemPrompt(errorType: string, bulletinContext?: BulletinContext): string {
  const error = ERROR_DETAILS[errorType];
  const errorBlock = error
    ? `
Erreur détectée : ${errorType} — ${error.label}
Description : ${error.description}
Valeur attendue : ${error.valeurAttendue}
Valeur erronée : ${error.valeurErronee}`
    : `
Erreur détectée : ${errorType}`;

  const bulletinBlock = bulletinContext
    ? `
Contexte du bulletin :
- Salarié : ${bulletinContext.salarie ?? "non renseigné"}
- Période : ${bulletinContext.periode ?? "non renseignée"}
- Brut : ${bulletinContext.brut != null ? `${bulletinContext.brut} €` : "non renseigné"}`
    : "";

  return `Tu es un expert en paie française, spécialisé dans la Convention Collective Nationale de Travail des établissements et services pour personnes inadaptées et handicapées (CCNT 66).
Tu expliques les erreurs de paramétrage détectées dans les bulletins de paie.
Réponds en français, de manière claire et pédagogique.
Utilise des exemples concrets quand c'est pertinent.
Si l'utilisateur pose une question hors sujet, recentre poliment sur le domaine de la paie et des erreurs de paramétrage.
${errorBlock}${bulletinBlock}`;
}

/* ────────────────────── STREAMING ────────────────────── */

const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";
const MISTRAL_MODEL = "mistral-small-latest";

export async function streamChatResponse(req: ChatRequest, res: Response): Promise<void> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    res.status(500).json({ erreur: "MISTRAL_API_KEY non configurée" });
    return;
  }

  const systemPrompt = buildSystemPrompt(req.errorType, req.bulletinContext);

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...req.history.slice(-20),
    { role: "user", content: req.message },
  ];

  const body = JSON.stringify({
    model: MISTRAL_MODEL,
    messages,
    stream: true,
    max_tokens: 1024,
    temperature: 0.3,
  });

  let mistralRes: globalThis.Response;
  try {
    mistralRes = await fetch(MISTRAL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body,
    });
  } catch (err) {
    console.error("Erreur appel Mistral:", err);
    res.status(502).json({ erreur: "Impossible de contacter l'API Mistral" });
    return;
  }

  if (!mistralRes.ok) {
    const text = await mistralRes.text().catch(() => "");
    console.error(`Mistral API ${mistralRes.status}: ${text}`);
    res.status(502).json({ erreur: `Erreur API Mistral (${mistralRes.status})` });
    return;
  }

  // Configure SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const reader = mistralRes.body?.getReader();
  if (!reader) {
    res.write("data: [DONE]\n\n");
    res.end();
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const payload = trimmed.slice(6);
        if (payload === "[DONE]") {
          res.write("data: [DONE]\n\n");
          continue;
        }

        try {
          const parsed = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        } catch {
          // Ignore malformed chunks
        }
      }
    }
  } catch (err) {
    console.error("Erreur streaming:", err);
  } finally {
    res.write("data: [DONE]\n\n");
    res.end();
  }
}
