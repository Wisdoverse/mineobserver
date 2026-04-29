'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Bot, Users, Wifi, WifiOff, ChevronLeft, Map, Backpack, 
  Activity, Clock, Heart, Cookie, Footprints, Eye, Compass, Grid3X3
} from 'lucide-react';
import { AgentCard, MiniMap, InventoryGrid } from '@/components/agent';
import { useAgentObserver } from '@/hooks/use-agent-observer';
import { AddDemoAgentDialog } from '@/hooks/use-demo-agent';
import type { AgentEvent, NearbyBlock, NearbyEntity, InventorySlot, Position } from '@/lib/types';

export default function ObserverPage() {
  const { agents, events, worldSnapshots, isConnected, lastUpdate } = useAgentObserver();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'detail'>('grid');
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'inventory' | 'events'>('overview');
  const [now, setNow] = useState(() => Date.now());

  // 更新时间用于相对时间计算
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAgentClick = useCallback((agentId: string) => {
    setSelectedAgentId(agentId);
    setViewMode('detail');
    setActiveTab('overview');
  }, []);

  const handleBack = useCallback(() => {
    setSelectedAgentId(null);
    setViewMode('grid');
  }, []);

  const selectedAgent = selectedAgentId ? agents.get(selectedAgentId) : null;
  const selectedSnapshot = selectedAgentId ? worldSnapshots.get(selectedAgentId) : null;
  const selectedEvents = selectedAgentId ? (events.get(selectedAgentId) || []) : [];

  const formatTime = (timestamp: number) => new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const getTimeSince = (timestamp: number) => {
    const seconds = Math.floor((now - timestamp) / 1000);
    if (seconds < 5) return '刚刚';
    if (seconds < 60) return `${seconds}秒前`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}分钟前`;
    return `${Math.floor(minutes / 60)}小时前`;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/70 border-b border-white/10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-black animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">Agent Observer</h1>
                <p className="text-xs text-gray-500">Minecraft 实时监控</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                isConnected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {isConnected ? <><Wifi className="w-3 h-3" /> {agents.size} Agent</> : <><WifiOff className="w-3 h-3" /> 断开</>}
              </div>
              <AddDemoAgentDialog />
            </div>
          </div>
        </div>
      </header>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="relative">
          <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-950 to-black -z-10" />
          <div className="fixed inset-0 opacity-30" style={{
            backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.05) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />

          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <h2 className="text-2xl font-bold">活跃 Agent</h2>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full">{agents.size}</span>
              </div>
              <p className="text-gray-500 text-sm">
                实时监控 Agent 活动 {lastUpdate > 0 && <span className="ml-2">最后更新: {getTimeSince(lastUpdate)}</span>}
              </p>
            </div>

            {agents.size === 0 ? (
              <div className="flex flex-col items-center justify-center py-32">
                <div className="w-24 h-24 mb-6 rounded-2xl bg-gray-900/50 border border-gray-800 flex items-center justify-center">
                  <Bot className="w-12 h-12 text-gray-700" />
                </div>
                <h3 className="text-xl font-semibold mb-2">暂无活跃 Agent</h3>
                <p className="text-gray-500 text-center">点击右上角"添加演示 Agent"启动测试</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from(agents.entries()).map(([agentId, agent]) => (
                  <AgentCard 
                    key={agentId} 
                    agent={agent} 
                    events={events.get(agentId) || []}
                    onClick={() => handleAgentClick(agentId)} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail View */}
      {viewMode === 'detail' && selectedAgent && (
        <div className="relative">
          <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-950 to-black -z-10" />

          {/* Top Nav */}
          <div className="sticky top-0 z-50 backdrop-blur-xl bg-black/70 border-b border-white/10">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={handleBack} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-all border border-white/10">
                    <ChevronLeft className="w-4 h-4" />
                    <span className="text-sm">返回</span>
                  </button>
                  <div className="h-6 w-px bg-white/10" />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="font-semibold">{selectedAgent.username}</h2>
                      <p className="text-xs text-gray-500">{selectedAgent.position.x.toFixed(1)}, {selectedAgent.position.y.toFixed(1)}, {selectedAgent.position.z.toFixed(1)}</p>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg border border-white/10">
                  {[
                    { id: 'overview', icon: Activity, label: '总览' },
                    { id: 'map', icon: Map, label: '地图' },
                    { id: 'inventory', icon: Backpack, label: '背包' },
                    { id: 'events', icon: Clock, label: '日志' },
                  ].map(({ id, icon: Icon, label }) => (
                    <button key={id} onClick={() => setActiveTab(id as typeof activeTab)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        activeTab === id ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}>
                      <Icon className="w-3.5 h-3.5" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="container mx-auto px-4 py-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Status */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Status Cards */}
                  <div className="bg-gradient-to-br from-gray-900/80 to-black/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      <h3 className="font-semibold">实时状态</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <StatusItem icon={Compass} label="位置" value={`${selectedAgent.position.x.toFixed(1)}, ${selectedAgent.position.y.toFixed(1)}, ${selectedAgent.position.z.toFixed(1)}`} color="emerald" />
                      <StatusItem icon={Eye} label="视角" value={`Y: ${selectedAgent.yaw.toFixed(0)}° P: ${selectedAgent.pitch.toFixed(0)}°`} color="blue" />
                      <StatusItem icon={Grid3X3} label="模式" value={selectedAgent.gamemode.charAt(0).toUpperCase() + selectedAgent.gamemode.slice(1)} color="purple" />
                      <StatusItem icon={Footprints} label="状态" value={selectedAgent.isOnGround ? '地面' : '空中'} color={selectedAgent.isSprinting ? 'orange' : 'gray'} />
                    </div>
                  </div>

                  {/* Bars */}
                  <div className="grid grid-cols-2 gap-4">
                    <StatBar icon={Heart} label="生命值" value={selectedAgent.health} maxValue={selectedAgent.maxHealth || 20} color="red" />
                    <StatBar icon={Cookie} label="饥饿值" value={selectedAgent.food} maxValue={20} color="orange" />
                  </div>

                  {/* Mini Map Preview */}
                  <div className="bg-gradient-to-br from-gray-900/80 to-black/60 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Map className="w-4 h-4 text-emerald-400" />
                        <h3 className="font-semibold">周围环境</h3>
                      </div>
                      <button onClick={() => setActiveTab('map')} className="text-xs text-emerald-400 hover:text-emerald-300">查看大图</button>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-white/10">
                      <MiniMap 
                        position={selectedAgent.position}
                        yaw={selectedAgent.yaw}
                        blocks={selectedSnapshot?.blocks?.map(b => ({ position: b.position, type: b.type, name: b.name || b.type.replace(/_/g, ' ') })) || []}
                        entities={selectedSnapshot?.entities?.map(e => ({ type: e.type, position: e.position, distance: Math.sqrt(Math.pow(e.position.x - selectedAgent.position.x, 2) + Math.pow(e.position.z - selectedAgent.position.z, 2)) })) || []}
                      />
                    </div>
                  </div>
                </div>

                {/* Events Sidebar */}
                <div className="bg-gradient-to-br from-gray-900/80 to-black/60 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-semibold">事件日志</h3>
                    <span className="ml-auto text-xs text-gray-500">{selectedEvents.length} 条</span>
                  </div>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                    {selectedEvents.length === 0 ? (
                      <div className="text-center py-8 text-gray-600">暂无事件</div>
                    ) : (
                      selectedEvents.map((event, i) => (
                        <EventItem key={`${event.timestamp}-${i}`} event={event} />
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'map' && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-gradient-to-br from-gray-900/80 to-black/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Map className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-semibold">小地图</h3>
                    <span className="ml-2 text-xs text-gray-500">32 格范围</span>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-white/10">
                    <MiniMap 
                      position={selectedAgent.position}
                      yaw={selectedAgent.yaw}
                      blocks={selectedSnapshot?.blocks?.map(b => ({ position: b.position, type: b.type, name: b.name || b.type.replace(/_/g, ' ') })) || []}
                      entities={selectedSnapshot?.entities?.map(e => ({ type: e.type, position: e.position, distance: Math.sqrt(Math.pow(e.position.x - selectedAgent.position.x, 2) + Math.pow(e.position.z - selectedAgent.position.z, 2)) })) || []}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-500 rounded-sm" /><span>玩家</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-amber-500 rounded-sm" /><span>实体</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-green-700 rounded-sm" /><span>草地</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-gray-600 rounded-sm" /><span>石头</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-400 rounded-sm" /><span>水源</span></div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-gradient-to-br from-gray-900/80 to-black/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Backpack className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-semibold">背包物品</h3>
                  </div>
                  <InventoryGrid 
                    inventory={selectedAgent.inventory || []}
                    equipment={selectedAgent.equipment}
                  />
                </div>
              </div>
            )}

            {activeTab === 'events' && (
              <div className="max-w-3xl mx-auto">
                <div className="bg-gradient-to-br from-gray-900/80 to-black/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Clock className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-semibold">完整事件日志</h3>
                    <span className="ml-2 text-xs text-gray-500">{selectedEvents.length} 条</span>
                  </div>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {selectedEvents.length === 0 ? (
                      <div className="text-center py-12 text-gray-600">暂无事件</div>
                    ) : (
                      selectedEvents.map((event, i) => (
                        <div key={`${event.timestamp}-${i}`} className="flex gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                            <EventIcon type={event.type} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{getEventTypeName(event.type)}</span>
                              <span className="text-xs text-gray-500">{formatTime(event.timestamp)}</span>
                            </div>
                            <p className="text-sm text-gray-400 truncate">{event.description}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusItem({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400',
    gray: 'from-gray-500/20 to-gray-600/10 border-gray-500/30 text-gray-400',
  };
  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br ${colorMap[color] || colorMap.gray} border`}>
      <div className="flex items-center gap-2 mb-2"><Icon className="w-4 h-4 opacity-70" /><span className="text-xs opacity-70">{label}</span></div>
      <p className="text-sm font-semibold truncate">{value}</p>
    </div>
  );
}

function StatBar({ icon: Icon, label, value, maxValue, color }: { icon: React.ElementType; label: string; value: number; maxValue: number; color: string }) {
  const percentage = Math.max(0, Math.min(100, (value / maxValue) * 100));
  const colorMap: Record<string, { bar: string; text: string }> = {
    red: { bar: 'bg-gradient-to-r from-red-600 to-red-400', text: 'text-red-400' },
    orange: { bar: 'bg-gradient-to-r from-orange-600 to-amber-400', text: 'text-orange-400' },
  };
  return (
    <div className="bg-gradient-to-br from-gray-900/80 to-black/60 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${colorMap[color]?.text}`} />
        <span className="text-sm text-gray-400">{label}</span>
        <span className={`ml-auto text-sm font-semibold ${colorMap[color]?.text}`}>{value} / {maxValue}</span>
      </div>
      <div className="h-3 bg-black/50 rounded-full overflow-hidden border border-white/10">
        <div className={`h-full ${colorMap[color]?.bar} rounded-full transition-all duration-500 shadow-lg`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function EventItem({ event }: { event: AgentEvent }) {
  return (
    <div className="flex gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
      <div className="flex-shrink-0 mt-0.5"><EventIcon type={event.type} /></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{event.description}</p>
        <p className="text-xs text-gray-600">{formatTimeSimple(event.timestamp)}</p>
      </div>
    </div>
  );
}

function EventIcon({ type }: { type: string }) {
  const iconMap: Record<string, { icon: React.ElementType; color: string }> = {
    move: { icon: Footprints, color: 'text-blue-400' },
    jump: { icon: Activity, color: 'text-green-400' },
    attack: { icon: Heart, color: 'text-red-400' },
    chat: { icon: Users, color: 'text-purple-400' },
    pickup: { icon: Backpack, color: 'text-amber-400' },
    break: { icon: Grid3X3, color: 'text-gray-400' },
    place: { icon: Grid3X3, color: 'text-emerald-400' },
  };
  const config = iconMap[type] || { icon: Activity, color: 'text-gray-400' };
  return <config.icon className={`w-3.5 h-3.5 ${config.color}`} />;
}

function getEventTypeName(type: string): string {
  const nameMap: Record<string, string> = {
    move: '移动', jump: '跳跃', attack: '攻击', chat: '聊天', pickup: '拾取', drop: '丢弃',
    break: '破坏', place: '放置', death: '死亡', respawn: '重生', eat: '进食', sleep: '睡觉',
  };
  return nameMap[type] || type;
}

function formatTimeSimple(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
