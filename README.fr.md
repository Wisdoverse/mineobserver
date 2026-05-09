<div align="center">

# ⛏️ MineObserver

**Plateforme d'observation en temps réel des agents Minecraft**

Surveillez, suivez et visualisez vos agents IA Minecraft — tout en un seul endroit.

[![GitHub](https://img.shields.io/badge/GitHub-Wisdoverse%2Fmineobserver-181717?logo=github)](https://github.com/Wisdoverse/mineobserver)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · **Français** · [Русский](README.ru.md) · [Español](README.es.md) · [العربية](README.ar.md) · [Deutsch](README.de.md)

</div>

---

## 🖼️ Captures d'écran

**Page d'accueil** — Scène Minecraft en pixel art avec le nombre d'agents en ligne et le point de connexion

![Page d'accueil](public/mineobserver-preview-landing.png)

**Tableau de bord** — Matrice multi-agents · Inventaire / Carte / Journal · Vue d'ensemble du serveur · Classement · Chat

![Tableau de bord](public/mineobserver-preview-dashboard.png)

---

## ✨ Fonctionnalités

| Catégorie | Détails |
|-----------|---------|
| **Statut en temps réel** | Position, santé, faim, mode de jeu, dimension — tout en temps réel |
| **Visualisation de l'inventaire** | Équipement, barre de raccourcis et sac à dos en un coup d'œil |
| **Mini-carte** | Distribution des blocs et entités autour de l'agent |
| **Galerie de captures** | Captures d'écran téléchargées par les agents, stockées dans le stockage objet |
| **Progression de construction** | Suivi des plans de construction et du pourcentage d'achèvement |
| **Fenêtre de chat** | Canaux public / équipe / chuchotement / système |
| **Journal des événements** | Chaque action de l'agent — déplacement, casse de bloc, ramassage d'objet, etc. |
| **Multi-agents** | Observation simultanée de plusieurs agents |
| **Statistiques et classement** | Statistiques agrégées avec dimensions de classement interchangeables |

---

## 🛠️ Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + shadcn/ui (Radix) + Tailwind CSS 4 |
| Langage | TypeScript 5 (strict) |
| Temps réel | WebSocket (bibliothèque `ws`) |
| Base de données | Supabase (PostgreSQL) |
| Stockage objet | Stockage compatible S3 |
| Build | tsup · pnpm |

---

## 🚀 Démarrage rapide

### Prérequis

- **Node.js** ≥ 20
- **pnpm** ≥ 9

### Installation et exécution

```bash
# Installer les dépendances
pnpm install

# Démarrer le serveur de développement (http://localhost:5000)
pnpm dev

# Build de production
pnpm build

# Démarrer le serveur de production
pnpm start
```

---

## 📁 Structure du projet

```
src/
├── app/                        # Next.js App Router
│   ├── page.tsx               # Tableau de bord principal
│   ├── layout.tsx             # Layout racine
│   └── api/                   # 13 endpoints REST API
├── components/
│   ├── ui/                    # Composants de base shadcn/ui
│   └── agent/                 # Composants métier
│       ├── agent-card.tsx             # Carte de statut agent
│       ├── inventory-grid.tsx         # Grille d'inventaire
│       ├── mini-map.tsx               # Mini-carte
│       ├── vision-gallery.tsx         # Galerie de captures
│       ├── build-progress.tsx         # Suivi de construction
│       ├── chat-window.tsx            # Fenêtre de chat
│       ├── team-panel.tsx             # Panneau d'équipe
│       └── stats-leaderboard.tsx      # Statistiques et classement
├── hooks/
│   ├── use-agent-observer.ts          # Hook WebSocket Observer
│   └── use-demo-agent.tsx             # Générateur d'agent démo
├── lib/
│   ├── types/agent.ts                 # Définitions de types TypeScript
│   ├── ws-client.ts                   # Utilitaire client WebSocket
│   └── utils.ts                       # Utilitaires partagés (cn, etc.)
├── storage/
│   ├── database/agent-db.ts           # Opérations base de données
│   ├── database/supabase-client.ts    # Client Supabase
│   └── vision-storage.ts              # Upload et URL des captures
├── ws-handlers/
│   ├── agent.ts                       # Gestionnaire de messages WebSocket
│   └── agent-state.ts                 # Gestionnaire d'état des agents
└── server.ts                          # Point d'entrée serveur HTTP + WS
```

---

## 📡 Protocole WebSocket

**Endpoint :** `ws://<host>:5000/ws/agent`

### Agent → Serveur

| Type de message | Description |
|----------------|-------------|
| `agent:register` | Enregistrer ou reconnecter un agent |
| `agent:status:update` | Envoyer une mise à jour de statut (partielle OK) |
| `agent:event` | Signaler un événement personnalisé |
| `agent:world:snapshot` | Envoyer un instantané du monde |
| `agent:vision` | Télécharger une capture d'écran |
| `agent:build:progress` | Mettre à jour la progression de construction |
| `agent:chat` | Envoyer un message de chat |
| `agent:disconnect` | Déconnexion gracieuse |
| `ping` | Battement de cœur |

### Serveur → Client

| Type de message | Description |
|----------------|-------------|
| `agents:list` | Liste complète des agents (à l'enregistrement de l'observateur) |
| `status:update` | Diffusion de changement de statut |
| `event:new` | Notification de nouvel événement |
| `world:snapshot` | Diffusion d'instantané du monde |
| `vision:new` | Notification de nouvelle capture |
| `build:progress` | Mise à jour de progression de construction |
| `chat:new` | Nouveau message de chat |
| `admin:data-cleared` | Notification de purge de données |
| `pong` | Réponse au battement de cœur |

> 📖 Spécification complète du protocole : [public/api-docs.md](public/api-docs.md)

---

## 🔌 REST API

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/agents` | GET | Lister tous les agents |
| `/api/agents/[id]` | GET | Détail d'un agent + événements récents |
| `/api/agents/[id]/events` | GET | Événements de l'agent (paginés) |
| `/api/agents/[id]/snapshots` | GET | Instantanés du monde |
| `/api/agents/[id]/vision` | GET | Liste des captures |
| `/api/agents/[id]/trajectory` | GET | Trajectoire de déplacement |
| `/api/agents/[id]/builds` | GET | Enregistrements de construction |
| `/api/events` | GET | Flux d'événements global |
| `/api/messages` | GET | Messages de chat |
| `/api/stats` | GET | Statistiques de la plateforme |
| `/api/leaderboard` | GET | Classement des agents |
| `/api/admin/clear-data` | POST | Purger les données (événements / tout) |
| `/api/vision-proxy` | GET | Proxy d'image (contourne l'expiration des URLs signées) |

---

## 🤖 Guide d'intégration agent

Connectez votre bot Minecraft à MineObserver en 4 étapes :

```
1.  Connexion    →  ws://<host>:5000/ws/agent
2.  Enregistrement → { type: "agent:register", payload: { agentId, username, ... } }
3.  Statut       →  { type: "agent:status:update", payload: { agentId, status: {...} } }
4.  (Optionnel)  →  agent:vision · agent:build:progress · agent:chat · agent:world:snapshot
```

**Conseils :**
- Utilisez un **`agentId` stable** pour permettre la reconnexion sans perte de données
- Envoyez des mises à jour de statut toutes les **2–5 secondes**
- Téléchargez les captures en **PNG encodé en base64**
- Lors de la déconnexion, envoyez `agent:disconnect` ou fermez simplement le socket — le statut hors ligne est préservé

> 📖 Référence complète des champs et exemples : [public/api-docs.md](public/api-docs.md)

---

## 🗄️ Rétention des données

| Type de données | Limite de rétention (par agent) |
|----------------|-------------------------------|
| Événements | 200 |
| Instantanés du monde | 30 |
| Captures d'écran | 50 |
| Messages de chat | 100 |
| Mises à jour de statut | 1 000 |
| Enregistrements de construction | 20 |

Les enregistrements plus anciens sont automatiquement élagués via une stratégie à fenêtre glissante avec un nettoyage limité.

---

## 🏗️ Architecture

```
┌──────────────┐      WebSocket       ┌──────────────────┐
│  Minecraft   │ ◄──────────────────► │   MineObserver      │
│  Agent(s)    │   ws://host/ws/agent │   Serveur        │
└──────────────┘                      │                  │
                                      │  ┌────────────┐  │
┌──────────────┐      WebSocket       │  │  Gestionnaire│ │
│  Observateur │ ◄──────────────────► │  │  d'état     │  │
│  (Navigateur)│   connexion auto     │  └────────────┘  │
└──────────────┘                      │                  │
                                      │  ┌────────────┐  │
                                      │  │  Supabase  │  │
                                      │  │  (Postgres)│  │
                                      │  └────────────┘  │
                                      │                  │
                                      │  ┌────────────┐  │
                                      │  │  Stockage  │  │
                                      │  │  Objet S3  │  │
                                      │  └────────────┘  │
                                      └──────────────────┘
```

---

## 📜 Licence

Ce projet est sous licence [MIT](LICENSE).
