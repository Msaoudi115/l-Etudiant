# PasseportEtudiant — PRD

## Problem statement
Transformer le prototype HTML unique « PasseportEtudiant » (Salon de l'Orientation l'Étudiant × Albert School) en véritable application full-stack : React + FastAPI + MongoDB, avec espace professeur, QR réellement scannable, animations premium et dashboard analytics temps réel. Scoring statique, pas d'authentification — accès contrôlé par code professeur.

## Architecture
- **Backend** : FastAPI + Motor (MongoDB async), collections `schools`, `classes`, `students`, `stamps`. Seed auto au démarrage (16 écoles, classe PROF2026, profils Lucas & Théo).
- **Frontend** : React 19 + React Router + framer-motion + recharts + qrcode.react + html5-qrcode. Style « passeport français » (rouge/navy/cream) encapsulé dans `/src/styles/passport.css`.

## User personas
- **Lucas (intentionniste)** — lycéen Terminale, vient seul, profil complet, QR individuel, consentements actifs. Représente la valeur idéale pour l'Étudiant.
- **Théo (anonyme)** — lycéen venu en groupe scolaire sans profil individuel. Illustre le coût d'une inscription collective (pas de tampon, pas de récap, pas de lead qualifiable).
- **Professeur** — crée un code classe, suit en direct les inscriptions + tampons de ses élèves.
- **l'Étudiant (éditeur)** — consulte le dashboard analytics salon temps réel.

## Core requirements (static)
- Identité passeport (nom, prénom, photo emoji, filières, QR, consentements RGPD).
- Tampons : 4 pôles (Ingénierie, Commerce, Prépas, Conférences), 16 établissements, QR scannable ou clic.
- Récap post-salon : score calculé (tampons × consentements × filières), recommandations ciblées, prochaines étapes.
- Espace prof : création de code classe, dashboard élèves avec compteurs.
- Analytics : KPIs, répartition par pôle, top 5 stands, filières, consentements, flux live.

## What's been implemented (2026-04-17)
- ✅ Backend FastAPI complet (`/app/backend/server.py`), 22+ endpoints sous `/api`, toutes les collections seedées.
- ✅ 9 pages React routées : Select, Create, Cover, Identity, Stamps, Recap, Teacher, Analytics, Stand.
- ✅ Animations premium : flip 3D du passeport à l'ouverture, staggered reveals, stamp « slam » rouge rotatif quand on tamponne, transitions framer-motion.
- ✅ QR réel : génération via `qrcode.react` (identité + stands), scan caméra via `html5-qrcode` avec fallback démo en surcouche.
- ✅ Espace prof complet : création classe / accès par code / dashboard élèves avec KPIs + liste temps réel.
- ✅ Dashboard analytics l'Étudiant : KPIs, bar chart (tampons / pôle), pie chart (filières), top 5 stands, consentements, flux live — refresh 5s.
- ✅ Page stand publique `/stand/:schoolId` avec gros QR scannable (pour les écoles).
- ✅ Persistance `localStorage` de l'ID étudiant courant.
- ✅ Tests automatisés : 25/25 backend + 17 frontend = 100 %.

## Backlog (P0 / P1 / P2)
- **P1** — Export CSV du dashboard prof (liste élèves + stamps).
- **P1** — Email récap post-salon (Resend/SendGrid) envoyé à l'élève.
- **P2** — Mode « hors-ligne » avec sync différée (PWA manifest + service worker).
- **P2** — Leaderboard anonymisé entre classes pour créer de l'émulation.
- **P2** — Génération de badges téléchargeables (« J'étais au Salon 2026 ») partageables sur Snap/Insta.
- **P2** — Intégration IA (Claude / GPT) pour recommandations personnalisées textuelles.

## Next tasks
- Recueillir retour utilisateur sur les flux principaux.
- Prioriser emails récap + exports CSV selon les besoins du salon.
