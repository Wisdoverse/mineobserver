'use client';

import { useMemo } from 'react';
import type { Position } from '@/lib/types/agent';

interface MiniMapProps {
  position: Position;
  yaw: number;
  blocks?: Array<{ position: Position; type: string; name: string }>;
  entities?: Array<{ type: string; name?: string; position: Position; distance: number }>;
}

const BLOCK_COLORS: Record<string, string> = {
  // 矿石
  diamond_ore: '#4AFFEA',
  gold_ore: '#FFD700',
  iron_ore: '#D4D4D4',
  coal_ore: '#4A4A4A',
  emerald_ore: '#50C878',
  lapis_ore: '#266FFF',
  redstone_ore: '#FF0000',
  copper_ore: '#D77A4D',
  nether_gold_ore: '#FFD700',
  nether_quartz_ore: '#FFFFFF',
  ancient_debris: '#6B4C4C',
  // 方块
  grass_block: '#5D8C3E',
  dirt: '#8B6B4A',
  stone: '#7F7F7F',
  cobblestone: '#6B6B6B',
  oak_log: '#8B5A2B',
  sand: '#E2C879',
  gravel: '#8B8682',
  clay: '#9EA4B0',
  water: '#3498DB',
  lava: '#FF4500',
  // 植被
  oak_leaves: '#228B22',
  grass: '#32CD32',
  tall_grass: '#228B22',
  flowers: '#FF69B4',
  mushrooms: '#FF6347',
  // 结构
  oak_planks: '#C4A574',
  cobweb: '#DCDCDC',
  iron_bars: '#C0C0C0',
  fence: '#8B4513',
  torch: '#FFA500',
  redstone_torch: '#FF0000',
  // 容器
  chest: '#D2691E',
  ender_chest: '#1E90FF',
  furnace: '#696969',
  crafting_table: '#C4A574',
  // 默认
  default: '#888888',
};

function getBlockColor(blockType: string): string {
  const normalized = blockType.toLowerCase().replace(/minecraft:/, '');
  return BLOCK_COLORS[normalized] || BLOCK_COLORS.default;
}

const ENTITY_ICONS: Record<string, string> = {
  player: '👤',
  zombie: '🧟',
  skeleton: '💀',
  creeper: '🟩',
  spider: '🕷️',
  enderman: '🖤',
  pig: '🐷',
  cow: '🐄',
  sheep: '🐑',
  chicken: '🐔',
  default: '❓',
};

function getEntityIcon(entityType: string): string {
  const normalized = entityType.toLowerCase().replace(/minecraft:/, '');
  return ENTITY_ICONS[normalized] || ENTITY_ICONS.default;
}

export function MiniMap({ position, yaw, blocks = [], entities = [] }: MiniMapProps) {
  const RADIUS = 16;
  const SIZE = 200;
  const CELL_SIZE = SIZE / (RADIUS * 2 + 1);

  // 过滤范围内的方块和实体
  const visibleBlocks = useMemo(() => {
    return blocks.filter((b) => {
      const dx = Math.abs(b.position.x - position.x);
      const dz = Math.abs(b.position.z - position.z);
      return dx <= RADIUS && dz <= RADIUS && b.position.y >= position.y - 2 && b.position.y <= position.y + 3;
    });
  }, [blocks, position]);

  const visibleEntities = useMemo(() => {
    return entities
      .filter((e) => {
        const dx = Math.abs(e.position.x - position.x);
        const dz = Math.abs(e.position.z - position.z);
        return dx <= RADIUS && dz <= RADIUS;
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10);
  }, [entities, position]);

  // 绘制地图
  const mapGrid = useMemo(() => {
    const grid: Array<Array<{ color: string; type: string; y: number } | null>> = [];
    for (let x = -RADIUS; x <= RADIUS; x++) {
      grid.push([]);
      for (let z = -RADIUS; z <= RADIUS; z++) {
        const worldX = position.x + x;
        const worldZ = position.z + z;

        // 查找该位置最高的方块
        const blocksAtPos = visibleBlocks.filter(
          (b) => b.position.x === worldX && b.position.z === worldZ
        );
        const topBlock = blocksAtPos.sort((a, b) => b.position.y - a.position.y)[0];

        if (topBlock) {
          grid[x + RADIUS].push({
            color: getBlockColor(topBlock.type),
            type: topBlock.type,
            y: topBlock.position.y,
          });
        } else {
          grid[x + RADIUS].push(null);
        }
      }
    }
    return grid;
  }, [position, visibleBlocks]);

  // 计算玩家图标旋转
  const playerRotation = -yaw * (Math.PI / 180);

  return (
    <div className="space-y-2">
      {/* 坐标显示 */}
      <div className="flex items-center justify-between text-sm">
        <div className="font-mono">
          <span className="text-muted-foreground">X:</span> {position.x}{' '}
          <span className="text-muted-foreground">Y:</span> {position.y}{' '}
          <span className="text-muted-foreground">Z:</span> {position.z}
        </div>
        <div className="text-muted-foreground">
          朝向: {Math.round(yaw)}°
        </div>
      </div>

      {/* 地图区域 */}
      <div className="relative bg-slate-900 rounded-lg overflow-hidden" style={{ width: SIZE, height: SIZE }}>
        {/* 网格 */}
        <svg width={SIZE} height={SIZE} className="absolute inset-0">
          {mapGrid.map((row, xi) =>
            row.map((cell, zi) => {
              if (!cell) {
                return (
                  <rect
                    key={`${xi}-${zi}`}
                    x={zi * CELL_SIZE}
                    y={xi * CELL_SIZE}
                    width={CELL_SIZE}
                    height={CELL_SIZE}
                    fill="#1a1a2e"
                    stroke="#2a2a4e"
                    strokeWidth={0.5}
                  />
                );
              }
              return (
                <rect
                  key={`${xi}-${zi}`}
                  x={zi * CELL_SIZE}
                  y={xi * CELL_SIZE}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  fill={cell.color}
                  stroke="#333"
                  strokeWidth={0.5}
                  opacity={0.7 + Math.min((cell.y - position.y + 2) * 0.1, 0.3)}
                />
              );
            })
          )}
        </svg>

        {/* 玩家指示器 */}
        <div
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) rotate(${playerRotation}rad)`,
          }}
        >
          <div className="relative">
            {/* 方向箭头 */}
            <svg width="20" height="20" viewBox="0 0 20 20" className="text-yellow-400">
              <polygon points="10,2 16,18 10,14 4,18" fill="currentColor" />
            </svg>
          </div>
        </div>

        {/* 方向标记 */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] text-white/50">N</div>
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-white/50">S</div>
        <div className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] text-white/50">W</div>
        <div className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-white/50">E</div>

        {/* 范围圈 */}
        <svg width={SIZE} height={SIZE} className="absolute inset-0 pointer-events-none">
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS * CELL_SIZE} fill="none" stroke="white" strokeWidth={1} strokeDasharray="4,4" opacity={0.3} />
        </svg>
      </div>

      {/* 附近实体列表 */}
      {visibleEntities.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">附近实体</p>
          <div className="flex flex-wrap gap-1">
            {visibleEntities.map((entity, i) => (
              <div
                key={i}
                className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs"
                title={`${entity.type} - ${entity.distance.toFixed(1)}m`}
              >
                <span>{getEntityIcon(entity.type)}</span>
                <span className="text-muted-foreground">{entity.distance.toFixed(0)}m</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
