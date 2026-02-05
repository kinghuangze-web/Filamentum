import React from 'react';
import { Package, Coins, Trophy, Activity, TrendingUp } from 'lucide-react';

// 定义统计数据接口
export interface StatsData {
    weight: number; // 总重量 (g)
    value: number;  // 总价值 (¥)
    count: number;  // 已完成创作次数
    spoolCount: number; // 耗材卷数
}

export interface StatsCardsProps {
    data?: StatsData;
}

// 默认 Mock 数据
const DEFAULT_DATA: StatsData = {
    weight: 2450, // 2.45kg
    value: 450,
    count: 12,
    spoolCount: 5
};

export function StatsCards({ data = DEFAULT_DATA }: StatsCardsProps) {
    // 格式化数据
    const weightInKg = (data.weight / 1000).toFixed(2);
    const valueFormatted = data.value.toFixed(0);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 fade-in">
            {/* 卡片 1: 可用创作材料 (耗材 -> Amber) - Bento Style: Clean Card with Warm Accent */}
            <div className="relative overflow-hidden rounded-2xl bg-white border border-stone-100 p-6 shadow-soft hover:shadow-card transition-all duration-300 group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>

                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-amber-100 text-amber-600 rounded-xl shadow-sm group-hover:rotate-6 transition-transform">
                            <Package size={22} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wide">可用创作材料</h3>
                    </div>

                    <div>
                        <div className="flex items-baseline gap-1.5 mb-1">
                            <span className="text-5xl font-black text-stone-800 tracking-tight">{data.spoolCount}</span>
                            <span className="text-xl font-bold text-stone-400">卷</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm font-medium text-stone-400 mb-2">
                            <span>总重 {weightInKg} kg</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-medium text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg w-fit">
                            <Activity size={14} />
                            <span>足够支持多个新作品</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 卡片 2: 当前材料价值 (资产 -> Amber theme but differentiated) */}
            <div className="relative overflow-hidden rounded-2xl bg-white border border-stone-100 p-6 shadow-soft hover:shadow-card transition-all duration-300 group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>

                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-orange-100 text-orange-600 rounded-xl shadow-sm group-hover:rotate-6 transition-transform">
                            <Coins size={22} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wide">当前材料价值</h3>
                    </div>

                    <div>
                        <div className="flex items-baseline gap-1 mb-2">
                            <span className="text-2xl font-bold text-stone-400 mr-1">¥</span>
                            <span className="text-5xl font-black text-stone-800 tracking-tight">{valueFormatted}</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-medium text-stone-500 bg-stone-50 px-3 py-1.5 rounded-lg w-fit">
                            <TrendingUp size={14} />
                            <span>来自你的材料收藏</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 卡片 3: 已完成创作 (状态 -> Emerald) */}
            <div className="relative overflow-hidden rounded-2xl bg-white border border-stone-100 p-6 shadow-soft hover:shadow-card transition-all duration-300 group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>

                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shadow-sm group-hover:rotate-6 transition-transform">
                            <Trophy size={22} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wide">已完成创作</h3>
                    </div>

                    <div>
                        <div className="flex items-baseline gap-1.5 mb-2">
                            <span className="text-5xl font-black text-stone-800 tracking-tight">{data.count}</span>
                            <span className="text-xl font-bold text-stone-400">次</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit">
                            <span>每一次打印都是一次探索</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
