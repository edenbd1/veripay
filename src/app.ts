import express from "express";
import bulletinsRoutes from "./routes/bulletins.routes.js";

const app = express();

// CORS — manual headers (more reliable across hosting platforms)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json({ limit: "2mb" }));

app.use("/bulletins", bulletinsRoutes);

app.post("/contact", (req, res) => {
  const { nom, email, sujet, message } = req.body ?? {};
  if (!nom || !email || !message) {
    res.status(400).json({ erreur: "Champs requis : nom, email, message" });
    return;
  }
  console.log(`[CONTACT] De: ${nom} <${email}> | Sujet: ${sujet || "(aucun)"} | Message: ${message}`);
  res.json({ ok: true });
});

app.get("/", (_req, res) => {
  res.json({
    name: "VeriPay API",
    version: "1.0.0",
    endpoints: {
      "POST /bulletins/upload": "Envoi d'un PDF de bulletin(s) -> extraction JSON",
      "POST /bulletins/verifier": "Vérification d'un bulletin JSON -> erreurs éventuelles",
      "POST /bulletins/chat": "Chat IA pour expliquer les erreurs de paramétrage (SSE streaming)",
      "GET /bulletins/sante": "Santé de l'API",
    },
  });
});

export default app;
