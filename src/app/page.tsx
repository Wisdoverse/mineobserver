'use client';

import { useState, useEffect } from 'react';
import { Bot, Users, Wifi, WifiOff, RefreshCw, Server, Pause, Trash2, ChevronLeft, Play, Plus, X, Cog, Sun, Moon, Eye, Compass, MapPin, Heart, Utensils, Activity } from 'lucide-react';
import { useAgentObserver } from '@/hooks/use-agent-observer';
import { useDemoAgent, AddDemoAgentDialog } from '@/hooks/use-demo-agent';
import { AgentCard } from '@/components/agent/agent-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { MiniMap } from '@/components/agent/mini-map';
import { InventoryGrid } from '@/components/agent/inventory-grid';
import type { AgentStatus, WorldSnapshot, AgentEvent } from '@/lib/types/agent';

export default function ObserverPage() {
  const [wsHost, setWsHost] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isDemoDialogOpen, setIsDemoDialogOpen] = useState(false);

  useEffect(() => {
    setWsHost(window.location.host);
  }, []);

  const { agents, events, worldSnapshots, isConnected } = useAgentObserver();
  const { activeAgents, startDemoAgent, stopDemoAgent, stopAllDemoAgents } = useDemoAgent();

  // 演示 Agent 状态由 useAgentObserver 通过 WebSocket 接收
  const allAgents = agents;

  const handleAgentClick = (agentId: string) => {
    setSelectedAgentId(agentId);
    setViewMode('detail');
  };

  const handleBack = () => {
    setSelectedAgentId(null);
    setViewMode('list');
  };

  const selectedAgent = selectedAgentId ? allAgents.get(selectedAgentId) : null;
  const selectedSnapshot = selectedAgentId ? worldSnapshots.get(selectedAgentId) : undefined;
  const selectedEvents = selectedAgentId ? events.get(selectedAgentId) || [] : [];

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <svg viewBox="0 0 16 16" className="w-7 h-7 text-white">
                  <rect x="2" y="2" width="3" height="3" fill="currentColor"/>
                  <rect x="5" y="2" width="3" height="3" fill="currentColor"/>
                  <rect x="8" y="2" width="3" height="3" fill="currentColor"/>
                  <rect x="11" y="2" width="3" height="3" fill="currentColor"/>
                  <rect x="2" y="5" width="3" height="3" fill="currentColor"/>
                  <rect x="11" y="5" width="3" height="3" fill="currentColor"/>
                  <rect x="2" y="8" width="3" height="3" fill="currentColor"/>
                  <rect x="5" y="8" width="6" height="3" fill="currentColor"/>
                  <rect x="11" y="8" width="3" height="3" fill="currentColor"/>
                  <rect x="2" y="11" width="3" height="3" fill="currentColor"/>
                  <rect x="11" y="11" width="3" height="3" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Minecraft Agent 观测台
                </h1>
                <div className="flex items-center gap-3 mt-0.5">
                  <div className="flex items-center gap-1.5">
                    {isConnected ? (
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-xs text-green-600 font-medium">WebSocket 已连接</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="inline-flex h-2 w-2 rounded-full bg-red-400"></span>
                        </span>
                        <span className="text-xs text-red-500 font-medium">连接断开</span>
                      </div>
                    )}
                  </div>
                  <span className="text-gray-300">|</span>
                  <span className="text-xs text-gray-500">
                    {allAgents.size} 个 Agent 在线
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <AddDemoAgentDialog />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* "I am human, I am agent" Banner */}
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-green-500 to-teal-500 p-8 shadow-xl shadow-emerald-500/20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L2c+PC9zdmc+')] opacity-30"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-6">
              <div className="hidden sm:flex flex-col gap-2">
                <div className="flex -space-x-3">
                  <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center shadow-lg">
                    <svg viewBox="0 0 16 16" className="w-8 h-8 text-white">
                      <rect x="2" y="2" width="3" height="3" fill="currentColor"/>
                      <rect x="5" y="2" width="3" height="3" fill="currentColor"/>
                      <rect x="8" y="2" width="3" height="3" fill="currentColor"/>
                      <rect x="11" y="2" width="3" height="3" fill="currentColor"/>
                      <rect x="2" y="5" width="3" height="3" fill="currentColor"/>
                      <rect x="11" y="5" width="3" height="3" fill="currentColor"/>
                      <rect x="2" y="8" width="3" height="3" fill="currentColor"/>
                      <rect x="5" y="8" width="6" height="3" fill="currentColor"/>
                      <rect x="11" y="8" width="3" height="3" fill="currentColor"/>
                      <rect x="2" y="11" width="3" height="3" fill="currentColor"/>
                      <rect x="11" y="11" width="3" height="3" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-white/30 flex items-center justify-center shadow-lg animate-bounce" style={{ animationDuration: '2s' }}>
                    <span className="text-2xl">🤖</span>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
                  I am human, <span className="text-amber-300">I am agent</span>
                </h2>
                <p className="text-white/80 text-sm sm:text-base max-w-2xl">
                  实时观测 Minecraft Agent 的行为。安装 <code className="bg-white/20 px-2 py-0.5 rounded font-mono">minecraft-client</code> 技能让 Agent 自动连接并上报状态。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Agent Grid or Detail */}
        {viewMode === 'detail' && selectedAgent ? (
          <div className="space-y-6">
            {/* Agent Header */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={handleBack}
                      className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <div className="relative">
                      <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center shadow-lg">
                        <svg viewBox="0 0 16 16" className="w-9 h-9 text-white">
                          <rect x="2" y="2" width="3" height="3" fill="currentColor"/>
                          <rect x="5" y="2" width="3" height="3" fill="currentColor"/>
                          <rect x="8" y="2" width="3" height="3" fill="currentColor"/>
                          <rect x="11" y="2" width="3" height="3" fill="currentColor"/>
                          <rect x="2" y="5" width="3" height="3" fill="currentColor"/>
                          <rect x="11" y="5" width="3" height="3" fill="currentColor"/>
                          <rect x="2" y="8" width="3" height="3" fill="currentColor"/>
                          <rect x="5" y="8" width="6" height="3" fill="currentColor"/>
                          <rect x="11" y="8" width="3" height="3" fill="currentColor"/>
                          <rect x="2" y="11" width="3" height="3" fill="currentColor"/>
                          <rect x="11" y="11" width="3" height="3" fill="currentColor"/>
                        </svg>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-400 border-2 border-white animate-pulse"></div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedAgent.username}</h2>
                      <div className="flex items-center gap-2 text-white/80 text-sm">
                        <MapPin className="w-4 h-4" />
                        <span className="font-mono">
                          {selectedAgent.position.x}, {selectedAgent.position.y}, {selectedAgent.position.z}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="bg-white/20 text-white border-0">
                      {selectedAgent.gamemode}
                    </Badge>
                    <Badge variant="secondary" className="bg-white/20 text-white border-0">
                      {selectedAgent.world}
                    </Badge>
                    {activeAgents.has(selectedAgentId!) && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          stopDemoAgent(selectedAgentId!);
                          if (allAgents.size <= 1) handleBack();
                        }}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        <Pause className="w-4 h-4 mr-1" />
                        停止
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Status Bars */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart className="w-5 h-5 text-red-500" />
                        <span className="font-medium text-gray-700">生命值</span>
                      </div>
                      <span className="font-mono font-semibold">{selectedAgent.health}/{selectedAgent.maxHealth}</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-300"
                        style={{ width: `${(selectedAgent.health / selectedAgent.maxHealth) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Utensils className="w-5 h-5 text-orange-500" />
                        <span className="font-medium text-gray-700">饥饿值</span>
                      </div>
                      <span className="font-mono font-semibold">{selectedAgent.food}/20</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300"
                        style={{ width: `${(selectedAgent.food / 20) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Status Flags */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {selectedAgent.isSprinting && (
                    <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm font-medium">
                      疾跑中
                    </span>
                  )}
                  {selectedAgent.isSneaking && (
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                      潜行
                    </span>
                  )}
                  {selectedAgent.isSleeping && (
                    <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium">
                      睡觉中
                    </span>
                  )}
                  {selectedAgent.isOnGround ? (
                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                      地面
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
                      空中
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Detail Tabs */}
            <Tabs defaultValue="map" className="space-y-4">
              <TabsList className="bg-white rounded-xl p-1 shadow-sm border">
                <TabsTrigger value="map" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                  <Compass className="w-4 h-4 mr-2" />
                  周围
                </TabsTrigger>
                <TabsTrigger value="inventory" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                  <Activity className="w-4 h-4 mr-2" />
                  背包
                </TabsTrigger>
                <TabsTrigger value="events" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                  <Cog className="w-4 h-4 mr-2" />
                  日志
                </TabsTrigger>
              </TabsList>

              <TabsContent value="map">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Compass className="w-5 h-5 text-emerald-500" />
                    周围环境
                  </h3>
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-shrink-0">
                      <MiniMap
                        position={selectedAgent.position}
                        yaw={selectedAgent.yaw}
                        blocks={selectedSnapshot?.blocks || []}
                        entities={selectedSnapshot?.entities || []}
                      />
                    </div>
                    <div className="flex-1 space-y-4">
                      {selectedSnapshot?.entities && selectedSnapshot.entities.length > 0 ? (
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h4 className="font-medium text-gray-700 mb-3">附近实体</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {selectedSnapshot.entities.slice(0, 12).map((entity, i) => (
                              <div key={i} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm">
                                <span className="text-lg">
                                  {entity.type === 'pig' ? '🐷' : 
                                   entity.type === 'cow' ? '🐄' : 
                                   entity.type === 'sheep' ? '🐑' : 
                                   entity.type === 'chicken' ? '🐔' : 
                                   entity.type === 'player' ? '👤' : '❓'}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{entity.type}</p>
                                  <p className="text-xs text-gray-500">{entity.distance?.toFixed(1)}m</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
                          暂无实体数据
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="inventory">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-500" />
                    物品栏
                  </h3>
                  <InventoryGrid inventory={selectedAgent.inventory} equipment={selectedAgent.equipment} />
                </div>
              </TabsContent>

              <TabsContent value="events">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Cog className="w-5 h-5 text-emerald-500" />
                      事件日志
                    </h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {selectedEvents.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        暂无事件记录
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {selectedEvents.map((event) => (
                          <div key={event.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <Badge variant="outline" className="text-xs">
                                    {event.type}
                                  </Badge>
                                  <span className="text-xs text-gray-400">
                                    {formatTime(event.timestamp)}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm text-gray-700">{event.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <>
            {/* Active Agents Grid */}
            {allAgents.size > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Bot className="w-6 h-6 text-emerald-500" />
                    在线 Agent
                    <Badge variant="secondary" className="ml-2">{allAgents.size}</Badge>
                  </h2>
                  {activeAgents.size > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={stopAllDemoAgents}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Pause className="w-4 h-4 mr-1" />
                      停止所有演示
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from(allAgents.entries()).map(([agentId, agent]) => (
                    <div
                      key={agentId}
                      className="group bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl hover:border-emerald-300 transition-all duration-300 cursor-pointer"
                      onClick={() => handleAgentClick(agentId)}
                    >
                      {/* Agent Header */}
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                              <svg viewBox="0 0 16 16" className="w-7 h-7 text-white">
                                <rect x="2" y="2" width="3" height="3" fill="currentColor"/>
                                <rect x="5" y="2" width="3" height="3" fill="currentColor"/>
                                <rect x="8" y="2" width="3" height="3" fill="currentColor"/>
                                <rect x="11" y="2" width="3" height="3" fill="currentColor"/>
                                <rect x="2" y="5" width="3" height="3" fill="currentColor"/>
                                <rect x="11" y="5" width="3" height="3" fill="currentColor"/>
                                <rect x="2" y="8" width="3" height="3" fill="currentColor"/>
                                <rect x="5" y="8" width="6" height="3" fill="currentColor"/>
                                <rect x="11" y="8" width="3" height="3" fill="currentColor"/>
                                <rect x="2" y="11" width="3" height="3" fill="currentColor"/>
                                <rect x="11" y="11" width="3" height="3" fill="currentColor"/>
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-bold text-white text-lg">{agent.username}</h3>
                              <div className="flex items-center gap-2 text-white/80 text-xs">
                                <MapPin className="w-3 h-3" />
                                <span className="font-mono">
                                  {agent.position.x}, {agent.position.y}, {agent.position.z}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                              {agent.gamemode}
                            </Badge>
                            {activeAgents.has(agentId) && (
                              <Badge variant="secondary" className="bg-amber-400/80 text-amber-900 border-0 text-xs">
                                演示
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Agent Stats */}
                      <div className="px-5 py-4 space-y-3">
                        {/* Health & Food */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500 flex items-center gap-1">
                                <Heart className="w-3 h-3 text-red-500" />
                                生命
                              </span>
                              <span className="font-mono font-medium">{agent.health}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full"
                                style={{ width: `${(agent.health / agent.maxHealth) * 100}%` }}
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500 flex items-center gap-1">
                                <Utensils className="w-3 h-3 text-orange-500" />
                                饥饿
                              </span>
                              <span className="font-mono font-medium">{agent.food}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                                style={{ width: `${(agent.food / 20) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Status Badges */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {agent.isSprinting && (
                            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-xs font-medium">
                              疾跑
                            </span>
                          )}
                          {agent.isSneaking && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
                              潜行
                            </span>
                          )}
                          {agent.isOnGround ? (
                            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-600 text-xs font-medium">
                              地面
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 text-xs font-medium">
                              空中
                            </span>
                          )}
                        </div>
                        
                        {/* Recent Event */}
                        {events.get(agentId)?.length ? (
                          <div className="pt-2 border-t border-gray-100">
                            <p className="text-xs text-gray-500 truncate">
                              最近: {events.get(agentId)?.[events.get(agentId)!.length - 1]?.description}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-32 h-32 mb-8 rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 border-2 border-dashed border-emerald-300 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-16 h-16 text-emerald-400">
                    <rect x="4" y="4" width="4" height="4" fill="currentColor"/>
                    <rect x="8" y="4" width="4" height="4" fill="currentColor"/>
                    <rect x="12" y="4" width="4" height="4" fill="currentColor"/>
                    <rect x="16" y="4" width="4" height="4" fill="currentColor"/>
                    <rect x="4" y="8" width="4" height="4" fill="currentColor"/>
                    <rect x="16" y="8" width="4" height="4" fill="currentColor"/>
                    <rect x="4" y="12" width="4" height="4" fill="currentColor"/>
                    <rect x="8" y="12" width="8" height="4" fill="currentColor"/>
                    <rect x="16" y="12" width="4" height="4" fill="currentColor"/>
                    <rect x="4" y="16" width="4" height="4" fill="currentColor"/>
                    <rect x="16" y="16" width="4" height="4" fill="currentColor"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">等待 Agent 加入...</h3>
                <p className="text-gray-500 text-center mb-8 max-w-md">
                  暂无在线 Agent。安装 <code className="bg-gray-100 px-2 py-0.5 rounded font-mono">minecraft-client</code> 技能让 Agent 自动连接。
                </p>
                <AddDemoAgentDialog />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
