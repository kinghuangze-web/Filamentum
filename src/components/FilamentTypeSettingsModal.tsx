'use client';

import React, { useState, useEffect } from 'react';
import { X, Settings as SettingsIcon, Check, Plus, Trash2 } from 'lucide-react';
import { FILAMENT_TYPES, DEFAULT_ENABLED_TYPES } from '../lib/constants';
import { AppSettings } from '../lib/types';

interface FilamentTypeSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: AppSettings) => void;
    currentSettings: AppSettings;
}

export function FilamentTypeSettingsModal({
    isOpen,
    onClose,
    onSave,
    currentSettings
}: FilamentTypeSettingsModalProps) {
    const [selectedTypes, setSelectedTypes] = useState<string[]>(currentSettings.enabledFilamentTypes);
    const [customTypes, setCustomTypes] = useState<string[]>(currentSettings.customFilamentTypes || []);
    const [newTypeName, setNewTypeName] = useState('');

    useEffect(() => {
        setSelectedTypes(currentSettings.enabledFilamentTypes);
        setCustomTypes(currentSettings.customFilamentTypes || []);
    }, [currentSettings]);

    const toggleType = (type: string) => {
        setSelectedTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    const toggleCategory = (category: string) => {
        const types = FILAMENT_TYPES[category as keyof typeof FILAMENT_TYPES];
        const allSelected = types.every((t: string) => selectedTypes.includes(t));

        if (allSelected) {
            // 取消全选该分类
            setSelectedTypes(prev => prev.filter((t: string) => !types.includes(t)));
        } else {
            // 全选该分类
            setSelectedTypes(prev => {
                const newSet = new Set([...prev, ...types]);
                return Array.from(newSet);
            });
        }
    };

    const handleAddCustomType = () => {
        const trimmed = newTypeName.trim();
        if (!trimmed) return;

        // 检查是否已存在
        const allTypes = [...Object.values(FILAMENT_TYPES).flat(), ...customTypes];
        if (allTypes.includes(trimmed)) {
            alert('该类型已存在！');
            return;
        }

        const newCustomTypes = [...customTypes, trimmed];
        setCustomTypes(newCustomTypes);
        setSelectedTypes(prev => [...prev, trimmed]); // 自动勾选新添加的类型
        setNewTypeName('');
    };

    const handleDeleteCustomType = (type: string) => {
        setCustomTypes(prev => prev.filter(t => t !== type));
        setSelectedTypes(prev => prev.filter(t => t !== type));
    };

    const handleSave = () => {
        onSave({
            enabledFilamentTypes: selectedTypes,
            customFilamentTypes: customTypes
        });
        onClose();
    };

    const handleReset = () => {
        setSelectedTypes(DEFAULT_ENABLED_TYPES);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-gradient-to-r from-violet-50 to-purple-50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl shadow-lg">
                            <SettingsIcon className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-stone-800">
                                耗材类型管理
                            </h2>
                            <p className="text-stone-500 text-sm">
                                勾选你需要显示的耗材类型
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

                {/* Content */}
                <div className="p-8 overflow-y-auto flex-1">
                    {/* 添加自定义类型 */}
                    <div className="mb-6 p-5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
                        <h3 className="text-sm font-bold text-amber-800 mb-3">添加自定义类型</h3>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newTypeName}
                                onChange={e => setNewTypeName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddCustomType()}
                                placeholder="例如: PETG Pro, PLA Ultra"
                                className="flex-1 px-4 py-2.5 bg-white border border-amber-200 rounded-xl text-stone-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                            />
                            <button
                                type="button"
                                onClick={handleAddCustomType}
                                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center gap-2"
                            >
                                <Plus size={18} />
                                添加
                            </button>
                        </div>
                    </div>

                    {/* 自定义类型列表 */}
                    {customTypes.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-stone-700 mb-3 uppercase tracking-wide">
                                自定义类型 ({customTypes.length})
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {customTypes.map(type => (
                                    <div
                                        key={type}
                                        className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all border-2 ${selectedTypes.includes(type)
                                            ? 'bg-orange-50 border-orange-500'
                                            : 'bg-white border-stone-200'
                                            }`}
                                    >
                                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                                            <input
                                                type="checkbox"
                                                checked={selectedTypes.includes(type)}
                                                onChange={() => toggleType(type)}
                                                className="sr-only"
                                            />
                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selectedTypes.includes(type)
                                                ? 'bg-orange-500 border-orange-500'
                                                : 'border-stone-300'
                                                }`}>
                                                {selectedTypes.includes(type) && (
                                                    <Check size={14} className="text-white" />
                                                )}
                                            </div>
                                            <span className={`text-sm font-medium ${selectedTypes.includes(type)
                                                ? 'text-orange-900'
                                                : 'text-stone-600'
                                                }`}>
                                                {type}
                                            </span>
                                        </label>
                                        <button
                                            onClick={() => handleDeleteCustomType(type)}
                                            className="p-1.5 text-stone-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors ml-2"
                                            title="删除此类型"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mb-6 flex items-center justify-between">
                        <div className="text-sm text-stone-600">
                            已选择 <span className="font-bold text-violet-600">{selectedTypes.length}</span> 种耗材类型
                        </div>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="px-4 py-2 text-sm font-bold text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                        >
                            恢复默认（PLA + PETG）
                        </button>
                    </div>

                    <div className="space-y-6">
                        {Object.entries(FILAMENT_TYPES).map(([category, types]) => {
                            const allSelected = types.every(t => selectedTypes.includes(t));
                            const someSelected = types.some(t => selectedTypes.includes(t));

                            return (
                                <div key={category} className="bg-stone-50 rounded-2xl p-5 border border-stone-100">
                                    {/* 分类标题 */}
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wide">
                                            {category}
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => toggleCategory(category)}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${allSelected
                                                ? 'bg-violet-500 text-white'
                                                : someSelected
                                                    ? 'bg-violet-100 text-violet-700'
                                                    : 'bg-white text-stone-500 border border-stone-200'
                                                }`}
                                        >
                                            {allSelected ? '全部取消' : '全选'}
                                        </button>
                                    </div>

                                    {/* 类型列表 */}
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {types.map(type => (
                                            <label
                                                key={type}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all border-2 ${selectedTypes.includes(type)
                                                    ? 'bg-violet-50 border-violet-500'
                                                    : 'bg-white border-stone-200 hover:border-violet-300'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTypes.includes(type)}
                                                    onChange={() => toggleType(type)}
                                                    className="sr-only"
                                                />
                                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selectedTypes.includes(type)
                                                    ? 'bg-violet-500 border-violet-500'
                                                    : 'border-stone-300'
                                                    }`}>
                                                    {selectedTypes.includes(type) && (
                                                        <Check size={14} className="text-white" />
                                                    )}
                                                </div>
                                                <span className={`text-sm font-medium ${selectedTypes.includes(type)
                                                    ? 'text-violet-700'
                                                    : 'text-stone-600'
                                                    }`}>
                                                    {type}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-stone-100 flex justify-end gap-3 bg-stone-50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 text-stone-500 font-medium hover:bg-stone-100 rounded-xl transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-8 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-violet-500/30 transition-all"
                    >
                        保存设置
                    </button>
                </div>
            </div>
        </div>
    );
}
