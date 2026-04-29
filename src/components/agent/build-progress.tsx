'use client';

import { Hammer, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface BuildTask {
  buildId: string;
  blueprintName: string;
  status: string;
  progress: number;
  currentLayer?: number;
  totalLayers?: number;
  blocksPlaced: number;
  blocksTotal: number;
  materialsUsed?: Array<{ material: string; used: number; remaining: number }>;
  startedAt: number;
  estimatedCompletion?: number;
  errors?: string[];
}

interface BuildProgressProps {
  builds: BuildTask[];
  agentName: string;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  started: { icon: Hammer, color: 'text-blue-600', bgColor: 'bg-blue-50', label: '开始建造' },
  in_progress: { icon: Loader2, color: 'text-amber-600', bgColor: 'bg-amber-50', label: '建造中' },
  completed: { icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-50', label: '建造完成' },
  failed: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50', label: '建造失败' },
  cancelled: { icon: XCircle, color: 'text-stone-500', bgColor: 'bg-stone-50', label: '已取消' },
};

export function BuildProgress({ builds, agentName }: BuildProgressProps) {
  if (builds.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
          <Hammer className="w-5 h-5 text-emerald-600" />
          建造进度
        </h2>
        <div className="text-center py-8 text-stone-400">
          <Hammer className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">暂无建造任务</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
      <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
        <Hammer className="w-5 h-5 text-emerald-600" />
        建造进度
        <span className="text-sm font-normal text-stone-400 ml-1">({builds.length})</span>
      </h2>
      <div className="space-y-4">
        {builds.map((build) => {
          const config = statusConfig[build.status] || statusConfig.started;
          const Icon = config.icon;
          const progressPercent = Math.round(build.progress * 100);

          return (
            <div key={build.buildId} className="border border-stone-200 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-stone-900 text-sm">{build.blueprintName}</h3>
                  <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-xs font-medium ${config.color} ${config.bgColor}`}>
                    <Icon className={`w-3 h-3 ${build.status === 'in_progress' ? 'animate-spin' : ''}`} />
                    {config.label}
                  </span>
                </div>
                <span className="text-lg font-bold text-emerald-600">{progressPercent}%</span>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPercent}%`,
                    background: build.status === 'failed'
                      ? 'linear-gradient(to right, #ef4444, #dc2626)'
                      : build.status === 'completed'
                      ? 'linear-gradient(to right, #34d399, #10b981)'
                      : 'linear-gradient(to right, #fbbf24, #f59e0b)',
                  }}
                />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-xs text-stone-500">
                <div>
                  方块: {build.blocksPlaced}/{build.blocksTotal}
                </div>
                {build.currentLayer !== undefined && build.totalLayers !== undefined && (
                  <div>
                    层: {build.currentLayer}/{build.totalLayers}
                  </div>
                )}
                {build.estimatedCompletion && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(build.estimatedCompletion).toLocaleTimeString()}
                  </div>
                )}
              </div>

              {/* Materials */}
              {build.materialsUsed && build.materialsUsed.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {build.materialsUsed.map((m, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-stone-50 text-stone-600 rounded text-xs">
                      {m.material}: {m.used}/{m.used + m.remaining}
                    </span>
                  ))}
                </div>
              )}

              {/* Errors */}
              {build.errors && build.errors.length > 0 && (
                <div className="mt-3 p-2 bg-red-50 rounded-lg">
                  {build.errors.map((err, idx) => (
                    <p key={idx} className="text-xs text-red-600">{err}</p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
