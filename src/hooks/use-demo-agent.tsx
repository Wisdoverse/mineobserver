'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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

interface DemoAgentConfig {
  username: string;
  serverHost: string;
  serverPort: number;
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
  const wsRef = useRef<WebSocket | null>(null);

  // 连接 WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    wsRef.current = new WebSocket(`${protocol}//${window.location.host}/ws/agent`);

    wsRef.current.onopen = () => {
      console.log('[Demo] WebSocket connected');
      setIsConnected(true);
    };

    wsRef.current.onclose = () => {
      console.log('[Demo] WebSocket closed');
      wsRef.current = null;
      setIsConnected(false);
    };
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

  // 启动演示 Agent
  const startDemoAgent = useCallback((config: DemoAgentConfig) => {
    connect();

    const agentId = `demo-${config.username}-${Date.now()}`;
    const initialPosition = { x: 0, y: 64, z: 0 };

    // 等待 WebSocket 连接
    const waitForConnection = () => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        setTimeout(waitForConnection, 100);
        return;
      }

      const ws = wsRef.current;

      // 发送注册消息
      ws.send(JSON.stringify({
        type: 'agent:register',
        payload: {
          agentId,
          username: config.username,
          serverHost: config.serverHost,
          serverPort: config.serverPort,
        },
      }));

      // 初始化状态
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
          yaw: Math.random() * 360,
          pitch: 0,
          isOnGround: true,
          isSleeping: false,
          isSprinting: false,
          isSneaking: false,
          lastUpdated: Date.now(),
        },
      };

      ws.send(JSON.stringify({
        type: 'agent:status:update',
        payload: initialStatus,
      }));

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

      // 保存配置
      setAgentConfigs(prev => new Map(prev).set(agentId, config));

      // 启动状态更新定时器
      let currentPos = { ...initialPosition };
      let health = 20;
      let food = 18;
      let yaw = 0;

      const updateInterval = setInterval(() => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        const wsCurrent = wsRef.current;

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

        wsCurrent.send(JSON.stringify({
          type: 'agent:status:update',
          payload: {
            agentId,
            status: {
              position: currentPos,
              health,
              food,
              yaw,
              isSprinting: Math.random() > 0.8,
              isSneaking: Math.random() > 0.9,
              isOnGround: Math.random() > 0.1,
            },
          },
        }));

        // 随机发送事件
        if (Math.random() > 0.7) {
          const eventType = DEMO_EVENT_TYPES[Math.floor(Math.random() * DEMO_EVENT_TYPES.length)];
          wsCurrent.send(JSON.stringify({
            type: 'agent:event',
            payload: {
              agentId,
              event: {
                type: eventType.type,
                description: eventType.description,
                data: {},
              },
            },
          }));
        }

        // 随机更新世界快照
        if (Math.random() > 0.8) {
          // 添加一些随机方块
          const randomBlock = {
            position: {
              x: currentPos.x + Math.floor(Math.random() * 10) - 5,
              y: currentPos.y + Math.floor(Math.random() * 5),
              z: currentPos.z + Math.floor(Math.random() * 10) - 5,
            },
            type: ['stone', 'cobblestone', 'dirt', 'grass_block'][Math.floor(Math.random() * 4)],
            name: '方块',
          };

          wsCurrent.send(JSON.stringify({
            type: 'agent:world:snapshot',
            payload: {
              agentId,
              snapshot: {
                blocks: [...DEMO_BLOCKS.slice(0, 10), randomBlock],
                entities: DEMO_ENTITIES,
                timestamp: Date.now(),
              },
            },
          }));
        }
      }, 2000);

      setIntervals(prev => new Map(prev).set(agentId, updateInterval));
    };

    waitForConnection();
  }, [connect]);

  // 停止演示 Agent
  const stopDemoAgent = useCallback((agentId: string) => {
    setIntervals(prev => {
      const interval = prev.get(agentId);
      if (interval) {
        clearInterval(interval);
      }
      const next = new Map(prev);
      next.delete(agentId);
      return next;
    });
    setAgentConfigs(prev => {
      const next = new Map(prev);
      next.delete(agentId);
      return next;
    });
  }, []);

  // 停止所有演示 Agent
  const stopAllDemoAgents = useCallback(() => {
    setIntervals(prev => {
      prev.forEach((interval) => clearInterval(interval));
      return new Map();
    });
    setAgentConfigs(new Map());
  }, []);

  // 清理
  useEffect(() => {
    return () => {
      intervals.forEach((interval) => clearInterval(interval));
      wsRef.current?.close();
    };
  }, [intervals]);

  return {
    activeAgents: agentConfigs,
    startDemoAgent,
    stopDemoAgent,
    stopAllDemoAgents,
    isConnected,
  };
}

interface DemoAgentDialogProps {
  onStartDemo: (config: DemoAgentConfig) => void;
}

export function DemoAgentDialog({ onStartDemo }: DemoAgentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [serverHost, setServerHost] = useState('localhost');
  const [serverPort, setServerPort] = useState('25565');

  const handleSubmit = () => {
    if (!username.trim()) return;
    onStartDemo({
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
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          添加演示 Agent
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加演示 Agent</DialogTitle>
          <DialogDescription>
            创建一个模拟的 Minecraft Agent 来演示观测台功能。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">用户名</Label>
            <Input
              id="username"
              placeholder="输入 Agent 用户名"
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
          <Button onClick={handleSubmit} disabled={!username.trim()}>
            启动
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
