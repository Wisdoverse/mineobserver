'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { createWsConnection, type WsMessage } from '@/lib/ws-client';
import type {
  AgentStatus,
  AgentEvent,
  EventType,
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
          localStorage.removeItem('mineobserver-demo-agents');
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

        // Load historical data from REST API
        (async () => {
          try {
            const [eventsRes, messagesRes] = await Promise.all([
              fetch('/api/events?limit=50'),
              fetch('/api/messages?limit=50'),
            ]);
            const eventsData = await eventsRes.json();
            const messagesData = await messagesRes.json();

            if (eventsData.success && Array.isArray(eventsData.data)) {
              setEvents((prev) => {
                const next = new Map(prev);
                for (const e of eventsData.data as { id: number; agent_id: string; event_type: string; description: string; event_data: Record<string, unknown>; created_at: string }[]) {
                  const event: AgentEvent = {
                    id: String(e.id),
                    agentId: e.agent_id,
                    type: e.event_type as EventType,
                    description: e.description,
                    data: e.event_data,
                    timestamp: new Date(e.created_at).getTime(),
                  };
                  const list = next.get(e.agent_id) || [];
                  if (!list.some((ex) => ex.id === String(e.id))) {
                    list.unshift(event);
                    next.set(e.agent_id, list.slice(0, 50));
                  }
                }
                return next;
              });
            }

            if (messagesData.success && Array.isArray(messagesData.data)) {
              setChatMessages((prev) => {
                const existingIds = new Set(prev.map((m) => m.messageId));
                const newMsgs = messagesData.data
                  .filter((m: { message_id: string }) => !existingIds.has(m.message_id))
                  .map((m: { message_id: string; agent_id: string; content: string; channel: string; recipient: string | null; sender: { agentId: string; username: string; type: string }; mentioned_agents: { agentId: string; username: string }[] | null; created_at: string }) => ({
                    messageId: m.message_id,
                    agentId: m.agent_id,
                    content: m.content,
                    channel: m.channel,
                    recipient: m.recipient || undefined,
                    sender: m.sender as { agentId: string; username: string; type: 'agent' | 'player' },
                    mentionedAgents: m.mentioned_agents || undefined,
                    timestamp: new Date(m.created_at).getTime(),
                  }));
                return [...prev, ...newMsgs].sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
              });
            }
          } catch (err) {
            console.error('[Observer] Failed to load history:', err);
          }
        })();
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
