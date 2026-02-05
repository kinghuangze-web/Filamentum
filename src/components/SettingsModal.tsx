'use client';

import React, { useState, useEffect } from 'react';
import { X, Settings, Printer as PrinterIcon, Zap, Hammer, Plus, Trash2, Save, RotateCcw } from 'lucide-react';
import { Printer, CostConfig } from '../lib/types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    config: CostConfig;
    onConfigChange: (config: CostConfig) => void;
    printers: Printer[];
    onPrintersChange: (printers: Printer[]) => void;
}

const TABS = [
    { id: 'printers', label: '我的设备', icon: PrinterIcon },
    { id: 'cost', label: '成本配置', icon: Zap },
] as const;

export function SettingsModal({
    isOpen,
    onClose,
    config,
    onConfigChange,
    printers,
    onPrintersChange
}: SettingsModalProps) {
    const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['id']>('printers');
    const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null);

    // --- Printer State Removed (using props) ---

    // --- Cost State Removed (using props) ---

    if (!isOpen) return null;

    const handleSave = () => {
        // TODO: Persist to localStorage
        onClose();
    };

    const handleDeletePrinter = (id: string) => {
        if (confirm('确认删除此设备?')) {
            onPrintersChange(printers.filter(p => p.id !== id));
        }
    };

    return (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl h-[600px] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-gradient-to-r from-stone-50 to-slate-50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl shadow-lg">
                            <Settings className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-stone-800">系统设置</h2>
                            <p className="text-stone-500 text-sm">管理打印机设备与成本参数</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-xl text-stone-400 hover:text-stone-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-stone-100 px-8">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-slate-800 text-stone-800'
                                : 'border-transparent text-stone-400 hover:text-stone-600'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-stone-50/50">

                    {/* --- Printers Tab --- */}
                    {activeTab === 'printers' && (
                        <div className="space-y-6">
                            {/* 列表模式或编辑模式切换 */}
                            {!editingPrinter ? (
                                <>
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-bold text-stone-700">设备列表 ({printers.length})</h3>
                                        <button
                                            onClick={() => setEditingPrinter({ id: '', name: '', type: 'FDM', powerWatts: 300, status: 'idle' })}
                                            className="flex items-center gap-1 text-sm text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100"
                                        >
                                            <Plus size={16} /> 添加设备
                                        </button>
                                    </div>

                                    <div className="grid gap-4">
                                        {printers.map(p => (
                                            <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex items-center justify-between group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                                                        <PrinterIcon size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-stone-800">{p.name}</div>
                                                        <div className="text-xs text-stone-500 flex gap-2">
                                                            <span className="bg-stone-100 px-1.5 rounded">{p.type}</span>
                                                            <span>{p.powerWatts}W</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => setEditingPrinter(p)}
                                                        className="p-2 text-stone-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg"
                                                    >
                                                        <Settings size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePrinter(p.id)}
                                                        className="p-2 text-stone-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {printers.length === 0 && (
                                            <div className="text-center py-10 text-stone-400 border-2 border-dashed border-stone-100 rounded-xl">
                                                暂无设备，请点击右上角添加
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm space-y-4 animate-in fade-in slide-in-from-right-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-bold text-stone-800">{editingPrinter.id ? '编辑设备' : '添加新设备'}</h3>
                                        <button onClick={() => setEditingPrinter(null)} className="text-stone-400 hover:text-stone-600"><X size={20} /></button>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-stone-500 mb-1 block">设备名称</label>
                                        <input
                                            value={editingPrinter.name}
                                            onChange={e => setEditingPrinter({ ...editingPrinter, name: e.target.value })}
                                            className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-800 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                            placeholder="例如: Bambu Lab A1"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-stone-500 mb-1 block">类型</label>
                                            <select
                                                value={editingPrinter.type}
                                                onChange={e => setEditingPrinter({ ...editingPrinter, type: e.target.value as any })}
                                                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-800 outline-none"
                                            >
                                                <option value="FDM">FDM (热熔)</option>
                                                <option value="SLA">SLA (光固化)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-stone-500 mb-1 block">功率 (W)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={editingPrinter.powerWatts}
                                                onChange={e => setEditingPrinter({ ...editingPrinter, powerWatts: Math.max(0, parseInt(e.target.value) || 0) })}
                                                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-800 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-end gap-2">
                                        <button
                                            onClick={() => setEditingPrinter(null)}
                                            className="px-4 py-2 text-stone-500 font-bold hover:bg-stone-100 rounded-xl"
                                        >
                                            取消
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (!editingPrinter.name) return;
                                                const newPrinter = { ...editingPrinter, id: editingPrinter.id || crypto.randomUUID() };
                                                if (editingPrinter.id) {
                                                    // Edit
                                                    onPrintersChange(printers.map(p => p.id === newPrinter.id ? newPrinter : p));
                                                } else {
                                                    // Add
                                                    onPrintersChange([...printers, newPrinter]);
                                                }
                                                setEditingPrinter(null);
                                            }}
                                            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200"
                                        >
                                            保存
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- Cost Tab --- */}
                    {activeTab === 'cost' && (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-stone-500 uppercase flex items-center gap-2 mb-2">
                                        <Zap size={14} className="text-amber-500" /> 电费单价 (元/度)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={config.electricityRate}
                                        onChange={e => onConfigChange({ ...config, electricityRate: Math.max(0, parseFloat(e.target.value)) })}
                                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl font-mono"
                                    />
                                    <p className="text-xs text-stone-400 mt-1">用于计算打印过程中的电能消耗成本</p>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-stone-500 uppercase flex items-center gap-2 mb-2">
                                        <Hammer size={14} className="text-slate-500" /> 人工/后处理时薪 (元/小时)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={config.laborRate}
                                        onChange={e => onConfigChange({ ...config, laborRate: Math.max(0, parseFloat(e.target.value)) })}
                                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl font-mono"
                                    />
                                    <p className="text-xs text-stone-400 mt-1">计入模型后处理（拆支撑、打磨）的时间成本</p>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-stone-500 uppercase flex items-center gap-2 mb-2">
                                        <RotateCcw size={14} className="text-rose-500" /> 机器折旧 + 场地房租 (元/小时)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={config.depreciationRate}
                                        onChange={e => onConfigChange({ ...config, depreciationRate: Math.max(0, parseFloat(e.target.value)) })}
                                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl font-mono"
                                    />
                                    <p className="text-xs text-stone-400 mt-1">打印机运行时每小时的固定损耗与分摊成本</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-stone-100 bg-white flex justify-end">
                    <button
                        onClick={handleSave}
                        className="px-8 py-3 bg-stone-800 text-white font-bold rounded-xl hover:bg-stone-700 transition-colors flex items-center gap-2"
                    >
                        <Save size={18} />
                        保存设置
                    </button>
                </div>
            </div>
        </div>
    );
}
