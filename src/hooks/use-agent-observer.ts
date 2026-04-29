'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { createWsConnection, type WsMessage } from '@/lib/ws-client';
import type {
  AgentStatus,
  AgentEvent,
  WorldSnapshot,
} from '@/lib/types/agent';

interface UseAgentObserverReturn {
  agents: Map<string, AgentStatus>;
  events: Map<string, AgentEvent[]>;
  worldSnapshots: Map<string, WorldSnapshot>;
  isConnected: boolean;
  lastUpdate: number;
}

export function useAgentObserver(): UseAgentObserverReturn {
  const [agents, setAgents] = useState<Map<string, AgentStatus>>(new Map());
  const [events, setEvents] = useState<Map<string, AgentEvent[]>>(new Map());
  const [worldSnapshots, setWorldSnapshots] = useState<Map<string, WorldSnapshot>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(0);

  useEffect(() => {
    // 初始化 lastUpdate
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

      case 'agent:registered': {
        const { agentId, status } = msg.payload as { agentId: string; status: AgentStatus };
        setAgents((prev) => {
          const next = new Map(prev);
          next.set(agentId, status);
          return next;
        });
        break;
      }

      case 'agent:unregistered': {
        const { agentId } = msg.payload as { agentId: string };
        setAgents((prev) => {
          const next = new Map(prev);
          next.delete(agentId);
          return next;
        });
        setEvents((prev) => {
          const next = new Map(prev);
          next.delete(agentId);
          return next;
        });
        break;
      }

      case 'status:update': {
        const { agentId, status } = msg.payload as { agentId: string; status: AgentStatus };
        setAgents((prev) => {
          const next = new Map(prev);
          next.set(agentId, status);
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
        // 注册为观测者
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
    isConnected,
    lastUpdate,
  };
}
