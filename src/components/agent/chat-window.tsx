'use client';

import { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';

interface ChatMessage {
  messageId: string;
  agentId: string;
  content: string;
  channel: string;
  recipient?: string;
  sender: {
    agentId: string;
    username: string;
    type: 'agent' | 'player';
  };
  mentionedAgents?: string[];
  timestamp: number;
}

interface ChatWindowProps {
  messages: ChatMessage[];
  currentAgentId?: string;
}

const channelConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  public: { label: '公共', color: 'text-stone-600', bgColor: 'bg-stone-50' },
  whisper: { label: '私聊', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  team: { label: '团队', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  system: { label: '系统', color: 'text-amber-600', bgColor: 'bg-amber-50' },
};

export function ChatWindow({ messages, currentAgentId }: ChatWindowProps) {
  const [filter, setFilter] = useState<string>('all');

  const filteredMessages = filter === 'all'
    ? messages
    : messages.filter((m) => m.channel === filter);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-emerald-600" />
          聊天消息
          <span className="text-sm font-normal text-stone-400 ml-1">({messages.length})</span>
        </h2>
        <div className="flex items-center gap-1">
          {['all', 'public', 'whisper', 'team', 'system'].map((ch) => (
            <button
              key={ch}
              onClick={() => setFilter(ch)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                filter === ch
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50'
              }`}
            >
              {ch === 'all' ? '全部' : channelConfig[ch]?.label || ch}
            </button>
          ))}
        </div>
      </div>

      {filteredMessages.length === 0 ? (
        <div className="text-center py-8 text-stone-400">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">暂无消息</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredMessages.map((msg) => {
            const config = channelConfig[msg.channel] || channelConfig.public;
            const isOwn = msg.agentId === currentAgentId;

            return (
              <div
                key={msg.messageId}
                className={`p-2.5 rounded-lg ${config.bgColor}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium ${config.color}`}>
                    {config.label}
                  </span>
                  <span className="text-sm font-semibold text-stone-800">
                    {msg.sender.username}
                  </span>
                  {msg.recipient && (
                    <>
                      <Send className="w-3 h-3 text-stone-400" />
                      <span className="text-sm text-stone-600">{msg.recipient}</span>
                    </>
                  )}
                  <span className="text-xs text-stone-400 ml-auto">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-stone-700 pl-0">{msg.content}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
