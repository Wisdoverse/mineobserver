'use client';

import { useState } from 'react';
import { Heart, Utensils, Compass, MapPin, Eye, Sun, Moon } from 'lucide-react';
import type { AgentStatus } from '@/lib/types/agent';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { InventoryGrid } from './inventory-grid';
import { MiniMap } from './mini-map';

interface AgentCardProps {
  agent: AgentStatus;
  events: Array<{ id: string; type: string; description: string; timestamp: number }>;
  worldSnapshot?: {
    blocks: Array<{ position: { x: number; y: number; z: number }; type: string; name: string }>;
    entities: Array<{ type: string; name?: string; position: { x: number; y: number; z: number }; distance: number }>;
  };
  isSelected?: boolean;
  onClick?: () => void;
}

const EVENT_TYPE_CONFIG: Record<string, { color: string; label: string }> = {
  connected: { color: 'bg-green-500', label: '连接' },
  disconnected: { color: 'bg-red-500', label: '断开' },
  moved: { color: 'bg-blue-500', label: '移动' },
  jumped: { color: 'bg-purple-500', label: '跳跃' },
  attacked: { color: 'bg-red-500', label: '攻击' },
  damaged: { color: 'bg-orange-500', label: '受伤' },
  died: { color: 'bg-red-700', label: '死亡' },
  chat_sent: { color: 'bg-cyan-500', label: '发送' },
  chat_received: { color: 'bg-teal-500', label: '收到' },
  block_broken: { color: 'bg-amber-600', label: '破坏' },
  block_placed: { color: 'bg-yellow-500', label: '放置' },
  item_picked_up: { color: 'bg-emerald-500', label: '拾取' },
  item_dropped: { color: 'bg-gray-500', label: '丢弃' },
  item_used: { color: 'bg-indigo-500', label: '使用' },
  inventory_changed: { color: 'bg-pink-500', label: '背包' },
  world_changed: { color: 'bg-violet-500', label: '世界' },
  respawned: { color: 'bg-green-600', label: '重生' },
};

export function AgentCard({ agent, events, worldSnapshot, isSelected, onClick }: AgentCardProps) {
  const [activeTab, setActiveTab] = useState<string>('status');

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getGamemodeIcon = () => {
    switch (agent.gamemode) {
      case 'creative':
        return <Sun className="w-4 h-4 text-yellow-500" />;
      case 'adventure':
        return <Compass className="w-4 h-4 text-amber-500" />;
      case 'spectator':
        return <Eye className="w-4 h-4 text-purple-500" />;
      default:
        return <Moon className="w-4 h-4 text-green-500" />;
    }
  };

  return (
    <div
      className={`bg-card border rounded-lg overflow-hidden transition-all cursor-pointer ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="p-4 border-b bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <span className="text-lg font-bold text-white">{agent.username[0]?.toUpperCase()}</span>
              </div>
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${
                  agent.connected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
            </div>
            <div>
              <h3 className="font-semibold">{agent.username}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span className="font-mono text-xs">
                  {agent.position.x}, {agent.position.y}, {agent.position.z}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="capitalize gap-1 text-xs">
                    {getGamemodeIcon()}
                    {agent.gamemode}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>游戏模式: {agent.gamemode}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Badge variant="secondary" className="text-xs">{agent.world}</Badge>
          </div>
        </div>
      </div>

      {/* Status Bars */}
      <div className="p-4 space-y-3">
        {/* Health - Minecraft heart style */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4 text-red-500" />
              <span className="text-xs">生命值</span>
            </div>
            <span className="font-mono text-xs">
              {agent.health} / {agent.maxHealth}
            </span>
          </div>
          <div className="mc-health-bar">
            {Array.from({ length: 10 }).map((_, i) => {
              const heartValue = (i + 1) * (agent.maxHealth / 10);
              if (agent.health >= heartValue) {
                return <span key={i} className="mc-heart mc-heart-full">❤</span>;
              } else if (agent.health >= heartValue - agent.maxHealth / 10) {
                return <span key={i} className="mc-heart mc-heart-half">❤</span>;
              }
              return <span key={i} className="mc-heart mc-heart-empty">❤</span>;
            })}
          </div>
        </div>

        {/* Food - Minecraft drumstick style */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Utensils className="w-4 h-4 text-orange-500" />
              <span className="text-xs">饥饿值</span>
            </div>
            <span className="font-mono text-xs">
              {agent.food} / 20
            </span>
          </div>
          <div className="mc-hunger-bar">
            {Array.from({ length: 10 }).map((_, i) => {
              const drumstickValue = (i + 1) * 2;
              if (agent.food >= drumstickValue) {
                return <span key={i} className="mc-drumstick mc-drumstick-full">🍖</span>;
              }
              return <span key={i} className="mc-drumstick mc-drumstick-empty">🍖</span>;
            })}
          </div>
        </div>

        {/* Status Flags */}
        <div className="flex flex-wrap gap-2">
          {agent.isSprinting && (
            <Badge variant="outline" className="text-orange-500 border-orange-500">
              疾跑中
            </Badge>
          )}
          {agent.isSneaking && (
            <Badge variant="outline" className="text-blue-500 border-blue-500">
              潜行
            </Badge>
          )}
          {agent.isSleeping && (
            <Badge variant="outline" className="text-indigo-500 border-indigo-500">
              睡觉
            </Badge>
          )}
          {agent.isOnGround ? (
            <Badge variant="outline" className="text-green-500 border-green-500">
              地面
            </Badge>
          ) : (
            <Badge variant="outline" className="text-amber-500 border-amber-500">
              空中
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs - 阻止冒泡，点击 tab 不跳转详情 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} onClick={(e) => e.stopPropagation()}>
        <TabsList className="w-full rounded-none border-t">
          <TabsTrigger value="status" className="flex-1" onClick={(e) => e.stopPropagation()}>
            背包
          </TabsTrigger>
          <TabsTrigger value="map" className="flex-1" onClick={(e) => e.stopPropagation()}>
            地图
          </TabsTrigger>
          <TabsTrigger value="events" className="flex-1" onClick={(e) => e.stopPropagation()}>
            日志
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="p-4">
          <InventoryGrid
            inventory={agent.inventory || []}
            
            equipment={agent.equipment}
          />
        </TabsContent>

        <TabsContent value="map" className="p-4">
          <MiniMap
            playerX={agent.position.x}
            playerY={agent.position.y}
            playerZ={agent.position.z}
            yaw={agent.yaw || 0}
            blocks={(worldSnapshot?.blocks || []).map((b: { position: { x: number; y: number; z: number }; type: string }) => ({ position: { x: b.position.x, y: b.position.y, z: b.position.z }, type: b.type }))}
            entities={(worldSnapshot?.entities || []).map((e: { id?: string; name?: string; type: string; position: { x: number; y: number; z: number } }) => ({ id: e.id || e.name || String(Math.random()), type: e.type, position: e.position }))}
          />
        </TabsContent>

        <TabsContent value="events" className="p-4 max-h-64 overflow-y-auto">
          <div className="space-y-2">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">暂无事件</p>
            ) : (
              events.slice(0, 20).map((event) => {
                const config = EVENT_TYPE_CONFIG[event.type] || {
                  color: 'bg-gray-500',
                  label: event.type,
                };
                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-2 text-sm p-2 rounded bg-muted/50"
                  >
                    <div className={`w-2 h-2 rounded-full mt-1 ${config.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {config.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(event.timestamp)}
                        </span>
                      </div>
                      <p className="mt-1 truncate">{event.description}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
