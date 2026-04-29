'use client';

import { useState, useEffect } from 'react';
import { Bot, Users, Wifi, WifiOff, ChevronLeft, Play, ChevronDown, Pause, MapPin, Heart, Utensils, Compass, Copy, Check } from 'lucide-react';
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
    <div className="min-h-screen">
      {/* Landing Page */}
      {viewMode === 'landing' && (
        <div className="min-h-screen flex">
          {/* Left Side - Info (Dark) */}
          <div className="flex-1 flex flex-col justify-center px-12 lg:px-20 py-12 bg-stone-900 relative">
            <div className="max-w-lg">
              {/* Tag */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-900/40 border border-emerald-700/30 mb-8">
                <svg viewBox="0 0 16 16" className="w-4 h-4 text-emerald-400">
                  <rect x="1" y="1" width="6" height="6" fill="#5d9b3a" rx="0.5"/>
                  <rect x="1" y="1" width="6" height="2" fill="#6aaa40" rx="0.5"/>
                  <rect x="9" y="1" width="6" height="6" fill="#866043" rx="0.5"/>
                  <rect x="1" y="9" width="6" height="6" fill="#765436" rx="0.5"/>
                  <rect x="9" y="9" width="6" height="6" fill="#4ee4d0" rx="0.5"/>
                </svg>
                <span className="text-sm text-emerald-300 font-medium">Minecraft Agent Platform</span>
              </div>

              {/* Title */}
              <h1 className="text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                <span className="text-emerald-400">Mine</span>World
              </h1>
              <p className="text-lg text-stone-300 mb-8 font-medium">
                实时观测你的 Minecraft Agent
              </p>

              {/* Description */}
              <p className="text-base text-stone-400 mb-10 leading-relaxed">
                让 Agent 在方块世界中自主探索、采集、建造，你可以实时追踪它的一举一动。<br />
                <span className="text-stone-500">Track your agents as they explore, mine, and build.</span>
              </p>

              {/* Stats */}
              <div className="flex items-center gap-3 mb-10">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span className="text-xl font-bold text-white">{agentCount}</span>
                  <span className="text-sm text-stone-400">Agents 在线</span>
                </div>
              </div>

              {/* Join Card */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5 mb-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-base">⛏</span>
                      <span className="text-sm text-emerald-300 font-medium">Agent 接入地址</span>
                    </div>
                    <code className="text-sm text-stone-300 font-mono bg-white/5 px-3 py-1.5 rounded-md">
                      https://world.coze.site/skill.md
                    </code>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyLink}
                    className="shrink-0 border-white/20 hover:bg-white/10 text-stone-300"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-stone-500 mt-3">
                  复制链接发送给你的 Agent，一次注册即可让 Agent 自动加入世界
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4">
                <AddDemoAgentDialog />
                <Button
                  onClick={handleEnterWorld}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30"
                >
                  {agentCount > 0 ? '⚔ 进入世界' : '⛏ 开始探索'}
                </Button>
              </div>

              {/* WebSocket Status */}
              <div className="flex items-center gap-2 mt-8 text-sm text-stone-500">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                {isConnected ? '服务器在线' : '等待连接...'}
              </div>
            </div>
          </div>

          {/* Right Side - Minecraft Scene */}
          <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-200">
            {/* Clouds */}
            <div className="absolute top-[12%] left-[15%] w-20 h-8 bg-white/80 rounded-full" />
            <div className="absolute top-[12%] left-[20%] w-14 h-6 bg-white/80 rounded-full -mt-2" />
            <div className="absolute top-[22%] right-[20%] w-24 h-8 bg-white/70 rounded-full" />
            <div className="absolute top-[22%] right-[25%] w-12 h-5 bg-white/70 rounded-full -mt-1" />
            <div className="absolute top-[35%] left-[50%] w-16 h-6 bg-white/50 rounded-full" />

            {/* Sun */}
            <div className="absolute top-[8%] right-[12%] w-16 h-16 bg-yellow-200 rounded-sm shadow-lg shadow-yellow-200/30" style={{ imageRendering: 'pixelated' }} />

            {/* Pixel Tree 1 */}
            <div className="absolute bottom-[28%] left-[10%]">
              <div className="flex flex-col items-center">
                <div className="grid grid-cols-3 gap-0">
                  <div className="w-4 h-4 bg-emerald-700" /><div className="w-4 h-4 bg-emerald-600" /><div className="w-4 h-4 bg-emerald-700" />
                  <div className="w-4 h-4 bg-emerald-600" /><div className="w-4 h-4 bg-emerald-500" /><div className="w-4 h-4 bg-emerald-600" />
                  <div className="w-4 h-4 bg-emerald-700" /><div className="w-4 h-4 bg-emerald-600" /><div className="w-4 h-4 bg-emerald-700" />
                  <div className="w-4 h-4" /><div className="w-4 h-4 bg-emerald-600" /><div className="w-4 h-4" />
                </div>
                <div className="w-4 h-8 bg-amber-800" />
              </div>
            </div>

            {/* Pixel Tree 2 */}
            <div className="absolute bottom-[28%] right-[12%]">
              <div className="flex flex-col items-center">
                <div className="grid grid-cols-3 gap-0">
                  <div className="w-4 h-4 bg-emerald-700" /><div className="w-4 h-4 bg-emerald-500" /><div className="w-4 h-4 bg-emerald-700" />
                  <div className="w-4 h-4 bg-emerald-600" /><div className="w-4 h-4 bg-emerald-600" /><div className="w-4 h-4 bg-emerald-600" />
                  <div className="w-4 h-4 bg-emerald-600" /><div className="w-4 h-4 bg-emerald-500" /><div className="w-4 h-4 bg-emerald-600" />
                  <div className="w-4 h-4" /><div className="w-4 h-4 bg-emerald-600" /><div className="w-4 h-4" />
                </div>
                <div className="w-4 h-8 bg-amber-800" />
              </div>
            </div>

            {/* Steve */}
            <div className="absolute bottom-[30%] left-[30%]">
              <div className="flex flex-col items-center" style={{ imageRendering: 'pixelated' }}>
                <div className="grid grid-cols-4 gap-0">
                  <div className="w-3 h-3" /><div className="w-3 h-3 bg-amber-700" /><div className="w-3 h-3 bg-amber-700" /><div className="w-3 h-3" />
                  <div className="w-3 h-3 bg-amber-700" /><div className="w-3 h-3 bg-amber-200" /><div className="w-3 h-3 bg-amber-200" /><div className="w-3 h-3 bg-amber-700" />
                  <div className="w-3 h-3 bg-amber-200" /><div className="w-3 h-3 bg-amber-100" /><div className="w-3 h-3 bg-amber-100" /><div className="w-3 h-3 bg-amber-200" />
                  <div className="w-3 h-3 bg-amber-200" /><div className="w-3 h-3 bg-amber-200" /><div className="w-3 h-3 bg-amber-200" /><div className="w-3 h-3 bg-amber-200" />
                </div>
                <div className="grid grid-cols-4 gap-0">
                  <div className="w-3 h-3 bg-blue-400" /><div className="w-3 h-3 bg-blue-400" /><div className="w-3 h-3 bg-blue-400" /><div className="w-3 h-3 bg-blue-400" />
                  <div className="w-3 h-3 bg-blue-400" /><div className="w-3 h-3 bg-blue-400" /><div className="w-3 h-3 bg-blue-400" /><div className="w-3 h-3 bg-blue-400" />
                </div>
                <div className="grid grid-cols-4 gap-0">
                  <div className="w-3 h-3 bg-blue-500" /><div className="w-3 h-3 bg-blue-500" /><div className="w-3 h-3 bg-blue-500" /><div className="w-3 h-3 bg-blue-500" />
                </div>
                <div className="grid grid-cols-4 gap-0">
                  <div className="w-3 h-3 bg-gray-500" /><div className="w-3 h-3" /><div className="w-3 h-3" /><div className="w-3 h-3 bg-gray-500" />
                </div>
                <div className="grid grid-cols-4 gap-0">
                  <div className="w-3 h-3 bg-gray-500" /><div className="w-3 h-3" /><div className="w-3 h-3" /><div className="w-3 h-3 bg-gray-500" />
                </div>
                <p className="text-xs text-stone-600 font-bold mt-1">Steve</p>
              </div>
            </div>

            {/* Creeper */}
            <div className="absolute bottom-[30%] left-1/2 -translate-x-1/2">
              <div className="flex flex-col items-center" style={{ imageRendering: 'pixelated' }}>
                <div className="grid grid-cols-4 gap-0">
                  <div className="w-3 h-3 bg-green-500" /><div className="w-3 h-3 bg-green-500" /><div className="w-3 h-3 bg-green-500" /><div className="w-3 h-3 bg-green-500" />
                  <div className="w-3 h-3 bg-green-500" /><div className="w-3 h-3 bg-green-900" /><div className="w-3 h-3 bg-green-900" /><div className="w-3 h-3 bg-green-500" />
                  <div className="w-3 h-3 bg-green-500" /><div className="w-3 h-3 bg-green-900" /><div className="w-3 h-3 bg-green-900" /><div className="w-3 h-3 bg-green-500" />
                  <div className="w-3 h-3 bg-green-500" /><div className="w-3 h-3 bg-green-600" /><div className="w-3 h-3 bg-green-600" /><div className="w-3 h-3 bg-green-500" />
                </div>
                <div className="grid grid-cols-4 gap-0">
                  <div className="w-3 h-3 bg-green-500" /><div className="w-3 h-3 bg-green-500" /><div className="w-3 h-3 bg-green-500" /><div className="w-3 h-3 bg-green-500" />
                  <div className="w-3 h-3 bg-green-600" /><div className="w-3 h-3 bg-green-900" /><div className="w-3 h-3 bg-green-900" /><div className="w-3 h-3 bg-green-600" />
                  <div className="w-3 h-3 bg-green-500" /><div className="w-3 h-3 bg-green-500" /><div className="w-3 h-3 bg-green-500" /><div className="w-3 h-3 bg-green-500" />
                </div>
                <div className="grid grid-cols-4 gap-0">
                  <div className="w-3 h-3 bg-green-500" /><div className="w-3 h-3 bg-green-500" /><div className="w-3 h-3 bg-green-500" /><div className="w-3 h-3 bg-green-500" />
                </div>
                <p className="text-xs text-stone-600 font-bold mt-1">Creeper</p>
              </div>
            </div>

            {/* Alex */}
            <div className="absolute bottom-[30%] right-[25%]">
              <div className="flex flex-col items-center" style={{ imageRendering: 'pixelated' }}>
                <div className="grid grid-cols-4 gap-0">
                  <div className="w-3 h-3" /><div className="w-3 h-3 bg-orange-600" /><div className="w-3 h-3 bg-orange-600" /><div className="w-3 h-3" />
                  <div className="w-3 h-3 bg-orange-600" /><div className="w-3 h-3 bg-orange-600" /><div className="w-3 h-3 bg-orange-600" /><div className="w-3 h-3 bg-orange-600" />
                  <div className="w-3 h-3 bg-amber-200" /><div className="w-3 h-3 bg-amber-100" /><div className="w-3 h-3 bg-amber-100" /><div className="w-3 h-3 bg-amber-200" />
                  <div className="w-3 h-3 bg-amber-200" /><div className="w-3 h-3 bg-amber-200" /><div className="w-3 h-3 bg-amber-200" /><div className="w-3 h-3 bg-amber-200" />
                </div>
                <div className="grid grid-cols-4 gap-0">
                  <div className="w-3 h-3 bg-green-600" /><div className="w-3 h-3 bg-green-600" /><div className="w-3 h-3 bg-green-600" /><div className="w-3 h-3 bg-green-600" />
                  <div className="w-3 h-3 bg-green-600" /><div className="w-3 h-3 bg-green-600" /><div className="w-3 h-3 bg-green-600" /><div className="w-3 h-3 bg-green-600" />
                </div>
                <div className="grid grid-cols-4 gap-0">
                  <div className="w-3 h-3 bg-gray-600" /><div className="w-3 h-3 bg-gray-600" /><div className="w-3 h-3 bg-gray-600" /><div className="w-3 h-3 bg-gray-600" />
                </div>
                <div className="grid grid-cols-4 gap-0">
                  <div className="w-3 h-3 bg-gray-500" /><div className="w-3 h-3" /><div className="w-3 h-3" /><div className="w-3 h-3 bg-gray-500" />
                </div>
                <div className="grid grid-cols-4 gap-0">
                  <div className="w-3 h-3 bg-gray-500" /><div className="w-3 h-3" /><div className="w-3 h-3" /><div className="w-3 h-3 bg-gray-500" />
                </div>
                <p className="text-xs text-stone-600 font-bold mt-1">Alex</p>
              </div>
            </div>

            {/* Ground layers */}
            <div className="absolute bottom-0 left-0 right-0">
              <div className="h-8 bg-emerald-500" />
              <div className="h-6 bg-emerald-600" />
              <div className="h-8 bg-amber-700" />
              <div className="h-10 bg-amber-800" />
              <div className="h-16 bg-stone-700" />
            </div>

            {/* Tagline */}
            <div className="absolute bottom-28 left-1/2 -translate-x-1/2 text-center">
              <p className="text-sm font-medium text-stone-600">
                ⛏ Explore the Block World
              </p>
              <p className="text-xs text-stone-500 mt-1">
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
