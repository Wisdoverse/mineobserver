'use client';

import { useState, useEffect } from 'react';
import { Bot, Users, Wifi, WifiOff, ChevronLeft, Play, Plus, MapPin, Heart, Utensils, Compass, Copy, Check, Globe, Link2 } from 'lucide-react';
import { useAgentObserver } from '@/hooks/use-agent-observer';
import { useDemoAgent, AddDemoAgentDialog } from '@/hooks/use-demo-agent';
import { AgentCard } from '@/components/agent/agent-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MiniMap } from '@/components/agent/mini-map';
import { InventoryGrid } from '@/components/agent/inventory-grid';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { AgentStatus, WorldSnapshot } from '@/lib/types/agent';

export default function ObserverPage() {
  const [viewMode, setViewMode] = useState<'landing' | 'list' | 'detail'>('landing');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [disconnectConfirm, setDisconnectConfirm] = useState<{ open: boolean; agentId: string | null; username: string | null }>({ open: false, agentId: null, username: null });

  const { agents, events, worldSnapshots, isConnected } = useAgentObserver();
  const { activeAgents, startDemoAgent, stopDemoAgent } = useDemoAgent();

  const allAgents = agents;
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
          <div className="flex-1 flex flex-col justify-center px-12 lg:px-24 py-12">
            <div className="max-w-xl">
              {/* Tag */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-100 border border-stone-200 mb-8">
                <Globe className="w-4 h-4 text-stone-500" />
                <span className="text-sm text-stone-500 font-medium">Minecraft Agent Platform</span>
              </div>

              {/* Title */}
              <h1 className="text-5xl lg:text-6xl font-bold text-stone-900 mb-6 leading-tight">
                Minecraft<br />
                <span className="text-emerald-600">Agent World</span>
              </h1>

              {/* Description */}
              <p className="text-lg text-stone-600 mb-8 leading-relaxed">
                Agent 在这里生活、工作、探索 Minecraft 世界。<br />
                <span className="text-stone-400">Where agents live, work, and explore the Minecraft world.</span>
              </p>

              {/* Stats */}
              <div className="flex items-center gap-2 mb-10">
                <Users className="w-5 h-5 text-emerald-600" />
                <span className="text-2xl font-bold text-stone-800">{agentCount}</span>
                <span className="text-stone-500">Agents 已加入</span>
              </div>

              {/* Join Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-5 mb-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Link2 className="w-4 h-4 text-stone-400" />
                      <span className="text-sm text-stone-500">加入 Minecraft Agent World</span>
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

              {/* Actions */}
              <div className="flex items-center gap-4">
                <AddDemoAgentDialog />
                <Button
                  variant="outline"
                  onClick={handleEnterWorld}
                  className="border-stone-300 text-stone-600 hover:bg-stone-100"
                >
                  {agentCount > 0 ? '查看现有 Agent' : '跳过演示'}
                </Button>
              </div>

              {/* WebSocket Status */}
              <div className="flex items-center gap-2 mt-8 text-sm text-stone-400">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
                {isConnected ? 'WebSocket 已连接' : '等待 Agent 连接...'}
              </div>
            </div>
          </div>

          {/* Right Side - Visual */}
          <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-stone-100 to-emerald-50 relative overflow-hidden">
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-20">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#9CA3AF" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Center Visual */}
            <div className="relative z-10">
              {/* Main Grid Sphere */}
              <div className="w-80 h-80 rounded-full border-2 border-stone-300 relative" style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(16, 185, 129, 0.1), transparent 50%), radial-gradient(circle at 70% 70%, rgba(16, 185, 129, 0.05), transparent 50%)'
              }}>
                {/* Latitude lines */}
                <div className="absolute inset-0 rounded-full border border-stone-200/50" style={{ transform: 'scale(0.75)' }} />
                <div className="absolute inset-0 rounded-full border border-stone-200/30" style={{ transform: 'scale(0.5)' }} />
                
                {/* Longitude lines */}
                <div className="absolute inset-0 rounded-full border border-stone-200/50" style={{ transform: 'rotate(45deg)', transformOrigin: 'center' }} />
                <div className="absolute inset-0 rounded-full border border-stone-200/50" style={{ transform: 'rotate(-45deg)', transformOrigin: 'center' }} />
                <div className="absolute inset-0 rounded-full border border-stone-200/30" style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }} />
              </div>

              {/* Agent Avatars around the sphere */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 border-4 border-white shadow-lg flex items-center justify-center">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <p className="text-center text-xs text-stone-600 mt-1 font-medium">Agent_01</p>
              </div>

              <div className="absolute top-1/4 right-0 translate-x-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-4 border-white shadow-lg flex items-center justify-center">
                  <span className="text-xl">🎮</span>
                </div>
                <p className="text-center text-xs text-stone-600 mt-1 font-medium">Steve</p>
              </div>

              <div className="absolute bottom-1/4 right-0 translate-x-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 border-4 border-white shadow-lg flex items-center justify-center">
                  <span className="text-lg">⛏️</span>
                </div>
                <p className="text-center text-xs text-stone-600 mt-1 font-medium">Miner</p>
              </div>

              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 border-4 border-white shadow-lg flex items-center justify-center">
                  <span className="text-xl">🏠</span>
                </div>
                <p className="text-center text-xs text-stone-600 mt-1 font-medium">Builder</p>
              </div>

              <div className="absolute top-1/4 left-0 -translate-x-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-rose-500 border-4 border-white shadow-lg flex items-center justify-center">
                  <span className="text-lg">⚔️</span>
                </div>
                <p className="text-center text-xs text-stone-600 mt-1 font-medium">Warrior</p>
              </div>
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
                  <button onClick={() => setViewMode('landing')} className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
                    <Globe className="w-6 h-6 text-emerald-600" />
                  </button>
                  <div>
                    <h1 className="text-xl font-bold text-stone-900">
                      Minecraft Agent World
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-stone-500">
                      <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
                      {isConnected ? '在线' : '离线'} · {agentCount} 个 Agent
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDisconnectConfirm({ open: true, agentId: selectedAgentId, username: selectedAgent?.username || null })}
                  className="text-red-500 border-red-200 hover:bg-red-50"
                >
                  断开连接
                </Button>
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

      {/* 断开连接确认对话框 */}
      <AlertDialog open={disconnectConfirm.open} onOpenChange={(open) => setDisconnectConfirm((prev) => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认断开连接</AlertDialogTitle>
            <AlertDialogDescription>
              确定要断开与 <span className="font-semibold text-foreground">{disconnectConfirm.username}</span> 的连接吗？
              {activeAgents.has(disconnectConfirm.agentId || '') && (
                <span className="block mt-2 text-amber-600">
                  这是演示 Agent，断开后配置将被清除。
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (disconnectConfirm.agentId) {
                  stopDemoAgent(disconnectConfirm.agentId);
                  // 如果是从详情页断开的，退回到列表页
                  if (viewMode === 'detail' && disconnectConfirm.agentId === selectedAgentId) {
                    setViewMode('list');
                    setSelectedAgentId(null);
                  }
                }
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              确认断开
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
