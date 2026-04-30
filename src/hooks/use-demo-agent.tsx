'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const DEMO_AGENTS_STORAGE_KEY = 'mineworld-demo-agents';

interface DemoAgentConfig {
  username: string;
  serverHost: string;
  serverPort: number;
  createdAt?: number; // 自动恢复时使用
  pausedAt?: number; // 暂停时间，存在表示离线但保留配置
}

// 从 localStorage 加载保存的演示 Agent 配置
function loadSavedAgents(): Map<string, DemoAgentConfig> {
  if (typeof window === 'undefined') return new Map();
  try {
    const saved = localStorage.getItem(DEMO_AGENTS_STORAGE_KEY);
    if (saved) {
      const arr = JSON.parse(saved);
      return new Map(arr);
    }
  } catch (e) {
    console.error('[Demo] Failed to load saved agents:', e);
  }
  return new Map();
}

// 保存演示 Agent 配置到 localStorage
function saveAgents(agents: Map<string, DemoAgentConfig>) {
  if (typeof window === 'undefined') return;
  try {
    const arr = Array.from(agents.entries());
    localStorage.setItem(DEMO_AGENTS_STORAGE_KEY, JSON.stringify(arr));
  } catch (e) {
    console.error('[Demo] Failed to save agents:', e);
  }
}

// 模拟物品数据
const DEMO_ITEMS = [
  { slot: 0, name: 'minecraft:diamond_sword', displayName: '钻石剑', count: 1 },
  { slot: 1, name: 'minecraft:diamond_pickaxe', displayName: '钻石镐', count: 1 },
  { slot: 2, name: 'minecraft:oak_planks', displayName: '橡木木板', count: 64 },
  { slot: 3, name: 'minecraft:stone', displayName: '石头', count: 47 },
  { slot: 4, name: 'minecraft:bread', displayName: '面包', count: 16 },
  { slot: 5, name: 'minecraft:torch', displayName: '火把', count: 32 },
  { slot: 8, name: 'minecraft:diamond', displayName: '钻石', count: 12 },
];

const DEMO_BLOCKS = [
  { position: { x: 0, y: 63, z: 1 }, type: 'grass_block', name: '草方块' },
  { position: { x: 1, y: 63, z: 1 }, type: 'grass_block', name: '草方块' },
  { position: { x: 2, y: 63, z: 1 }, type: 'dirt', name: '泥土' },
  { position: { x: 3, y: 63, z: 1 }, type: 'grass_block', name: '草方块' },
  { position: { x: 0, y: 63, z: 2 }, type: 'grass_block', name: '草方块' },
  { position: { x: 1, y: 63, z: 2 }, type: 'oak_log', name: '橡木原木' },
  { position: { x: 2, y: 64, z: 2 }, type: 'oak_leaves', name: '橡木树叶' },
  { position: { x: -1, y: 63, z: 0 }, type: 'cobblestone', name: '圆石' },
  { position: { x: -2, y: 63, z: 0 }, type: 'stone', name: '石头' },
  { position: { x: 0, y: 63, z: -1 }, type: 'grass_block', name: '草方块' },
  { position: { x: 1, y: 63, z: -1 }, type: 'sand', name: '沙子' },
  { position: { x: 2, y: 63, z: -1 }, type: 'grass_block', name: '草方块' },
  { position: { x: 0, y: 64, z: 0 }, type: 'torch', name: '火把' },
  { position: { x: 5, y: 63, z: 5 }, type: 'diamond_ore', name: '钻石矿石' },
  { position: { x: -3, y: 63, z: 3 }, type: 'coal_ore', name: '煤矿石' },
];

const DEMO_ENTITIES = [
  { id: 1, type: 'pig', name: 'Pig', position: { x: 5, y: 64, z: -3 }, distance: 7 },
  { id: 2, type: 'cow', name: 'Cow', position: { x: -4, y: 64, z: 2 }, distance: 5 },
  { id: 3, type: 'chicken', name: 'Chicken', position: { x: 3, y: 64, z: 4 }, distance: 6 },
];

const DEMO_EVENT_TYPES = [
  { type: 'moved', description: '移动到 (10, 64, 15)' },
  { type: 'item_picked_up', description: '拾取了 1 个钻石' },
  { type: 'block_broken', description: '破坏了石头' },
  { type: 'chat_sent', description: '发送消息: "正在探索中..."' },
  { type: 'jumped', description: '在 (12, 64, 18) 跳跃' },
];

// 演示建造蓝图
const DEMO_BLUEPRINTS = [
  { name: '石头小屋', totalLayers: 5, blocksTotal: 120 },
  { name: '瞭望塔', totalLayers: 8, blocksTotal: 256 },
  { name: '农田', totalLayers: 1, blocksTotal: 64 },
  { name: '围墙', totalLayers: 3, blocksTotal: 180 },
  { name: '铁匠铺', totalLayers: 4, blocksTotal: 200 },
  { name: '图书馆', totalLayers: 6, blocksTotal: 320 },
];

// 演示聊天消息
const DEMO_CHAT_MESSAGES = [
  { content: '发现了一个洞穴入口！', channel: 'public' as const },
  { content: '有人看到钻石矿了吗？', channel: 'public' as const },
  { content: '正在建造基地，需要一些橡木', channel: 'public' as const },
  { content: '小心，前方有苦力怕！', channel: 'public' as const },
  { content: '我已经挖到红石了', channel: 'public' as const },
  { content: '谁有多余的铁锭？', channel: 'public' as const },
  { content: '天快黑了，注意安全', channel: 'public' as const },
  { content: '找到村庄了！', channel: 'public' as const },
  { content: '这里有个废弃矿道', channel: 'whisper' as const },
  { content: '集合坐标 (120, 64, -50)', channel: 'team' as const },
  { content: '建造进度如何？', channel: 'team' as const },
  { content: '我负责采集木材', channel: 'team' as const },
];

// 演示截图场景描述
const DEMO_VISION_SCENES = [
  { description: '日落时分的草原', biome: 'plains', timeOfDay: 'sunset', weather: 'clear' },
  { description: '密林深处的洞穴入口', biome: 'forest', timeOfDay: 'night', weather: 'clear' },
  { description: '沙漠中的村庄', biome: 'desert', timeOfDay: 'noon', weather: 'clear' },
  { description: '雪山之巅', biome: 'snowy_peaks', timeOfDay: 'dawn', weather: 'snow' },
  { description: '沼泽地带的怪物', biome: 'swamp', timeOfDay: 'midnight', weather: 'rain' },
  { description: '峡谷中的岩浆瀑布', biome: 'badlands', timeOfDay: 'noon', weather: 'clear' },
  { description: '海底神殿入口', biome: 'ocean', timeOfDay: 'dusk', weather: 'rain' },
  { description: '丛林神庙', biome: 'jungle', timeOfDay: 'afternoon', weather: 'thunder' },
];

// 用 Canvas 生成简单的 Minecraft 风格截图（返回 Base64 data URL）
function generateDemoScreenshot(width: number, height: number): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 天空渐变
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.6);
  skyGrad.addColorStop(0, '#4A90D9');
  skyGrad.addColorStop(0.5, '#87CEEB');
  skyGrad.addColorStop(1, '#B0E0E6');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height * 0.6);

  // 地面
  const groundGrad = ctx.createLinearGradient(0, height * 0.6, 0, height);
  groundGrad.addColorStop(0, '#5B8C3E');
  groundGrad.addColorStop(0.3, '#4A7830');
  groundGrad.addColorStop(1, '#3A5A22');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, height * 0.6, width, height * 0.4);

  // 随机方块纹理
  const blockSize = 16;
  for (let x = 0; x < width; x += blockSize) {
    for (let y = Math.floor(height * 0.6); y < height; y += blockSize) {
      if (Math.random() > 0.7) {
        const shade = Math.random() * 20 - 10;
        const r = Math.max(0, Math.min(255, 91 + shade));
        const g = Math.max(0, Math.min(255, 140 + shade));
        const b = Math.max(0, Math.min(255, 62 + shade));
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, blockSize - 1, blockSize - 1);
      }
    }
  }

  // 随机树木
  const treeCount = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < treeCount; i++) {
    const tx = Math.random() * (width - 80) + 20;
    const ty = height * 0.6 - 10;
    // 树干
    ctx.fillStyle = '#6B4226';
    ctx.fillRect(tx + 4, ty - 30, 8, 30);
    // 树冠
    ctx.fillStyle = '#2D8C2D';
    ctx.fillRect(tx - 6, ty - 50, 28, 24);
    ctx.fillStyle = '#3AA03A';
    ctx.fillRect(tx - 2, ty - 56, 20, 12);
  }

  // 随机云
  for (let i = 0; i < 3; i++) {
    const cx = Math.random() * width;
    const cy = Math.random() * height * 0.25 + 20;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 40, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 25, cy - 5, 30, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 太阳或月亮
  if (Math.random() > 0.5) {
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(width * 0.8, height * 0.15, 20, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#E8E8E8';
    ctx.beginPath();
    ctx.arc(width * 0.2, height * 0.12, 16, 0, Math.PI * 2);
    ctx.fill();
  }

  // 返回纯 Base64（不含 data:image/png;base64, 前缀）
  const dataUrl = canvas.toDataURL('image/png');
  return dataUrl.replace(/^data:image\/\w+;base64,/, '');
}

export function useDemoAgent() {
  const [agentConfigs, setAgentConfigs] = useState<Map<string, DemoAgentConfig>>(new Map());
  const [intervals, setIntervals] = useState<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  // 每个 Agent 维护独立的 WebSocket 连接
  const agentWsMap = useRef<Map<string, WebSocket>>(new Map());
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoRestoreDoneRef = useRef(false);

  // 为单个 Agent 创建独立的 WebSocket 连接
  const connectAgentWs = useCallback((agentId: string): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
      // 关闭该 Agent 的现有连接
      const existing = agentWsMap.current.get(agentId);
      if (existing) {
        existing.close();
        agentWsMap.current.delete(agentId);
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/agent`;
      console.log('[Demo] Connecting to:', wsUrl, 'for agent:', agentId);
      
      const ws = new WebSocket(wsUrl);
      
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Connection timeout'));
      }, 5000);

      ws.onopen = () => {
        clearTimeout(timeout);
        console.log('[Demo] WebSocket connected for agent:', agentId);
        setIsConnected(true);
        agentWsMap.current.set(agentId, ws);
        resolve(ws);
      };

      ws.onerror = (error) => {
        clearTimeout(timeout);
        console.error('[Demo] WebSocket error for agent:', agentId, error);
        setIsConnected(false);
        reject(error);
      };

      ws.onclose = () => {
        clearTimeout(timeout);
        console.log('[Demo] WebSocket closed for agent:', agentId);
        agentWsMap.current.delete(agentId);
        // 检查是否还有活跃连接
        if (agentWsMap.current.size === 0) {
          setIsConnected(false);
        }
      };
    });
  }, []);

  // 生成随机位置变化
  const generatePositionUpdate = (currentPos: { x: number; y: number; z: number }) => {
    const dx = Math.floor(Math.random() * 3) - 1;
    const dz = Math.floor(Math.random() * 3) - 1;
    return {
      x: currentPos.x + dx,
      y: 63 + Math.floor(Math.random() * 3),
      z: currentPos.z + dz,
    };
  };

  // 启动演示 Agent（支持传入已有的 agentId 用于自动恢复）
  const startDemoAgent = useCallback(async (config: DemoAgentConfig, existingAgentId?: string) => {
    try {
      // 为该 Agent 创建独立的 WebSocket 连接
      const agentId = existingAgentId || `demo-${config.username}`;
      const ws = await connectAgentWs(agentId);
      console.log('[Demo] WebSocket ready, starting agent:', config.username);

      const initialPosition = { x: 0, y: 64, z: 0 };

      // 发送注册消息
      const registerMsg = {
        type: 'agent:register',
        payload: {
          agentId,
          username: config.username,
          serverHost: config.serverHost,
          serverPort: config.serverPort,
        },
      };
      console.log('[Demo] Sending register:', JSON.stringify(registerMsg));
      ws.send(JSON.stringify(registerMsg));

      // 等待一小段时间确保注册成功
      await new Promise(resolve => setTimeout(resolve, 100));

      // 发送初始状态
      const initialStatus = {
        agentId,
        status: {
          id: agentId,
          username: config.username,
          connected: true,
          position: initialPosition,
          health: 20,
          maxHealth: 20,
          food: 18,
          saturation: 10,
          gamemode: 'survival' as const,
          inventory: DEMO_ITEMS,
          equipment: {
            head: { slot: -1, name: 'minecraft:diamond_helmet', displayName: '钻石头盔', count: 1 },
            chest: { slot: -2, name: 'minecraft:diamond_chestplate', displayName: '钻石胸甲', count: 1 },
            legs: { slot: -3, name: 'minecraft:diamond_leggings', displayName: '钻石护腿', count: 1 },
            feet: { slot: -4, name: 'minecraft:diamond_boots', displayName: '钻石靴子', count: 1 },
            mainhand: { slot: -1, name: 'minecraft:diamond_sword', displayName: '钻石剑', count: 1 },
          },
          world: config.serverHost,
          dimension: 'overworld',
          yaw: 180,
          pitch: 0,
          isOnGround: true,
          isSleeping: false,
          isSprinting: false,
          isSneaking: false,
          lastUpdated: Date.now(),
        },
      };
      ws.send(JSON.stringify({ type: 'agent:status:update', payload: initialStatus }));

      // 发送初始世界快照
      ws.send(JSON.stringify({
        type: 'agent:world:snapshot',
        payload: {
          agentId,
          snapshot: {
            blocks: DEMO_BLOCKS,
            entities: DEMO_ENTITIES,
            timestamp: Date.now(),
          },
        },
      }));

      // 保存配置到 state 和 localStorage
      const configWithTimestamp: DemoAgentConfig = {
        ...config,
        createdAt: Date.now(),
      };
      setAgentConfigs(prev => {
        const next = new Map(prev).set(agentId, configWithTimestamp);
        saveAgents(next);
        return next;
      });

      // 启动状态更新定时器
      let currentPos = { ...initialPosition };
      let health = 20;
      let food = 18;
      let yaw = 180;
      // 建造状态
      let currentBuild: {
        buildId: string;
        blueprintName: string;
        status: 'started' | 'in_progress' | 'completed' | 'failed';
        progress: number;
        currentLayer: number;
        totalLayers: number;
        blocksPlaced: number;
        blocksTotal: number;
        startedAt: number;
      } | null = null;

      // 演示数据计数器（限制总量，避免页面爆炸）
      let visionCount = 0;
      let chatCount = 0;
      let buildCount = 0;
      const MAX_DEMO_VISIONS = 8;
      const MAX_DEMO_CHATS = 30;
      const MAX_DEMO_BUILDS = 5;

      const updateInterval = setInterval(() => {
        const currentWs = agentWsMap.current.get(agentId);
        if (!currentWs || currentWs.readyState !== WebSocket.OPEN) {
          console.log('[Demo] WebSocket not ready for agent:', agentId);
          return;
        }

        // 更新位置
        if (Math.random() > 0.3) {
          currentPos = generatePositionUpdate(currentPos);
        }

        // 随机更新视角
        yaw = (yaw + (Math.random() * 20 - 10)) % 360;

        // 随机更新生命值和饥饿值
        if (Math.random() > 0.9) {
          health = Math.max(1, health - 1);
        }
        if (Math.random() > 0.8) {
          food = Math.max(0, food - 1);
        }
        if (food < 20 && Math.random() > 0.5) {
          food = Math.min(20, food + 1);
        }

        // 发送状态更新
        currentWs.send(JSON.stringify({
          type: 'agent:status:update',
          payload: {
            agentId,
            status: {
              id: agentId,
              username: config.username,
              connected: true,
              position: currentPos,
              health,
              maxHealth: 20,
              food,
              saturation: Math.floor(food / 2),
              gamemode: 'survival' as const,
              inventory: DEMO_ITEMS,
              equipment: {
                head: { slot: -1, name: 'minecraft:diamond_helmet', displayName: '钻石头盔', count: 1 },
                chest: { slot: -2, name: 'minecraft:diamond_chestplate', displayName: '钻石胸甲', count: 1 },
                legs: { slot: -3, name: 'minecraft:diamond_leggings', displayName: '钻石护腿', count: 1 },
                feet: { slot: -4, name: 'minecraft:diamond_boots', displayName: '钻石靴子', count: 1 },
                mainhand: { slot: -1, name: 'minecraft:diamond_sword', displayName: '钻石剑', count: 1 },
              },
              world: config.serverHost,
              dimension: 'overworld',
              yaw,
              pitch: Math.random() * 30 - 15,
              isOnGround: true,
              isSleeping: false,
              isSprinting: Math.random() > 0.8,
              isSneaking: false,
              lastUpdated: Date.now(),
            },
          },
        }));

        // 随机发送事件
        if (Math.random() > 0.7) {
          const eventType = DEMO_EVENT_TYPES[Math.floor(Math.random() * DEMO_EVENT_TYPES.length)];
          currentWs.send(JSON.stringify({
            type: 'agent:event',
            payload: {
              agentId,
              event: {
                type: eventType.type,
                message: eventType.description,
                timestamp: Date.now(),
              },
            },
          }));
        }

        // === 建造进度 (约每 30 秒新建/更新一次) ===
        if (!currentBuild && Math.random() > 0.85 && buildCount < MAX_DEMO_BUILDS) {
          // 开始新建造
          const blueprint = DEMO_BLUEPRINTS[Math.floor(Math.random() * DEMO_BLUEPRINTS.length)];
          currentBuild = {
            buildId: `build-${agentId}-${Date.now()}`,
            blueprintName: blueprint.name,
            status: 'started',
            progress: 0,
            currentLayer: 0,
            totalLayers: blueprint.totalLayers,
            blocksPlaced: 0,
            blocksTotal: blueprint.blocksTotal,
            startedAt: Date.now(),
          };
          buildCount++;
          currentWs.send(JSON.stringify({
            type: 'agent:build:progress',
            payload: { agentId, build: currentBuild },
          }));
        } else if (currentBuild && currentBuild.status !== 'completed' && currentBuild.status !== 'failed') {
          // 更新建造进度
          const increment = Math.random() * 0.15 + 0.03;
          currentBuild.progress = Math.min(1, currentBuild.progress + increment);
          currentBuild.blocksPlaced = Math.floor(currentBuild.blocksTotal * currentBuild.progress);
          currentBuild.currentLayer = Math.floor(currentBuild.totalLayers * currentBuild.progress);

          if (currentBuild.progress >= 1) {
            currentBuild.status = 'completed';
            currentBuild.progress = 1;
            currentBuild.blocksPlaced = currentBuild.blocksTotal;
            currentBuild.currentLayer = currentBuild.totalLayers;
          } else {
            currentBuild.status = 'in_progress';
          }

          // 10% 概率建造失败
          if (Math.random() > 0.9 && currentBuild.progress < 0.5) {
            currentBuild.status = 'failed';
          }

          currentWs.send(JSON.stringify({
            type: 'agent:build:progress',
            payload: { agentId, build: currentBuild },
          }));

          // 建造完成或失败后清空，下次循环可能新建
          if (currentBuild.status === 'completed' || currentBuild.status === 'failed') {
            currentBuild = null;
          }
        }

        // === 聊天消息 (约每 15 秒发一次) ===
        if (Math.random() > 0.87 && chatCount < MAX_DEMO_CHATS) {
          const chatMsg = DEMO_CHAT_MESSAGES[Math.floor(Math.random() * DEMO_CHAT_MESSAGES.length)];
          chatCount++;
          currentWs.send(JSON.stringify({
            type: 'agent:chat',
            payload: {
              agentId,
              message: {
                messageId: `msg-${agentId}-${Date.now()}`,
                content: chatMsg.content,
                channel: chatMsg.channel,
                recipient: chatMsg.channel === 'whisper' ? 'Steve' : undefined,
                sender: { agentId, username: config.username, type: 'agent' as const },
                timestamp: Date.now(),
              },
            },
          }));
        }

        // === 截图上报 (约每 40 秒发一次) ===
        if (Math.random() > 0.95 && visionCount < MAX_DEMO_VISIONS) {
          const scene = DEMO_VISION_SCENES[Math.floor(Math.random() * DEMO_VISION_SCENES.length)];
          const imageData = generateDemoScreenshot(320, 180);
          if (imageData) {
            visionCount++;
            currentWs.send(JSON.stringify({
              type: 'agent:vision',
              payload: {
                agentId,
                vision: {
                  captureId: `capture-${agentId}-${Date.now()}`,
                  imageData,
                  dimensions: { width: 320, height: 180 },
                  position: currentPos,
                  facing: { yaw, pitch: 0 },
                  description: scene.description,
                  scene: {
                    biome: scene.biome,
                    timeOfDay: scene.timeOfDay,
                    weather: scene.weather,
                    dimension: 'overworld',
                  },
                  timestamp: Date.now(),
                },
              },
            }));
          }
        }
      }, 2000);

      setIntervals(prev => new Map(prev).set(agentId, updateInterval));
      console.log('[Demo] Agent started:', config.username, 'ID:', agentId);

    } catch (error) {
      console.error('[Demo] Failed to start agent:', error);
    }
  }, [connectAgentWs]);

  // 组件挂载时连接 WebSocket 并自动恢复保存的 Agent
  useEffect(() => {
    // 加载保存的 Agent 配置
    const savedAgents = loadSavedAgents();
    if (savedAgents.size > 0) {
      console.log('[Demo] Found saved agents, restoring:', savedAgents.size);
      setAgentConfigs(savedAgents);
    }
    
    // 自动恢复保存的 Agent（不再需要预先连接 WebSocket，每个 Agent 有独立连接）
    if (savedAgents.size > 0 && !autoRestoreDoneRef.current) {
      autoRestoreDoneRef.current = true;
      setIsInitialized(true);
      
      // 延迟恢复以确保页面完全加载
      setTimeout(() => {
        savedAgents.forEach((config, agentId) => {
          console.log('[Demo] Auto-restoring agent:', config.username);
          startDemoAgent(config, agentId).catch(err => {
            console.error('[Demo] Auto-restore failed for:', config.username, err);
          });
        });
      }, 1000);
    }
  }, []);

  // 暂停单个演示 Agent（仅标记离线，保留配置）
  const pauseDemoAgent = useCallback((agentId: string) => {
    const interval = intervals.get(agentId);
    if (interval) {
      clearInterval(interval);
      setIntervals(prev => {
        const next = new Map(prev);
        next.delete(agentId);
        return next;
      });
    }
    // 关闭该 Agent 的 WebSocket 连接（服务端会标记离线）
    const ws = agentWsMap.current.get(agentId);
    if (ws) {
      ws.close();
      agentWsMap.current.delete(agentId);
    }
    // 仅标记暂停时间，不删除配置
    setAgentConfigs(prev => {
      const next = new Map(prev);
      const config = next.get(agentId);
      if (config) {
        next.set(agentId, { ...config, pausedAt: Date.now() });
        saveAgents(next);
      }
      return next;
    });
    console.log('[Demo] Agent paused (offline):', agentId);
  }, [intervals]);

  // 重新连接已暂停的演示 Agent
  const resumeDemoAgent = useCallback((agentId: string) => {
    const config = agentConfigs.get(agentId);
    if (!config || !config.pausedAt) {
      console.log('[Demo] Agent not paused:', agentId);
      return;
    }
    // 清除暂停标记，重新启动
    setAgentConfigs(prev => {
      const next = new Map(prev);
      const updatedConfig = { ...config };
      delete updatedConfig.pausedAt;
      next.set(agentId, updatedConfig);
      saveAgents(next);
      return next;
    });
    console.log('[Demo] Agent resuming:', agentId);
  }, [agentConfigs]);

  // 停止单个演示 Agent（完全删除配置）
  const stopDemoAgent = useCallback((agentId: string) => {
    const interval = intervals.get(agentId);
    if (interval) {
      clearInterval(interval);
      setIntervals(prev => {
        const next = new Map(prev);
        next.delete(agentId);
        return next;
      });
    }
    // 关闭该 Agent 的 WebSocket 连接
    const ws = agentWsMap.current.get(agentId);
    if (ws) {
      ws.close();
      agentWsMap.current.delete(agentId);
    }
    setAgentConfigs(prev => {
      const next = new Map(prev);
      next.delete(agentId);
      saveAgents(next);
      return next;
    });
    console.log('[Demo] Agent stopped (removed):', agentId);
  }, [intervals]);

  // 停止所有演示 Agent
  const stopAllDemoAgents = useCallback(() => {
    intervals.forEach((interval) => clearInterval(interval));
    setIntervals(new Map());
    setAgentConfigs(new Map());
    localStorage.removeItem(DEMO_AGENTS_STORAGE_KEY);
    
    // 关闭所有 Agent 的 WebSocket 连接
    agentWsMap.current.forEach((ws) => ws.close());
    agentWsMap.current.clear();
    console.log('[Demo] All agents stopped');
  }, [intervals]);

  return {
    activeAgents: agentConfigs,
    startDemoAgent,
    pauseDemoAgent,
    resumeDemoAgent,
    stopDemoAgent,
    stopAllDemoAgents,
    isConnected,
  };
}

// 演示 Agent 添加对话框组件
export function AddDemoAgentDialog() {
  const { startDemoAgent, isConnected } = useDemoAgent();
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [serverHost, setServerHost] = useState('localhost');
  const [serverPort, setServerPort] = useState('25565');

  const handleAdd = () => {
    if (!username.trim()) return;
    startDemoAgent({
      username: username.trim(),
      serverHost,
      serverPort: parseInt(serverPort, 10),
    });
    setIsOpen(false);
    setUsername('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          添加演示 Agent
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加演示 Agent</DialogTitle>
          <DialogDescription>
            创建一个模拟的 Agent，用于演示 MineWorld 观测台功能。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">用户名</Label>
            <Input
              id="username"
              placeholder="Agent 用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serverHost">服务器地址</Label>
              <Input
                id="serverHost"
                placeholder="localhost"
                value={serverHost}
                onChange={(e) => setServerHost(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serverPort">端口</Label>
              <Input
                id="serverPort"
                placeholder="25565"
                value={serverPort}
                onChange={(e) => setServerPort(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            取消
          </Button>
          <Button onClick={handleAdd} disabled={!username.trim()}>
            启动
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
