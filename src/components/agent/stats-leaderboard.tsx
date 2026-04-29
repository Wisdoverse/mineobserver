'use client';

import { Activity, Bot, Heart, Pickaxe, Skull, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';

interface GlobalStats {
  onlineAgents: number;
  totalAgents: number;
  totalEvents: number;
  activeBuilds: number;
  totalBuilds: number;
  totalTeams: number;
  uptime: number;
}

interface LeaderboardEntry {
  agentId: string;
  username: string;
  value: number;
  stats: Record<string, number>;
}

export function StatsAndLeaderboard() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardMetric, setLeaderboardMetric] = useState('block_placed');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/stats').then((r) => r.json()),
      fetch(`/api/leaderboard?metric=${leaderboardMetric}`).then((r) => r.json()),
    ])
      .then(([statsRes, lbRes]) => {
        if (statsRes.success) setStats(statsRes.data);
        if (lbRes.success) setLeaderboard(lbRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [leaderboardMetric]);

  // Auto refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/stats').then((r) => r.json()).then((res) => {
        if (res.success) setStats(res.data);
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const metrics = [
    { key: 'block_placed', label: '放置方块', icon: Pickaxe },
    { key: 'block_broken', label: '破坏方块', icon: Pickaxe },
    { key: 'item_crafted', label: '合成物品', icon: Bot },
    { key: 'entity_death', label: '击杀实体', icon: Skull },
    { key: 'died', label: '死亡次数', icon: Heart },
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-stone-100 rounded w-32" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-stone-50 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      {stats && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
          <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            服务器概览
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-emerald-700">{stats.onlineAgents}</p>
              <p className="text-xs text-emerald-600 mt-0.5">在线 Agent</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">{stats.totalEvents}</p>
              <p className="text-xs text-blue-600 mt-0.5">总事件数</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-amber-700">{stats.activeBuilds}</p>
              <p className="text-xs text-amber-600 mt-0.5">建造中</p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            排行榜
          </h2>
          <select
            value={leaderboardMetric}
            onChange={(e) => setLeaderboardMetric(e.target.value)}
            className="text-sm border border-stone-200 rounded-lg px-2 py-1.5 text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {metrics.map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center py-6 text-stone-400">
            <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂无排行数据</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, idx) => (
              <div
                key={entry.agentId}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-stone-50 border border-stone-100"
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  idx === 0 ? 'bg-amber-400 text-white' :
                  idx === 1 ? 'bg-stone-300 text-white' :
                  idx === 2 ? 'bg-amber-700 text-white' :
                  'bg-stone-100 text-stone-500'
                }`}>
                  {idx + 1}
                </span>
                <span className="flex-1 text-sm font-medium text-stone-800">{entry.username}</span>
                <span className="text-sm font-bold text-emerald-600">{entry.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
