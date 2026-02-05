'use client';

import React, { memo } from 'react';
import { Edit, Trash2, Image as ImageIcon, Sparkles, Coins, Thermometer } from 'lucide-react';
import { Filament } from '../lib/types';
import { SpoolRing } from './SpoolRing';

interface FilamentListProps {
    data: Filament;
    onClick?: (filament: Filament) => void;
    onEdit?: (filament: Filament) => void;
    onDelete?: (id: string) => void;
    onViewWorks?: (filament: Filament) => void;
}

export const FilamentList = memo(function FilamentList({ data: item, onClick, onEdit, onDelete, onViewWorks }: FilamentListProps) {
    const percent = item.weight > 0 ? Math.min(100, Math.max(0, (item.remaining / item.weight) * 100)) : 0;
    const costPerG = item.weight > 0 ? (item.price / item.weight) : 0;

    return (
        <div
            onClick={() => onClick?.(item)}
            className="group flex items-center gap-4 p-3 bg-white border-b border-stone-100 hover:bg-stone-50 transition-colors cursor-pointer last:border-0"
        >
            {/* Status & Icon */}
            <div className="flex-shrink-0 w-10">
                <div className="relative w-8 h-8">
                    <div
                        className="w-8 h-8 rounded-full border border-stone-200 shadow-sm"
                        style={{ backgroundColor: item.color }}
                    />
                    <div className="absolute -bottom-1 -right-1">
                        <SpoolRing percentage={percent} color={item.color} size={16} />
                    </div>
                </div>
            </div>

            {/* Main Info */}
            <div className="flex-1 min-w-[180px]">
                <div className="font-bold text-stone-800 text-sm truncate">{item.brand} {item.type}</div>
                <div className="text-xs text-stone-500 font-medium truncate">{item.colorName}</div>
            </div>

            {/* Stats (Desktop only) */}
            <div className="hidden md:flex flex-col w-32">
                <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-stone-600">{item.remaining}g</span>
                    <span className="text-stone-400">/ {item.weight}g</span>
                </div>
                <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${percent < 20 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${percent}%` }}
                    />
                </div>
            </div>

            {/* Temp */}
            <div className="hidden lg:flex items-center gap-1.5 w-24 text-xs text-stone-500">
                <Thermometer size={14} className="text-stone-400" />
                <span className="font-mono">{item.tempMin}-{item.tempMax}°C</span>
            </div>

            {/* Price */}
            <div className="hidden xl:flex items-center gap-1.5 w-24 text-xs font-mono text-amber-600 font-bold">
                <Coins size={14} className="text-amber-400" />
                ¥{costPerG.toFixed(3)}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => { e.stopPropagation(); onViewWorks?.(item); }}
                    className="p-2 text-stone-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="查看作品"
                >
                    <ImageIcon size={16} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit?.(item); }}
                    className="p-2 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    title="编辑"
                >
                    <Edit size={16} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete?.(item.id); }}
                    className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="删除"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
});
