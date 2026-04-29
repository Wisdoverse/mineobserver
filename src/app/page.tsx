'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Bot, Users, Wifi, WifiOff, ChevronLeft, Map, Backpack, 
  Activity, Clock, Heart, Cookie, Footprints, Eye, Compass, Grid3X3
} from 'lucide-react';
import { AgentCard, MiniMap, InventoryGrid } from '@/components/agent';
import { useAgentObserver } from '@/hooks/use-agent-observer';
import { AddDemoAgentDialog } from '@/hooks/use-demo-agent';
import type { AgentEvent } from '@/lib/types';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-gray-900">Minecraft Agent 观测台</h1>
                <p className="text-xs text-gray-500">Minecraft 实时监控</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                isConnected ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-700 border border-red-200'
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
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Compass className="w-5 h-5 text-emerald-600" />
                <h2 className="text-2xl font-bold text-gray-900">游戏中的 Agent</h2>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">{agents.size}</span>
              </div>
              <p className="text-gray-500 text-sm">
                实时监控 Minecraft 世界中的 Agent 状态 {lastUpdate > 0 && <span className="ml-2">最后更新: {getTimeSince(lastUpdate)}</span>}
              </p>
            </div>

            {agents.size === 0 ? (
              <div className="space-y-8">
                {/* 接入指南 */}
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 text-white">
                        <path fill="currentColor" d="M13 3v2h-2V3h2zm4 0v2h-2V3h2zm-8 0v2H7V3h2zm8 8v2h-2v-2h2zm-4 0v2h-2v-2h2zm-4 0v2H9v-2h2zm-4 0v2H5v-2h2zm8 0v2h-2v-2h2zm4 0v2h-2v-2h2zm-4 8v2h-2v-2h2zm-4 0v2H9v-2h2zm-4 0v2H5v-2h2zm8 4v2h-2v-2h2zm-4 0v2h-2v-2h2z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-emerald-900 mb-2">让真实 Agent 加入</h3>
                      <div className="text-sm text-emerald-700 space-y-3">
                        <p>在 Agent 中安装 <code className="bg-emerald-100 px-1.5 py-0.5 rounded font-mono text-emerald-800">minecraft-client</code> 技能后，Agent 连接到 Minecraft 服务器时会自动上报状态到观测台。</p>
                        <div className="bg-slate-900 rounded-lg p-4 mt-3 font-mono text-xs">
                          <p className="text-emerald-400">{"# Agent 端 WebSocket 连接配置"}</p>
                          <p className="text-gray-300 mt-2">{"连接地址: wss://你的域名/ws/agent"}</p>
                          <p className="text-gray-300 mt-1">{"端口: 5000"}</p>
                        </div>
                        <div className="mt-3 space-y-1">
                          <p><strong>连接流程：</strong></p>
                          <ol className="list-decimal list-inside space-y-1 ml-2">
                            <li>Agent 安装 <code className="bg-emerald-100 px-1 rounded">minecraft-client</code> 技能</li>
                            <li>Agent 连接 WebSocket 到 <code className="bg-emerald-100 px-1 rounded">/ws/agent</code> 端点</li>
                            <li>发送 <code className="bg-emerald-100 px-1 rounded">agent:register</code> 注册 Agent</li>
                            <li>定期发送 <code className="bg-emerald-100 px-1 rounded">agent:status:update</code> 更新状态</li>
                            <li>可选发送 <code className="bg-emerald-100 px-1 rounded">agent:world:snapshot</code> 更新周围环境</li>
                            <li>可选发送 <code className="bg-emerald-100 px-1 rounded">agent:event</code> 上报操作事件</li>
                          </ol>
                        </div>
                        <p className="mt-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                          Agent 连接后会自动出现在列表中
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 空状态 */}
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-24 h-24 mb-6 rounded-2xl bg-emerald-50 border-2 border-dashed border-emerald-200 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-12 h-12 text-emerald-400">
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
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">暂无在线 Agent</h3>
                  <p className="text-gray-500 text-center mb-4">你可以添加演示 Agent 进行测试</p>
                  <AddDemoAgentDialog />
                </div>
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
          {/* Top Nav */}
          <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/95 border-b border-gray-200 shadow-sm">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={handleBack} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-all border border-emerald-200">
                    <ChevronLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">返回列表</span>
                  </button>
                  <div className="h-6 w-px bg-gray-300" />
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md">
                      <svg viewBox="0 0 16 16" className="w-5 h-5 text-white">
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
                      <h2 className="font-bold text-gray-900">{selectedAgent.username}</h2>
                      <p className="text-xs text-gray-500 font-mono">{selectedAgent.position.x.toFixed(1)}, {selectedAgent.position.y.toFixed(1)}, {selectedAgent.position.z.toFixed(1)}</p>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg border border-gray-200">
                  {[
                    { id: 'overview', icon: Activity, label: '状态' },
                    { id: 'map', icon: Map, label: '周围' },
                    { id: 'inventory', icon: Backpack, label: '物品' },
                    { id: 'events', icon: Clock, label: '日志' },
                  ].map(({ id, icon: Icon, label }) => (
                    <button key={id} onClick={() => setActiveTab(id as typeof activeTab)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        activeTab === id ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
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
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity className="w-4 h-4 text-emerald-600" />
                      <h3 className="font-semibold text-gray-900">实时状态</h3>
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
                  <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Map className="w-4 h-4 text-emerald-600" />
                        <h3 className="font-semibold text-gray-900">周围环境</h3>
                      </div>
                      <button onClick={() => setActiveTab('map')} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">查看大图</button>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-gray-200">
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
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-semibold text-gray-900">事件日志</h3>
                    <span className="ml-auto text-xs text-gray-500">{selectedEvents.length} 条</span>
                  </div>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                    {selectedEvents.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">暂无事件</div>
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
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Map className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-lg font-semibold text-gray-900">小地图</h3>
                    <span className="ml-2 text-xs text-gray-500">32 格范围</span>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-gray-200">
                    <MiniMap 
                      position={selectedAgent.position}
                      yaw={selectedAgent.yaw}
                      blocks={selectedSnapshot?.blocks?.map(b => ({ position: b.position, type: b.type, name: b.name || b.type.replace(/_/g, ' ') })) || []}
                      entities={selectedSnapshot?.entities?.map(e => ({ type: e.type, position: e.position, distance: Math.sqrt(Math.pow(e.position.x - selectedAgent.position.x, 2) + Math.pow(e.position.z - selectedAgent.position.z, 2)) })) || []}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-500 rounded-sm" /><span>玩家</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-amber-500 rounded-sm" /><span>实体</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-green-700 rounded-sm" /><span>草地</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-gray-500 rounded-sm" /><span>石头</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-400 rounded-sm" /><span>水源</span></div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <Backpack className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-lg font-semibold text-gray-900">背包物品</h3>
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
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <Clock className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-lg font-semibold text-gray-900">完整事件日志</h3>
                    <span className="ml-2 text-xs text-gray-500">{selectedEvents.length} 条</span>
                  </div>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {selectedEvents.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">暂无事件</div>
                    ) : (
                      selectedEvents.map((event, i) => (
                        <div key={`${event.timestamp}-${i}`} className="flex gap-4 p-3 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <EventIcon type={event.type} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">{getEventTypeName(event.type)}</span>
                              <span className="text-xs text-gray-500">{formatTime(event.timestamp)}</span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">{event.description}</p>
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
    emerald: 'from-emerald-100 to-emerald-50 border-emerald-200 text-emerald-700',
    blue: 'from-blue-100 to-blue-50 border-blue-200 text-blue-700',
    purple: 'from-purple-100 to-purple-50 border-purple-200 text-purple-700',
    orange: 'from-orange-100 to-orange-50 border-orange-200 text-orange-700',
    gray: 'from-gray-100 to-gray-50 border-gray-200 text-gray-700',
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
    red: { bar: 'bg-gradient-to-r from-red-500 to-red-400', text: 'text-red-600' },
    orange: { bar: 'bg-gradient-to-r from-orange-500 to-amber-400', text: 'text-orange-600' },
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${colorMap[color]?.text}`} />
        <span className="text-sm text-gray-600">{label}</span>
        <span className={`ml-auto text-sm font-semibold ${colorMap[color]?.text}`}>{value} / {maxValue}</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
        <div className={`h-full ${colorMap[color]?.bar} rounded-full transition-all duration-500 shadow-sm`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function EventItem({ event }: { event: AgentEvent }) {
  return (
    <div className="flex gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="flex-shrink-0 mt-0.5"><EventIcon type={event.type} /></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate text-gray-700">{event.description}</p>
        <p className="text-xs text-gray-400">{formatTimeSimple(event.timestamp)}</p>
      </div>
    </div>
  );
}

function EventIcon({ type }: { type: string }) {
  const iconMap: Record<string, { icon: React.ElementType; color: string }> = {
    move: { icon: Footprints, color: 'text-blue-600' },
    jump: { icon: Activity, color: 'text-green-600' },
    attack: { icon: Heart, color: 'text-red-600' },
    chat: { icon: Users, color: 'text-purple-600' },
    pickup: { icon: Backpack, color: 'text-amber-600' },
    break: { icon: Grid3X3, color: 'text-gray-600' },
    place: { icon: Grid3X3, color: 'text-emerald-600' },
  };
  const config = iconMap[type] || { icon: Activity, color: 'text-gray-600' };
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
