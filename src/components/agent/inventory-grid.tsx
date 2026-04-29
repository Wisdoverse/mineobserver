'use client';

import { type InventorySlot } from '@/lib/types/agent';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface InventoryGridProps {
  inventory: InventorySlot[];
  equipment?: {
    head?: InventorySlot;
    chest?: InventorySlot;
    legs?: InventorySlot;
    feet?: InventorySlot;
    mainhand?: InventorySlot;
    offhand?: InventorySlot;
  };
}

const SLOT_ICONS: Record<string, string> = {
  // 工具
  diamond_sword: '⚔️',
  iron_sword: '⚔️',
  wooden_sword: '⚔️',
  bow: '🏹',
  crossbow: '🏹',
  trident: '🔱',
  shield: '🛡️',
  // 挖掘工具
  diamond_pickaxe: '⛏️',
  iron_pickaxe: '⛏️',
  wooden_pickaxe: '⛏️',
  diamond_axe: '🪓',
  iron_axe: '🪓',
  wooden_axe: '🪓',
  diamond_shovel: '铲',
  iron_shovel: '铲',
  wooden_shovel: '铲',
  diamond_hoe: '锄',
  iron_hoe: '锄',
  // 方块
  dirt: '🟫',
  stone: '⬜',
  cobblestone: '🔲',
  grass_block: '🟩',
  sand: '🟨',
  oak_log: '🟫',
  oak_planks: '🟧',
  glass: '🔷',
  // 矿物
  diamond: '💎',
  gold_ingot: '🥇',
  iron_ingot: '🔩',
  coal: '⬛',
  emerald: '💚',
  lapis_lazuli: '🔵',
  redstone: '🔴',
  // 食物
  apple: '🍎',
  bread: '🍞',
  cooked_beef: '🥩',
  cooked_chicken: '🍗',
  cooked_porkchop: '🥓',
  golden_apple: '🍎',
  carrot: '🥕',
  potato: '🥔',
  // 生物
  skeleton_skull: '💀',
  zombie_head: '🧟',
  creeper_head: '🟩',
  dragon_head: '🐉',
  // 特殊
  compass: '🧭',
  clock: '🕐',
  map: '🗺️',
  book: '📖',
  bookshelf: '📚',
  ender_pearl: '🔮',
  ender_eye: '👁️',
  firework_rocket: '🎆',
  potion: '🧪',
  splash_potion: '🧴',
  experience_bottle: '✨',
  // 羊毛
  white_wool: '🧶',
  // 默认
  default: '📦',
};

function getItemIcon(itemName: string): string {
  const normalized = itemName.toLowerCase().replace(/minecraft:/, '');
  return SLOT_ICONS[normalized] || SLOT_ICONS.default;
}

function InventorySlotDisplay({ slot }: { slot: InventorySlot }) {
  const icon = getItemIcon(slot.name);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative w-10 h-10 bg-muted rounded border flex items-center justify-center text-lg">
            {icon}
            {slot.count > 1 && (
              <span className="absolute bottom-0 right-0 text-[10px] font-mono bg-background/80 px-0.5 rounded">
                {slot.count}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="font-medium">{slot.displayName || slot.name}</p>
          {slot.count > 1 && <p className="text-xs text-muted-foreground">数量: {slot.count}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function EmptySlot() {
  return <div className="w-10 h-10 bg-muted/30 rounded border border-dashed" />;
}

export function InventoryGrid({ inventory, equipment }: InventoryGridProps) {
  // 填充空槽位到 27 格（2行 x 9列，主背包）
  const slots = Array(27).fill(null);
  inventory.forEach((item) => {
    if (item.slot >= 9 && item.slot < 36) {
      slots[item.slot - 9] = item;
    }
  });

  return (
    <div className="space-y-4">
      {/* 装备栏 */}
      {equipment && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">装备栏</p>
          <div className="flex gap-1">
            {/* 头部 */}
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs text-muted-foreground">头部</div>
              {equipment.head ? (
                <InventorySlotDisplay slot={equipment.head} />
              ) : (
                <EmptySlot />
              )}
            </div>
            {/* 胸甲 */}
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs text-muted-foreground">胸甲</div>
              {equipment.chest ? (
                <InventorySlotDisplay slot={equipment.chest} />
              ) : (
                <EmptySlot />
              )}
            </div>
            {/* 护腿 */}
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs text-muted-foreground">护腿</div>
              {equipment.legs ? (
                <InventorySlotDisplay slot={equipment.legs} />
              ) : (
                <EmptySlot />
              )}
            </div>
            {/* 靴子 */}
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs text-muted-foreground">靴子</div>
              {equipment.feet ? (
                <InventorySlotDisplay slot={equipment.feet} />
              ) : (
                <EmptySlot />
              )}
            </div>
            {/* 主手 */}
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs text-muted-foreground">主手</div>
              {equipment.mainhand ? (
                <InventorySlotDisplay slot={equipment.mainhand} />
              ) : (
                <EmptySlot />
              )}
            </div>
            {/* 副手 */}
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs text-muted-foreground">副手</div>
              {equipment.offhand ? (
                <InventorySlotDisplay slot={equipment.offhand} />
              ) : (
                <EmptySlot />
              )}
            </div>
          </div>
        </div>
      )}

      {/* 热键栏 */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">热键栏 (1-9)</p>
        <div className="flex gap-1">
          {Array(9)
            .fill(null)
            .map((_, i) => {
              const hotbarItem = inventory.find((item) => item.slot === i);
              return (
                <div key={i} className="relative">
                  <span className="absolute -top-1 -left-1 text-[10px] text-muted-foreground">
                    {i + 1}
                  </span>
                  {hotbarItem ? (
                    <InventorySlotDisplay slot={hotbarItem} />
                  ) : (
                    <EmptySlot />
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* 主背包 */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">背包</p>
        <div className="grid grid-cols-9 gap-1">
          {slots.map((slot, i) => (
            <div key={i}>{slot ? <InventorySlotDisplay slot={slot} /> : <EmptySlot />}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
