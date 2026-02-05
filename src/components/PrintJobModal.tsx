'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
    X, Palette, Camera, Plus, Trash2, FileText, Link2
} from 'lucide-react';
import { Filament } from '../lib/types';

interface JobItem {
    filamentId: string;
    used: number;
}

interface PrintJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (job: { name: string; link?: string; image?: string; printTime?: number; items: JobItem[] }) => void;
    filaments: Filament[];
}

export function PrintJobModal({
    isOpen,
    onClose,
    onSubmit,
    filaments
}: PrintJobModalProps) {
    const [jobForm, setJobForm] = useState({
        name: '',
        link: '',
        image: '',
        printTime: 0, // 打印时长（分钟）
        items: [{ filamentId: '', used: 0 }] as JobItem[]
    });

    const handleAddItem = () => {
        setJobForm(p => ({
            ...p,
            items: [...p.items, { filamentId: '', used: 0 }]
        }));
    };

    const handleRemoveItem = (index: number) => {
        setJobForm(p => ({
            ...p,
            items: p.items.filter((_, i) => i !== index)
        }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setJobForm(p => ({ ...p, image: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validItems = jobForm.items.filter(i => i.filamentId && i.used > 0);
        if (validItems.length === 0) return;

        onSubmit({
            name: jobForm.name,
            link: jobForm.link || undefined,
            image: jobForm.image || undefined,
            printTime: jobForm.printTime,
            items: validItems
        });

        // 重置表单
        setJobForm({
            name: '',
            link: '',
            image: '',
            printTime: 0,
            items: [{ filamentId: '', used: 0 }]
        });
        onClose();
    };

    // 计算总消耗
    const totalUsed = jobForm.items.reduce((sum, i) => sum + (i.used || 0), 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-violet-50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl shadow-lg">
                            <Palette className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-stone-800">
                                登记创作任务
                            </h2>
                            <p className="text-stone-500 text-sm">
                                记录这次打印，自动扣减库存
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-stone-100 rounded-xl text-stone-400 hover:text-stone-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-8 overflow-y-auto flex-1">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 作品信息 */}
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-bold text-stone-500 mb-2 block uppercase tracking-wide flex items-center gap-2">
                                    <FileText size={14} /> 作品名称
                                </label>
                                <input
                                    required
                                    value={jobForm.name}
                                    onChange={e => setJobForm({ ...jobForm, name: e.target.value })}
                                    placeholder="例如: 机械龙"
                                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-stone-500 mb-2 block uppercase tracking-wide flex items-center gap-2">
                                    <Link2 size={14} /> 链接 (可选)
                                </label>
                                <input
                                    value={jobForm.link}
                                    onChange={e => setJobForm({ ...jobForm, link: e.target.value })}
                                    placeholder="MakerWorld 或其他链接"
                                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 outline-none focus:bg-white focus:border-indigo-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-stone-500 mb-2 block uppercase tracking-wide">
                                    打印时长 (分钟,可选)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={jobForm.printTime}
                                    onChange={e => setJobForm({ ...jobForm, printTime: Math.max(0, parseInt(e.target.value) || 0) })}
                                    placeholder="0"
                                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 outline-none focus:bg-white focus:border-indigo-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* 照片上传 */}
                        <div>
                            <label className="text-xs font-bold text-stone-500 mb-2 block uppercase tracking-wide flex items-center gap-2">
                                <Camera size={14} /> 作品照片 (可选)
                            </label>
                            <label className="flex items-center justify-center h-36 border-2 border-dashed border-stone-300 rounded-2xl cursor-pointer hover:bg-stone-50 hover:border-indigo-400 transition-all relative overflow-hidden group">
                                {jobForm.image ? (
                                    <>
                                        <Image src={jobForm.image} fill className="object-cover" alt="preview" unoptimized />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-white text-sm font-bold">点击更换</span>
                                        </div>
                                    </>
                                ) : (
                                    <span className="text-stone-400 text-sm flex flex-col items-center gap-2 group-hover:text-indigo-500 transition-colors">
                                        <Camera size={32} strokeWidth={1.5} />
                                        点击上传照片
                                    </span>
                                )}
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />
                            </label>
                        </div>

                        {/* 材料消耗清单 */}
                        <div className="border-t border-stone-100 pt-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-stone-700 flex items-center gap-2">
                                    材料消耗清单
                                    {totalUsed > 0 && (
                                        <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                            总计 {totalUsed}g
                                        </span>
                                    )}
                                </h3>
                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1"
                                >
                                    <Plus size={14} /> 添加材料
                                </button>
                            </div>

                            <div className="space-y-3">
                                {jobForm.items.map((row, idx) => {
                                    const selectedFilament = filaments.find(f => f.id === row.filamentId);

                                    return (
                                        <div key={idx} className="flex gap-3 items-center">
                                            <select
                                                value={row.filamentId}
                                                onChange={e => {
                                                    const newItems = [...jobForm.items];
                                                    newItems[idx].filamentId = e.target.value;
                                                    setJobForm({ ...jobForm, items: newItems });
                                                }}
                                                className="flex-1 px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm text-stone-700 outline-none focus:border-indigo-500 transition-all"
                                            >
                                                <option value="">选择材料...</option>
                                                {filaments.map(f => (
                                                    <option key={f.id} value={f.id}>
                                                        {f.brand} {f.type} ({f.colorName}) - 剩余 {f.remaining}g
                                                    </option>
                                                ))}
                                            </select>

                                            {/* 颜色预览 */}
                                            {selectedFilament && (
                                                <div
                                                    className="w-8 h-8 rounded-lg border border-stone-200 shadow-inner"
                                                    style={{ backgroundColor: selectedFilament.color }}
                                                />
                                            )}

                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    placeholder="g"
                                                    value={row.used || ''}
                                                    onChange={e => {
                                                        const val = parseInt(e.target.value) || 0;
                                                        const newItems = [...jobForm.items];
                                                        newItems[idx].used = Math.max(0, val);
                                                        setJobForm({ ...jobForm, items: newItems });
                                                    }}
                                                    className={`w-24 px-4 py-3 bg-white border rounded-xl text-sm text-center outline-none transition-all ${selectedFilament && row.used > selectedFilament.remaining
                                                        ? 'border-rose-300 text-rose-600 focus:border-rose-500 bg-rose-50'
                                                        : 'border-stone-200 focus:border-indigo-500'
                                                        }`}
                                                />
                                                {selectedFilament && row.used > selectedFilament.remaining && (
                                                    <div className="absolute top-full left-0 right-0 text-[10px] text-rose-500 font-bold text-center mt-1">
                                                        超额 {(row.used - selectedFilament.remaining).toFixed(1)}g
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItem(idx)}
                                                className="p-2 text-stone-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                disabled={jobForm.items.length === 1}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 操作按钮 */}
                        <div className="pt-4 flex justify-end gap-3 border-t border-stone-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 text-stone-500 font-medium hover:bg-stone-50 rounded-xl transition-colors"
                            >
                                取消
                            </button>
                            <button
                                type="submit"
                                disabled={totalUsed === 0}
                                className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                确认归档
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
