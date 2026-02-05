'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
    X, ExternalLink, Thermometer, Droplets, Clock, Trash2,
    Activity, Gauge, Zap, Image as ImageIcon, Plus, Camera, Link2, Star, Sparkles, Loader2
} from 'lucide-react';
import { Filament, PrintHistory, CostConfig, AIConfig } from '../lib/types';
import { parsePrintScreenshot } from '../lib/ai-service';
import { SpoolRing } from './SpoolRing';

// 热床类型标签
const PLATE_LABELS: Record<string, string> = {
    cool_stabilized: '增稳低温',
    cool: '低温板',
    engineering: '工程板',
    smooth_high_temp: '光面/高温',
    textured: '纹理PEI'
};

interface FilamentDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    filament: Filament | null;
    costConfig: CostConfig;
    aiConfig?: AIConfig | null;
    onEdit?: () => void;
    onDeleteHistory?: (historyId: string) => void;
    onAddWork?: (work: { name: string; weight: number; printTime: number; rating: number; link?: string; image?: string }) => void;
}

export function FilamentDetailModal({
    isOpen,
    onClose,
    filament,
    costConfig,
    aiConfig,
    onEdit,
    onDeleteHistory,
    onAddWork
}: FilamentDetailModalProps) {
    // 作品录入表单
    const [showAddWork, setShowAddWork] = useState(false);
    const [workForm, setWorkForm] = useState({
        name: '',
        weight: 0,
        printTime: 0, // 小时
        rating: 0,
        link: '',
        image: ''
    });
    const [analyzing, setAnalyzing] = useState(false);

    if (!isOpen || !filament) return null;

    const percent = filament.weight > 0 ? Math.min(100, Math.max(0, (filament.remaining / filament.weight) * 100)) : 0;
    const costPerG = filament.price / filament.weight;
    const totalUsed = filament.history.reduce((sum, h) => sum + h.weight, 0);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setWorkForm(p => ({ ...p, image: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAIAnalyze = async () => {
        if (!workForm.image || !aiConfig) return;
        setAnalyzing(true);
        const res = await parsePrintScreenshot(aiConfig, workForm.image);
        setAnalyzing(false);
        if (res.error) {
            alert(res.error);
        } else {
            setWorkForm(p => ({
                ...p,
                weight: res.weight || p.weight,
                printTime: res.printTime || p.printTime
            }));
        }
    };

    const handleAddWork = () => {
        if (!workForm.name || !workForm.weight) return;

        onAddWork?.({
            name: workForm.name,
            weight: workForm.weight,
            printTime: workForm.printTime,
            rating: workForm.rating,
            link: workForm.link || undefined,
            image: workForm.image || undefined
        });

        // 重置表单
        setWorkForm({ name: '', weight: 0, printTime: 0, rating: 0, link: '', image: '' });
        setShowAddWork(false);
    };

    return (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-stone-100 flex justify-between items-start bg-gradient-to-r from-stone-50 to-amber-50/50">
                    <div className="flex gap-6">
                        {/* 颜色大方块 */}
                        <div
                            className="w-24 h-24 rounded-2xl shadow-lg border-4 border-white ring-1 ring-stone-200"
                            style={{ backgroundColor: filament.color }}
                        />

                        {/* 基本信息 */}
                        <div>
                            <h2 className="text-3xl font-black text-stone-800 tracking-tight">
                                {filament.brand}
                            </h2>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="px-3 py-1 rounded-lg text-sm font-bold bg-white border border-stone-200 text-stone-600 shadow-sm">
                                    {filament.type}
                                </span>
                                <span className="text-stone-500 font-medium">
                                    {filament.colorName}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 mt-3">
                                <span className="text-sm text-stone-400">
                                    ¥{costPerG.toFixed(3)}/g
                                </span>
                                <span className="text-sm text-stone-400">
                                    每卷 ¥{filament.price}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-stone-100 rounded-xl text-stone-400 hover:text-stone-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* 左侧：库存状态 */}
                    <div className="col-span-1 space-y-4">
                        {/* 库存进度 */}
                        <div className="bg-stone-50 rounded-2xl p-6 text-center">
                            <SpoolRing percentage={percent} color={filament.color} size={120} />
                            <div className="mt-4">
                                <div className="text-3xl font-black text-stone-800">
                                    {filament.remaining}
                                    <span className="text-lg text-stone-400 font-medium ml-1">g</span>
                                </div>
                                <div className="text-sm text-stone-500 mt-1">
                                    / {filament.weight}g
                                </div>
                            </div>
                            {percent < 20 && (
                                <div className="mt-4 px-3 py-2 bg-rose-50 text-rose-600 text-xs font-bold rounded-lg">
                                    ⚠️ 库存不足，建议补货
                                </div>
                            )}
                        </div>

                        {/* 操作按钮 */}
                        <div className="space-y-3">
                            {onAddWork && (
                                <button
                                    onClick={() => setShowAddWork(!showAddWork)}
                                    className={`w-full py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${showAddWork
                                        ? 'bg-stone-200 text-stone-600'
                                        : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                        }`}
                                >
                                    <Plus size={18} />
                                    {showAddWork ? '收起' : '记录单色作品'}
                                </button>
                            )}
                            {onEdit && (
                                <button
                                    onClick={onEdit}
                                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all"
                                >
                                    编辑材料参数
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 右侧：详细参数 + 历史 */}
                    <div className="col-span-2 space-y-6">
                        {/* 单色作品录入表单 */}
                        {showAddWork && (
                            <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-100 space-y-4 fade-in">
                                <h4 className="font-bold text-amber-800 text-sm flex items-center gap-2">
                                    <Plus size={16} />
                                    记录单色打印作品
                                </h4>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-stone-500 mb-1 block">作品名称 *</label>
                                        <input
                                            value={workForm.name}
                                            onChange={e => setWorkForm(p => ({ ...p, name: e.target.value }))}
                                            placeholder="例如: 测试立方体"
                                            className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm outline-none focus:border-amber-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-stone-500 mb-1 block">消耗 (g) *</label>
                                        <input
                                            type="number"
                                            value={workForm.weight || ''}
                                            onChange={e => setWorkForm(p => ({ ...p, weight: parseInt(e.target.value) || 0 }))}
                                            placeholder="50"
                                            className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm outline-none focus:border-amber-500 transition-all"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-stone-500 mb-1 block flex items-center gap-2">
                                            <Clock size={12} /> 打印时长 (小时)
                                        </label>
                                        <input
                                            type="number"
                                            value={workForm.printTime || ''}
                                            onChange={e => setWorkForm(p => ({ ...p, printTime: parseFloat(e.target.value) || 0 }))}
                                            placeholder="2.5"
                                            step="0.1"
                                            className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm outline-none focus:border-amber-500 transition-all"
                                        />
                                        <p className="text-[10px] text-stone-400 mt-1">用于计算电费、折旧和人工成本</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-stone-500 mb-1 block flex items-center gap-1">
                                            <Link2 size={12} /> 链接 (可选)
                                        </label>
                                        <input
                                            value={workForm.link}
                                            onChange={e => setWorkForm(p => ({ ...p, link: e.target.value }))}
                                            placeholder="MakerWorld 链接"
                                            className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm outline-none focus:border-amber-500 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-stone-500 mb-1 block flex items-center gap-1">
                                            <Camera size={12} /> 照片 (支持 AI 识别)
                                        </label>
                                        <div className="flex gap-2">
                                            <label className="flex-1 flex items-center justify-center h-[38px] border border-dashed border-stone-300 rounded-lg cursor-pointer hover:bg-stone-50 hover:border-amber-400 transition-all text-xs text-stone-400 gap-1 overflow-hidden">
                                                {workForm.image ? (
                                                    <span className="text-amber-600 font-medium">已选择照片 ✓</span>
                                                ) : (
                                                    <>
                                                        <Camera size={14} />
                                                        上传截图
                                                    </>
                                                )}
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                />
                                            </label>
                                            {workForm.image && aiConfig?.enabled && (
                                                <button
                                                    onClick={handleAIAnalyze}
                                                    disabled={analyzing}
                                                    className="px-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
                                                    title="使用 AI 识别耗材用量和时间"
                                                >
                                                    {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-stone-500 mb-1 block">自我评分</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button
                                                    key={star}
                                                    onClick={() => setWorkForm(p => ({ ...p, rating: star }))}
                                                    className={`transition-colors hover:scale-110 ${workForm.rating >= star ? 'text-amber-400 fill-amber-400' : 'text-stone-300'}`}
                                                >
                                                    <Star size={24} fill={workForm.rating >= star ? "currentColor" : "none"} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        onClick={() => setShowAddWork(false)}
                                        className="px-4 py-2 text-stone-500 text-sm font-medium hover:bg-stone-100 rounded-lg transition-colors"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={handleAddWork}
                                        disabled={!workForm.name || !workForm.weight}
                                        className="px-5 py-2 bg-amber-500 text-white text-sm font-bold rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        确认记录
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 打印参数 */}
                        <div>
                            <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                                <Gauge size={18} className="text-amber-500" />
                                打印参数
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-stone-50 rounded-xl p-4 flex items-center gap-4">
                                    <div className="p-3 bg-red-100 text-red-500 rounded-xl">
                                        <Thermometer size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs text-stone-500 font-medium">喷嘴温度</div>
                                        <div className="text-lg font-bold text-stone-800">
                                            {filament.tempMin}-{filament.tempMax}°C
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-stone-50 rounded-xl p-4 flex items-center gap-4">
                                    <div className="p-3 bg-blue-100 text-blue-500 rounded-xl">
                                        <Droplets size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs text-stone-500 font-medium">
                                            热床 ({PLATE_LABELS[filament.defaultPlate]})
                                        </div>
                                        <div className="text-lg font-bold text-stone-800">
                                            {filament.bedSettings[filament.defaultPlate]?.initial}/
                                            {filament.bedSettings[filament.defaultPlate]?.other}°C
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-stone-50 rounded-xl p-4 flex items-center gap-4">
                                    <div className="p-3 bg-emerald-100 text-emerald-500 rounded-xl">
                                        <Activity size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs text-stone-500 font-medium">流量比</div>
                                        <div className="text-lg font-bold text-stone-800">
                                            {filament.flowRatio}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-stone-50 rounded-xl p-4 flex items-center gap-4">
                                    <div className="p-3 bg-violet-100 text-violet-500 rounded-xl">
                                        <Zap size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs text-stone-500 font-medium">压力提前</div>
                                        <div className="text-lg font-bold text-stone-800">
                                            {filament.pressureAdvance}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 创作历史 */}
                        <div>
                            <h3 className="font-bold text-stone-800 mb-4 flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Clock size={18} className="text-amber-500" />
                                    创作记录
                                    <span className="text-xs font-medium text-stone-400">
                                        ({filament.history.length} 次，共 {totalUsed}g)
                                    </span>
                                </span>
                            </h3>

                            {filament.history.length === 0 ? (
                                <div className="bg-stone-50 rounded-xl p-8 text-center text-stone-400">
                                    <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
                                    <div className="text-sm">暂无创作记录</div>
                                    <div className="text-xs mt-1">点击上方「记录单色作品」添加</div>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                    {filament.history.map((h: PrintHistory) => (
                                        <div
                                            key={h.id}
                                            className="bg-stone-50 rounded-xl p-4 flex items-center gap-4 group hover:bg-stone-100 transition-colors"
                                        >
                                            {/* 图片 */}
                                            {h.image ? (
                                                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-stone-200 flex-shrink-0">
                                                    <Image
                                                        src={h.image}
                                                        alt={h.name}
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-16 h-16 rounded-lg bg-stone-200 flex items-center justify-center">
                                                    <ImageIcon size={24} className="text-stone-400" />
                                                </div>
                                            )}

                                            {/* 信息 */}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-stone-800 truncate flex items-center gap-2">
                                                    {h.name}
                                                    {h.link && (
                                                        <a
                                                            href={h.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-amber-500 hover:text-amber-600"
                                                            onClick={e => e.stopPropagation()}
                                                        >
                                                            <ExternalLink size={14} />
                                                        </a>
                                                    )}
                                                    {h.rating && h.rating > 0 && (
                                                        <div className="flex gap-0.5 ml-1">
                                                            {Array.from({ length: h.rating }).map((_, i) => (
                                                                <Star key={i} size={12} className="text-amber-400 fill-amber-400" />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-sm text-stone-500 flex items-center gap-3 mt-1 flex-wrap">
                                                    <span className="font-mono font-bold text-amber-600 bg-amber-50 px-1.5 rounded">
                                                        {h.weight}g
                                                    </span>
                                                    {h.printTime && (
                                                        <span className="font-mono text-stone-500 bg-stone-100 px-1.5 rounded flex items-center gap-1">
                                                            <Clock size={10} />
                                                            {h.printTime}h
                                                        </span>
                                                    )}
                                                    <span className="font-mono text-rose-600 font-bold">
                                                        ¥{((h.weight * costPerG) + ((h.printTime || 0) * (costConfig.electricityRate + costConfig.laborRate + costConfig.depreciationRate))).toFixed(2)}
                                                    </span>
                                                    <span className="text-xs text-stone-400">
                                                        (材:¥{(h.weight * costPerG).toFixed(1)} + 时:¥{((h.printTime || 0) * (costConfig.electricityRate + costConfig.laborRate + costConfig.depreciationRate)).toFixed(1)})
                                                    </span>
                                                </div>
                                                <div className="text-xs text-stone-400 mt-1">
                                                    {h.date}
                                                </div>
                                            </div>

                                            {/* 删除按钮 */}
                                            {onDeleteHistory && (
                                                <button
                                                    onClick={() => onDeleteHistory(h.id)}
                                                    className="p-2 text-stone-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                    title="删除记录（库存会恢复）"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
