# API VeriPay — Analyse de bulletins de paie

## `POST /bulletins/analyser`

Analyse un fichier PDF contenant un ou plusieurs bulletins de paie et détecte les erreurs de paramétrage.

---

### Entrée

| Élément | Détail |
|---|---|
| **Content-Type** | `multipart/form-data` |
| **Champ fichier** | `pdf` — fichier PDF (max 10 Mo) |
| **Query param (optionnel)** | `?type=detaille` ou `?type=clarifie` — force le type de bulletin (sinon détecté automatiquement) |

Exemple `curl` :

```bash
curl -F "pdf=@mon_fichier.pdf" "http://localhost:3000/bulletins/analyser"
```

---

### Sortie (succès) — `200 OK`

```json
{
  "nombreBulletins": 12,
  "nombrePages": 14,
  "bulletins": [
    {
      "salarie": "Mme DUPONT Marie",
      "periode": "janvier 2026",
      "valide": false,
      "erreurs": [
        {
          "type": "TIAFM",
          "message": "Plafond de SS laissé au montant 2025"
        },
        {
          "type": "RGDUB",
          "message": "Coef de RGDU T delta mal renseigné"
        }
      ]
    },
    {
      "salarie": "M. MARTIN Jean",
      "periode": "janvier 2026",
      "valide": true,
      "erreurs": []
    }
  ]
}
```

#### Description des champs

| Champ | Type | Description |
|---|---|---|
| `nombreBulletins` | `number` | Nombre total de bulletins détectés dans le PDF |
| `nombrePages` | `number` | Nombre de pages du PDF |
| `bulletins[]` | `array` | Un élément par bulletin |
| `bulletins[].salarie` | `string` | Nom du salarié |
| `bulletins[].periode` | `string` | Période du bulletin (ex: `"janvier 2026"`) |
| `bulletins[].valide` | `boolean` | `true` si aucune erreur détectée, `false` sinon |
| `bulletins[].erreurs[]` | `array` | Liste des erreurs détectées (vide si valide) |
| `bulletins[].erreurs[].type` | `string` | Code REF CEGI de l'erreur (voir tableau ci-dessous) |
| `bulletins[].erreurs[].message` | `string` | Description lisible de l'erreur |

#### Types d'erreurs détectées

| `type` | REF CEGI | Description | Valeur attendue | Valeur erronée |
|---|---|---|---|---|
| `TIAFM` | TIAFM | Plafond mensuel de la sécurité sociale laissé au montant 2025 | 4 005 € | 3 925 € |
| `AAICO` | AAICO | Erreur de frappe sur le SMIC mensuel 151,67 h | 1 823,03 € | 1 832,03 € |
| `RGDUB` | RGDUB | Coefficient RGDU T delta mal renseigné | 0.3821 | 0.3241 |
| `autre` | — | Autre erreur non catégorisée | — | — |

---

### Sortie (erreur) — `400` / `500`

```json
{
  "erreur": "Aucun fichier PDF fourni (attendu: champ 'pdf')"
}
```

| Code HTTP | Cas |
|---|---|
| `400` | Fichier manquant ou format non PDF |
| `500` | Erreur lors du parsing ou de l'analyse |
