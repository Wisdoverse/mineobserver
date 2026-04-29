'use client';

import { Users, Crown, Shield } from 'lucide-react';

interface TeamMember {
  agentId: string;
  username: string;
  role: string;
  status?: string;
  task?: { type: string; progress: number };
}

interface TeamUpdate {
  teamId: string;
  teamName: string;
  action: string;
  leader: string;
  members: TeamMember[];
  task?: { type: string; progress: number };
  timestamp: number;
}

interface TeamPanelProps {
  teams: Map<string, TeamUpdate>;
  currentAgentId?: string;
}

export function TeamPanel({ teams, currentAgentId }: TeamPanelProps) {
  if (teams.size === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
      <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-emerald-600" />
        团队协作
        <span className="text-sm font-normal text-stone-400 ml-1">({teams.size})</span>
      </h2>
      <div className="space-y-3">
        {Array.from(teams.entries()).map(([teamId, team]) => {
          const members = team.members || [];

          return (
            <div key={teamId} className="border border-stone-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-stone-900 text-sm">{team.teamName}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  team.action === 'disbanded'
                    ? 'bg-stone-100 text-stone-500'
                    : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {team.action === 'disbanded' ? '已解散' : team.action === 'created' ? '新创建' : '活跃'}
                </span>
              </div>

              {/* Members */}
              <div className="space-y-1.5">
                {members.map((member) => (
                  <div key={member.agentId} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {member.role === 'leader' ? (
                        <Crown className="w-3.5 h-3.5 text-amber-500" />
                      ) : (
                        <Shield className="w-3.5 h-3.5 text-blue-400" />
                      )}
                      <span className={`${member.agentId === currentAgentId ? 'font-semibold text-emerald-700' : 'text-stone-700'}`}>
                        {member.username}
                      </span>
                    </div>
                    {member.task && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-stone-500">{member.task.type}</span>
                        <div className="w-12 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.round(member.task.progress * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Team task */}
              {team.task && (
                <div className="mt-3 pt-3 border-t border-stone-100">
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span>团队任务: {team.task.type}</span>
                    <span>{Math.round(team.task.progress * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${Math.round(team.task.progress * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
