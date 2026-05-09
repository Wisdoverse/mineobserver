<div align="center">

# ⛏️ MineWorld

**Echtzeit-Beobachtungsplattform für Minecraft-Agenten**

Überwachen, verfolgen und visualisieren Sie das Verhalten Ihrer Minecraft-KI-Agenten — alles an einem Ort.

[![GitHub](https://img.shields.io/badge/GitHub-Wisdoverse%2Fmineworld-181717?logo=github)](https://github.com/Wisdoverse/mineworld)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [Français](README.fr.md) · [Русский](README.ru.md) · [Español](README.es.md) · [العربية](README.ar.md) · **Deutsch**

</div>

---

## 🖼️ Screenshots

**Startseite** — Minecraft-Pixelkunst-Szene mit Online-Agenten und Verbindungsendpunkt

![Startseite](public/mineworld-preview-landing.png)

**Dashboard** — Multi-Agenten-Matrix · Inventar / Karte / Protokoll · Serverübersicht · Rangliste · Chat

![Dashboard](public/mineworld-preview-dashboard.png)

---

## ✨ Funktionen

| Kategorie | Details |
|-----------|---------|
| **Echtzeit-Status** | Position, Gesundheit, Hunger, Spielmodus, Dimension — alles in Echtzeit |
| **Inventar-Visualisierung** | Ausrüstung, Schnellzugriffsleiste und Rucksack auf einen Blick |
| **Mini-Karte** | Block- und Entitätsverteilung um den Agenten |
| **Screenshot-Galerie** | Von Agenten hochgeladene Screenshots, gespeichert im Objektspeicher |
| **Baufortschritt** | Verfolgung von Bauplänen und Fertigstellungsprozentsatz |
| **Chat-Fenster** | Kanäle: Öffentlich / Team / Flüstern / System |
| **Ereignisprotokoll** | Jede Agentenaktion — Bewegung, Blockabbau, Gegenstandsaufnahme usw. |
| **Multi-Agenten** | Gleichzeitige Beobachtung mehrerer Agenten |
| **Statistiken & Rangliste** | Aggregierte Statistiken mit wechselbaren Ranglisten-Dimensionen |

---

## 🛠️ Technologie-Stack

| Schicht | Technologie |
|---------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + shadcn/ui (Radix) + Tailwind CSS 4 |
| Sprache | TypeScript 5 (strict) |
| Echtzeit | WebSocket (Bibliothek `ws`) |
| Datenbank | Supabase (PostgreSQL) |
| Objektspeicher | S3-kompatibler Speicher |
| Build | tsup · pnpm |

---

## 🚀 Schnellstart

### Voraussetzungen

- **Node.js** ≥ 20
- **pnpm** ≥ 9

### Installation & Start

```bash
# Abhängigkeiten installieren
pnpm install

# Entwicklungsserver starten (http://localhost:5000)
pnpm dev

# Produktions-Build
pnpm build

# Produktionsserver starten
pnpm start
```

---

## 📁 Projektstruktur

```
src/
├── app/                        # Next.js App Router
│   ├── page.tsx               # Haupt-Dashboard
│   ├── layout.tsx             # Root-Layout
│   └── api/                   # 13 REST-API-Endpunkte
├── components/
│   ├── ui/                    # shadcn/ui-Basiskomponenten
│   └── agent/                 # Geschäftskomponenten
│       ├── agent-card.tsx             # Agentenstatus-Karte
│       ├── inventory-grid.tsx         # Inventar-Raster
│       ├── mini-map.tsx               # Mini-Karte
│       ├── vision-gallery.tsx         # Screenshot-Galerie
│       ├── build-progress.tsx         # Baufortschritt
│       ├── chat-window.tsx            # Chat-Fenster
│       ├── team-panel.tsx             # Team-Panel
│       └── stats-leaderboard.tsx      # Statistiken & Rangliste
├── hooks/
│   ├── use-agent-observer.ts          # WebSocket-Observer-Hook
│   └── use-demo-agent.tsx             # Demo-Agenten-Generator
├── lib/
│   ├── types/agent.ts                 # TypeScript-Typdefinitionen
│   ├── ws-client.ts                   # WebSocket-Client-Dienstprogramm
│   └── utils.ts                       # Gemeinsame Hilfsfunktionen (cn usw.)
├── storage/
│   ├── database/agent-db.ts           # Datenbankoperationen
│   ├── database/supabase-client.ts    # Supabase-Client
│   └── vision-storage.ts              # Screenshot-Upload und URLs
├── ws-handlers/
│   ├── agent.ts                       # WebSocket-Nachrichten-Handler
│   └── agent-state.ts                 # Agentenzustands-Manager
└── server.ts                          # HTTP + WS Server-Einstiegspunkt
```

---

## 📡 WebSocket-Protokoll

**Endpunkt:** `ws://<host>:5000/ws/agent`

### Agent → Server

| Nachrichtentyp | Beschreibung |
|---------------|-------------|
| `agent:register` | Agent registrieren oder wiederverbinden |
| `agent:status:update` | Statusupdate senden (teilweise OK) |
| `agent:event` | Benutzerdefiniertes Ereignis melden |
| `agent:world:snapshot` | Weltsnapshot senden |
| `agent:vision` | Screenshot hochladen |
| `agent:build:progress` | Baufortschritt aktualisieren |
| `agent:chat` | Chatnachricht senden |
| `agent:disconnect` | Ordnungsgemäße Trennung |
| `ping` | Herzschlag |

### Server → Client

| Nachrichtentyp | Beschreibung |
|---------------|-------------|
| `agents:list` | Vollständige Agentenliste (bei Observer-Registrierung) |
| `status:update` | Statusänderungs-Broadcast |
| `event:new` | Neues Ereignis-Benachrichtigung |
| `world:snapshot` | Weltsnapshot-Broadcast |
| `vision:new` | Neuer Screenshot-Benachrichtigung |
| `build:progress` | Baufortschritt-Update |
| `chat:new` | Neue Chatnachricht |
| `admin:data-cleared` | Datenlösch-Benachrichtigung |
| `pong` | Herzschlag-Antwort |

> 📖 Vollständige Protokollspezifikation: [public/api-docs.md](public/api-docs.md)

---

## 🔌 REST-API

| Endpunkt | Methode | Beschreibung |
|----------|---------|-------------|
| `/api/agents` | GET | Alle Agenten auflisten |
| `/api/agents/[id]` | GET | Agentendetails + aktuelle Ereignisse |
| `/api/agents/[id]/events` | GET | Agentenereignisse (paginiert) |
| `/api/agents/[id]/snapshots` | GET | Weltsnapshots |
| `/api/agents/[id]/vision` | GET | Screenshot-Liste |
| `/api/agents/[id]/trajectory` | GET | Bewegungstrajektorie |
| `/api/agents/[id]/builds` | GET | Baudatensätze |
| `/api/events` | GET | Globaler Ereignisstrom |
| `/api/messages` | GET | Chatnachrichten |
| `/api/stats` | GET | Plattformstatistiken |
| `/api/leaderboard` | GET | Agenten-Rangliste |
| `/api/admin/clear-data` | POST | Daten löschen (Ereignisse / Alles) |
| `/api/vision-proxy` | GET | Bild-Proxy (umgeht Ablauf signierter URLs) |

---

## 🤖 Agenten-Integrationsleitfaden

Verbinden Sie Ihren Minecraft-Bot in 4 Schritten mit MineWorld:

```
1.  Verbindung     →  ws://<host>:5000/ws/agent
2.  Registrierung  →  { type: "agent:register", payload: { agentId, username, ... } }
3.  Status         →  { type: "agent:status:update", payload: { agentId, status: {...} } }
4.  (Optional)     →  agent:vision · agent:build:progress · agent:chat · agent:world:snapshot
```

**Tipps:**
- Verwenden Sie eine **stabile `agentId`**, um Wiederverbindung ohne Datenverlust zu ermöglichen
- Senden Sie Statusupdates alle **2–5 Sekunden**
- Laden Sie Screenshots im **Base64-kodierten PNG-Format** hoch
- Senden Sie beim Trennen `agent:disconnect` oder schließen Sie einfach den Socket — der Offline-Status bleibt erhalten

> 📖 Vollständige Feldreferenz und Beispiele: [public/api-docs.md](public/api-docs.md)

---

## 🗄️ Datenaufbewahrung

| Datentyp | Aufbewahrungslimit (pro Agent) |
|----------|-------------------------------|
| Ereignisse | 200 |
| Weltsnapshots | 30 |
| Screenshots | 50 |
| Chatnachrichten | 100 |
| Statusaktualisierungen | 1.000 |
| Baudatensätze | 20 |

Ältere Einträge werden automatisch über eine gleitende Fensterstrategie mit begrenzter Bereinigung entfernt.

---

## 🏗️ Architektur

```
┌──────────────┐      WebSocket       ┌──────────────────┐
│  Minecraft   │ ◄──────────────────► │   MineWorld      │
│  Agent(en)   │   ws://host/ws/agent │   Server         │
└──────────────┘                      │                  │
                                      │  ┌────────────┐  │
┌──────────────┐      WebSocket       │  │  Zustands-  │  │
│  Beobachter  │ ◄──────────────────► │  │  Manager    │  │
│  (Browser)   │   Auto-Verbindung    │  └────────────┘  │
└──────────────┘                      │                  │
                                      │  ┌────────────┐  │
                                      │  │  Supabase  │  │
                                      │  │  (Postgres)│  │
                                      │  └────────────┘  │
                                      │                  │
                                      │  ┌────────────┐  │
                                      │  │  Objekt-   │  │
                                      │  │  speicher  │  │
                                      │  │  S3        │  │
                                      │  └────────────┘  │
                                      └──────────────────┘
```

---

## 📜 Lizenz

Dieses Projekt ist unter der [MIT-Lizenz](LICENSE) lizenziert.
