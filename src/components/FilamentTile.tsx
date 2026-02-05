'use client';

import React, { memo } from 'react';
import { Filament } from '../lib/types';
import { SpoolRing } from './SpoolRing';

interface FilamentTileProps {
    data: Filament;
    onClick?: (filament: Filament) => void;
    // Tile view usually doesn't show actions directly to keep it clean, 
    // or shows them on context menu/hover. For simplicity, we keep it clean.
}

export const FilamentTile = memo(function FilamentTile({ data: item, onClick }: FilamentTileProps) {
    const percent = item.weight > 0 ? Math.min(100, Math.max(0, (item.remaining / item.weight) * 100)) : 0;

    return (
        <div
            onClick={() => onClick?.(item)}
            className="group flex items-center gap-3 p-3 bg-white rounded-xl border border-stone-100 shadow-sm hover:shadow-md hover:border-indigo-100 hover:bg-indigo-50/10 cursor-pointer transition-all duration-200"
        >
            {/* Visual: Spool Ring */}
            <div className="flex-shrink-0 relative">
                <SpoolRing percentage={percent} color={item.color} size={42} materialType={item.type} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="font-bold text-stone-800 text-sm truncate leading-tight mb-0.5">
                    {item.brand} {item.type}
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-stone-500 truncate max-w-[80px]">{item.colorName}</span>
                    <span className={`font-mono font-bold ${percent < 20 ? 'text-rose-500' : 'text-emerald-600'}`}>
                        {item.remaining}g
                    </span>
                </div>
            </div>

            {/* Qty Badge */}
            <div className="bg-stone-100 text-stone-500 text-[10px] font-bold px-1.5 py-0.5 rounded border border-stone-200 whitespace-nowrap group-hover:bg-white group-hover:text-stone-800 transition-colors">
                1 卷
            </div>
        </div>
    );
});
