import express from "express";
import cors from "cors";
import bulletinsRoutes from "./routes/bulletins.routes.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use("/bulletins", bulletinsRoutes);

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
