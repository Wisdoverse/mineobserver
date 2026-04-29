'use client';

import { useState, useEffect, useCallback } from 'react';
import { Activity, Users, Wifi, WifiOff, RefreshCw, Server, Pause, Trash2, Bot, ArrowLeft, MapPin, Heart, Utensils, Backpack, Map, Clock, Move, Eye } from 'lucide-react';
import { useAgentObserver } from '@/hooks/use-agent-observer';
import { useDemoAgent, AddDemoAgentDialog } from '@/hooks/use-demo-agent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { AgentStatus, AgentEvent, WorldSnapshot } from '@/lib/types/agent';

function getEventEmoji(type: string): string {
  const emojiMap: Record<string, string> = {
    move: '🚶',
    jump: '🦘',
    attack: '⚔️',
    damage: '💔',
    chat: '💬',
    block_break: '⛏️',
    block_place: '🧱',
    item_pickup: '📦',
    item_drop: '📤',
    death: '💀',
    respawn: '✨',
    login: '🔌',
    logout: '👋',
    fish: '🎣',
    sleep: '😴',
    wake: '☀️',
  };
  return emojiMap[type] || '📌';
}

function AgentCardView({ agent, events, worldSnapshot, onClick, onStop }: {
  agent: AgentStatus;
  events: AgentEvent[];
  worldSnapshot?: WorldSnapshot;
  onClick: () => void;
  onStop?: () => void;
}) {
  const recentEvents = events.slice(-3).reverse();
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 hover:-translate-y-0.5"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            <CardTitle className="text-lg">{agent.username}</CardTitle>
          </div>
          <Badge variant={agent.connected ? 'default' : 'destructive'}>
            {agent.connected ? '在线' : '离线'}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span className="font-mono">
            {agent.position.x}, {agent.position.y}, {agent.position.z}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">


        {/* 最近事件 */}
        {recentEvents.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>最近活动</span>
            </div>
            {recentEvents.map((event) => (
              <div key={event.id} className="flex items-center gap-2 text-xs">
                <span>{getEventEmoji(event.type)}</span>
                <span className="truncate flex-1">{event.description}</span>
              </div>
            ))}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" className="flex-1 gap-1">
            <Eye className="w-3 h-3" />
            查看详情
          </Button>
          {agent.id.startsWith('demo-') && onStop && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="text-destructive" onClick={(e) => { e.stopPropagation(); onStop(); }}>
                    <Pause className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>停止演示</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AgentDetailView({ agent, events, worldSnapshot, onBack }: {
  agent: AgentStatus;
  events: AgentEvent[];
  worldSnapshot?: WorldSnapshot;
  onBack: () => void;
}) {
  const recentEvents = events.slice(-20).reverse();
  
  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        返回列表
      </Button>

      {/* Agent 信息头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-full">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{agent.username}</h2>
              {agent.id.startsWith('demo-') && (
                <Badge variant="outline">
                  <Bot className="w-3 h-3 mr-1" />
                  演示
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground font-mono">{agent.id}</p>
          </div>
        </div>
        <Badge variant={agent.connected ? 'default' : 'destructive'} className="text-sm px-3 py-1">
          {agent.connected ? '在线' : '离线'}
        </Badge>
      </div>

      {/* 状态卡片网格 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-sm flex items-center gap-1">
              <MapPin className="w-4 h-4" /> 坐标
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="font-mono text-sm space-y-0.5">
              <div>X: {agent.position.x}</div>
              <div>Y: {agent.position.y}</div>
              <div>Z: {agent.position.z}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-sm flex items-center gap-1">
              <Eye className="w-4 h-4" /> 视角
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="font-mono text-sm">
              <div>Yaw: {agent.yaw.toFixed(1)}°</div>
              <div>Pitch: {agent.pitch.toFixed(1)}°</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-sm flex items-center gap-1">
              <Activity className="w-4 h-4" /> 状态
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="font-mono text-sm capitalize">
              <div>{agent.gamemode}</div>
              <div className="text-muted-foreground">{agent.dimension}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-sm flex items-center gap-1">
              <Move className="w-4 h-4" /> 速度
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="font-mono text-sm">
              {agent.velocity
                ? `${agent.velocity.x.toFixed(2)}, ${agent.velocity.y.toFixed(2)}, ${agent.velocity.z.toFixed(2)}`
                : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 生命值和饥饿值 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-sm flex items-center gap-1">
              <Heart className="w-4 h-4 text-red-500" /> 生命值
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="flex items-center gap-3">
              <Progress value={(agent.health / agent.maxHealth) * 100} className="h-3 flex-1" />
              <span className="font-mono text-sm">{agent.health} / {agent.maxHealth}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-sm flex items-center gap-1">
              <Utensils className="w-4 h-4 text-orange-500" /> 饥饿值
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="flex items-center gap-3">
              <Progress value={(agent.food / 20) * 100} className="h-3 flex-1" />
              <span className="font-mono text-sm">{agent.food} / 20</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 事件日志 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" /> 事件日志
          </CardTitle>
          <CardDescription>Agent 的最近活动记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                暂无事件记录
              </p>
            ) : (
              recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="text-2xl">{getEventEmoji(event.type)}</div>
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
  );
}

export default function ObserverPage() {
  const { agents, events, worldSnapshots, isConnected, lastUpdate } = useAgentObserver();
  const { activeAgents, stopDemoAgent, stopAllDemoAgents } = useDemoAgent();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [wsHost, setWsHost] = useState<string>('');

  useEffect(() => {
    setCurrentTime(Date.now());
    setWsHost(window.location.host);
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const agentsList = Array.from(agents.values());
  const selectedAgent = selectedAgentId ? agents.get(selectedAgentId) : null;
  const selectedEvents = selectedAgentId ? events.get(selectedAgentId) || [] : [];
  const demoAgentCount = activeAgents.size;

  const timeSinceUpdate = lastUpdate > 0 ? Math.round((currentTime - lastUpdate) / 1000) : 0;

  const handleAgentClick = useCallback((agentId: string) => {
    setSelectedAgentId(agentId);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedAgentId(null);
  }, []);

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
                {demoAgentCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    <Bot className="w-3 h-3 mr-1" />
                    {demoAgentCount} 演示
                  </Badge>
                )}
              </div>

              {/* 演示 Agent 控制 */}
              <div className="flex items-center gap-2">
                <AddDemoAgentDialog />

                {demoAgentCount > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="icon" className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>停止所有演示 Agent</AlertDialogTitle>
                        <AlertDialogDescription>
                          这将断开所有正在运行的演示 Agent 连接。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={stopAllDemoAgents}>
                          确认停止
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>

              {/* 刷新按钮 */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={() => window.location.reload()}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>刷新页面</p>
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
          /* 空状态 */
          <div className="flex flex-col items-center justify-center py-20">
            <div className="p-6 bg-muted rounded-full mb-6">
              <Server className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">暂无活跃的 Agent</h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              当有 Minecraft Agent 连接时，它们会显示在这里。
              <br />
              你可以添加演示 Agent 来预览观测台功能。
            </p>

            <div className="flex gap-3 mb-8">
              <AddDemoAgentDialog />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    演示模式
                  </CardTitle>
                  <CardDescription>
                    使用模拟数据预览观测台功能
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    点击"添加演示 Agent"按钮，可以创建一个模拟的 Minecraft Agent，
                    自动发送位置更新、事件日志和周围环境信息。
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>模拟移动和视角变化</li>
                    <li>随机生成事件日志</li>
                    <li>展示背包和装备</li>
                    <li>小地图方块和实体显示</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    真实 Agent 集成
                  </CardTitle>
                  <CardDescription>
                    连接真实的 Minecraft Agent
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Agent 需要通过 WebSocket 连接到此观测台并上报状态。
                    查看 AGENTS.md 文档了解集成方式。
                  </p>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-xs font-mono text-muted-foreground mb-2">连接地址:</p>
                    <code className="text-sm" suppressHydrationWarning>
                      ws://{wsHost || 'localhost'}/ws/agent
                    </code>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : selectedAgent ? (
          /* 详情视图 */
          <AgentDetailView
            agent={selectedAgent}
            events={selectedEvents}
            worldSnapshot={worldSnapshots.get(selectedAgentId!)}
            onBack={handleBack}
          />
        ) : (
          /* 卡片网格视图 */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Backpack className="w-5 h-5" />
                Agent 列表
              </h2>
              <Badge variant="secondary">{agentsList.length} 个在线</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {agentsList.map((agent) => (
                <AgentCardView
                  key={agent.id}
                  agent={agent}
                  events={events.get(agent.id) || []}
                  worldSnapshot={worldSnapshots.get(agent.id)}
                  onClick={() => handleAgentClick(agent.id)}
                  onStop={agent.id.startsWith('demo-') ? () => stopDemoAgent(agent.id) : undefined}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
