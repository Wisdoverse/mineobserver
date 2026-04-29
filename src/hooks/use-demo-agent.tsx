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

const DEMO_AGENTS_STORAGE_KEY = 'minecraft-observer-demo-agents';

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

export function useDemoAgent() {
  const [agentConfigs, setAgentConfigs] = useState<Map<string, DemoAgentConfig>>(new Map());
  const [intervals, setIntervals] = useState<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoRestoreDoneRef = useRef(false);

  // 连接到 WebSocket（Promise 版本）
  const connectWs = useCallback((): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
      // 关闭现有连接
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/agent`;
      console.log('[Demo] Connecting to:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Connection timeout'));
      }, 5000);

      ws.onopen = () => {
        clearTimeout(timeout);
        console.log('[Demo] WebSocket connected');
        setIsConnected(true);
        wsRef.current = ws;
        resolve(ws);
      };

      ws.onerror = (error) => {
        clearTimeout(timeout);
        console.error('[Demo] WebSocket error:', error);
        setIsConnected(false);
        reject(error);
      };

      ws.onclose = () => {
        clearTimeout(timeout);
        console.log('[Demo] WebSocket closed');
        setIsConnected(false);
        wsRef.current = null;
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
      // 连接 WebSocket
      const ws = await connectWs();
      console.log('[Demo] WebSocket ready, starting agent:', config.username);

      // 生成 agentId（如果是自动恢复，使用原来的 ID）
      const timestamp = Date.now();
      const agentId = existingAgentId || `demo-${config.username}-${timestamp}`;
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
          lastUpdated: timestamp,
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

      const updateInterval = setInterval(() => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          console.log('[Demo] WebSocket not ready, skipping update');
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
        wsRef.current.send(JSON.stringify({
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
          wsRef.current.send(JSON.stringify({
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
      }, 2000);

      setIntervals(prev => new Map(prev).set(agentId, updateInterval));
      console.log('[Demo] Agent started:', config.username, 'ID:', agentId);

    } catch (error) {
      console.error('[Demo] Failed to start agent:', error);
    }
  }, [connectWs]);

  // 组件挂载时连接 WebSocket 并自动恢复保存的 Agent
  useEffect(() => {
    // 加载保存的 Agent 配置
    const savedAgents = loadSavedAgents();
    if (savedAgents.size > 0) {
      console.log('[Demo] Found saved agents, restoring:', savedAgents.size);
      setAgentConfigs(savedAgents);
    }
    
    // 连接 WebSocket
    connectWs().then(() => {
      // WebSocket 连接成功后，自动恢复保存的 Agent
      if (savedAgents.size > 0 && !autoRestoreDoneRef.current) {
        autoRestoreDoneRef.current = true;
        setIsInitialized(true);
        
        // 延迟恢复以确保 WebSocket 完全就绪
        setTimeout(() => {
          savedAgents.forEach((config, agentId) => {
            console.log('[Demo] Auto-restoring agent:', config.username);
            startDemoAgent(config, agentId).catch(err => {
              console.error('[Demo] Auto-restore failed for:', config.username, err);
            });
          });
        }, 1000);
      }
    }).catch(err => {
      console.error('[Demo] Initial connection failed:', err);
    });
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
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
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
            创建一个模拟的 Minecraft Agent，用于演示观测台功能。
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
          <Button onClick={handleAdd} disabled={!username.trim() || !isConnected}>
            启动
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
