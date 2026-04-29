// WebSocket 客户端工具 - 前端使用

import type { WsMessage } from './types/agent';

interface WsOptions {
  path: string;
  onMessage: (msg: WsMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  reconnect?: boolean;
  reconnectInterval?: number;
  heartbeatMs?: number;
}

export function createWsConnection(opts: WsOptions): {
  send: (msg: WsMessage) => void;
  close: () => void;
  isConnected: () => boolean;
} {
  const {
    path,
    onMessage,
    onOpen,
    onClose,
    onError,
    reconnect = true,
    reconnectInterval = 3000,
    heartbeatMs = 30000,
  } = opts;

  let ws: WebSocket | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  function connect() {
    if (closed) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${protocol}//${window.location.host}${path}`);

    ws.onopen = () => {
      console.log('[WS] Connected to', path);
      // 启动心跳
      heartbeatTimer = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping', payload: null }));
        }
      }, heartbeatMs);
      onOpen?.();
    };

    ws.onmessage = (e) => {
      try {
        const msg: WsMessage = JSON.parse(e.data);
        if (msg.type === 'pong') return;
        onMessage(msg);
      } catch (err) {
        console.error('[WS] Failed to parse message:', err);
      }
    };

    ws.onclose = () => {
      console.log('[WS] Connection closed');
      cleanup();
      onClose?.();
      if (reconnect && !closed) {
        console.log(`[WS] Reconnecting in ${reconnectInterval}ms...`);
        reconnectTimer = setTimeout(connect, reconnectInterval);
      }
    };

    ws.onerror = (error) => {
      console.error('[WS] Error:', error);
      onError?.(error);
    };
  }

  function cleanup() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  // 初始化连接
  connect();

  return {
    send: (msg: WsMessage) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
      } else {
        console.warn('[WS] Cannot send, not connected');
      }
    },
    close: () => {
      closed = true;
      cleanup();
      if (ws) {
        ws.close();
        ws = null;
      }
    },
    isConnected: () => ws !== null && ws.readyState === WebSocket.OPEN,
  };
}

export type { WsMessage };
