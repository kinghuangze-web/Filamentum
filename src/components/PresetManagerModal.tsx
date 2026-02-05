'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Upload, Plus, Trash2, Edit2, Copy, FileJson, Settings } from 'lucide-react';
import { FilamentPreset, Filament } from '../lib/types';
import { presetService } from '../services/preset-service';
import { DEFAULT_BED_SETTINGS, PLATE_TYPES } from '../lib/constants';

interface PresetManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenFilamentTypeSettings?: () => void;
    filaments?: Filament[]; // 现有库存，用于批量应用预设
    onBatchUpdate?: (updates: Filament[]) => Promise<void>;
}

export function PresetManagerModal({ isOpen, onClose, onOpenFilamentTypeSettings, filaments = [], onBatchUpdate }: PresetManagerModalProps) {
    const [presets, setPresets] = useState<FilamentPreset[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<FilamentPreset | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadPresets();
        }
    }, [isOpen]);

    const loadPresets = async () => {
        setLoading(true);
        const list = await presetService.getAll();
        setPresets(list);
        setLoading(false);
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.bbsflmt';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                const formData = new FormData();
                formData.append('file', file);

                const res = await fetch('/api/presets/import', {
                    method: 'POST',
                    body: formData
                });

                if (!res.ok) throw new Error('Import failed');

                const items = await res.json();

                if (!Array.isArray(items) || items.length === 0) {
                    alert('未发现有效的预设数据');
                    return;
                }

                for (const item of items) {
                    const newPreset: FilamentPreset = {
                        ...item,
                        id: 'user-' + crypto.randomUUID(),
                        source: 'user',
                        createdAt: new Date().toISOString()
                    };
                    await presetService.saveUserPreset(newPreset);
                }

                await loadPresets();
                alert(`成功导入 ${items.length} 个预设`);
            } catch (err) {
                console.error(err);
                alert('导入失败：文件格式错误或无法解析');
            }
        };
        input.click();
    };

    const handleCreate = () => {
        const newPreset: FilamentPreset = {
            id: 'user-' + crypto.randomUUID(),
            brand: 'New Brand',
            type: 'New Type',
            tempMin: 200,
            tempMax: 220,
            flowRatio: 0.98,
            pressureAdvance: 0.02,
            maxVolumetricSpeed: 12,
            defaultPlate: 'textured',
            bedSettings: { ...DEFAULT_BED_SETTINGS },
            source: 'user',
            createdAt: new Date().toISOString()
        };
        setEditForm(newPreset);
        setEditingId(newPreset.id);
    };

    const handleEdit = (preset: FilamentPreset) => {
        if (preset.source === 'builtin') {
            const copy: FilamentPreset = {
                ...preset,
                id: 'user-' + crypto.randomUUID(),
                source: 'user',
                brand: preset.brand + ' (Copy)',
                createdAt: new Date().toISOString()
            };
            setEditForm(copy);
            setEditingId(copy.id);
        } else {
            setEditForm({ ...preset });
            setEditingId(preset.id);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('确定删除此预设吗？')) {
            await presetService.deleteUserPreset(id);
            await loadPresets();
            if (editingId === id) {
                setEditingId(null);
                setEditForm(null);
            }
        }
    };

    const handleSaveForm = async () => {
        if (!editForm) return;
        await presetService.saveUserPreset(editForm);
        await loadPresets();
        setEditingId(null);
        setEditForm(null);
    };

    // 应用当前预设到库存
    const handleApplyToStock = async () => {
        if (!editForm || !onBatchUpdate || filaments.length === 0) return;

        // 查找匹配耗材 (Brand & Type)
        const matches = filaments.filter(f =>
            f.brand.toLowerCase() === editForm.brand.toLowerCase() &&
            f.type.toLowerCase() === editForm.type.toLowerCase()
        );

        if (matches.length === 0) {
            alert('库存中没有找到匹配该品牌和类型的耗材。');
            return;
        }

        if (!confirm(`在库存中找到 ${matches.length} 卷匹配耗材。\n\n是否将它们的打印参数（温度、流量、PA值等）全部更新为此预设的值？`)) {
            return;
        }

        const now = new Date().toISOString();
        const updates = matches.map(f => ({
            ...f,
            tempMin: editForm.tempMin,
            tempMax: editForm.tempMax,
            flowRatio: editForm.flowRatio,
            pressureAdvance: editForm.pressureAdvance,
            maxVolumetricSpeed: editForm.maxVolumetricSpeed,
            defaultPlate: editForm.defaultPlate,
            bedSettings: editForm.bedSettings,
            updatedAt: now
        }));

        await onBatchUpdate(updates);
        alert(`已成功更新 ${matches.length} 卷耗材的参数！`);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[80vh] flex overflow-hidden">

                {/* 左侧：列表 */}
                <div className="w-1/3 border-r border-stone-100 flex flex-col bg-stone-50/50">
                    <div className="p-4 border-b border-stone-100 bg-white">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-stone-700">预设库</h3>
                            <div className="flex gap-2">
                                <button onClick={handleImport} title="导入" className="p-2 hover:bg-stone-100 rounded-lg text-stone-500 hover:text-amber-600">
                                    <Upload size={18} />
                                </button>
                                <button onClick={handleCreate} title="新建" className="p-2 hover:bg-stone-100 rounded-lg text-stone-500 hover:text-amber-600">
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>
                        {onOpenFilamentTypeSettings && (
                            <button
                                onClick={onOpenFilamentTypeSettings}
                                className="w-full flex items-center gap-3 px-3 py-2.5 bg-gradient-to-r from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 border border-violet-200 rounded-xl transition-all group"
                            >
                                <div className="p-1.5 bg-white rounded-lg border border-violet-200 group-hover:border-violet-300 transition-colors">
                                    <Settings size={16} className="text-violet-600" />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="text-sm font-bold text-violet-700">耗材类型管理</div>
                                    <div className="text-xs text-violet-500">勾选要显示的类型</div>
                                </div>
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {loading && <div className="text-center p-4 text-stone-400">加载中...</div>}
                        {presets.map(p => (
                            <div
                                key={p.id}
                                onClick={() => handleEdit(p)}
                                className={`p-3 rounded-xl cursor-pointer border transition-all group ${editingId === p.id
                                    ? 'bg-amber-50 border-amber-200 shadow-sm'
                                    : 'bg-white border-stone-200 hover:border-amber-200'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-stone-700 text-sm">{p.brand}</div>
                                        <div className="text-xs text-stone-500">{p.type}</div>
                                    </div>
                                    {p.source === 'builtin' ? (
                                        <span className="text-[10px] bg-stone-100 text-stone-400 px-1.5 py-0.5 rounded">内置</span>
                                    ) : (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-100 text-stone-400 hover:text-rose-500 rounded transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 右侧：编辑表单 */}
                <div className="flex-1 flex flex-col bg-white">
                    <div className="p-4 border-b border-stone-100 flex justify-between items-center">
                        <h3 className="font-bold text-stone-800">
                            {editForm ? (editForm.source === 'builtin' ? '查看预设' : '编辑预设') : '选择或新建预设'}
                        </h3>
                        <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-xl text-stone-400">
                            <X size={24} />
                        </button>
                    </div>

                    {editForm ? (
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* 基本信息 */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-stone-500 mb-1 block">品牌</label>
                                    <input
                                        type="text"
                                        value={editForm.brand}
                                        onChange={e => setEditForm({ ...editForm, brand: e.target.value })}
                                        className="w-full p-2 border rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-stone-500 mb-1 block">材料类型</label>
                                    <input
                                        type="text"
                                        value={editForm.type}
                                        onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                                        className="w-full p-2 border rounded-lg text-sm"
                                    />
                                </div>
                            </div>

                            {/* 打印参数 */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-stone-500 mb-1 block">喷嘴温度范围 (°C)</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="number"
                                            value={editForm.tempMin}
                                            onChange={e => setEditForm({ ...editForm, tempMin: Number(e.target.value) })}
                                            className="w-full p-2 border rounded-lg text-sm"
                                        />
                                        <span className="text-stone-300">-</span>
                                        <input
                                            type="number"
                                            value={editForm.tempMax}
                                            onChange={e => setEditForm({ ...editForm, tempMax: Number(e.target.value) })}
                                            className="w-full p-2 border rounded-lg text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-stone-500 mb-1 block">最大体积速度 (mm³/s)</label>
                                    <input
                                        type="number"
                                        value={editForm.maxVolumetricSpeed}
                                        onChange={e => setEditForm({ ...editForm, maxVolumetricSpeed: Number(e.target.value) })}
                                        className="w-full p-2 border rounded-lg text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-stone-500 mb-1 block">流量比例 (Flow Ratio)</label>
                                    <input
                                        type="number" step="0.01"
                                        value={editForm.flowRatio}
                                        onChange={e => setEditForm({ ...editForm, flowRatio: Number(e.target.value) })}
                                        className="w-full p-2 border rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-stone-500 mb-1 block">压力提前 (Pressure Advance)</label>
                                    <input
                                        type="number" step="0.01"
                                        value={editForm.pressureAdvance}
                                        onChange={e => setEditForm({ ...editForm, pressureAdvance: Number(e.target.value) })}
                                        className="w-full p-2 border rounded-lg text-sm"
                                    />
                                </div>
                            </div>

                            {/* 热床设置 */}
                            <div>
                                <label className="text-xs font-bold text-stone-500 mb-2 block">热床温度设置</label>
                                <div className="space-y-2 bg-stone-50 p-4 rounded-xl border border-stone-100">
                                    {PLATE_TYPES.map(plate => (
                                        <div key={plate.id} className="flex items-center justify-between text-sm">
                                            <span className="text-stone-600 w-32">{plate.label}</span>
                                            <div className="flex gap-2 items-center">
                                                <input
                                                    type="number" placeholder="首层"
                                                    value={editForm.bedSettings?.[plate.id]?.initial || 0}
                                                    onChange={e => {
                                                        const newBed = { ...editForm.bedSettings };
                                                        newBed[plate.id] = { ...newBed[plate.id], initial: Number(e.target.value) };
                                                        setEditForm({ ...editForm, bedSettings: newBed });
                                                    }}
                                                    className="w-20 p-1.5 border rounded-md text-center"
                                                />
                                                <input
                                                    type="number" placeholder="其他层"
                                                    value={editForm.bedSettings?.[plate.id]?.other || 0}
                                                    onChange={e => {
                                                        const newBed = { ...editForm.bedSettings };
                                                        newBed[plate.id] = { ...newBed[plate.id], other: Number(e.target.value) };
                                                        setEditForm({ ...editForm, bedSettings: newBed });
                                                    }}
                                                    className="w-20 p-1.5 border rounded-md text-center"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-stone-300">
                            <FileJson size={48} className="mb-4" />
                            <p>请选择左侧预设进行编辑，或点击 + 新建</p>
                        </div>
                    )}

                    {/* 底部按钮 */}
                    {editForm && (
                        <div className="p-4 border-t border-stone-100 bg-stone-50 flex justify-between gap-3">
                            {/* 应用到库存 */}
                            {onBatchUpdate && filaments && filaments.length > 0 && (
                                <button
                                    onClick={handleApplyToStock}
                                    className="px-4 py-2.5 text-stone-600 font-bold rounded-xl hover:bg-stone-200 transition-all flex items-center gap-2 text-sm"
                                    title={`将此预设应用到库存中所有 ${editForm.brand} ${editForm.type} 耗材`}
                                >
                                    <Copy size={16} /> 应用到同类库存
                                </button>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={handleSaveForm}
                                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-lg hover:shadow-orange-500/30 transition-all flex items-center gap-2"
                                >
                                    <Save size={18} /> 保存预设
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
