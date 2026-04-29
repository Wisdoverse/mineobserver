'use client';

import { useState } from 'react';
import { Camera, ChevronLeft, ChevronRight, MapPin, Clock } from 'lucide-react';

interface VisionCapture {
  captureId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  dimensions: { width: number; height: number };
  position: { x: number; y: number; z: number };
  description?: string;
  sceneInfo?: { biome?: string; weather?: string; timeOfDay?: string; [key: string]: string | undefined };
  timestamp: number;
}

interface VisionGalleryProps {
  visions: VisionCapture[];
  agentName: string;
}

export function VisionGallery({ visions, agentName }: VisionGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (visions.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5 text-emerald-600" />
          截图画廊
        </h2>
        <div className="text-center py-8 text-stone-400">
          <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">暂无截图</p>
          <p className="text-xs mt-1">Agent 上报截图后将在此展示</p>
        </div>
      </div>
    );
  }

  const selected = selectedIndex !== null ? visions[selectedIndex] : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
      <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
        <Camera className="w-5 h-5 text-emerald-600" />
        截图画廊
        <span className="text-sm font-normal text-stone-400 ml-1">({visions.length})</span>
      </h2>

      {/* 缩略图网格 */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {visions.map((v, idx) => (
          <button
            key={v.captureId}
            onClick={() => setSelectedIndex(idx)}
            className={`aspect-square rounded-lg overflow-hidden border-2 transition-all hover:border-emerald-400 ${
              selectedIndex === idx ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-stone-200'
            }`}
          >
            <img
              src={v.thumbnailUrl || v.imageUrl}
              alt={v.description || `截图 ${idx + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {/* 选中截图详情 */}
      {selected && (
        <div className="border border-stone-200 rounded-xl overflow-hidden">
          <div className="relative">
            <img
              src={selected.imageUrl}
              alt={selected.description || '截图'}
              className="w-full max-h-64 object-contain bg-stone-50"
            />
            {/* 导航按钮 */}
            {visions.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedIndex(Math.max(0, (selectedIndex ?? 0) - 1))}
                  disabled={(selectedIndex ?? 0) === 0}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedIndex(Math.min(visions.length - 1, (selectedIndex ?? 0) + 1))}
                  disabled={(selectedIndex ?? 0) === visions.length - 1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
          <div className="p-3 text-sm">
            <div className="flex items-center gap-4 text-stone-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {selected.position.x.toFixed(0)}, {selected.position.y.toFixed(0)}, {selected.position.z.toFixed(0)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(selected.timestamp).toLocaleTimeString()}
              </span>
            </div>
            {selected.description && (
              <p className="text-stone-700 mt-1">{selected.description}</p>
            )}
            {selected.sceneInfo && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selected.sceneInfo.biome && (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs">
                    {String(selected.sceneInfo.biome)}
                  </span>
                )}
                {selected.sceneInfo.weather && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                    {String(selected.sceneInfo.weather)}
                  </span>
                )}
                {selected.sceneInfo.timeOfDay && (
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs">
                    {String(selected.sceneInfo.timeOfDay)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
