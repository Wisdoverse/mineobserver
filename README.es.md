<div align="center">

# ⛏️ MineWorld

**Plataforma de observación en tiempo real de agentes Minecraft**

Monitorea, rastrea y visualiza el comportamiento de tus agentes IA de Minecraft — todo en un solo lugar.

[![GitHub](https://img.shields.io/badge/GitHub-Wisdoverse%2Fmineworld-181717?logo=github)](https://github.com/Wisdoverse/mineworld)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [Français](README.fr.md) · [Русский](README.ru.md) · **Español** · [العربية](README.ar.md) · [Deutsch](README.de.md)

</div>

---

## 🖼️ Capturas de pantalla

**Página de inicio** — Escena pixelada de Minecraft con agentes en línea y punto de conexión

![Página de inicio](public/mineworld-preview-landing.png)

**Panel de monitoreo** — Matriz multi-agente · Inventario / Mapa / Registro · Resumen del servidor · Ranking · Chat

![Panel de monitoreo](public/mineworld-preview-dashboard.png)

---

## ✨ Características

| Categoría | Detalle |
|-----------|---------|
| **Estado en tiempo real** | Posición, salud, hambre, modo de juego, dimensión — todo en tiempo real |
| **Visualización de inventario** | Equipamiento, barra de acceso rápido y mochila de un vistazo |
| **Mini-mapa** | Distribución de bloques y entidades alrededor del agente |
| **Galería de capturas** | Capturas de pantalla subidas por agentes, almacenadas en almacenamiento de objetos |
| **Progreso de construcción** | Seguimiento de planos y porcentaje de finalización |
| **Ventana de chat** | Canales público / equipo / susurro / sistema |
| **Registro de eventos** | Cada acción del agente — movimiento, romper bloques, recoger objetos, etc. |
| **Multi-agente** | Observación simultánea de múltiples agentes |
| **Estadísticas y ranking** | Estadísticas agregadas con dimensiones de ranking intercambiables |

---

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + shadcn/ui (Radix) + Tailwind CSS 4 |
| Lenguaje | TypeScript 5 (strict) |
| Tiempo real | WebSocket (librería `ws`) |
| Base de datos | Supabase (PostgreSQL) |
| Almacenamiento de objetos | Almacenamiento compatible S3 |
| Build | tsup · pnpm |

---

## 🚀 Inicio rápido

### Requisitos

- **Node.js** ≥ 20
- **pnpm** ≥ 9

### Instalación y ejecución

```bash
# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo (http://localhost:5000)
pnpm dev

# Build de producción
pnpm build

# Iniciar servidor de producción
pnpm start
```

---

## 📁 Estructura del proyecto

```
src/
├── app/                        # Next.js App Router
│   ├── page.tsx               # Panel principal de monitoreo
│   ├── layout.tsx             # Layout raíz
│   └── api/                   # 13 endpoints REST API
├── components/
│   ├── ui/                    # Componentes base shadcn/ui
│   └── agent/                 # Componentes de negocio
│       ├── agent-card.tsx             # Tarjeta de estado del agente
│       ├── inventory-grid.tsx         # Cuadrícula de inventario
│       ├── mini-map.tsx               # Mini-mapa
│       ├── vision-gallery.tsx         # Galería de capturas
│       ├── build-progress.tsx         # Progreso de construcción
│       ├── chat-window.tsx            # Ventana de chat
│       ├── team-panel.tsx             # Panel de equipo
│       └── stats-leaderboard.tsx      # Estadísticas y ranking
├── hooks/
│   ├── use-agent-observer.ts          # Hook WebSocket Observer
│   └── use-demo-agent.tsx             # Generador de agente demo
├── lib/
│   ├── types/agent.ts                 # Definiciones de tipos TypeScript
│   ├── ws-client.ts                   # Utilidad cliente WebSocket
│   └── utils.ts                       # Utilidades compartidas (cn, etc.)
├── storage/
│   ├── database/agent-db.ts           # Operaciones de base de datos
│   ├── database/supabase-client.ts    # Cliente Supabase
│   └── vision-storage.ts              # Subida y URL de capturas
├── ws-handlers/
│   ├── agent.ts                       # Manejador de mensajes WebSocket
│   └── agent-state.ts                 # Gestor de estado de agentes
└── server.ts                          # Punto de entrada servidor HTTP + WS
```

---

## 📡 Protocolo WebSocket

**Endpoint:** `ws://<host>:5000/ws/agent`

### Agente → Servidor

| Tipo de mensaje | Descripción |
|----------------|-------------|
| `agent:register` | Registrar o reconectar un agente |
| `agent:status:update` | Enviar actualización de estado (parcial OK) |
| `agent:event` | Reportar un evento personalizado |
| `agent:world:snapshot` | Enviar instantánea del mundo |
| `agent:vision` | Subir captura de pantalla |
| `agent:build:progress` | Actualizar progreso de construcción |
| `agent:chat` | Enviar mensaje de chat |
| `agent:disconnect` | Desconexión graceful |
| `ping` | Latido |

### Servidor → Cliente

| Tipo de mensaje | Descripción |
|----------------|-------------|
| `agents:list` | Lista completa de agentes (al registrar observador) |
| `status:update` | Difusión de cambio de estado |
| `event:new` | Notificación de nuevo evento |
| `world:snapshot` | Difusión de instantánea del mundo |
| `vision:new` | Notificación de nueva captura |
| `build:progress` | Actualización de progreso de construcción |
| `chat:new` | Nuevo mensaje de chat |
| `admin:data-cleared` | Notificación de purga de datos |
| `pong` | Respuesta al latido |

> 📖 Especificación completa del protocolo: [public/api-docs.md](public/api-docs.md)

---

## 🔌 REST API

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/agents` | GET | Listar todos los agentes |
| `/api/agents/[id]` | GET | Detalle del agente + eventos recientes |
| `/api/agents/[id]/events` | GET | Eventos del agente (paginados) |
| `/api/agents/[id]/snapshots` | GET | Instantáneas del mundo |
| `/api/agents/[id]/vision` | GET | Lista de capturas |
| `/api/agents/[id]/trajectory` | GET | Trayectoria de movimiento |
| `/api/agents/[id]/builds` | GET | Registros de construcción |
| `/api/events` | GET | Flujo global de eventos |
| `/api/messages` | GET | Mensajes de chat |
| `/api/stats` | GET | Estadísticas de la plataforma |
| `/api/leaderboard` | GET | Ranking de agentes |
| `/api/admin/clear-data` | POST | Purgar datos (eventos / todo) |
| `/api/vision-proxy` | GET | Proxy de imágenes (evita expiración de URLs firmadas) |

---

## 🤖 Guía de integración del agente

Conecta tu bot de Minecraft a MineWorld en 4 pasos:

```
1.  Conexión       →  ws://<host>:5000/ws/agent
2.  Registro       →  { type: "agent:register", payload: { agentId, username, ... } }
3.  Estado         →  { type: "agent:status:update", payload: { agentId, status: {...} } }
4.  (Opcional)     →  agent:vision · agent:build:progress · agent:chat · agent:world:snapshot
```

**Consejos:**
- Usa un **`agentId` estable** para permitir reconexión sin pérdida de datos
- Envía actualizaciones de estado cada **2–5 segundos**
- Sube capturas en formato **PNG codificado en base64**
- Al desconectar, envía `agent:disconnect` o simplemente cierra el socket — el estado offline se preserva

> 📖 Referencia completa de campos y ejemplos: [public/api-docs.md](public/api-docs.md)

---

## 🗄️ Retención de datos

| Tipo de datos | Límite de retención (por agente) |
|--------------|--------------------------------|
| Eventos | 200 |
| Instantáneas del mundo | 30 |
| Capturas de pantalla | 50 |
| Mensajes de chat | 100 |
| Actualizaciones de estado | 1 000 |
| Registros de construcción | 20 |

Los registros más antiguos se eliminan automáticamente mediante una estrategia de ventana deslizante con limpieza limitada.

---

## 🏗️ Arquitectura

```
┌──────────────┐      WebSocket       ┌──────────────────┐
│  Minecraft   │ ◄──────────────────► │   MineWorld      │
│  Agente(s)   │   ws://host/ws/agent │   Servidor       │
└──────────────┘                      │                  │
                                      │  ┌────────────┐  │
┌──────────────┐      WebSocket       │  │  Gestor de  │  │
│  Observador  │ ◄──────────────────► │  │  estado     │  │
│  (Navegador) │   auto-conexión      │  └────────────┘  │
└──────────────┘                      │                  │
                                      │  ┌────────────┐  │
                                      │  │  Supabase  │  │
                                      │  │  (Postgres)│  │
                                      │  └────────────┘  │
                                      │                  │
                                      │  ┌────────────┐  │
                                      │  │  Almacén   │  │
                                      │  │  Objetos   │  │
                                      │  │  S3        │  │
                                      │  └────────────┘  │
                                      └──────────────────┘
```

---

## 📜 Licencia

Este proyecto está licenciado bajo [MIT](LICENSE).
