'use client';

import { useState, useEffect } from 'react';
import { Activity, Users, Wifi, WifiOff, RefreshCw, Server } from 'lucide-react';
import { useAgentObserver } from '@/hooks/use-agent-observer';
import { AgentCard } from '@/components/agent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ObserverPage() {
  const { agents, events, worldSnapshots, isConnected, lastUpdate } = useAgentObserver();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);

  useEffect(() => {
    setCurrentTime(Date.now());
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const agentsList = Array.from(agents.values());
  const selectedAgent = selectedAgentId ? agents.get(selectedAgentId) : null;
  const selectedEvents = selectedAgentId ? events.get(selectedAgentId) || [] : [];
  const selectedSnapshot = selectedAgentId ? worldSnapshots.get(selectedAgentId) : undefined;

  const timeSinceUpdate = Math.round((currentTime - lastUpdate) / 1000);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Minecraft Agent 观测台</h1>
                <p className="text-sm text-muted-foreground">
                  实时监控 Agent 在 Minecraft 世界中的行为
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* 连接状态 */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant={isConnected ? 'default' : 'destructive'} className="gap-1">
                      {isConnected ? (
                        <>
                          <Wifi className="w-3 h-3" />
                          已连接
                        </>
                      ) : (
                        <>
                          <WifiOff className="w-3 h-3" />
                          未连接
                        </>
                      )}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>最后更新: {timeSinceUpdate}秒前</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Agent 数量 */}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="font-mono">{agentsList.length}</span>
                <span className="text-muted-foreground">个 Agent</span>
              </div>

              {/* 刷新按钮 */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon">
                      <RefreshCw className={`w-4 h-4 ${!isConnected ? 'animate-spin' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>刷新连接</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {agentsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="p-6 bg-muted rounded-full mb-6">
              <Server className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">暂无活跃的 Agent</h2>
            <p className="text-muted-foreground text-center max-w-md">
              当有 Minecraft Agent 连接时，它们会显示在这里。
              <br />
              Agent 需要安装专门的客户端来连接到此观测台。
            </p>
            <div className="mt-8 p-4 bg-muted/50 rounded-lg max-w-lg">
              <h3 className="font-semibold mb-2">快速开始</h3>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>在 Agent 环境中安装 minecraft-client 技能</li>
                <li>配置观测台地址为当前页面 URL</li>
                <li>启动 Agent 连接 Minecraft 服务器</li>
                <li>观察 Agent 的实时行为</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Agent 列表 */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Agent 列表</h2>
                <Badge variant="secondary">{agentsList.length}</Badge>
              </div>
              <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                {agentsList.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    events={events.get(agent.id) || []}
                    worldSnapshot={worldSnapshots.get(agent.id)}
                    isSelected={selectedAgentId === agent.id}
                    onClick={() => setSelectedAgentId(agent.id)}
                  />
                ))}
              </div>
            </div>

            {/* 选中 Agent 详情 */}
            <div className="lg:col-span-2">
              {selectedAgent ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">{selectedAgent.username}</h2>
                      <p className="text-sm text-muted-foreground">
                        Agent ID: {selectedAgent.id}
                      </p>
                    </div>
                    <Badge variant={selectedAgent.connected ? 'default' : 'destructive'}>
                      {selectedAgent.connected ? '在线' : '离线'}
                    </Badge>
                  </div>

                  {/* 详细状态卡片 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm">坐标</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <p className="font-mono text-sm">
                          X: {selectedAgent.position.x}
                          <br />
                          Y: {selectedAgent.position.y}
                          <br />
                          Z: {selectedAgent.position.z}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm">视角</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <p className="font-mono text-sm">
                          Yaw: {selectedAgent.yaw.toFixed(1)}°
                          <br />
                          Pitch: {selectedAgent.pitch.toFixed(1)}°
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm">状态</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <p className="font-mono text-sm capitalize">
                          {selectedAgent.gamemode}
                          <br />
                          维度: {selectedAgent.dimension}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm">速度</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <p className="font-mono text-sm">
                          {selectedAgent.velocity
                            ? `${selectedAgent.velocity.x.toFixed(2)}, ${selectedAgent.velocity.y.toFixed(2)}, ${selectedAgent.velocity.z.toFixed(2)}`
                            : 'N/A'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 完整事件日志 */}
                  <Card>
                    <CardHeader>
                      <CardTitle>事件日志</CardTitle>
                      <CardDescription>Agent 的最近活动记录</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {selectedEvents.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            暂无事件记录
                          </p>
                        ) : (
                          selectedEvents.map((event) => (
                            <div
                              key={event.id}
                              className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                            >
                              <div className="text-2xl">
                                {getEventEmoji(event.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <Badge variant="outline" className="text-xs">
                                    {event.type}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(event.timestamp).toLocaleString('zh-CN')}
                                  </span>
                                </div>
                                <p className="text-sm mt-1">{event.description}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] bg-muted/50 rounded-lg">
                  <Users className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">点击左侧 Agent 卡片查看详情</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function getEventEmoji(type: string): string {
  const emojiMap: Record<string, string> = {
    connected: '🔗',
    disconnected: '❌',
    moved: '🚶',
    jumped: '🦘',
    attacked: '⚔️',
    damaged: '💔',
    died: '💀',
    chat_sent: '📤',
    chat_received: '📨',
    block_broken: '⛏️',
    block_placed: '🧱',
    item_picked_up: '📥',
    item_dropped: '📤',
    item_used: '✋',
    inventory_changed: '🎒',
    world_changed: '🌍',
    respawned: '✨',
  };
  return emojiMap[type] || '📌';
}
