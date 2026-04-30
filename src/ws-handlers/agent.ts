import { WebSocketServer, WebSocket } from 'ws';
import { agentStateManager } from './agent-state';
import type {
  AgentRegisterPayload,
  StatusUpdatePayload,
  EventPayload,
  WorldSnapshotPayload,
  VisionPayload,
  BuildProgressPayload,
  SubscribePayload,
  TeamUpdatePayload,
  ChatPayload,
  TradePayload,
  WsMessage,
  AgentStatus,
  EventType,
} from '@/lib/types/agent';
import { agentDb } from '@/storage/database/agent-db';
import { uploadVisionImage } from '@/storage/vision-storage';

// Agent 客户端映射 (agentId -> WebSocket)
const agentClients = new Map<string, WebSocket>();
// Observer 客户端集合
const observerClients = new Set<WebSocket>();

// 辅助：创建事件对象
function createAgentEvent(
  agentId: string,
  type: EventType,
  description: string,
  data?: Record<string, unknown>
) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    agentId,
    type,
    timestamp: Date.now(),
    description,
    data: data || {},
  };
}

// 辅助：格式化坐标
function formatPosition(pos: { x: number; y: number; z: number }): string {
  return `(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)})`;
}

export function setupAgentHandler(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket) => {
    let clientAgentId: string | null = null;

    ws.on('message', async (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString()) as WsMessage;

        switch (msg.type) {
          case 'agent:register': {
            const payload = msg.payload as AgentRegisterPayload;
            const { agentId, username, serverHost, serverPort } = payload;
            clientAgentId = agentId;
            agentClients.set(agentId, ws);

            const isReconnect = agentStateManager.hasAgent(agentId);
            agentStateManager.register(agentId, {
              id: agentId,
              username,
              connected: true,
              serverHost,
              serverPort,
            });

            // 确认注册
            ws.send(JSON.stringify({
              type: 'agent:register:ack',
              payload: { success: true, agentId, isReconnect },
            }));

            // 广播给观测者
            const status = agentStateManager.getAgentStatus(agentId);
            broadcastToObservers({
              type: 'status:update',
              payload: {
                agentId,
                status,
                event: createAgentEvent(
                  agentId,
                  isReconnect ? 'connected' : 'connected',
                  `${username} ${isReconnect ? '已重新连接' : '已连接'}`
                ),
              },
            });
            break;
          }

          case 'agent:status:update': {
            const payload = msg.payload as StatusUpdatePayload;
            const { agentId, status } = payload;

            const prevStatus = agentStateManager.getAgentStatus(agentId);
            const updatedStatus = agentStateManager.updateStatus(agentId, status);

            if (updatedStatus && prevStatus) {
              // 检测位置变化
              if (
                status.position &&
                prevStatus.position &&
                (status.position.x !== prevStatus.position.x ||
                  status.position.y !== prevStatus.position.y ||
                  status.position.z !== prevStatus.position.z)
              ) {
                const movedEvent = agentStateManager.addEvent(
                  agentId,
                  createAgentEvent(
                    agentId,
                    'moved',
                    `移动到 ${formatPosition(updatedStatus.position)}`,
                    { from: prevStatus.position, to: updatedStatus.position }
                  )
                );
                if (movedEvent) {
                  broadcastToObservers({ type: 'event:new', payload: { agentId, event: movedEvent } });
                }
              }

              // 检测跳跃
              if (status.position && prevStatus.position) {
                if (status.position.y > prevStatus.position.y + 0.5) {
                  const jumpedEvent = agentStateManager.addEvent(
                    agentId,
                    createAgentEvent(agentId, 'jumped', `在 ${formatPosition(status.position)} 跳跃`)
                  );
                  if (jumpedEvent) {
                    broadcastToObservers({ type: 'event:new', payload: { agentId, event: jumpedEvent } });
                  }
                }
              }

              // 持久化轨迹数据（位置变化时）
              if (status.position) {
                try {
                  await agentDb.insertStatusUpdate({
                    agent_id: agentId,
                    position: status.position,
                    health: status.health,
                    food: status.food,
                    dimension: status.dimension,
                  });
                } catch (err) {
                  console.error('持久化轨迹数据失败:', err);
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

          case 'agent:disconnect': {
            const payload = msg.payload as { agentId: string; reason?: string };
            const { agentId, reason } = payload;
            const agent = agentStateManager.getAgentStatus(agentId);

            if (agent) {
              const status = agentStateManager.disconnect(agentId);

              // 记录断开事件
              const disconnectEvent = agentStateManager.addEvent(agentId, {
                agentId,
                type: 'disconnected' as EventType,
                description: reason
                  ? `${agent.username || 'Agent'} 已断开连接: ${reason}`
                  : `${agent.username || 'Agent'} 已断开连接`,
                data: { reason: reason || 'unknown' },
              });

              broadcastToObservers({
                type: 'status:update',
                payload: { agentId, status, event: disconnectEvent },
              });

              // 清除 WebSocket 映射
              agentClients.delete(agentId);
              clientAgentId = null;

              // 主动关闭 WebSocket 连接
              try { ws.close(); } catch (_e) { /* ignore */ }

              console.log(`Agent ${agentId} 主动断开: ${reason || 'no reason'}`);
            }
            break;
          }

          case 'agent:event': {
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
            const payload = msg.payload as WorldSnapshotPayload;
            const { agentId, snapshot } = payload;

            agentStateManager.updateWorldSnapshot(agentId, snapshot);

            broadcastToObservers({
              type: 'world:snapshot',
              payload: { agentId, snapshot },
            });
            break;
          }

          case 'agent:vision': {
            // Agent 截图上报
            const payload = msg.payload as VisionPayload;
            const { agentId, vision } = payload;

            try {
              // 上传图片到对象存储
              const uploadResult = await uploadVisionImage(
                agentId,
                vision.captureId,
                vision.imageData,
                vision.thumbnailData,
              );

              // 存入数据库（使用 imageKey 而非签名 URL）
              await agentDb.insertVision({
                agent_id: agentId,
                capture_id: vision.captureId,
                image_key: uploadResult.imageKey,
                thumbnail_key: uploadResult.thumbnailKey,
                dimensions: vision.dimensions,
                position: vision.position,
                facing: vision.facing,
                description: vision.description,
                scene_info: vision.scene as Record<string, unknown> | undefined,
                size_bytes: uploadResult.sizeBytes,
              });
              agentDb.cleanupOldVision(agentId).catch((err: Error) => console.error('清理旧截图失败:', err));

              // 生成代理 URL 用于广播（使用相对路径，兼容任意域名访问）
              const visionProxyUrl = `/api/vision-proxy?key=${encodeURIComponent(uploadResult.imageKey)}`;
              const thumbProxyUrl = uploadResult.thumbnailKey ? `/api/vision-proxy?key=${encodeURIComponent(uploadResult.thumbnailKey)}` : undefined;

              // 添加截图事件
              const visionEvent = agentStateManager.addEvent(
                agentId,
                createAgentEvent(agentId, 'vision_captured', `截图: ${vision.description || vision.captureId}`, {
                  captureId: vision.captureId,
                  imageUrl: visionProxyUrl,
                  thumbnailUrl: thumbProxyUrl,
                })
              );

              // 广播给观测者
              broadcastToObservers({
                type: 'vision:new',
                payload: {
                  agentId,
                  vision: {
                    captureId: vision.captureId,
                    imageUrl: visionProxyUrl,
                    thumbnailUrl: thumbProxyUrl,
                    dimensions: vision.dimensions,
                    position: vision.position,
                    description: vision.description,
                    sceneInfo: vision.scene,
                    timestamp: vision.timestamp,
                  },
                },
              });

              if (visionEvent) {
                broadcastToObservers({ type: 'event:new', payload: { agentId, event: visionEvent } });
              }

              // ACK
              ws.send(JSON.stringify({
                type: 'agent:vision:ack',
                payload: { success: true, captureId: vision.captureId, imageUrl: visionProxyUrl },
              }));
            } catch (err) {
              console.error('处理截图上传失败:', err);
              ws.send(JSON.stringify({
                type: 'agent:vision:ack',
                payload: { success: false, captureId: vision.captureId, error: '截图上传失败' },
              }));
            }
            break;
          }

          case 'agent:build:progress': {
            // 建造进度上报
            const payload = msg.payload as BuildProgressPayload;
            const { agentId, build } = payload;

            try {
              await agentDb.upsertBuild({
                agent_id: agentId,
                build_id: build.buildId,
                blueprint_name: build.blueprintName,
                status: build.status,
                progress: build.progress,
                current_layer: build.currentLayer,
                total_layers: build.totalLayers,
                blocks_placed: build.blocksPlaced,
                blocks_total: build.blocksTotal,
                materials_used: build.materialsUsed,
                started_at: new Date(build.startedAt).toISOString(),
                estimated_completion: build.estimatedCompletion
                  ? new Date(build.estimatedCompletion).toISOString()
                  : undefined,
                errors: build.errors,
              });
              agentDb.cleanupOldBuilds(agentId).catch((err: Error) => console.error('清理旧建造记录失败:', err));

              // 广播给观测者
              broadcastToObservers({
                type: 'build:progress',
                payload: { agentId, build },
              });

              // 映射建造状态到事件类型
              const buildStatusToEvent: Record<string, EventType> = {
                started: 'build_started',
                in_progress: 'build_progress',
                completed: 'build_completed',
                failed: 'build_failed',
                cancelled: 'build_failed',
              };
              const buildEventType = buildStatusToEvent[build.status] || 'build_progress';

              // 添加建造事件
              const buildEvent = agentStateManager.addEvent(
                agentId,
                createAgentEvent(
                  agentId,
                  buildEventType,
                  `建造 ${build.blueprintName}: ${build.status} (${Math.round(build.progress * 100)}%)`,
                  { buildId: build.buildId, progress: build.progress, status: build.status }
                )
              );
              if (buildEvent) {
                broadcastToObservers({ type: 'event:new', payload: { agentId, event: buildEvent } });
              }
            } catch (err) {
              console.error('处理建造进度失败:', err);
            }
            break;
          }

          case 'agent:subscribe': {
            // 事件订阅
            const payload = msg.payload as SubscribePayload;
            const { agentId, subscription } = payload;

            try {
              const status = subscription.action === 'unsubscribe' ? 'inactive' : 'active';
              await agentDb.upsertSubscription({
                agent_id: agentId,
                subscription_id: subscription.subscriptionId,
                events: subscription.events,
                filter: subscription.filter as Record<string, unknown> | undefined,
                callback_url: subscription.callbackUrl || undefined,
                status,
              });

              ws.send(JSON.stringify({
                type: 'agent:subscribe:ack',
                payload: {
                  success: true,
                  subscriptionId: subscription.subscriptionId,
                  status,
                },
              }));
            } catch (err) {
              console.error('处理事件订阅失败:', err);
              ws.send(JSON.stringify({
                type: 'agent:subscribe:ack',
                payload: { success: false, error: '订阅处理失败' },
              }));
            }
            break;
          }

          case 'agent:team:update': {
            // 团队协作
            const payload = msg.payload as TeamUpdatePayload;
            const { agentId, team } = payload;

            try {
              const teamStatus = team.action === 'disbanded' ? 'disbanded' : 'active';
              await agentDb.upsertTeam({
                team_id: team.teamId,
                team_name: team.teamName,
                leader_agent_id: team.leader,
                members: team.members,
                task: team.task,
                status: teamStatus,
              });

              // 广播团队更新
              broadcastToObservers({
                type: 'team:update',
                payload: { agentId, team },
              });

              // 映射团队动作到事件类型
              const teamActionToEvent: Record<string, EventType> = {
                created: 'team_created',
                joined: 'team_joined',
                left: 'team_left',
                disbanded: 'team_disbanded',
                status_update: 'team_joined',
              };
              const teamEventType = teamActionToEvent[team.action] || 'team_created';

              // 添加团队事件
              const teamEvent = agentStateManager.addEvent(
                agentId,
                createAgentEvent(
                  agentId,
                  teamEventType,
                  `团队 ${team.teamName}: ${team.action}`,
                  { teamId: team.teamId, action: team.action }
                )
              );
              if (teamEvent) {
                broadcastToObservers({ type: 'event:new', payload: { agentId, event: teamEvent } });
              }
            } catch (err) {
              console.error('处理团队更新失败:', err);
            }
            break;
          }

          case 'agent:chat': {
            // 聊天消息
            const payload = msg.payload as ChatPayload;
            const { agentId, message } = payload;

            try {
              await agentDb.insertMessage({
                message_id: message.messageId,
                agent_id: agentId,
                content: message.content,
                channel: message.channel,
                recipient: message.recipient,
                sender: message.sender,
                mentioned_agents: message.mentionedAgents,
              });

              // 广播聊天消息
              broadcastToObservers({
                type: 'chat:new',
                payload: { agentId, message },
              });

              // 如果是私聊，转发给目标 Agent
              if (message.channel === 'whisper' && message.recipient) {
                const targetWs = agentClients.get(message.recipient);
                if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                  targetWs.send(JSON.stringify({
                    type: 'chat:received',
                    payload: { message },
                  }));
                }
              }

              // 添加聊天事件
              const chatEvent = agentStateManager.addEvent(
                agentId,
                createAgentEvent(
                  agentId,
                  message.channel === 'whisper' ? 'chat_sent' : 'chat_received',
                  `[${message.channel}] ${message.sender.username}: ${message.content}`,
                  { channel: message.channel, recipient: message.recipient }
                )
              );
              if (chatEvent) {
                broadcastToObservers({ type: 'event:new', payload: { agentId, event: chatEvent } });
              }
            } catch (err) {
              console.error('处理聊天消息失败:', err);
            }
            break;
          }

          case 'agent:trade': {
            // 村民交易
            const payload = msg.payload as TradePayload;
            const { agentId, trade } = payload;

            // 映射交易动作到事件类型
            const tradeActionToEvent: Record<string, EventType> = {
              trade_opened: 'trade_opened',
              trade_completed: 'trade_completed',
              trade_failed: 'trade_failed',
            };
            const tradeEventType = tradeActionToEvent[trade.action] || 'trade_opened';

            // 添加交易事件
            const tradeEvent = agentStateManager.addEvent(
              agentId,
              createAgentEvent(
                agentId,
                tradeEventType,
                `交易${trade.action === 'trade_completed' ? '完成' : trade.action === 'trade_failed' ? '失败' : '打开'}: ${trade.villagerProfession || `村民#${trade.villagerId}`}`,
                { tradeId: trade.tradeId, villagerId: trade.villagerId, action: trade.action }
              )
            );

            // 广播给观测者
            broadcastToObservers({
              type: 'trade:update',
              payload: { agentId, trade },
            });

            if (tradeEvent) {
              broadcastToObservers({ type: 'event:new', payload: { agentId, event: tradeEvent } });
            }
            break;
          }

          case 'admin:clear': {
            // 管理员清空内存中的所有 Agent
            const clearScope = (msg.payload as { scope?: string })?.scope || 'all';
            console.log('[Admin] Clear memory, scope:', clearScope);
            const clearedAgents = agentStateManager.clearAll();
            // 通知所有 Observer 数据已清空
            broadcastToObservers({
              type: 'admin:data-cleared',
              payload: { scope: clearScope },
            });
            broadcastToObservers({
              type: 'agents:list',
              payload: { agents: agentStateManager.getAllAgents() },
            });
            ws.send(JSON.stringify({
              type: 'admin:clear:ack',
              payload: { success: true, cleared: clearedAgents },
            }));
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

          case 'ping': {
            ws.send(JSON.stringify({ type: 'pong', payload: null }));
            break;
          }

          default:
            console.warn('[WS] Unknown message type:', msg.type);
        }
      } catch (err) {
        console.error('[WS] Failed to process message:', err);
      }
    });

    ws.on('close', () => {
      if (clientAgentId) {
        console.log(`[Agent] Disconnected: ${clientAgentId}`);
        agentClients.delete(clientAgentId);

        // 标记离线而非删除
        agentStateManager.disconnect(clientAgentId);

        // 添加断连事件
        const status = agentStateManager.getAgentStatus(clientAgentId);
        if (status) {
          agentStateManager.addEvent(
            clientAgentId,
            createAgentEvent(clientAgentId, 'disconnected', `${status.username} 已断开连接`)
          );
        }

        // 广播状态更新（离线），而不是删除
        broadcastToObservers({
          type: 'status:update',
          payload: { agentId: clientAgentId, status: agentStateManager.getAgentStatus(clientAgentId) },
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
