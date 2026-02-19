# VeriPay API

API de vérification des bulletins de salaire français. Prend en entrée un PDF (un ou plusieurs bulletins), extrait toutes les données en JSON, et permet de recalculer les cotisations selon une convention collective pour détecter les erreurs.

## Prérequis

- Node.js >= 18

## Installation

```bash
npm install
```

## Scripts

- `npm run dev` — Lance l’API en mode développement (rechargement à la volée)
- `npm run build` — Compile le projet TypeScript
- `npm start` — Lance l’API (après `npm run build`)

## Endpoints

| Méthode | URL | Description |
|--------|-----|-------------|
| GET | `/` | Description de l’API et des endpoints |
| GET | `/bulletins/sante` | Santé de l’API |
| POST | `/bulletins/upload` | Envoi d’un PDF (multipart, champ `pdf`) → extraction JSON |
| POST | `/bulletins/verifier` | Body JSON `{ "bulletin": { ... } }` → vérification et liste d’erreurs |

## Types de bulletins

- **Détaillé** : chaque cotisation a un code (ex. 20000, 20200). Colonnes Base, Taux, Montants, Retenues, Patronales.
- **Clarifié** : cotisations regroupées par blocs (SANTE, RETRAITE, FAMILLE, ASSURANCE CHÔMAGE, etc.).

L’API détecte automatiquement le type à partir du contenu du PDF et renvoie le JSON correspondant (`type: "detaille"` ou `type: "clarifie"`).

## Convention collective

Pour l’instant une seule convention est gérée : **Convention collective du 15 mars 1966 (CCNT 66)**. La configuration (taux, plafond sécu) est dans `src/config/convention-ccnt66.ts`. Le moteur de calcul est dans `src/services/calcul.service.ts`.

## Structure du projet

```
src/
  config/          # Convention collective (CCNT 66)
  types/           # Types TypeScript (bulletin détaillé, clarifié, convention, vérification)
  services/        # Extraction PDF, parsers, calcul, vérification
  routes/          # Routes Express
  app.ts
  index.ts
```

## Exemple d’utilisation

```bash
# Santé
curl http://localhost:3000/bulletins/sante

# Upload d’un PDF
curl -X POST -F "pdf=@bulletin.pdf" http://localhost:3000/bulletins/upload

# Vérification d’un bulletin (JSON issu de /upload)
curl -X POST -H "Content-Type: application/json" \
  -d '{"bulletin": { "type": "clarifie", "employeur": {...}, ... }}' \
  http://localhost:3000/bulletins/verifier
```
