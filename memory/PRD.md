# PasseportEtudiant — PRD

## Problem statement
Transformer le prototype HTML unique « PasseportEtudiant » (Salon de l'Orientation l'Étudiant × Albert School) en véritable application full-stack : React + FastAPI + MongoDB, avec espace professeur, QR réellement scannable, animations premium, dashboard analytics temps réel, leads qualifiés exportables, espace admin et badge partageable pour viralité.

## Architecture
- **Backend** : FastAPI + Motor (MongoDB async), collections `schools`, `classes`, `students`, `stamps`. Seed auto (16 écoles, 2 classes démo, 8 élèves démo avec tampons pré-générés).
- **Frontend** : React 19 + React Router + framer-motion + recharts + qrcode.react + html5-qrcode. Style « passeport français » (rouge/navy/cream).
- **Documentation** : Swagger UI à `/api/docs`, ReDoc à `/api/redoc`.

## User personas
- **Lucas (intentionniste)** — profil individuel complet. Valeur idéale pour l'Étudiant.
- **Théo (anonyme)** — venu en groupe sans profil. Coût d'une inscription collective.
- **Emma, Nadia, Hugo** (classe Henri-IV) / **Sarah, Malik, Léa** (classe Louis-le-Grand) — élèves démo pour animer le dashboard & leaderboard.
- **Professeur** — crée un code classe, suit ses élèves, voit son rang dans le leaderboard.
- **l'Étudiant (éditeur)** — consulte dashboard + onglet Leads qualifiés + export CSV.
- **Admin** — gère tous les profils, classes, reset.

## Core features (livrées)
- ✅ Identité passeport (QR, consentements RGPD, nom, filières…)
- ✅ Tampons 4 pôles / 16 stands, scan caméra + clic manuel
- ✅ Récap post-salon avec score, recos, next steps
- ✅ Espace prof : création code + dashboard élèves
- ✅ Dashboard analytics temps réel
- ✅ Page stand publique `/stand/:id`
- ✅ Persistance localStorage

## Features V2 (livrées le 2026-04-18)
- ✅ **Badge partageable PNG** — canvas 1080×1350, Web Share API + fallback download.
- ✅ **Leads qualifiés** — onglet dédié, filtres (filière × consentement × min tampons), table score/consents, **export CSV** en 1 clic.
- ✅ **Espace admin `/admin`** — clé `letudiant2026`, stats, recherche, suppression unitaire, resets (keep demos / total).
- ✅ **Leaderboard classes** — `/api/leaderboard` ranking, affiché sur l'espace prof + en bas du récap élève (marqueur « TA CLASSE »).
- ✅ **Seed enrichi** — 2 classes démo + 8 élèves avec tampons variés pour une démo immédiatement « vivante ».
- ✅ **Liste des profils créés** sur la page d'accueil avec suppression individuelle.
- ✅ Documentation backend via Swagger (`/api/docs`).

## Tests
- Itération 1 : 25/25 backend + 17 frontend = 100 %.
- Itération 2 : 19/19 nouveaux endpoints + toutes les UI nouvelles = 100 %.
- 2 bugs backend identifiés et corrigés par le testing agent (PROF2026B protection, admin reset seed keep).

## Backlog (P1 / P2)
- **P1** Email récap post-salon (Resend/SendGrid) envoyé à l'élève.
- **P1** Reco textuelle via Claude/GPT pour personnaliser le récap.
- **P2** Mode hors-ligne PWA avec sync différée.
- **P2** Code QR « ami » (scan entre élèves).
- **P2** Stand sponsorisé (badge doré + score bonus).
- **P2** Vibration haptique + son « kachunk » au tampon.
- **P2** Lottie confetti sur le score final du récap.

## Clés & credentials
- Admin : `letudiant2026`
- Code prof démo : `PROF2026`, `PROF2026B`
