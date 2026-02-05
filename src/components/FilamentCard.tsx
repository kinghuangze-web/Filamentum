'use client';

import React, { memo } from 'react';
import { Coins, Ticket, Thermometer, Tag, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { Filament } from '../lib/types';
import { PLATE_TYPES } from '../lib/constants';
import { SpoolRing } from './SpoolRing';

interface FilamentCardProps {
    data: Filament;
    onClick?: (filament: Filament) => void;
    onEdit?: (filament: Filament) => void;
    onDelete?: (id: string) => void;
    onViewWorks?: (filament: Filament) => void;
}

export const FilamentCard = memo(function FilamentCard({ data: item, onClick, onEdit, onDelete, onViewWorks }: FilamentCardProps) {
    const percent = item.weight > 0 ? Math.min(100, Math.max(0, (item.remaining / item.weight) * 100)) : 0;
    const costPerG = item.weight > 0 ? (item.price / item.weight) : 0;
    const defPlateId = item.defaultPlate || 'textured';
    const defPlateLabel = PLATE_TYPES.find(p => p.id === defPlateId)?.label.split('/')[0] || '热床';
    const plateTemp = item.bedSettings?.[defPlateId] || { initial: 0, other: 0 };

    return (
        <div
            onClick={() => onClick?.(item)}
            className="bg-white rounded-2xl border border-stone-100 shadow-md shadow-stone-200/60 hover:shadow-xl hover:shadow-amber-100/50 hover:-translate-y-1.5 cursor-pointer transition-all duration-300 group relative overflow-hidden"
        >
            <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                        <div className="bg-stone-800 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">
                            1 卷
                        </div>
                        <div className="bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-1 rounded-md border border-amber-100 flex items-center gap-1">
                            <Coins size={10} />
                            ¥{costPerG.toFixed(4)}/g
                        </div>
                    </div>
                    <SpoolRing percentage={percent} color={item.color} size={52} materialType={item.type} />
                </div>

                <div className="flex items-center gap-3 mb-4">
                    <div
                        className="w-11 h-11 rounded-full shadow-inner border border-stone-100 flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                    />
                    <div className="min-w-0">
                        <h3 className="font-bold text-stone-800 text-base leading-tight tracking-tight group-hover:text-amber-600 transition-colors truncate">
                            {item.brand}
                        </h3>
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                            {item.type}
                        </span>
                    </div>
                </div>

                <div className="text-xs text-stone-500 space-y-2.5 mb-5 bg-stone-50/80 p-4 rounded-xl border border-stone-100/50">
                    <div className="flex justify-between items-center group/item hover:bg-white rounded px-1 transition-colors">
                        <span className="flex items-center gap-1.5"><Ticket size={12} className="text-stone-400" /> 颜色</span>
                        <span className="font-bold text-stone-700 truncate max-w-[100px]">{item.colorName}</span>
                    </div>
                    <div className="flex justify-between items-center group/item hover:bg-white rounded px-1 transition-colors">
                        <span className="flex items-center gap-1.5"><Thermometer size={12} className="text-stone-400" /> 喷嘴</span>
                        <span className="font-mono font-bold text-stone-700">{item.tempMin}-{item.tempMax}°C</span>
                    </div>
                    <div className="flex justify-between items-center group/item hover:bg-white rounded px-1 transition-colors">
                        <span className="flex items-center gap-1.5"><Tag size={12} className="text-stone-400" /> {defPlateLabel}</span>
                        <span className="font-mono font-bold text-stone-700">{plateTemp.initial}/{plateTemp.other}°C</span>
                    </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-stone-100">
                    <div className={`text-xs font-medium flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${percent < 20 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        <div className={`w-2 h-2 rounded-full ${percent < 20 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                        <span className="font-mono font-bold">{item.remaining}g</span>
                        <span className="opacity-50">/</span>
                        <span className="font-mono">{item.weight}g</span>
                    </div>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                        <button
                            onClick={(e) => { e.stopPropagation(); onViewWorks?.(item); }}
                            className="p-2 hover:bg-indigo-50 rounded-lg text-stone-400 hover:text-indigo-600 transition-colors"
                            title="查看作品"
                        >
                            <ImageIcon size={16} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit?.(item); }}
                            className="p-2 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-amber-600 transition-colors"
                            title="编辑"
                        >
                            <Edit size={16} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete?.(item.id); }}
                            className="p-2 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-rose-500 transition-colors"
                            title="删除"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});
