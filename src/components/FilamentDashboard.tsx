'use client';

import React, { useMemo, useState } from 'react';
import { Filament } from '../lib/types';
import { Package, Tags, Palette, Scale, X, Filter, ChevronDown, ChevronRight } from 'lucide-react';

// 筛选器类型
export interface DashboardFilter {
    type: 'brand' | 'material' | 'color' | null;
    value: string | null;
}

interface FilamentDashboardProps {
    filaments: Filament[];
    onFilterChange: (filter: DashboardFilter) => void;
    onClose: () => void;
    currentFilter: DashboardFilter;
}

// 获取材料类型的主类别
function getMainType(type: string): string {
    const upperType = type.toUpperCase();
    if (upperType.includes('PLA')) return 'PLA';
    if (upperType.includes('PETG')) return 'PETG';
    if (upperType.includes('ABS')) return 'ABS';
    if (upperType.includes('TPU')) return 'TPU';
    if (upperType.includes('ASA')) return 'ASA';
    if (upperType.includes('PA') || upperType.includes('NYLON')) return 'PA';
    if (upperType.includes('PC')) return 'PC';
    return type;
}

// 预定义颜色映射
const COLOR_MAP: Record<string, string> = {
    '黑': '#1a1a1a', '白': '#f5f5f5', '红': '#ef4444', '蓝': '#3b82f6',
    '绿': '#22c55e', '黄': '#eab308', '橙': '#f97316', '紫': '#a855f7',
    '粉': '#ec4899', '灰': '#6b7280', '透明': '#e5e5e5', '金': '#f59e0b',
    '银': '#9ca3af', '肤': '#fdbf6f', '薄荷': '#5eead4', '棕': '#92400e',
};

function getColorHex(colorName: string, fallbackHex?: string): string {
    if (fallbackHex && fallbackHex.startsWith('#')) return fallbackHex;
    for (const [key, hex] of Object.entries(COLOR_MAP)) {
        if (colorName?.includes(key)) return hex;
    }
    return fallbackHex || '#9ca3af';
}

export function FilamentDashboard({ filaments, onFilterChange, onClose, currentFilter }: FilamentDashboardProps) {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['brand', 'type']));

    // 计算统计数据
    const stats = useMemo(() => {
        const totalWeight = filaments.reduce((sum, f) => sum + (f.weight || 0), 0);
        const brands = new Set(filaments.map(f => f.brand).filter(Boolean));
        const types = new Set(filaments.map(f => getMainType(f.type)));
        const colors = new Set(filaments.map(f => f.colorName).filter(Boolean));

        return {
            totalWeight: (totalWeight / 1000).toFixed(1),
            brandCount: brands.size,
            typeCount: types.size,
            colorCount: colors.size,
            totalSpools: filaments.length
        };
    }, [filaments]);

    // 品牌分布
    const brandDistribution = useMemo(() => {
        const brandCounts: Record<string, number> = {};
        filaments.forEach(f => {
            const brand = f.brand || '未知';
            brandCounts[brand] = (brandCounts[brand] || 0) + 1;
        });
        return Object.entries(brandCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }, [filaments]);

    // 材料类型分布
    const typeDistribution = useMemo(() => {
        const typeCounts: Record<string, number> = {};
        filaments.forEach(f => {
            const type = getMainType(f.type);
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
        return Object.entries(typeCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }, [filaments]);

    // 颜色分布
    const colorDistribution = useMemo(() => {
        const colorCounts: Record<string, { count: number; hex: string }> = {};
        filaments.forEach(f => {
            const colorName = f.colorName || '未知';
            const hex = getColorHex(colorName, f.color);
            if (!colorCounts[colorName]) {
                colorCounts[colorName] = { count: 0, hex };
            }
            colorCounts[colorName].count += 1;
        });
        return Object.entries(colorCounts)
            .map(([name, data]) => ({ name, count: data.count, color: data.hex }))
            .sort((a, b) => b.count - a.count);
    }, [filaments]);

    const handleBrandClick = (brand: string) => {
        if (currentFilter.type === 'brand' && currentFilter.value === brand) {
            onFilterChange({ type: null, value: null });
        } else {
            onFilterChange({ type: 'brand', value: brand });
        }
    };

    const handleTypeClick = (type: string) => {
        if (currentFilter.type === 'material' && currentFilter.value === type) {
            onFilterChange({ type: null, value: null });
        } else {
            onFilterChange({ type: 'material', value: type });
        }
    };

    const handleColorClick = (color: string) => {
        if (currentFilter.type === 'color' && currentFilter.value === color) {
            onFilterChange({ type: null, value: null });
        } else {
            onFilterChange({ type: 'color', value: color });
        }
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(section)) next.delete(section);
            else next.add(section);
            return next;
        });
    };

    return (
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-100 overflow-hidden">
            {/* 头部 - 紧凑版 */}
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100/50">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg text-white">
                        <Package size={16} />
                    </div>
                    <span className="font-bold text-stone-700">耗材统计</span>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-white/50 rounded-lg text-stone-400 hover:text-stone-600">
                    <X size={18} />
                </button>
            </div>

            {/* 当前筛选 */}
            {currentFilter.type && (
                <div className="px-4 py-2 bg-violet-50 border-b border-violet-100">
                    <button
                        onClick={() => onFilterChange({ type: null, value: null })}
                        className="flex items-center gap-1.5 text-sm text-violet-700 font-medium hover:text-violet-900"
                    >
                        <Filter size={14} />
                        <span className="truncate">{currentFilter.value}</span>
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* 统计概览 - 2x2网格 */}
            <div className="grid grid-cols-2 gap-2 p-3">
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-stone-800">{stats.totalWeight}kg</div>
                    <div className="text-[10px] text-stone-500">总重量 · {stats.totalSpools}卷</div>
                </div>
                <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-stone-800">{stats.brandCount}</div>
                    <div className="text-[10px] text-stone-500">品牌</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-stone-800">{stats.typeCount}</div>
                    <div className="text-[10px] text-stone-500">材料类型</div>
                </div>
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-stone-800">{stats.colorCount}</div>
                    <div className="text-[10px] text-stone-500">颜色</div>
                </div>
            </div>

            {/* 品牌分布 */}
            <div className="border-t border-stone-100">
                <button
                    onClick={() => toggleSection('brand')}
                    className="w-full flex justify-between items-center px-4 py-3 hover:bg-stone-50"
                >
                    <span className="flex items-center gap-2 text-sm font-bold text-stone-700">
                        <Tags size={14} className="text-violet-500" /> 品牌
                    </span>
                    {expandedSections.has('brand') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {expandedSections.has('brand') && (
                    <div className="px-3 pb-3 space-y-1">
                        {brandDistribution.slice(0, 8).map((item, idx) => {
                            const isActive = currentFilter.type === 'brand' && currentFilter.value === item.name;
                            const maxCount = brandDistribution[0]?.count || 1;
                            const width = Math.max(10, (item.count / maxCount) * 100);
                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleBrandClick(item.name)}
                                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all ${isActive ? 'bg-violet-100 ring-1 ring-violet-300' : 'hover:bg-stone-50'}`}
                                >
                                    <span className={`text-xs font-medium truncate flex-1 ${isActive ? 'text-violet-700' : 'text-stone-600'}`}>
                                        {item.name}
                                    </span>
                                    <div className="w-16 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${isActive ? 'bg-violet-400' : 'bg-amber-400'}`}
                                            style={{ width: `${width}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] text-stone-400 w-6 text-right">{item.count}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 材料类型分布 */}
            <div className="border-t border-stone-100">
                <button
                    onClick={() => toggleSection('type')}
                    className="w-full flex justify-between items-center px-4 py-3 hover:bg-stone-50"
                >
                    <span className="flex items-center gap-2 text-sm font-bold text-stone-700">
                        <Package size={14} className="text-emerald-500" /> 材料类型
                    </span>
                    {expandedSections.has('type') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {expandedSections.has('type') && (
                    <div className="px-3 pb-3 space-y-1">
                        {typeDistribution.map((item, idx) => {
                            const isActive = currentFilter.type === 'material' && currentFilter.value === item.name;
                            const maxCount = typeDistribution[0]?.count || 1;
                            const width = Math.max(10, (item.count / maxCount) * 100);
                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleTypeClick(item.name)}
                                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all ${isActive ? 'bg-violet-100 ring-1 ring-violet-300' : 'hover:bg-stone-50'}`}
                                >
                                    <span className={`text-xs font-medium truncate flex-1 ${isActive ? 'text-violet-700' : 'text-stone-600'}`}>
                                        {item.name}
                                    </span>
                                    <div className="w-16 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${isActive ? 'bg-violet-400' : 'bg-emerald-400'}`}
                                            style={{ width: `${width}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] text-stone-400 w-6 text-right">{item.count}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 颜色分布 */}
            <div className="border-t border-stone-100">
                <button
                    onClick={() => toggleSection('color')}
                    className="w-full flex justify-between items-center px-4 py-3 hover:bg-stone-50"
                >
                    <span className="flex items-center gap-2 text-sm font-bold text-stone-700">
                        <Palette size={14} className="text-pink-500" /> 颜色
                    </span>
                    {expandedSections.has('color') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {expandedSections.has('color') && (
                    <div className="px-3 pb-3">
                        <div className="flex flex-wrap gap-1.5">
                            {colorDistribution.map((item, idx) => {
                                const isActive = currentFilter.type === 'color' && currentFilter.value === item.name;
                                const isLight = item.color === '#f5f5f5' || item.color === '#e5e5e5';
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleColorClick(item.name)}
                                        className={`group flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${isActive ? 'ring-2 ring-violet-400 bg-violet-50' : 'hover:bg-stone-50 border border-stone-100'}`}
                                        title={`${item.name}: ${item.count}卷`}
                                    >
                                        <div
                                            className={`w-3 h-3 rounded-full ${isLight ? 'border border-stone-300' : ''}`}
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className="text-stone-500 max-w-[60px] truncate">{item.name}</span>
                                        <span className="text-stone-400">×{item.count}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
