# Validation de la synchronisation bancaire

API REST pour valider l’intégrité des opérations bancaires remontées par un prestataire (scraping) par rapport aux soldes des relevés. En cas d’anomalie, renvoie des raisons détaillées pour faciliter le contrôle du comptable.

## Stack

- **NestJS** – Framework Node.js
- **TypeScript**
- **class-validator / class-transformer** – Validation des entrées

## Installation

```bash
yarn install
```

## Démarrage

```bash
yarn start:dev
```

API sur `http://localhost:3000`

## Documentation API

Une documentation interactive de l’API est disponible via **Scalar** (à partir du même spec OpenAPI) :

- **URL :** [http://localhost:3000/api](http://localhost:3000/api)
- À afficher **après** avoir lancé l’app (`yarn start:dev`). Tu peux y voir les routes, les schémas et tester les appels.

## Route API

- `POST /movements/validation` – Valider mouvements + points de contrôle

**Body :**

```json
{
  "movements": [
    { "id": 1, "date": "2024-01-10", "wording": "Libellé", "amount": 100 }
  ],
  "balances": [{ "date": "2024-01-31", "balance": 100 }]
}
```

- **200** – `{ "message": "Accepted" }` – Synchro cohérente
- **422** – `{ "message": "Validation failed", "reasons": [...] }` – Anomalies (doublons d’`id` et/ou écarts de solde). Chaque raison a un `kind` (`DUPLICATE_IDS` ou `BALANCE_MISMATCH`) et des champs détaillés (ids, date, solde attendu/calculé, écart, message).
- **400** – Body invalide (format / validation DTO)

## Règles métier

- Détection des opérations en double (même `id`) ; liste des ids à fusionner ou supprimer.
- Pour chaque point de contrôle (date de fin de période), le solde attendu doit égaler la somme des `amount` des mouvements avec `date` ≤ date du point. Écart > 0 → doublons ou opérations en trop ; écart < 0 → opérations manquantes.
- Comparaison des montants à l’euro cent près (gestion des flottants IEEE 754).

## Tests

```bash
yarn test
yarn test:cov
yarn test:e2e
```

---

## Analyse de la production

**Contexte.** La synchro bancaire (scraping) peut générer des doublons ou des manques. Les soldes en fin de période sur les relevés client servent de points de contrôle. L’API valide la cohérence et, en cas d’anomalie, renvoie des raisons détaillées pour le contrôle manuel.

**Algorithme.** Détection des ids en double (liste dédupliquée, triée). Pour chaque point de contrôle : somme des montants des mouvements jusqu’à cette date, comparée au solde attendu. Écart positif = doublons ou opérations en trop ; écart négatif = manques.

**Choix techniques.** Comparaison des montants au centime près (flottants), avec tests dédiés. Réponses typées `DUPLICATE_IDS` / `BALANCE_MISMATCH`, champs explicites, messages en français. 422 pour échec métier, 400 pour body invalide.

**Limites.** Les `balances` sont triées en interne (ordre non imposé). Raisons exhaustives ; pagination ou résumé possible en cas de gros volume.
