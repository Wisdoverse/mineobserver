// Agent WebSocket 处理器 - /ws/agent 端点

import { WebSocketServer, WebSocket } from 'ws';
import { agentStateManager, createAgentEvent, formatPosition } from './agent-state';
import type {
  WsMessage,
  AgentRegisterPayload,
  StatusUpdatePayload,
  EventPayload,
  WorldSnapshotPayload,
} from '@/lib/types/agent';
import { createWriteStream } from 'fs';

// 调试日志文件
const debugLogStream = createWriteStream('/app/work/logs/bypass/ws-debug.log', { flags: 'a' });
function debug(msg: string) {
  debugLogStream.write(`[${new Date().toISOString()}] ${msg}\n`);
}

// 广播给所有连接的客户端（观测者）
const observerClients = new Set<WebSocket>();

// Agent 连接（用于上报状态）
const agentClients = new Map<string, WebSocket>();

export function setupAgentHandler(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket) => {
    let clientAgentId: string | null = null;

    ws.on('message', (raw) => {
      try {
        debug(`[WS] Raw data: ${raw.toString().substring(0, 300)}`);
        const msg: WsMessage = JSON.parse(raw.toString());
        
        // 记录所有消息类型用于调试
        debug(`[WS] Parsed message type: ${msg.type}`);

        // 处理心跳
        if (msg.type === 'ping') {
          debug('[WS] Handling ping');
          ws.send(JSON.stringify({ type: 'pong', payload: null }));
          return;
        }

        switch (msg.type) {
          case 'agent:register': {
            // Agent 注册
            const payload = msg.payload as AgentRegisterPayload;
            const { agentId, username, serverHost, serverPort } = payload;

            console.log(`[Agent] Registered: ${username} (${agentId})`);

            // 保存状态
            agentStateManager.register(agentId, username, serverHost, serverPort);
            agentClients.set(agentId, ws);
            clientAgentId = agentId;

            // 添加连接事件
            agentStateManager.addEvent(
              agentId,
              createAgentEvent(agentId, 'connected', `${username} 已连接到服务器 ${serverHost}:${serverPort}`)
            );

            // 广播给观测者
            broadcastToObservers({
              type: 'agent:registered',
              payload: {
                agentId,
                status: agentStateManager.getAgentStatus(agentId),
              },
            });

            // 回复 Agent
            ws.send(JSON.stringify({
              type: 'agent:register:ack',
              payload: { agentId, success: true },
            }));
            break;
          }

          case 'agent:status:update': {
            console.log(`[Debug] Received agent:status:update for agentId:`, (msg.payload as StatusUpdatePayload)?.agentId);
            // 状态更新
            const payload = msg.payload as StatusUpdatePayload;
            const { agentId, status } = payload;

            console.log(`[Debug] Updating status for agentId: ${agentId}`);

            const prevStatus = agentStateManager.getAgentStatus(agentId);
            const updatedStatus = agentStateManager.updateStatus(agentId, status);

            console.log(`[Debug] prevStatus:`, prevStatus, `updatedStatus:`, updatedStatus);

            if (updatedStatus && prevStatus) {
              // 检测位置变化
              if (
                status.position &&
                (status.position.x !== prevStatus.position.x ||
                  status.position.y !== prevStatus.position.y ||
                  status.position.z !== prevStatus.position.z)
              ) {
                agentStateManager.addEvent(
                  agentId,
                  createAgentEvent(
                    agentId,
                    'moved',
                    `移动到 ${formatPosition(updatedStatus.position)}`,
                    { from: prevStatus.position, to: updatedStatus.position }
                  )
                );
              }

              // 检测跳跃
              if (status.position && prevStatus.position) {
                if (status.position.y > prevStatus.position.y + 0.5) {
                  agentStateManager.addEvent(
                    agentId,
                    createAgentEvent(agentId, 'jumped', `在 ${formatPosition(status.position)} 跳跃`)
                  );
                }
              }
            }

            // 广播给观测者
            broadcastToObservers({
              type: 'status:update',
              payload: { agentId, status: updatedStatus },
            });
            break;
          }

          case 'agent:event': {
            // Agent 事件
            const payload = msg.payload as EventPayload;
            const { agentId, event } = payload;

            const newEvent = agentStateManager.addEvent(agentId, {
              agentId,
              type: event.type,
              description: event.description,
              data: event.data,
            });

            if (newEvent) {
              broadcastToObservers({
                type: 'event:new',
                payload: { agentId, event: newEvent },
              });
            }
            break;
          }

          case 'agent:world:snapshot': {
            // 世界快照
            const payload = msg.payload as WorldSnapshotPayload;
            const { agentId, snapshot } = payload;

            agentStateManager.updateWorldSnapshot(agentId, snapshot);

            broadcastToObservers({
              type: 'world:snapshot',
              payload: { agentId, snapshot },
            });
            break;
          }

          case 'observer:register': {
            // 观测者注册
            console.log('[Observer] New observer connected');
            observerClients.add(ws);

            // 发送当前所有 Agent 状态
            const agents = agentStateManager.getAllAgents();
            ws.send(JSON.stringify({
              type: 'agents:list',
              payload: { agents },
            }));
            break;
          }

          default:
            console.warn('[WS] Unknown message type:', msg.type);
        }
      } catch (err) {
        debug(`[WS] Error: ${err}`);
        console.error('[WS] Failed to process message:', err);
      }
    });

    ws.on('close', () => {
      if (clientAgentId) {
        console.log(`[Agent] Disconnected: ${clientAgentId}`);
        agentClients.delete(clientAgentId);
        agentStateManager.unregister(clientAgentId);

        // 广播给观测者
        broadcastToObservers({
          type: 'agent:unregistered',
          payload: { agentId: clientAgentId },
        });
      }
      observerClients.delete(ws);
    });

    ws.on('error', (err) => {
      console.error('[WS] Error:', err);
    });
  });
}

// 广播消息给所有观测者
function broadcastToObservers(msg: WsMessage) {
  const data = JSON.stringify(msg);
  observerClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}
