'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import {
    X, Sparkles, Upload, Image as ImageIcon, FileText,
    Loader2, Check, AlertCircle, Plus, Trash2, Edit3
} from 'lucide-react';
import { Filament, PlateType } from '../lib/types';
import { parseFilamentInfo, ParsedFilament } from '../lib/ai-service';
import { DEFAULT_BED_SETTINGS, inferColorHex, inferTemperature, compressImage } from '../lib/constants';
import { AIConfig } from '../lib/types';

interface AIParseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (filaments: Filament[]) => void;
    onOpenSettings: () => void;
    config: AIConfig | null;
}

export function AIParseModal({ isOpen, onClose, onImport, onOpenSettings, config }: AIParseModalProps) {
    const [inputText, setInputText] = useState('');
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<ParsedFilament[]>([]);
    const [confidence, setConfidence] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isConfigured = config && config.enabled && config.vl?.apiKey && config.storageMode !== 'encrypted';

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            // 压缩图片
            const compressed = await compressImage(base64, 800, 0.7);
            setImageBase64(compressed);
        };
        reader.readAsDataURL(file);
    };

    const handleParse = async () => {
        if (!config || !config.enabled) {
            setError('请先在设置中启用 AI 功能');
            return;
        }
        if (config.storageMode === 'encrypted') {
            setError('配置已锁定，请先在设置中解锁');
            return;
        }

        if (!inputText && !imageBase64) {
            setError('请输入文字或上传图片');
            return;
        }

        setLoading(true);
        setError(null);
        setResults([]);

        const result = await parseFilamentInfo(config, inputText, imageBase64 || undefined);

        setLoading(false);

        if (result.error) {
            setError(result.error);
            return;
        }

        setResults(result.items);
        setConfidence(result.confidence);
    };

    const handleRemoveResult = (index: number) => {
        setResults(prev => prev.filter((_, i) => i !== index));
    };

    const handleImport = () => {
        const filaments: Filament[] = results.map(item => {
            const temp = inferTemperature(item.type);
            const colorHex = inferColorHex(item.color || item.colorName || '');

            return {
                id: crypto.randomUUID(),
                brand: item.brand,
                type: item.type,
                color: colorHex,
                colorName: item.colorName || item.color || '未知',
                weight: item.weight || 1000,
                remaining: item.weight || 1000,
                price: item.price || 0,
                tempMin: temp.min,
                tempMax: temp.max,
                flowRatio: 0.98,
                pressureAdvance: 0.02,
                defaultPlate: 'textured' as PlateType,
                bedSettings: DEFAULT_BED_SETTINGS,
                history: [],
                createdAt: new Date().toISOString()
            };
        });

        // 处理数量 > 1 的情况
        const expandedFilaments: Filament[] = [];
        filaments.forEach((f, i) => {
            const qty = results[i]?.quantity || 1;
            for (let q = 0; q < qty; q++) {
                expandedFilaments.push({
                    ...f,
                    id: crypto.randomUUID()
                });
            }
        });

        onImport(expandedFilaments);
        handleClose();
    };

    const handleClose = () => {
        setInputText('');
        setImageBase64(null);
        setResults([]);
        setError(null);
        setConfidence(0);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-gradient-to-r from-violet-50 to-purple-50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
                            <Sparkles className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-stone-800">AI 智能入库</h2>
                            <p className="text-stone-500 text-sm">上传购物截图或粘贴订单文字</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-stone-100 rounded-xl text-stone-400 hover:text-stone-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto flex-1 space-y-6">
                    {/* 未配置 API 提示 */}
                    {!isConfigured && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-4">
                            <AlertCircle size={24} className="text-amber-600 flex-shrink-0" />
                            <div className="flex-1">
                                <div className="font-bold text-amber-800 mb-1">请先配置 AI API</div>
                                <div className="text-amber-700 text-sm mb-3">
                                    使用 AI 识别功能需要配置 API Key（支持智谱 GLM、DeepSeek、Google Gemini）
                                </div>
                                <button
                                    onClick={() => { onClose(); onOpenSettings(); }}
                                    className="px-4 py-2 bg-amber-500 text-white text-sm font-bold rounded-lg hover:bg-amber-600 transition-colors"
                                >
                                    前往设置
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 输入区域 */}
                    {isConfigured && (
                        <>
                            {/* 图片上传 */}
                            <div>
                                <label className="text-xs font-bold text-stone-500 mb-3 block uppercase tracking-wide flex items-center gap-2">
                                    <ImageIcon size={14} /> 购物截图
                                </label>
                                {imageBase64 ? (
                                    <div className="relative h-48">
                                        <Image
                                            src={imageBase64}
                                            alt="上传的图片"
                                            fill
                                            className="object-contain rounded-xl border border-stone-200"
                                            unoptimized
                                        />
                                        <button
                                            onClick={() => setImageBase64(null)}
                                            className="absolute top-2 right-2 p-2 bg-white/90 rounded-lg hover:bg-white shadow-md z-10"
                                        >
                                            <Trash2 size={16} className="text-rose-500" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:bg-stone-50 hover:border-violet-400 transition-all">
                                        <Upload size={32} className="text-stone-400 mb-2" />
                                        <span className="text-stone-500 text-sm">点击或拖拽上传图片</span>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                        />
                                    </label>
                                )}
                            </div>

                            {/* 文字输入 */}
                            <div>
                                <label className="text-xs font-bold text-stone-500 mb-3 block uppercase tracking-wide flex items-center gap-2">
                                    <FileText size={14} /> 订单文字
                                </label>
                                <textarea
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    placeholder="粘贴购物订单内容，例如：&#10;Bambu Lab PLA Basic 哑光黑 1kg ¥89 x2&#10;eSUN PLA+ 天空蓝 1kg ¥65"
                                    rows={4}
                                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 outline-none focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all resize-none"
                                />
                            </div>

                            {/* 解析按钮 */}
                            <button
                                onClick={handleParse}
                                disabled={loading || (!inputText && !imageBase64)}
                                className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-violet-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        AI 识别中...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={20} />
                                        开始识别
                                    </>
                                )}
                            </button>

                            {/* 错误提示 */}
                            {error && (
                                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3 fade-in">
                                    <AlertCircle size={20} className="text-rose-600" />
                                    <span className="text-rose-700">{error}</span>
                                </div>
                            )}

                            {/* 识别结果 */}
                            {results.length > 0 && (
                                <div className="space-y-4 fade-in">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-stone-800 flex items-center gap-2">
                                            <Check size={18} className="text-emerald-600" />
                                            识别到 {results.length} 种耗材
                                        </h3>
                                        <span className="text-xs text-stone-400">
                                            置信度: {Math.round(confidence * 100)}%
                                        </span>
                                    </div>

                                    <div className="space-y-3 max-h-48 overflow-y-auto">
                                        {results.map((item, index) => (
                                            <div
                                                key={index}
                                                className="bg-stone-50 rounded-xl p-4 flex items-center justify-between group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className="w-10 h-10 rounded-full border-2 border-white shadow-md"
                                                        style={{ backgroundColor: inferColorHex(item.color || item.colorName || '') }}
                                                    />
                                                    <div>
                                                        <div className="font-bold text-stone-800">
                                                            {item.brand} {item.type}
                                                        </div>
                                                        <div className="text-sm text-stone-500 flex gap-3">
                                                            <span>{item.colorName || item.color || '未知颜色'}</span>
                                                            <span>{item.weight}g</span>
                                                            <span>¥{item.price}</span>
                                                            {item.quantity > 1 && (
                                                                <span className="text-violet-600 font-bold">x{item.quantity}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveResult(index)}
                                                    className="p-2 text-stone-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={handleImport}
                                        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus size={20} />
                                        全部入库 ({results.reduce((sum, r) => sum + (r.quantity || 1), 0)} 卷)
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
