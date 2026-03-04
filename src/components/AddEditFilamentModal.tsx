'use client';

import React, { useState, useEffect, memo } from 'react';
import {
    X, Sparkles, Check, Palette, Lightbulb,
    Thermometer, Droplets, Scale, BookmarkPlus
} from 'lucide-react';
import { Filament, PlateType, FilamentPreset } from '../lib/types';
import { findPreset, saveUserPreset, createPresetFromFilament } from '../lib/presets';
import {
    PLATE_TYPES,
    DEFAULT_BED_SETTINGS,
    FILAMENT_TYPES,
    POPULAR_BRANDS,
    COMMON_COLORS,
    validators
} from '../lib/constants';
import { SpoolRing } from './SpoolRing';


interface AddEditFilamentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (filament: Filament) => void;
    editingFilament?: Filament | null;
    customTypes?: string[];
}

export function AddEditFilamentModal({
    isOpen,
    onClose,
    onSave,
    editingFilament,
    customTypes = []
}: AddEditFilamentModalProps) {
    const isEditing = !!editingFilament;

    // 表单状态
    const [formData, setFormData] = useState({
        brand: '',
        type: 'PLA Basic',
        color: '#1a1a1a',
        colorName: '哑光黑',
        weight: 1000,
        remaining: 1000,
        price: 89,
        tempMin: 190,
        tempMax: 220,
        flowRatio: 0.98,
        pressureAdvance: 0.04,
        defaultPlate: 'textured' as PlateType,
        bedSettings: DEFAULT_BED_SETTINGS,
        notes: ''
    });

    const [activePlateTab, setActivePlateTab] = useState<PlateType>('textured');
    const [matchedPreset, setMatchedPreset] = useState<FilamentPreset | null>(null);
    const [presetApplied, setPresetApplied] = useState(false);
    const [saveAsPreset, setSaveAsPreset] = useState(false);
    // 新增：判断是否为自定义类型模式
    const [isCustomType, setIsCustomType] = useState(false);

    // 编辑模式下填充数据
    useEffect(() => {
        if (editingFilament) {
            console.log('Initializing form with:', editingFilament);

            // 判断是否为标准类型
            const allStandardTypes = Object.values(FILAMENT_TYPES).flat();
            const isStandard = allStandardTypes.includes(editingFilament.type);
            setIsCustomType(!isStandard);

            setFormData({
                brand: editingFilament.brand,
                type: editingFilament.type,
                color: editingFilament.color,
                colorName: editingFilament.colorName,
                weight: editingFilament.weight,
                remaining: editingFilament.remaining,
                price: editingFilament.price,
                tempMin: editingFilament.tempMin,
                tempMax: editingFilament.tempMax,
                flowRatio: editingFilament.flowRatio,
                pressureAdvance: editingFilament.pressureAdvance,
                defaultPlate: editingFilament.defaultPlate,
                bedSettings: editingFilament.bedSettings,
                notes: editingFilament.notes || ''
            });
            setActivePlateTab(editingFilament.defaultPlate);
            setPresetApplied(false);
            setMatchedPreset(null);
        } else {
            // 如果 modal 打开但 editingFilament 为 null，说明是新增模式，已经在 resetForm处理了？
            // resetForm 仅在Close时调用。
            // 如果用户从编辑 -> 关闭 -> 新增，resetForm 会被调用。
            // 如果用户从新增 -> 编辑，resetForm 会被调用吗？
            // page.tsx openAddModal calls setEditingFilament(null).
            // 这里的 useEffect 依赖 editingFilament。
            // 如果 editingFilament 变为 null，我们应该重置表单吗？
            // 为了安全起见，可以在这里重置，但 onClose 已经做了。
            // 关键问题是：OpenAddModal 设置 null，modals.addEdit true。
            // OpenEditModal 设置 filament，modals.addEdit true。
            // 组件一直挂载吗？是的，在 page.tsx 中。
            // 所以 useEffect 会触发。
            if (isOpen && !editingFilament) {
                resetForm();
            }
        }
    }, [editingFilament, isOpen]);

    // 监听品牌+类型变化，自动匹配预设
    useEffect(() => {
        if (isEditing || !formData.brand) return;

        const preset = findPreset(formData.brand, formData.type);
        setMatchedPreset(preset);

        // 如果找到预设且尚未应用，显示提示
        if (preset && !presetApplied) {
            // 不自动应用，等待用户确认
        }
    }, [formData.brand, formData.type, isEditing, presetApplied]);

    // 应用预设
    const applyPreset = (preset: FilamentPreset) => {
        setFormData(prev => ({
            ...prev,
            tempMin: preset.tempMin,
            tempMax: preset.tempMax,
            flowRatio: preset.flowRatio,
            pressureAdvance: preset.pressureAdvance,
            defaultPlate: preset.defaultPlate,
            bedSettings: preset.bedSettings
        }));
        setActivePlateTab(preset.defaultPlate);
        setPresetApplied(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // 如果选择保存为预设
        if (saveAsPreset && !isEditing) {
            const preset = createPresetFromFilament(formData.brand, formData.type, {
                tempMin: formData.tempMin,
                tempMax: formData.tempMax,
                flowRatio: formData.flowRatio,
                pressureAdvance: formData.pressureAdvance,
                defaultPlate: formData.defaultPlate,
                bedSettings: formData.bedSettings
            });
            saveUserPreset(preset);
        }

        const newFilament: Filament = {
            id: editingFilament?.id || crypto.randomUUID(),
            ...formData,
            history: editingFilament?.history || [],
            createdAt: editingFilament?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        onSave(newFilament);
        resetForm();
        onClose();
    };

    const resetForm = () => {
        setFormData({
            brand: '',
            type: 'PLA Basic',
            color: '#1a1a1a',
            colorName: '哑光黑',
            weight: 1000,
            remaining: 1000,
            price: 89,
            tempMin: 190,
            tempMax: 220,
            flowRatio: 0.98,
            pressureAdvance: 0.04,
            defaultPlate: 'textured' as PlateType,
            bedSettings: DEFAULT_BED_SETTINGS,
            notes: ''
        });
        setMatchedPreset(null);
        setPresetApplied(false);
        setSaveAsPreset(false);
        setIsCustomType(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-gradient-to-r from-amber-50 to-orange-50">
                    <div className="flex items-center gap-4">
                        {/* 实时预览耗材盘 */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-white/50 rounded-full blur-sm" />
                            <SpoolRing
                                percentage={formData.weight > 0 ? (Math.min(100, Math.max(0, (formData.remaining / formData.weight) * 100))) : 0}
                                color={formData.color}
                                size={56}
                            />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-stone-800">
                                {isEditing ? '编辑材料属性' : '入库新材料'}
                            </h2>
                            <p className="text-stone-500 text-sm">
                                {isEditing ? '修改这卷材料的参数' : '添加一卷新的耗材到你的工坊'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => { resetForm(); onClose(); }}
                        className="p-2 hover:bg-stone-100 rounded-xl text-stone-400 hover:text-stone-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-8 overflow-y-auto flex-1">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 预设匹配提示 */}
                        {matchedPreset && !presetApplied && !isEditing && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between fade-in">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-100 rounded-lg">
                                        <Lightbulb size={18} className="text-amber-600" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-amber-800 text-sm">
                                            发现预设「{matchedPreset.brand} {matchedPreset.type}」
                                        </div>
                                        <div className="text-amber-600 text-xs">
                                            来源: {matchedPreset.source === 'builtin' ? '内置预设' : '用户预设'}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => applyPreset(matchedPreset)}
                                    className="px-4 py-2 bg-amber-500 text-white text-sm font-bold rounded-lg hover:bg-amber-600 transition-colors"
                                >
                                    应用预设
                                </button>
                            </div>
                        )}

                        {presetApplied && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3 fade-in">
                                <Check size={18} className="text-emerald-600" />
                                <span className="text-emerald-700 text-sm font-medium">
                                    已应用预设参数，可在下方微调
                                </span>
                            </div>
                        )}

                        {/* 品牌和材质 */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-stone-500 mb-2 block uppercase tracking-wide">
                                    品牌
                                </label>
                                <input
                                    list="brand-suggestions"
                                    required
                                    value={formData.brand}
                                    onChange={e => {
                                        setFormData({ ...formData, brand: e.target.value });
                                        setPresetApplied(false);
                                    }}
                                    placeholder="选择或输入品牌"
                                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                />
                                <datalist id="brand-suggestions">
                                    {POPULAR_BRANDS.map(brand => (
                                        <option key={brand} value={brand} />
                                    ))}
                                </datalist>
                            </div>
                            <div>
                                {/* 材质类型选择 - 混合模式 (Select + Custom Input) */}
                                <div className="space-y-2">
                                    <select
                                        value={isCustomType ? 'custom' : formData.type}
                                        onChange={e => {
                                            const val = e.target.value;
                                            if (val === 'custom') {
                                                setIsCustomType(true);
                                                // 保持原有值作为初始输入，或者是空? 
                                                // 如果原来就是标准值切换到自定义，可能想保留？
                                                // 暂时保持原值，方便修改
                                            } else {
                                                setIsCustomType(false);
                                                setFormData({ ...formData, type: val });
                                                setPresetApplied(false);
                                            }
                                        }}
                                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all appearance-none cursor-pointer"
                                    >
                                        {Object.entries(FILAMENT_TYPES).map(([category, types]) => (
                                            <optgroup key={category} label={category}>
                                                {types.map(type => <option key={type} value={type}>{type}</option>)}
                                            </optgroup>
                                        ))}
                                        <option value="custom">✨ 自定义 / 其他...</option>
                                    </select>

                                    {/* 自定义输入框 (仅当选择“自定义”时显示) */}
                                    {isCustomType && (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                            <input
                                                type="text"
                                                value={formData.type}
                                                onChange={e => {
                                                    setFormData({ ...formData, type: e.target.value });
                                                    setPresetApplied(false);
                                                }}
                                                placeholder="输入材质名称 (如: PETG Rapid)"
                                                className="w-full px-4 py-3 bg-amber-50/50 border border-amber-200 rounded-xl text-amber-900 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-amber-400/50"
                                                autoFocus
                                            />
                                            <div className="text-[10px] text-amber-600/70 mt-1 pl-1">
                                                * 将作为新的材质类型保存
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 颜色 */}
                        <div>
                            <label className="text-xs font-bold text-stone-500 mb-2 block uppercase tracking-wide flex items-center gap-2">
                                <Palette size={14} /> 颜色
                            </label>
                            <div className="flex gap-4 items-start">
                                <input
                                    type="color"
                                    value={formData.color}
                                    onChange={e => setFormData({ ...formData, color: e.target.value })}
                                    className="h-12 w-16 p-1 bg-white border border-stone-200 rounded-xl cursor-pointer"
                                />
                                <div className="flex-1 space-y-3">
                                    <input
                                        value={formData.colorName}
                                        onChange={e => setFormData({ ...formData, colorName: e.target.value })}
                                        placeholder="颜色名称"
                                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 outline-none focus:bg-white focus:border-amber-500 transition-all"
                                    />
                                    <div className="flex gap-2 flex-wrap">
                                        {COMMON_COLORS.map(c => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, color: c })}
                                                className={`w-7 h-7 rounded-lg border-2 cursor-pointer hover:scale-110 transition-transform ${formData.color === c ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-stone-200'}`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 重量和价格 (With Roll Helper) */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-1">
                                <label className="text-xs font-bold text-stone-500 mb-2 block uppercase tracking-wide flex items-center gap-2">
                                    <Scale size={14} /> 规格/卷
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="0.1"
                                        step="0.1"
                                        placeholder="1"
                                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 outline-none focus:bg-white focus:border-amber-500 transition-all font-mono font-bold"
                                        onChange={(e) => {
                                            const rolls = parseFloat(e.target.value);
                                            if (rolls > 0) {
                                                const newWeight = rolls * 1000;

                                                if (isEditing) {
                                                    // 编辑模式：只更新总重，保护剩余量不被错误重置
                                                    setFormData({
                                                        ...formData,
                                                        weight: newWeight
                                                        // remaining 保持不变
                                                    });
                                                } else {
                                                    // 新建模式：总重和剩余量同步更新
                                                    setFormData({
                                                        ...formData,
                                                        weight: newWeight,
                                                        remaining: newWeight
                                                    });
                                                }
                                            }
                                        }}
                                    />
                                    <span className="text-sm font-bold text-stone-400 whitespace-nowrap">卷</span>
                                </div>
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-bold text-stone-500 mb-2 block uppercase tracking-wide flex items-center gap-2">
                                    总重/剩余 (g)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        value={formData.weight}
                                        onChange={e => setFormData({ ...formData, weight: parseInt(e.target.value) || 0 })}
                                        onBlur={() => setFormData(p => ({ ...p, weight: validators.weight(p.weight) }))}
                                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 outline-none focus:bg-white focus:border-amber-500 transition-all"
                                        placeholder="总重"
                                    />
                                    <input
                                        type="number"
                                        value={formData.remaining}
                                        onChange={e => setFormData({ ...formData, remaining: parseInt(e.target.value) || 0 })}
                                        onBlur={() => setFormData(p => ({ ...p, remaining: validators.weight(p.remaining) }))}
                                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 outline-none focus:bg-white focus:border-amber-500 transition-all"
                                        placeholder="剩余"
                                    />
                                </div>
                            </div>

                            <div className="col-span-3">
                                <label className="text-xs font-bold text-stone-500 mb-2 block uppercase tracking-wide">
                                    价格 (¥)
                                </label>
                                <input
                                    type="number"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                    onBlur={() => setFormData(p => ({ ...p, price: validators.price(p.price) }))}
                                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 outline-none focus:bg-white focus:border-amber-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* 温度设置 */}
                        <div>
                            <label className="text-xs font-bold text-stone-500 mb-2 block uppercase tracking-wide flex items-center gap-2">
                                <Thermometer size={14} /> 喷嘴温度范围
                            </label>
                            <div className="flex gap-4 items-center">
                                <input
                                    type="number"
                                    value={formData.tempMin}
                                    onChange={e => setFormData({ ...formData, tempMin: parseInt(e.target.value) || 0 })}
                                    onBlur={() => setFormData(p => ({ ...p, tempMin: validators.temperature(p.tempMin) }))}
                                    className="w-24 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 outline-none focus:bg-white focus:border-amber-500 transition-all text-center"
                                />
                                <span className="text-stone-400 font-bold">—</span>
                                <input
                                    type="number"
                                    value={formData.tempMax}
                                    onChange={e => setFormData({ ...formData, tempMax: parseInt(e.target.value) || 0 })}
                                    onBlur={() => setFormData(p => ({ ...p, tempMax: validators.temperature(p.tempMax) }))}
                                    className="w-24 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 outline-none focus:bg-white focus:border-amber-500 transition-all text-center"
                                />
                                <span className="text-stone-500">°C</span>
                            </div>
                        </div>

                        {/* 热床配置 */}
                        <div className="bg-stone-50 p-5 rounded-2xl border border-stone-100">
                            <label className="text-xs font-bold text-stone-500 mb-4 block uppercase tracking-wide flex items-center gap-2">
                                <Droplets size={14} /> 热床配置
                            </label>

                            {/* Tab 切换 */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {PLATE_TYPES.map(p => (
                                    <button
                                        type="button"
                                        key={p.id}
                                        onClick={() => setActivePlateTab(p.id as PlateType)}
                                        className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex-grow ${activePlateTab === p.id
                                            ? 'bg-amber-500 text-white shadow-md'
                                            : 'bg-white text-stone-500 hover:bg-stone-100 border border-stone-200'
                                            }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>

                            {/* 温度输入 */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-stone-400 mb-1 block">首层温度</label>
                                    <input
                                        type="number"
                                        value={formData.bedSettings[activePlateTab]?.initial || 0}
                                        onChange={e => {
                                            const v = parseInt(e.target.value) || 0;
                                            setFormData(p => ({
                                                ...p,
                                                bedSettings: {
                                                    ...p.bedSettings,
                                                    [activePlateTab]: { ...p.bedSettings[activePlateTab], initial: v }
                                                }
                                            }));
                                        }}
                                        className="w-full px-4 py-2.5 border border-stone-200 rounded-xl bg-white text-sm outline-none focus:border-amber-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-stone-400 mb-1 block">其他层温度</label>
                                    <input
                                        type="number"
                                        value={formData.bedSettings[activePlateTab]?.other || 0}
                                        onChange={e => {
                                            const v = parseInt(e.target.value) || 0;
                                            setFormData(p => ({
                                                ...p,
                                                bedSettings: {
                                                    ...p.bedSettings,
                                                    [activePlateTab]: { ...p.bedSettings[activePlateTab], other: v }
                                                }
                                            }));
                                        }}
                                        className="w-full px-4 py-2.5 border border-stone-200 rounded-xl bg-white text-sm outline-none focus:border-amber-500 transition-all"
                                    />
                                </div>
                            </div>

                            {/* 设为默认 */}
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, defaultPlate: activePlateTab })}
                                className={`w-full mt-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${formData.defaultPlate === activePlateTab
                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                    : 'bg-white border border-stone-200 text-stone-500 hover:border-stone-300'
                                    }`}
                            >
                                {formData.defaultPlate === activePlateTab ? (
                                    <><Check size={14} /> 已设为默认打印板</>
                                ) : (
                                    <><span className="w-3.5 h-3.5 rounded-full border border-stone-300"></span> 设为默认打印板</>
                                )}
                            </button>
                        </div>

                        {/* 保存为预设选项 */}
                        {!isEditing && !matchedPreset && formData.brand && (
                            <label className="flex items-center gap-3 p-4 bg-violet-50 border border-violet-100 rounded-xl cursor-pointer hover:bg-violet-100 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={saveAsPreset}
                                    onChange={e => setSaveAsPreset(e.target.checked)}
                                    className="w-5 h-5 rounded border-violet-300 text-violet-600 focus:ring-violet-500"
                                />
                                <div className="flex items-center gap-2">
                                    <BookmarkPlus size={18} className="text-violet-600" />
                                    <span className="text-violet-700 font-medium text-sm">
                                        保存为预设（下次添加「{formData.brand} {formData.type}」时自动应用）
                                    </span>
                                </div>
                            </label>
                        )}

                        {/* 操作按钮 */}
                        <div className="pt-4 flex justify-end gap-3 border-t border-stone-100">
                            <button
                                type="button"
                                onClick={() => { resetForm(); onClose(); }}
                                className="px-6 py-3 text-stone-500 font-medium hover:bg-stone-50 rounded-xl transition-colors"
                            >
                                取消
                            </button>
                            <button
                                type="submit"
                                className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all"
                            >
                                {isEditing ? '保存修改' : '确认入库'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
