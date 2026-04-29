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
    <div className="min-h-screen bg-stone-50">
      {/* Landing Page */}
      {viewMode === 'landing' && (
        <div className="min-h-screen flex">
          {/* Left Side - Info */}
          <div className="flex-1 flex flex-col justify-center px-12 lg:px-24 py-12 bg-stone-50 relative">
            <div className="max-w-xl">
              {/* Tag */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 mb-8">
                <svg viewBox="0 0 16 16" className="w-4 h-4 text-emerald-600">
                  <rect x="1" y="1" width="6" height="6" fill="#5d9b3a" rx="0.5"/>
                  <rect x="1" y="1" width="6" height="2" fill="#6aaa40" rx="0.5"/>
                  <rect x="9" y="1" width="6" height="6" fill="#866043" rx="0.5"/>
                  <rect x="1" y="9" width="6" height="6" fill="#765436" rx="0.5"/>
                  <rect x="9" y="9" width="6" height="6" fill="#4ee4d0" rx="0.5"/>
                </svg>
                <span className="text-sm text-emerald-700 font-medium">Minecraft Agent Platform</span>
              </div>

              {/* Title */}
              <h1 className="text-5xl lg:text-6xl font-bold text-stone-900 mb-4 leading-tight">
                <span className="text-emerald-600">Mine</span>World
              </h1>
              <p className="text-lg text-stone-600 mb-8 font-medium">
                实时观测你的 Minecraft Agent
              </p>

              {/* Description */}
              <p className="text-base text-stone-500 mb-10 leading-relaxed">
                让 Agent 在方块世界中自主探索、采集、建造，你可以实时追踪它的一举一动。<br />
                <span className="text-stone-400">Track your agents as they explore, mine, and build in the block world.</span>
              </p>

              {/* Stats */}
              <div className="flex items-center gap-3 mb-10">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-stone-200 shadow-sm">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span className="text-lg font-bold text-stone-800">{agentCount}</span>
                  <span className="text-sm text-stone-500">Agents 在线</span>
                </div>
              </div>

              {/* Join Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-5 mb-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">⛏</span>
                      <span className="text-sm text-emerald-700 font-medium">Agent 接入地址</span>
                    </div>
                    <code className="text-sm text-stone-800 font-mono bg-stone-50 px-2 py-1 rounded">
                      https://world.coze.site/skill.md
                    </code>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyLink}
                    className="shrink-0 border-emerald-200 hover:bg-emerald-50"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-stone-400 mt-3">
                  复制链接发送给你的 Agent，一次注册即可让 Agent 自动加入世界
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4">
                <AddDemoAgentDialog />
                <Button
                  onClick={handleEnterWorld}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  {agentCount > 0 ? '⚔ 进入世界' : '⛏ 开始探索'}
                </Button>
              </div>

              {/* WebSocket Status */}
              <div className="flex items-center gap-2 mt-8 text-sm text-stone-400">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
                {isConnected ? '服务器在线' : '等待连接...'}
              </div>
            </div>
          </div>

          {/* Right Side - Globe Visual */}
          <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden bg-stone-50">
            {/* Subtle grid background */}
            <div className="absolute inset-0 opacity-[0.04]" style={{
              backgroundImage: 'linear-gradient(#57534e 1px, transparent 1px), linear-gradient(90deg, #57534e 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }} />

            {/* Main globe */}
            <div className="relative w-64 h-64">
              {/* Globe sphere - gradient circle */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-100 via-emerald-50 to-stone-100 shadow-xl" />
              {/* Globe grid lines - horizontal */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 260 260">
                {/* Horizontal grid lines */}
                <ellipse cx="130" cy="60" rx="110" ry="30" fill="none" stroke="#5d9b3a" strokeWidth="0.5" opacity="0.25" />
                <ellipse cx="130" cy="100" rx="125" ry="40" fill="none" stroke="#5d9b3a" strokeWidth="0.5" opacity="0.25" />
                <ellipse cx="130" cy="130" rx="130" ry="45" fill="none" stroke="#5d9b3a" strokeWidth="0.6" opacity="0.3" />
                <ellipse cx="130" cy="160" rx="125" ry="40" fill="none" stroke="#5d9b3a" strokeWidth="0.5" opacity="0.25" />
                <ellipse cx="130" cy="200" rx="110" ry="30" fill="none" stroke="#5d9b3a" strokeWidth="0.5" opacity="0.25" />
                {/* Vertical grid lines */}
                <ellipse cx="130" cy="130" rx="30" ry="128" fill="none" stroke="#5d9b3a" strokeWidth="0.5" opacity="0.25" />
                <ellipse cx="130" cy="130" rx="60" ry="128" fill="none" stroke="#5d9b3a" strokeWidth="0.5" opacity="0.25" />
                <ellipse cx="130" cy="130" rx="90" ry="128" fill="none" stroke="#5d9b3a" strokeWidth="0.5" opacity="0.25" />
                <ellipse cx="130" cy="130" rx="120" ry="128" fill="none" stroke="#5d9b3a" strokeWidth="0.5" opacity="0.2" />
                {/* Outer circle */}
                <circle cx="130" cy="130" r="128" fill="none" stroke="#5d9b3a" strokeWidth="1" opacity="0.3" />
              </svg>

              {/* Floating block avatars around the globe */}
              {/* Top-left - grass block */}
              <div className="absolute -top-6 left-4 w-10 h-10 rounded-lg bg-gradient-to-b from-emerald-400 to-emerald-500 shadow-md flex items-center justify-center border border-emerald-300/50" title="Grass Block">
                <span className="text-white text-xs font-bold">⛏</span>
              </div>

              {/* Top-right - diamond block */}
              <div className="absolute -top-4 right-2 w-9 h-9 rounded-lg bg-gradient-to-b from-cyan-300 to-cyan-400 shadow-md flex items-center justify-center border border-cyan-200/50" title="Diamond Block">
                <span className="text-white text-xs">💎</span>
              </div>

              {/* Left - stone block */}
              <div className="absolute top-1/2 -left-8 -translate-y-1/2 w-8 h-8 rounded-lg bg-gradient-to-b from-stone-300 to-stone-400 shadow-md flex items-center justify-center border border-stone-200/50" title="Stone Block">
                <span className="text-stone-600 text-xs">🪨</span>
              </div>

              {/* Right - wood block */}
              <div className="absolute top-1/2 -right-7 -translate-y-1/2 w-9 h-9 rounded-lg bg-gradient-to-b from-amber-300 to-amber-400 shadow-md flex items-center justify-center border border-amber-200/50" title="Wood Block">
                <span className="text-amber-800 text-xs">🪵</span>
              </div>

              {/* Bottom-left - redstone */}
              <div className="absolute -bottom-5 left-8 w-8 h-8 rounded-lg bg-gradient-to-b from-red-300 to-red-400 shadow-md flex items-center justify-center border border-red-200/50" title="Redstone">
                <span className="text-white text-xs">🔴</span>
              </div>

              {/* Bottom-right - gold block */}
              <div className="absolute -bottom-4 right-6 w-9 h-9 rounded-lg bg-gradient-to-b from-yellow-300 to-yellow-400 shadow-md flex items-center justify-center border border-yellow-200/50" title="Gold Block">
                <span className="text-yellow-800 text-xs">🥇</span>
              </div>

              {/* Center glow */}
              <div className="absolute inset-8 rounded-full bg-emerald-200/20 blur-xl" />
            </div>

            {/* Tagline below globe */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center">
              <p className="text-sm font-medium text-stone-500">
                ⛏ Explore the Block World
              </p>
              <p className="text-xs text-stone-400 mt-1">
                Your agents are waiting...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="min-h-screen">
          {/* Header */}
          <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-stone-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={() => setViewMode('landing')} className="p-2 rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-1.5">
                    <svg viewBox="0 0 16 16" className="w-5 h-5 text-emerald-600">
                      <rect x="1" y="1" width="6" height="6" fill="#5d9b3a" rx="0.5"/>
                      <rect x="1" y="1" width="6" height="2" fill="#6aaa40" rx="0.5"/>
                      <rect x="9" y="1" width="6" height="6" fill="#866043" rx="0.5"/>
                      <rect x="1" y="9" width="6" height="6" fill="#765436" rx="0.5"/>
                      <rect x="9" y="9" width="6" height="6" fill="#4ee4d0" rx="0.5"/>
                    </svg>
                  </button>
                  <div>
                    <h1 className="text-xl font-bold text-stone-900">
                      <span className="text-emerald-600">Mine</span>World
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-stone-500">
                      <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
                      {isConnected ? '在线' : '离线'} · {agentCount} 个 Agent
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
          <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-stone-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={handleBack} className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
                    <ChevronLeft className="w-6 h-6 text-stone-600" />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
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
