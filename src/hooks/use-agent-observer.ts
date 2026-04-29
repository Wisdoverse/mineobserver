'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { createWsConnection, type WsMessage } from '@/lib/ws-client';
import type {
  AgentStatus,
  AgentEvent,
  WorldSnapshot,
  VisionRecord,
  BuildRecord,
  ChatMessageRecord,
  TeamRecord,
} from '@/lib/types/agent';

interface ChatMessage {
  messageId: string;
  agentId: string;
  content: string;
  channel: string;
  recipient?: string;
  sender: {
    agentId: string;
    username: string;
    type: 'agent' | 'player';
  };
  mentionedAgents?: string[];
  timestamp: number;
}

interface BuildProgress {
  buildId: string;
  blueprintName: string;
  status: string;
  progress: number;
  currentLayer?: number;
  totalLayers?: number;
  blocksPlaced: number;
  blocksTotal: number;
  materialsUsed?: Array<{ material: string; used: number; remaining: number }>;
  startedAt: number;
  estimatedCompletion?: number;
  errors?: string[];
}

interface VisionCapture {
  captureId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  dimensions: { width: number; height: number };
  position: { x: number; y: number; z: number };
  description?: string;
  sceneInfo?: { biome?: string; weather?: string; timeOfDay?: string; [key: string]: string | undefined };
  timestamp: number;
}

interface TeamMember {
  agentId: string;
  username: string;
  role: string;
  status?: string;
  task?: { type: string; progress: number };
}

interface TeamUpdate {
  teamId: string;
  teamName: string;
  action: string;
  leader: string;
  members: TeamMember[];
  task?: { type: string; progress: number };
  timestamp: number;
}

interface UseAgentObserverReturn {
  agents: Map<string, AgentStatus>;
  events: Map<string, AgentEvent[]>;
  worldSnapshots: Map<string, WorldSnapshot>;
  visions: Map<string, VisionCapture[]>;
  builds: Map<string, BuildProgress[]>;
  chatMessages: ChatMessage[];
  teams: Map<string, TeamUpdate>;
  isConnected: boolean;
  lastUpdate: number;
}

const MAX_CHAT_MESSAGES = 100;

export function useAgentObserver(): UseAgentObserverReturn {
  const [agents, setAgents] = useState<Map<string, AgentStatus>>(new Map());
  const [events, setEvents] = useState<Map<string, AgentEvent[]>>(new Map());
  const [worldSnapshots, setWorldSnapshots] = useState<Map<string, WorldSnapshot>>(new Map());
  const [visions, setVisions] = useState<Map<string, VisionCapture[]>>(new Map());
  const [builds, setBuilds] = useState<Map<string, BuildProgress[]>>(new Map());
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [teams, setTeams] = useState<Map<string, TeamUpdate>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(0);

  useEffect(() => {
    setLastUpdate(Date.now());
  }, []);

  const handleMessage = useCallback((msg: WsMessage) => {
    setLastUpdate(Date.now());

    switch (msg.type) {
      case 'agents:list': {
        const { agents: agentList } = msg.payload as { agents: AgentStatus[] };
        setAgents(new Map(agentList.map((a) => [a.id, a])));
        break;
      }

      case 'status:update': {
        const payload = msg.payload as { agentId: string; status: AgentStatus };
        setAgents((prev) => {
          const next = new Map(prev);
          next.set(payload.agentId, payload.status);
          return next;
        });
        break;
      }

      case 'event:new': {
        const { agentId, event } = msg.payload as { agentId: string; event: AgentEvent };
        setEvents((prev) => {
          const next = new Map(prev);
          const agentEvents = next.get(agentId) || [];
          next.set(agentId, [event, ...agentEvents].slice(0, 50));
          return next;
        });
        break;
      }

      case 'world:snapshot': {
        const { agentId, snapshot } = msg.payload as { agentId: string; snapshot: WorldSnapshot };
        setWorldSnapshots((prev) => {
          const next = new Map(prev);
          next.set(agentId, snapshot);
          return next;
        });
        break;
      }

      case 'vision:new': {
        const { agentId, vision } = msg.payload as { agentId: string; vision: VisionCapture };
        setVisions((prev) => {
          const next = new Map(prev);
          const agentVisions = next.get(agentId) || [];
          next.set(agentId, [vision, ...agentVisions].slice(0, 20));
          return next;
        });
        break;
      }

      case 'build:progress': {
        const { agentId, build } = msg.payload as { agentId: string; build: BuildProgress };
        setBuilds((prev) => {
          const next = new Map(prev);
          const agentBuilds = next.get(agentId) || [];
          // 更新或添加
          const idx = agentBuilds.findIndex((b) => b.buildId === build.buildId);
          const updated = [...agentBuilds];
          if (idx >= 0) {
            updated[idx] = build;
          } else {
            updated.unshift(build);
          }
          next.set(agentId, updated.slice(0, 20));
          return next;
        });
        break;
      }

      case 'chat:new': {
        const { message } = msg.payload as { agentId: string; message: ChatMessage };
        setChatMessages((prev) => [message, ...prev].slice(0, MAX_CHAT_MESSAGES));
        break;
      }

      case 'team:update': {
        const { team } = msg.payload as { agentId: string; team: TeamUpdate };
        setTeams((prev) => {
          const next = new Map(prev);
          next.set(team.teamId, team);
          return next;
        });
        break;
      }

      case 'trade:update': {
        // 交易事件已通过 event:new 处理
        break;
      }

      case 'admin:data-cleared': {
        console.log('[Observer] Data cleared by admin, resetting all state');
        setAgents(new Map());
        setEvents(new Map());
        setWorldSnapshots(new Map());
        setVisions(new Map());
        setBuilds(new Map());
        setChatMessages([]);
        setTeams(new Map());
        try {
          localStorage.removeItem('mineworld-demo-agents');
        } catch {
          // ignore
        }
        break;
      }
    }
  }, []);

  const connRef = useRef<ReturnType<typeof createWsConnection> | null>(null);

  useEffect(() => {
    connRef.current = createWsConnection({
      path: '/ws/agent',
      onMessage: handleMessage,
      onOpen: () => {
        console.log('[Observer] Connected');
        setIsConnected(true);
        connRef.current?.send({
          type: 'observer:register',
          payload: {},
        });
      },
      onClose: () => {
        console.log('[Observer] Disconnected');
        setIsConnected(false);
      },
    });

    return () => {
      connRef.current?.close();
    };
  }, [handleMessage]);

  return {
    agents,
    events,
    worldSnapshots,
    visions,
    builds,
    chatMessages,
    teams,
    isConnected,
    lastUpdate,
  };
}
