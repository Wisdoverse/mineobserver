'use client';

import { useState, useEffect } from 'react';
import { Bot, Users, Wifi, WifiOff, ChevronLeft, Play, ChevronDown, Pause, MapPin, Heart, Utensils, Compass, Copy, Check, Globe, Link2 } from 'lucide-react';
import { useAgentObserver } from '@/hooks/use-agent-observer';
import { useDemoAgent, AddDemoAgentDialog } from '@/hooks/use-demo-agent';
import { AgentCard } from '@/components/agent/agent-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MiniMap } from '@/components/agent/mini-map';
import type { AgentStatus, WorldSnapshot } from '@/lib/types/agent';
import { InventoryGrid } from '@/components/agent/inventory-grid';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function ObserverPage() {
  const [viewMode, setViewMode] = useState<'landing' | 'list' | 'detail'>('landing');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { agents, events, worldSnapshots, isConnected } = useAgentObserver();
  const { activeAgents, startDemoAgent, pauseDemoAgent, resumeDemoAgent, stopDemoAgent } = useDemoAgent();

  // 合并实时 Agent 状态和本地演示 Agent 配置（包含已暂停的）
  const allAgents = new Map(agents);
  activeAgents.forEach((config, agentId) => {
    if (!allAgents.has(agentId)) {
      // 如果是暂停的演示 Agent，使用配置创建离线状态
      const pausedAgent: AgentStatus = {
        id: agentId,
        username: config.username,
        world: config.serverHost,
        connected: false,
        position: { x: 0, y: 0, z: 0 },
        health: 0,
        maxHealth: 20,
        food: 0,
        saturation: 0,
        gamemode: 'survival',
        inventory: [],
        equipment: {
          head: { slot: -1, name: '', displayName: '', count: 0 },
          chest: { slot: -2, name: '', displayName: '', count: 0 },
          legs: { slot: -3, name: '', displayName: '', count: 0 },
          feet: { slot: -4, name: '', displayName: '', count: 0 },
          mainhand: { slot: -1, name: '', displayName: '', count: 0 },
        },
        dimension: 'overworld',
        yaw: 0,
        pitch: 0,
        isOnGround: false,
        isSleeping: false,
        isSprinting: false,
        isSneaking: false,
        lastUpdated: config.pausedAt || Date.now(),
      };
      allAgents.set(agentId, pausedAgent);
    }
  });
  const agentCount = allAgents.size;

  const handleAgentClick = (agentId: string) => {
    setSelectedAgentId(agentId);
    setViewMode('detail');
  };

  const handleBack = () => {
    setSelectedAgentId(null);
    setViewMode('list');
  };

  const handleEnterWorld = () => {
    setViewMode('list');
  };

  const copyLink = () => {
    const link = 'https://world.coze.site/skill.md';
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedAgent = selectedAgentId ? allAgents.get(selectedAgentId) : null;
  const selectedSnapshot = selectedAgentId ? worldSnapshots.get(selectedAgentId) : undefined;
  const selectedEvents = selectedAgentId ? events.get(selectedAgentId) || [] : [];
  
  // Get demo agent config for server info
  const selectedDemoConfig = selectedAgentId ? activeAgents.get(selectedAgentId) : undefined;

  return (
    <div className="min-h-screen bg-stone-50 mc-bg-pattern">
      {/* Landing Page */}
      {viewMode === 'landing' && (
        <div className="min-h-screen flex">
          {/* Left Side - Info */}
          <div className="flex-1 flex flex-col justify-center px-12 lg:px-24 py-12 bg-stone-50 mc-bg-pattern relative">
            {/* Decorative Minecraft blocks in corners */}
            <div className="absolute top-6 left-6 w-6 h-6 minecraft-block grass-block opacity-50" />
            <div className="absolute top-6 right-6 w-5 h-5 minecraft-block diamond-block opacity-50" />
            <div className="absolute bottom-6 left-6 w-5 h-5 minecraft-block stone-block opacity-50" />
            <div className="absolute bottom-6 right-6 w-6 h-6 minecraft-block dirt-block opacity-50" />
            <div className="max-w-xl">
              {/* Tag */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-100 border border-stone-200 mb-8">
                <div className="w-4 h-4 minecraft-block grass-block" />
                <span className="text-sm text-stone-500 font-medium pixel-font">MineWorld Platform</span>
              </div>

              {/* Title */}
              <h1 className="text-5xl lg:text-6xl font-bold text-stone-900 mb-6 leading-tight pixel-font">
                <span className="text-emerald-600">Mine</span><span className="text-amber-600">World</span>
                <span className="block text-lg font-normal text-emerald-700 mt-2">⛏ Agent 观测平台 ⛏</span>
              </h1>

              {/* Description */}
              <p className="text-lg text-stone-600 mb-8 leading-relaxed">
                Agent 在这里生活、工作、探索方块世界。<br />
                <span className="text-stone-400">Where agents live, work, and explore the block world.</span>
              </p>

              {/* Stats */}
              <div className="flex items-center gap-2 mb-10">
                <Users className="w-5 h-5 text-emerald-600" />
                <span className="text-2xl font-bold text-stone-800">{agentCount}</span>
                <span className="text-stone-500">Agents 已加入</span>
              </div>

              {/* Join Card - Minecraft inventory style */}
              <div className="mc-slot rounded-xl p-5 mb-6">
                <div className="mc-slot-inner rounded-lg p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Link2 className="w-4 h-4 text-stone-400" />
                        <span className="text-sm text-stone-500">加入 MineWorld</span>
                      </div>
                      <code className="text-sm text-stone-800 font-mono">
                        https://world.coze.site/skill.md
                      </code>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyLink}
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-stone-400 mt-3">
                    复制链接发送给你的 Agent，一次注册即可让 Agent 自动加入观测平台
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4">
                <AddDemoAgentDialog />
                <Button
                  variant="outline"
                  onClick={handleEnterWorld}
                  className="mc-btn border-0 hover:bg-emerald-700 bg-emerald-600 text-white"
                >
                  {agentCount > 0 ? '⚔ 进入世界' : '⛏ 开始探索'}
                </Button>
              </div>

              {/* WebSocket Status */}
              <div className="flex items-center gap-2 mt-8 text-sm text-stone-400 pixel-font">
                <span className={`w-2 h-2 ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} style={{ imageRendering: 'pixelated' }} />
                {isConnected ? 'Server: Online ●' : 'Server: Offline ○'}
              </div>
            </div>
          </div>

          {/* Right Side - Minecraft World Visual */}
          <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden minecraft-bg">
            {/* Pixelated ground layer */}
            <div className="absolute bottom-0 left-0 right-0 h-32 minecraft-ground" />

            {/* Floating Minecraft blocks */}
            <div className="absolute top-[10%] left-[15%] w-10 h-10 minecraft-block grass-block float-anim" style={{ animationDelay: '0s' }} />
            <div className="absolute top-[25%] right-[20%] w-8 h-8 minecraft-block dirt-block float-anim" style={{ animationDelay: '1s' }} />
            <div className="absolute top-[55%] left-[10%] w-9 h-9 minecraft-block stone-block float-anim" style={{ animationDelay: '0.5s' }} />
            <div className="absolute top-[40%] right-[12%] w-10 h-10 minecraft-block diamond-block float-anim" style={{ animationDelay: '1.5s' }} />
            <div className="absolute bottom-[30%] left-[25%] w-7 h-7 minecraft-block wood-block float-anim" style={{ animationDelay: '2s' }} />
            <div className="absolute top-[15%] right-[40%] w-6 h-6 minecraft-block leaf-block float-anim" style={{ animationDelay: '0.8s' }} />

            {/* Center Minecraft Scene */}
            <div className="relative z-10 flex flex-col items-center">
              {/* Minecraft Tree */}
              <div className="relative mb-8">
                {/* Tree trunk */}
                <div className="flex flex-col items-center">
                  <div className="grid grid-cols-3 gap-0">
                    <div className="w-8 h-8 minecraft-block leaf-block" />
                    <div className="w-8 h-8 minecraft-block leaf-block" />
                    <div className="w-8 h-8 minecraft-block leaf-block" />
                  </div>
                  <div className="grid grid-cols-4 gap-0">
                    <div className="w-8 h-8 minecraft-block leaf-block" />
                    <div className="w-8 h-8 minecraft-block leaf-block" />
                    <div className="w-8 h-8 minecraft-block leaf-block" />
                    <div className="w-8 h-8 minecraft-block leaf-block" />
                  </div>
                  <div className="grid grid-cols-3 gap-0">
                    <div className="w-8 h-8 minecraft-block leaf-block" />
                    <div className="w-8 h-8 minecraft-block leaf-block" />
                    <div className="w-8 h-8 minecraft-block leaf-block" />
                  </div>
                  <div className="w-8 h-8 minecraft-block wood-block" />
                  <div className="w-8 h-8 minecraft-block wood-block" />
                  <div className="w-8 h-8 minecraft-block wood-block" />
                </div>
              </div>

              {/* Pixelated Agent characters */}
              <div className="flex items-end gap-8">
                {/* Steve-like character */}
                <div className="flex flex-col items-center pixel-character float-anim" style={{ animationDelay: '0s' }}>
                  <div className="w-10 h-10 bg-amber-300 border-2 border-amber-500 rounded-sm pixel-border" />
                  <div className="w-12 h-14 bg-sky-500 border-2 border-sky-700 rounded-sm pixel-border -mt-0.5" />
                  <div className="flex gap-0.5 -mt-0.5">
                    <div className="w-6 h-4 bg-sky-600 border-2 border-sky-800 rounded-sm pixel-border" />
                    <div className="w-6 h-4 bg-sky-600 border-2 border-sky-800 rounded-sm pixel-border" />
                  </div>
                  <p className="text-xs text-emerald-800 mt-2 font-bold pixel-font">Steve</p>
                </div>

                {/* Creeper-like character */}
                <div className="flex flex-col items-center pixel-character float-anim" style={{ animationDelay: '1s' }}>
                  <div className="w-10 h-10 bg-emerald-500 border-2 border-emerald-700 rounded-sm pixel-border relative">
                    <div className="absolute top-1.5 left-1.5 w-2 h-2 bg-stone-900" />
                    <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-stone-900" />
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-3 bg-stone-900 rounded-sm" />
                  </div>
                  <div className="w-12 h-14 bg-emerald-600 border-2 border-emerald-800 rounded-sm pixel-border -mt-0.5" />
                  <div className="flex gap-0.5 -mt-0.5">
                    <div className="w-6 h-4 bg-emerald-700 border-2 border-emerald-900 rounded-sm pixel-border" />
                    <div className="w-6 h-4 bg-emerald-700 border-2 border-emerald-900 rounded-sm pixel-border" />
                  </div>
                  <p className="text-xs text-emerald-800 mt-2 font-bold pixel-font">Creeper</p>
                </div>

                {/* Alex-like character */}
                <div className="flex flex-col items-center pixel-character float-anim" style={{ animationDelay: '0.5s' }}>
                  <div className="w-10 h-10 bg-amber-200 border-2 border-amber-400 rounded-sm pixel-border" />
                  <div className="w-12 h-14 bg-emerald-500 border-2 border-emerald-700 rounded-sm pixel-border -mt-0.5" />
                  <div className="flex gap-0.5 -mt-0.5">
                    <div className="w-6 h-4 bg-emerald-600 border-2 border-emerald-800 rounded-sm pixel-border" />
                    <div className="w-6 h-4 bg-emerald-600 border-2 border-emerald-800 rounded-sm pixel-border" />
                  </div>
                  <p className="text-xs text-emerald-800 mt-2 font-bold pixel-font">Alex</p>
                </div>
              </div>

              {/* Floating text */}
              <div className="mt-8 text-center">
                <p className="text-2xl font-bold text-emerald-700 pixel-font animate-pulse">
                  ⛏ Hello, World! ⛏
                </p>
                <p className="text-sm text-emerald-600 mt-1 pixel-font">Agents are exploring...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="min-h-screen">
          {/* Header */}
          <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 mc-grass-border-top shadow-sm">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={() => setViewMode('landing')} className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
                    <div className="w-6 h-6 minecraft-block grass-block" />
                  </button>
                  <div>
                    <h1 className="text-xl font-bold text-stone-900 pixel-font">
                      <span className="text-emerald-600">Mine</span><span className="text-amber-600">World</span>
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-stone-500 pixel-font">
                      <span className={`w-2 h-2 ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} style={{ imageRendering: 'pixelated' }} />
                      {isConnected ? 'Server: Online' : 'Server: Offline'} · {agentCount} Agent(s)
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <AddDemoAgentDialog />
                  {/* 连接管理下拉菜单 */}
                  {agentCount > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Wifi className="w-4 h-4" />
                          管理连接
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>连接管理</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {/* 显示所有演示 Agent，可断开或重连 */}
                        {Array.from(activeAgents.entries()).map(([agentId, config]) => (
                          <DropdownMenuItem key={agentId} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${config.pausedAt ? 'bg-stone-400' : 'bg-emerald-500 animate-pulse'}`} />
                              <span>{config.username}</span>
                            </div>
                            {config.pausedAt ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-emerald-600"
                                onClick={() => resumeDemoAgent(agentId)}
                              >
                                重连
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-orange-500"
                                onClick={() => pauseDemoAgent(agentId)}
                              >
                                断开
                              </Button>
                            )}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-500 cursor-pointer"
                          onClick={() => {
                            Array.from(activeAgents.keys()).forEach(agentId => pauseDemoAgent(agentId));
                          }}
                        >
                          <Pause className="w-4 h-4 mr-2" />
                          全部断开
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-6 py-8">
            {agentCount === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 rounded-full bg-stone-100 mx-auto mb-6 flex items-center justify-center">
                  <Bot className="w-10 h-10 text-stone-400" />
                </div>
                <h2 className="text-2xl font-bold text-stone-800 mb-2">暂无 Agent</h2>
                <p className="text-stone-500 mb-6">添加演示 Agent 或等待真实 Agent 加入</p>
                <AddDemoAgentDialog />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from(allAgents.entries()).map(([agentId, agent]) => (
                  <AgentCard
                    key={agentId}
                    agent={agent}
                    events={events.get(agentId) || []}
                    onClick={() => handleAgentClick(agentId)}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      )}

      {/* Detail View */}
      {viewMode === 'detail' && selectedAgent && (
        <div className="min-h-screen">
          {/* Header */}
          <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 mc-grass-border-top shadow-sm">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={handleBack} className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
                    <ChevronLeft className="w-6 h-6 text-stone-600" />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600 border-2 border-emerald-800 flex items-center justify-center pixel-border" style={{ imageRendering: 'pixelated' }}>
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h1 className="text-lg font-bold text-stone-900">{selectedAgent.username}</h1>
                      <p className="text-sm text-stone-500">
                        {selectedDemoConfig ? `${selectedDemoConfig.serverHost}:${selectedDemoConfig.serverPort}` : 'localhost:25565'}
                      </p>
                    </div>
                  </div>
                </div>
                {/* 连接状态指示 - 仅展示 */}
                <div className="flex items-center gap-2 text-sm">
                  <span className={`w-2 h-2 rounded-full ${selectedAgentId && activeAgents.get(selectedAgentId)?.pausedAt ? 'bg-stone-400' : 'bg-emerald-500 animate-pulse'}`} />
                  <span className="text-stone-500">
                    {selectedAgentId && activeAgents.get(selectedAgentId)?.pausedAt ? '已断开' : '已连接'}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-6 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Status & MiniMap */}
              <div className="lg:col-span-2 space-y-6">
                {/* Status Cards */}
                <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
                  <h2 className="text-lg font-bold text-stone-900 mb-4">状态</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-stone-500 mb-1">位置</p>
                      <p className="font-mono text-stone-800">
                        {selectedAgent.position?.x}, {selectedAgent.position?.y}, {selectedAgent.position?.z}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-stone-500 mb-1">游戏模式</p>
                      <Badge variant="outline" className="capitalize">
                        {selectedAgent.gamemode || 'survival'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-stone-500 mb-1">状态</p>
                      <div className="flex items-center gap-1">
                        {selectedAgent.isOnGround && (
                          <Badge className="bg-emerald-100 text-emerald-700">地面</Badge>
                        )}
                        {selectedAgent.isSprinting && (
                          <Badge className="bg-blue-100 text-blue-700">疾跑</Badge>
                        )}
                        {selectedAgent.isSneaking && (
                          <Badge className="bg-amber-100 text-amber-700">潜行</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-stone-500 mb-1">视角</p>
                      <p className="font-mono text-stone-800">
                        Y: {selectedAgent.yaw?.toFixed(1)}° P: {selectedAgent.pitch?.toFixed(1)}°
                      </p>
                    </div>
                  </div>
                  
                  {/* Health & Food */}
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-stone-600">生命值</span>
                        </div>
                        <span className="text-sm font-medium text-stone-800">
                          {selectedAgent.health} / {selectedAgent.maxHealth || 20}
                        </span>
                      </div>
                      <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full transition-all"
                          style={{ width: `${((selectedAgent.health || 0) / (selectedAgent.maxHealth || 20)) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Utensils className="w-4 h-4 text-amber-500" />
                          <span className="text-sm text-stone-600">饥饿值</span>
                        </div>
                        <span className="text-sm font-medium text-stone-800">
                          {selectedAgent.food} / 20
                        </span>
                      </div>
                      <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all"
                          style={{ width: `${((selectedAgent.food || 20) / 20) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* MiniMap */}
                {selectedSnapshot && (
                  <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
                    <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
                      <Compass className="w-5 h-5 text-emerald-600" />
                      周围环境
                    </h2>
                    <MiniMap
                      playerX={selectedAgent.position.x}
                      playerY={selectedAgent.position.y}
                      playerZ={selectedAgent.position.z}
                      yaw={selectedAgent.yaw || 0}
                      blocks={selectedSnapshot?.blocks || []}
                      entities={(selectedSnapshot?.entities || []).map((e, idx) => ({ id: e.id || `entity-${idx}`, type: e.type, position: e.position }))}
                    />
                  </div>
                )}
              </div>

              {/* Right Column - Inventory & Events */}
              <div className="space-y-6">
                {/* Inventory */}
                <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
                  <h2 className="text-lg font-bold text-stone-900 mb-4">物品栏</h2>
                  <InventoryGrid
                    inventory={selectedAgent.inventory || []}
                    equipment={{
                      head: selectedAgent.equipment?.head,
                      chest: selectedAgent.equipment?.chest,
                      legs: selectedAgent.equipment?.legs,
                      feet: selectedAgent.equipment?.feet,
                      mainhand: selectedAgent.equipment?.mainhand,
                      offhand: selectedAgent.equipment?.offhand,
                    }}
                  />
                </div>

                {/* Events */}
                <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
                  <h2 className="text-lg font-bold text-stone-900 mb-4">事件日志</h2>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {selectedEvents.length === 0 ? (
                      <p className="text-sm text-stone-400 text-center py-4">暂无事件</p>
                    ) : (
                      selectedEvents.slice(-20).reverse().map((event, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 rounded-lg bg-stone-50 border border-stone-100"
                        >
                          <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-stone-700">{event.type}</p>
                            <p className="text-xs text-stone-400 truncate">{String(event.data || '')}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}

    </div>
  );
}
