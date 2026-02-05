'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
    X, Sparkles, MessageSquare, Settings as SettingsIcon, Hexagon,
    Upload, Image as ImageIcon, FileText, Loader2, Check, AlertCircle,
    Plus, Trash2, Key, Shield, Eye, EyeOff, Lock, Send,
    Link2, Box, CheckCircle, Package
} from 'lucide-react';
import { Filament, AIConfig, ModelConfig } from '../lib/types';
import { parseFilamentInfo, ParsedFilament, chatWithAssistant, saveAIConfig, unlockAIConfig, PROVIDER_PRESETS } from '../lib/ai-service';
import { DEFAULT_BED_SETTINGS, inferColorHex, inferTemperature, compressImage } from '../lib/constants';

interface AIHubModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportFilaments: (filaments: Filament[]) => void;
    config: AIConfig | null;
    onConfigUpdate: (config: AIConfig) => void;
    filaments?: Filament[]; // 可选，因为可能还没传
}

const TABS = [
    { id: 'vision', label: '智能入库', icon: Sparkles },
    { id: 'chat', label: 'AI 助手', icon: MessageSquare },
    { id: 'config', label: '配置中心', icon: SettingsIcon },
] as const;

export function AIHubModal({ isOpen, onClose, onImportFilaments, config, onConfigUpdate, filaments = [] }: AIHubModalProps) {
    const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['id']>('vision');

    // --- Chat Image State (Added for multimodal support) ---
    // Note: Main chat state definitions moved to replace_file_content below to avoid conflicts
    // keeping this cleaner.


    // --- Vision State ---
    const [visionInput, setVisionInput] = useState('');
    const [visionImage, setVisionImage] = useState<string | null>(null);
    const [visionLoading, setVisionLoading] = useState(false);
    const [visionError, setVisionError] = useState<string | null>(null);
    const [visionResults, setVisionResults] = useState<ParsedFilament[]>([]);

    // --- Chat State (MUST be before conditional return) ---
    const [chatInput, setChatInput] = useState('');
    const [chatImage, setChatImage] = useState<string | null>(null);
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string; image?: string }[]>([
        { role: 'assistant', content: '你好！ 我是你的 3D 打印 AI 助手。我可以帮你查找库存、建议打印参数，或者解答任何 3D 打印相关的问题。你可以直接粘贴图片或截图发给我！' }
    ]);
    const [chatLoading, setChatLoading] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0); // 响应计时器（秒）
    const [lastResponseTime, setLastResponseTime] = useState<number | null>(null); // 上一次响应耗时
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll Chat
    useEffect(() => {
        setTimeout(() => {
            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }, 100);
    }, [chatHistory, chatLoading, chatImage]);

    // --- Vision State (选择性入库) ---
    const [selectedVisionIndices, setSelectedVisionIndices] = useState<Set<number>>(new Set());

    // --- Config State ---
    const [localConfig, setLocalConfig] = useState<AIConfig | null>(null);
    const [showKey, setShowKey] = useState<Record<string, boolean>>({});
    const [isLocked, setIsLocked] = useState(false);
    const [unlockPwd, setUnlockPwd] = useState('');
    const [configMsg, setConfigMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [subTab, setSubTab] = useState<'vl' | 'llm' | 'omni' | 'security'>('omni'); // 默认显示 omni

    // Default Config
    const DEFAULT_CONFIG: AIConfig = {
        enabled: true, // 全局开关
        storageMode: 'plain',
        omni: { provider: 'qwen', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', apiKey: '', model: 'qwen-omni-turbo', enabled: true },
        llm: { provider: 'deepseek', baseUrl: 'https://api.deepseek.com', apiKey: '', model: 'deepseek-chat', enabled: false },
        vl: { provider: 'qwen', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', apiKey: '', model: 'qwen-vl-plus', enabled: false }
    };

    // Sync config prop to localConfig, merge with defaults to ensure all fields exist
    useEffect(() => {
        if (config) {
            // 合并默认值，确保旧配置有 omni 字段
            const mergedConfig: AIConfig = {
                ...DEFAULT_CONFIG,
                ...config,
                llm: { ...DEFAULT_CONFIG.llm, ...config.llm },
                vl: { ...DEFAULT_CONFIG.vl, ...config.vl },
                omni: { ...DEFAULT_CONFIG.omni, ...(config.omni || {}) }
            };
            setLocalConfig(mergedConfig);
            setIsLocked(config.storageMode === 'encrypted');
        } else {
            setLocalConfig(DEFAULT_CONFIG);
        }
    }, [config]);

    // Scroll chat to bottom


    if (!isOpen) return null;

    // --- Vision Handlers ---
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = async () => {
            const compressed = await compressImage(reader.result as string, 800, 0.7);
            setVisionImage(compressed);
        };
        reader.readAsDataURL(file);
    };

    const handleVisionParse = async () => {
        if (!localConfig?.enabled || isLocked) { setVisionError('请先在"配置中心"解锁并启用 AI'); return; }
        if (!visionInput && !visionImage) return;

        setVisionLoading(true);
        setVisionError(null);
        setVisionResults([]);

        const res = await parseFilamentInfo(localConfig, visionInput, visionImage || undefined);
        setVisionLoading(false);

        if (res.error) setVisionError(res.error);
        else {
            setVisionResults(res.items);
            // 自动全选所有识别结果
            setSelectedVisionIndices(new Set(res.items.map((_, idx) => idx)));
        }
    };

    const handleImport = () => {
        // 只入库选中的耗材
        const newItems: Filament[] = [];
        visionResults.forEach((item, idx) => {
            if (!selectedVisionIndices.has(idx)) return; // 跳过未选中的

            const temp = inferTemperature(item.type);
            const colorHex = inferColorHex(item.color || item.colorName || '');
            const baseItem: Filament = {
                id: '',
                brand: item.brand, type: item.type, color: colorHex, colorName: item.colorName || '未知',
                weight: item.weight || 1000, remaining: item.weight || 1000, price: item.price || 0,
                tempMin: temp.min, tempMax: temp.max, flowRatio: 0.98, pressureAdvance: 0.02,
                defaultPlate: 'textured', bedSettings: DEFAULT_BED_SETTINGS, history: [], createdAt: new Date().toISOString()
            };
            const qty = item.quantity || 1;
            for (let i = 0; i < qty; i++) newItems.push({ ...baseItem, id: crypto.randomUUID() });
        });
        onImportFilaments(newItems);
        onClose();
        // Reset
        setVisionResults([]); setVisionInput(''); setVisionImage(null); setSelectedVisionIndices(new Set());
    };


    // Helper to process image file
    const processImageFile = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
            if (typeof reader.result === 'string') {
                const compressed = await compressImage(reader.result, 800, 0.7);
                setChatImage(compressed);
            }
        };
        reader.readAsDataURL(file);
    };

    // Handle Paste
    const handlePaste = async (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (const item of items) {
            if (item.type.indexOf('image') !== -1) {
                e.preventDefault();
                const file = item.getAsFile();
                if (file) processImageFile(file);
            }
        }
    };

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processImageFile(file);
    };

    // 从 AI 回复中提取耗材数据
    const extractFilamentsFromMessage = (content: string): ParsedFilament[] | null => {
        try {
            const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || content.match(/(\{[\s\S]*?"items"[\s\S]*?\})/);
            if (!jsonMatch) return null;
            const parsed = JSON.parse(jsonMatch[1]);
            return (parsed.items && Array.isArray(parsed.items)) ? parsed.items : null;
        } catch {
            return null;
        }
    };

    // 一键入库
    const handleQuickImport = (items: ParsedFilament[]) => {
        const newFilaments: Filament[] = [];
        items.forEach(item => {
            const temp = inferTemperature(item.type);
            const colorHex = inferColorHex(item.color || item.colorName || '');
            const baseItem: Filament = {
                id: '',
                brand: item.brand,
                type: item.type,
                color: colorHex,
                colorName: item.colorName || '未知',
                weight: item.weight || 1000,
                remaining: item.weight || 1000,
                price: item.price || 0,
                tempMin: temp.min,
                tempMax: temp.max,
                flowRatio: 0.98,
                pressureAdvance: 0.02,
                defaultPlate: 'textured',
                bedSettings: DEFAULT_BED_SETTINGS,
                history: [],
                createdAt: new Date().toISOString()
            };
            const qty = item.quantity || 1;
            for (let i = 0; i < qty; i++) {
                newFilaments.push({ ...baseItem, id: crypto.randomUUID() });
            }
        });
        onImportFilaments(newFilaments);
        setChatHistory(prev => [...prev, {
            role: 'assistant',
            content: `✅ 已成功导入 ${newFilaments.length} 条耗材记录！`
        }]);
    };

    // --- Chat Handlers ---
    const handleSendMessage = async () => {
        if ((!chatInput.trim() && !chatImage) || !localConfig?.enabled || isLocked) return;

        // 检查图片是否需要 VL 模型
        const img = chatImage;
        if (img && !localConfig.vl.apiKey) {
            setChatHistory(prev => [...prev, {
                role: 'assistant',
                content: '⚠️ 图片识别需要配置视觉模型 (VL)。请在配置中心 > 视觉模型 中设置 API Key（推荐使用 qwen-vl-max 或 glm-4v-flash）。'
            }]);
            return;
        }

        if (!img && !localConfig.llm.apiKey) {
            setChatHistory(prev => [...prev, { role: 'assistant', content: '请先在配置中心设置 API Key' }]);
            return;
        }

        const userMsg = chatInput;

        // Optimistic Update - 存储图片 Base64
        setChatInput('');
        setChatImage(null);
        setChatHistory(prev => [...prev, {
            role: 'user',
            content: userMsg,
            image: img || undefined
        }]);
        setChatLoading(true);
        setElapsedTime(0);
        setLastResponseTime(null);

        // 启动计时器
        const startTime = Date.now();
        timerRef.current = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - startTime) / 100) / 10);
        }, 100);

        try {
            // 限制历史记录长度（只保留最近 6 条，减少 Token）
            const recentHistory = chatHistory.slice(-6);

            // 准备上下文数据 (库存摘要 - 精简版)
            const contextData = filaments && filaments.length > 0 ? {
                summary: `共${filaments.length}卷耗材，总重${filaments.reduce((a: number, f: any) => a + f.remaining, 0)}g`
            } : undefined;

            const reply = await chatWithAssistant(
                localConfig,
                recentHistory, // 使用精简的历史
                userMsg || (img ? '请分析这张图片' : ''),
                contextData,
                img || undefined
            );

            // 记录耗时
            const duration = (Date.now() - startTime) / 1000;
            setLastResponseTime(duration);

            setChatHistory(prev => [...prev, { role: 'assistant', content: reply }]);
        } catch (e: any) {
            const errorMsg = e?.message || '未知错误';
            setChatHistory(prev => [...prev, {
                role: 'assistant',
                content: `抱歉，AI 响应失败。\n错误：${errorMsg}\n请检查配置或网络。`
            }]);
        } finally {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            setChatLoading(false);
        }
    };

    // 清空对话历史
    const handleClearChat = () => {
        setChatHistory([
            { role: 'assistant', content: '对话已清空。有什么可以帮您的？' }
        ]);
        setLastResponseTime(null);
    };

    // --- Config Handlers ---
    const handleUnlock = async () => {
        if (!localConfig) return;
        try {
            const unlocked = await unlockAIConfig(localConfig, unlockPwd);
            setLocalConfig(unlocked);
            setIsLocked(false);
            onConfigUpdate(unlocked);
            setConfigMsg({ type: 'success', text: '解锁成功' });
        } catch (e) {
            setConfigMsg({ type: 'error', text: '密码错误' });
        }
    };

    const handleSaveConfig = async () => {
        if (!localConfig) return;
        try {
            // If we are setting up encryption for the first time, we need a password?
            // Reuse unlockPwd if available, or ask user?
            // Simplified: If storageMode is encrypted, use unlockPwd.
            await saveAIConfig(localConfig, localConfig.storageMode === 'encrypted' ? unlockPwd : undefined);
            onConfigUpdate(localConfig);
            setConfigMsg({ type: 'success', text: '配置已保存' });
        } catch (e) {
            setConfigMsg({ type: 'error', text: '保存失败' });
        }
    };

    const updateModel = (type: 'llm' | 'vl' | 'omni', updates: Partial<ModelConfig>) => {
        setLocalConfig(prev => prev ? ({ ...prev, [type]: { ...prev[type], ...updates } }) : null);
    };

    // --- Render ---
    return (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[85vh] overflow-hidden flex flex-col md:flex-row">

                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 bg-stone-50 border-r border-stone-100 p-4 md:flex flex-col gap-2 hidden">
                    <div className="mb-6 px-2 flex items-center gap-2">
                        <Hexagon className="text-violet-600 fill-violet-100" size={28} />
                        <span className="font-bold text-xl text-stone-800">AI 中心</span>
                    </div>
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === tab.id
                                ? 'bg-white text-violet-600 shadow-sm shadow-stone-200'
                                : 'text-stone-500 hover:bg-stone-100'
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                    <div className="mt-auto px-4 py-4 bg-violet-50 rounded-xl">
                        <div className="text-xs font-bold text-violet-800 mb-1">当前状态</div>
                        <div className="flex items-center gap-2 text-xs text-violet-600">
                            <div className={`w-2 h-2 rounded-full ${localConfig?.enabled ? 'bg-emerald-500' : 'bg-stone-300'}`} />
                            {isLocked ? '已锁定' : (localConfig?.enabled ? '在线' : '离线')}
                        </div>
                    </div>
                </div>

                {/* Mobile Header (Tabs) */}
                <div className="md:hidden border-b border-stone-100 flex overflow-x-auto p-2">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold ${activeTab === tab.id ? 'text-violet-600' : 'text-stone-400'}`}
                        >
                            <tab.icon size={16} /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col h-full overflow-hidden bg-white relative">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-stone-100 rounded-full text-stone-400 z-10">
                        <X size={24} />
                    </button>

                    {/* --- Vision Tab --- */}
                    {activeTab === 'vision' && (
                        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">
                            <h2 className="text-2xl font-bold text-stone-800 mb-2">智能入库</h2>
                            <p className="text-stone-500 text-sm mb-6">上传购物截图，或直接粘贴 Excel/Word 表格、订单文本，AI 自动提取参数。</p>

                            {!localConfig?.enabled && (
                                <div className="p-4 bg-amber-50 text-amber-600 rounded-xl text-sm mb-4">功能未启用，请前往配置中心开启。</div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    {visionImage ? (
                                        <div className="border-2 border-dashed rounded-2xl h-48 border-violet-500 bg-violet-50/10 relative">
                                            <Image src={visionImage} alt="Uploaded" fill className="object-contain rounded-xl p-2" unoptimized />
                                            <button onClick={() => setVisionImage(null)} className="absolute top-4 right-4 bg-white p-2 rounded-full shadow hover:text-rose-500 z-10"><Trash2 size={16} /></button>
                                        </div>
                                    ) : (
                                        <label className="border-2 border-dashed rounded-2xl h-48 flex flex-col items-center justify-center transition-colors border-stone-200 hover:border-violet-400 hover:bg-stone-50 cursor-pointer">
                                            <Upload size={32} className="mb-2 text-stone-400" />
                                            <span className="text-sm font-bold text-stone-400">点击或拖拽上传图片</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                        </label>
                                    )}
                                    <textarea
                                        className="w-full p-4 bg-stone-50 rounded-2xl border-stone-100 text-sm focus:ring-2 focus:ring-violet-500 outline-none resize-none h-32"
                                        placeholder="或在此粘贴 Excel 表格、商品描述文本..."
                                        value={visionInput}
                                        onChange={e => setVisionInput(e.target.value)}
                                    />
                                    <button
                                        onClick={handleVisionParse}
                                        disabled={visionLoading || (!visionInput && !visionImage)}
                                        className="w-full py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                                    >
                                        {visionLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                                        开始识别
                                    </button>
                                    {visionError && <div className="text-rose-500 text-sm font-bold bg-rose-50 p-3 rounded-xl">{visionError}</div>}
                                </div>

                                <div className="bg-stone-50 rounded-2xl p-6 overflow-y-auto h-[400px]">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-stone-400 text-xs uppercase">识别结果</h3>
                                        {visionResults.length > 0 && (
                                            <button
                                                onClick={() => {
                                                    const allSelected = visionResults.every((_, idx) => selectedVisionIndices.has(idx));
                                                    if (allSelected) {
                                                        setSelectedVisionIndices(new Set());
                                                    } else {
                                                        setSelectedVisionIndices(new Set(visionResults.map((_, idx) => idx)));
                                                    }
                                                }}
                                                className="text-xs text-violet-600 hover:text-violet-700 font-bold"
                                            >
                                                {visionResults.every((_, idx) => selectedVisionIndices.has(idx)) ? '取消全选' : '全选'}
                                            </button>
                                        )}
                                    </div>
                                    {visionResults.length === 0 ? (
                                        <div className="text-center text-stone-300 py-20">暂无结果</div>
                                    ) : (
                                        <div className="space-y-3">
                                            {visionResults.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => {
                                                        const newSelected = new Set(selectedVisionIndices);
                                                        if (newSelected.has(idx)) {
                                                            newSelected.delete(idx);
                                                        } else {
                                                            newSelected.add(idx);
                                                        }
                                                        setSelectedVisionIndices(newSelected);
                                                    }}
                                                    className={`bg-white p-4 rounded-xl shadow-sm border cursor-pointer transition-all ${selectedVisionIndices.has(idx) ? 'border-violet-500 ring-2 ring-violet-100' : 'border-stone-100 hover:border-violet-300'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedVisionIndices.has(idx)}
                                                                onChange={() => { }}
                                                                className="w-4 h-4 text-violet-600 rounded"
                                                            />
                                                            <div>
                                                                <div className="font-bold text-stone-800">{item.brand} {item.type}</div>
                                                                <div className="text-xs text-stone-500">{item.colorName} · {item.weight}g</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full border border-stone-200" style={{ backgroundColor: inferColorHex(item.color || item.colorName) }} />
                                                            {item.quantity > 1 && <span className="bg-violet-100 text-violet-700 text-xs px-2 py-1 rounded-full">x{item.quantity}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                onClick={handleImport}
                                                disabled={selectedVisionIndices.size === 0}
                                                className={`w-full mt-4 py-3 font-bold rounded-xl transition-all ${selectedVisionIndices.size > 0
                                                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                {selectedVisionIndices.size > 0 ? `确认入库 (${selectedVisionIndices.size} 条)` : '请选择要入库的耗材'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- Chat Tab --- */}
                    {activeTab === 'chat' && (
                        <div className="flex-1 flex flex-col h-full">
                            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-stone-800">AI 助手</h2>
                                    <p className="text-stone-500 text-sm">打印问题诊断、参数咨询、耗材建议。</p>
                                </div>
                                <button
                                    onClick={handleClearChat}
                                    className="px-3 py-1.5 text-sm text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                                    title="清空对话（可加速响应）"
                                >
                                    <Trash2 size={16} className="inline mr-1" />
                                    清空
                                </button>
                            </div>
                            <div
                                ref={scrollRef}
                                className="flex-1 overflow-y-auto p-6 space-y-4 bg-stone-50/50"
                            >
                                {chatHistory.length === 0 && (
                                    <div className="text-center text-stone-300 py-20">
                                        <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                                        <p>有什么可以帮您？</p>
                                    </div>
                                )}
                                {chatHistory.map((msg, i) => {
                                    // 检测 assistant 消息中是否包含耗材数据
                                    const filamentData = msg.role === 'assistant' ? extractFilamentsFromMessage(msg.content) : null;

                                    return (
                                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                                ? 'bg-violet-600 text-white rounded-br-none'
                                                : 'bg-white border border-stone-100 text-stone-700 rounded-bl-none shadow-sm'
                                                }`}>
                                                {/* 如果有图片，先显示图片 */}
                                                {msg.image && (
                                                    <img
                                                        src={msg.image}
                                                        alt="用户上传"
                                                        className="w-full rounded-t-2xl max-w-xs object-cover"
                                                    />
                                                )}
                                                {/* 文字内容 */}
                                                {msg.content && (
                                                    <div className="p-4 whitespace-pre-wrap">
                                                        {msg.content}
                                                    </div>
                                                )}
                                                {/* 一键入库按钮 */}
                                                {filamentData && filamentData.length > 0 && (
                                                    <div className="px-4 pb-4">
                                                        <button
                                                            onClick={() => handleQuickImport(filamentData)}
                                                            className="w-full px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <Package size={18} />
                                                            一键入库 ({filamentData.length} 条)
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {/* Loading 气泡 - 实时计时 */}
                                {chatLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white border border-stone-100 text-stone-500 rounded-2xl rounded-bl-none shadow-sm p-4 flex items-center gap-2">
                                            <Loader2 size={16} className="animate-spin" />
                                            <span className="text-sm">AI 正在思考... {elapsedTime.toFixed(1)}s</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 输入区域 */}
                            <div className="p-4 bg-white border-t border-stone-100">
                                {/* 图片预览 */}
                                {chatImage && (
                                    <div className="mb-2 relative inline-block">
                                        <img src={chatImage} alt="Preview" className="h-20 w-auto rounded-lg border border-stone-200 shadow-sm" />
                                        <button
                                            onClick={() => setChatImage(null)}
                                            className="absolute -top-2 -right-2 p-1 bg-stone-800 text-white rounded-full hover:bg-stone-900 shadow-md"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    {/* 图片上传按钮 */}
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-3 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
                                        title="上传图片"
                                        disabled={chatLoading}
                                    >
                                        <ImageIcon size={20} />
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                    />

                                    <div className="flex-1 relative">
                                        <input
                                            className="w-full px-4 py-3 bg-stone-50 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                                            placeholder="输入问题，或直接 Ctrl+V 粘贴图片..."
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                            onPaste={handlePaste}
                                            disabled={chatLoading}
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={(!chatInput.trim() && !chatImage) || chatLoading}
                                            className="absolute right-2 top-2 p-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                        >
                                            {chatLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-2 text-center">
                                    <p className="text-[10px] text-stone-400">
                                        {lastResponseTime
                                            ? `上次响应耗时 ${lastResponseTime.toFixed(1)} 秒 · `
                                            : ''}
                                        支持粘贴截图 (Ctrl+V) 或上传图片
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- Config Tab --- */}
                    {activeTab === 'config' && localConfig && (
                        <div className="flex-1 overflow-y-auto p-6 md:p-10">
                            <h2 className="text-2xl font-bold text-stone-800 mb-6">配置中心</h2>

                            {isLocked ? (
                                <div className="flex flex-col items-center justify-center h-64 bg-stone-50 rounded-2xl border border-stone-100">
                                    <Lock size={32} className="text-stone-400 mb-4" />
                                    <input
                                        type="password"
                                        placeholder="输入密码解锁"
                                        className="px-4 py-2 rounded-xl border border-stone-200 mb-4 text-center"
                                        value={unlockPwd}
                                        onChange={e => setUnlockPwd(e.target.value)}
                                    />
                                    <button onClick={handleUnlock} className="px-6 py-2 bg-stone-800 text-white rounded-xl font-bold">解锁</button>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {/* 模型选择 Tabs */}
                                    <div className="flex gap-4 border-b border-stone-100 pb-2 overflow-x-auto">
                                        <button onClick={() => setSubTab('omni')} className={`font-bold pb-2 px-2 transition-colors whitespace-nowrap ${subTab === 'omni' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-stone-400 hover:text-stone-600'}`}>
                                            全模态 ✨
                                        </button>
                                        <button onClick={() => setSubTab('llm')} className={`font-bold pb-2 px-2 transition-colors whitespace-nowrap ${subTab === 'llm' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-stone-400 hover:text-stone-600'}`}>
                                            语言模型
                                        </button>
                                        <button onClick={() => setSubTab('vl')} className={`font-bold pb-2 px-2 transition-colors whitespace-nowrap ${subTab === 'vl' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-stone-400 hover:text-stone-600'}`}>
                                            视觉模型
                                        </button>
                                        <button onClick={() => setSubTab('security')} className={`font-bold pb-2 px-2 transition-colors whitespace-nowrap ${subTab === 'security' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-stone-400 hover:text-stone-600'}`}>
                                            安全设置
                                        </button>
                                    </div>

                                    {(subTab === 'vl' || subTab === 'llm' || subTab === 'omni') && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                            {/* 快速预设卡片 */}
                                            <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                                                <div className="text-xs font-bold text-stone-500 mb-3 uppercase tracking-wider">
                                                    快速配置预设
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {(['deepseek', 'qwen', 'openai'] as const).map(p => (
                                                        <button
                                                            key={p}
                                                            onClick={() => {
                                                                const preset = PROVIDER_PRESETS[p];
                                                                updateModel(subTab, { provider: p, baseUrl: preset.baseUrl, model: preset.model });
                                                            }}
                                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold border transition-all ${localConfig[subTab].provider === p
                                                                ? 'bg-stone-800 text-white border-stone-800 shadow-md'
                                                                : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-100'
                                                                }`}
                                                        >
                                                            {p === 'deepseek' && 'DeepSeek (深度求索)'}
                                                            {p === 'qwen' && 'Qwen (通义千问)'}
                                                            {p === 'openai' && 'OpenAI (GPT-4)'}
                                                            {localConfig[subTab].provider === p && <Check size={14} />}
                                                        </button>
                                                    ))}
                                                    <button
                                                        onClick={() => updateModel(subTab, { provider: 'custom' })}
                                                        className={`px-3 py-2 rounded-lg text-sm font-bold border ${localConfig[subTab].provider === 'custom' ? 'bg-stone-800 text-white' : 'bg-white border-stone-200'}`}
                                                    >
                                                        自定义
                                                    </button>
                                                </div>
                                                <div className="mt-3 text-xs text-stone-400">
                                                    {subTab === 'vl' ? '推荐使用 Qwen-VL-Max 或 GPT-4o 进行图片识别。' : '推荐使用 DeepSeek-V3 或 GPT-4o 进行对话。'}
                                                </div>
                                            </div>

                                            {/* 详细配置表单 */}
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-xs font-bold text-stone-500 uppercase mb-1.5 block">API Endpoint (Base URL)</label>
                                                    <div className="relative">
                                                        <div className="absolute left-3 top-3.5 text-stone-400">
                                                            <Link2 size={16} />
                                                        </div>
                                                        <input
                                                            className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-stone-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none font-mono text-sm transition-all"
                                                            value={localConfig[subTab].baseUrl}
                                                            onChange={e => updateModel(subTab, { baseUrl: e.target.value })}
                                                            placeholder="https://api.example.com/v1"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-xs font-bold text-stone-500 uppercase mb-1.5 block">API Key</label>
                                                    <div className="relative">
                                                        <div className="absolute left-3 top-3.5 text-stone-400">
                                                            <Key size={16} />
                                                        </div>
                                                        <input
                                                            type={showKey[subTab] ? 'text' : 'password'}
                                                            className="w-full pl-10 pr-10 py-3 bg-white rounded-xl border border-stone-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none font-mono text-sm transition-all"
                                                            value={localConfig[subTab].apiKey}
                                                            onChange={e => updateModel(subTab, { apiKey: e.target.value })}
                                                            placeholder="sk-..."
                                                        />
                                                        <button
                                                            onClick={() => setShowKey(p => ({ ...p, [subTab]: !p[subTab] }))}
                                                            className="absolute right-3 top-3.5 text-stone-400 hover:text-stone-600"
                                                        >
                                                            {showKey[subTab] ? <EyeOff size={16} /> : <Eye size={16} />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-xs font-bold text-stone-500 uppercase mb-1.5 block">Model Name</label>
                                                    <div className="relative">
                                                        <div className="absolute left-3 top-3.5 text-stone-400">
                                                            <Box size={16} />
                                                        </div>
                                                        <input
                                                            className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-stone-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none font-mono text-sm transition-all"
                                                            value={localConfig[subTab].model}
                                                            onChange={e => updateModel(subTab, { model: e.target.value })}
                                                            placeholder="gpt-4o, deepseek-chat..."
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {subTab === 'security' && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                                                        <Shield size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-emerald-900">安全存储</div>
                                                        <div className="text-xs text-emerald-700">Client-side Encryption enabled</div>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-emerald-800 leading-relaxed">
                                                    您的 API Key 仅存储在浏览器本地，并使用 AES 加密。服务器无法读取您的密钥。建议在公共设备上开启此功能。
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-stone-200">
                                                <div>
                                                    <div className="font-bold text-stone-800">加密保护</div>
                                                    <div className="text-xs text-stone-500">每次访问需要输入密码</div>
                                                </div>
                                                <button
                                                    onClick={() => setLocalConfig(prev => prev ? ({ ...prev, storageMode: prev.storageMode === 'plain' ? 'encrypted' : 'plain' }) : null)}
                                                    className={`w-12 h-6 rounded-full transition-colors relative ${localConfig.storageMode === 'encrypted' ? 'bg-emerald-500' : 'bg-stone-200'}`}
                                                >
                                                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm ${localConfig.storageMode === 'encrypted' ? 'right-1' : 'left-1'}`} />
                                                </button>
                                            </div>

                                            {localConfig.storageMode === 'encrypted' && (
                                                <div className="animate-in fade-in">
                                                    <label className="text-xs font-bold text-stone-500 uppercase mb-1.5 block">设置解锁密码</label>
                                                    <input
                                                        type="password"
                                                        className="w-full px-4 py-3 bg-white rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                                        placeholder="输入新密码"
                                                        value={unlockPwd}
                                                        onChange={e => setUnlockPwd(e.target.value)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="pt-6 flex flex-col gap-4 border-t border-stone-100 mt-8">
                                        {/* 每个模型的独立启用开关 */}
                                        <div className="text-xs font-bold text-stone-500 mb-1">模型启用状态</div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${localConfig.omni?.enabled ? 'bg-violet-50 border-violet-200' : 'bg-stone-50 border-stone-200'}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={localConfig.omni?.enabled ?? false}
                                                    onChange={e => updateModel('omni', { enabled: e.target.checked })}
                                                    className="w-4 h-4 text-violet-600 rounded"
                                                />
                                                <div>
                                                    <div className={`text-sm font-bold ${localConfig.omni?.enabled ? 'text-violet-700' : 'text-stone-400'}`}>全模态 ✨</div>
                                                    <div className="text-[10px] text-stone-400">文字+图片一体</div>
                                                </div>
                                            </label>
                                            <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${localConfig.llm?.enabled ? 'bg-blue-50 border-blue-200' : 'bg-stone-50 border-stone-200'}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={localConfig.llm?.enabled ?? false}
                                                    onChange={e => updateModel('llm', { enabled: e.target.checked })}
                                                    className="w-4 h-4 text-blue-600 rounded"
                                                />
                                                <div>
                                                    <div className={`text-sm font-bold ${localConfig.llm?.enabled ? 'text-blue-700' : 'text-stone-400'}`}>语言模型</div>
                                                    <div className="text-[10px] text-stone-400">纯文本对话</div>
                                                </div>
                                            </label>
                                            <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${localConfig.vl?.enabled ? 'bg-emerald-50 border-emerald-200' : 'bg-stone-50 border-stone-200'}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={localConfig.vl?.enabled ?? false}
                                                    onChange={e => updateModel('vl', { enabled: e.target.checked })}
                                                    className="w-4 h-4 text-emerald-600 rounded"
                                                />
                                                <div>
                                                    <div className={`text-sm font-bold ${localConfig.vl?.enabled ? 'text-emerald-700' : 'text-stone-400'}`}>视觉模型</div>
                                                    <div className="text-[10px] text-stone-400">智能入库</div>
                                                </div>
                                            </label>
                                        </div>
                                        <p className="text-[10px] text-stone-400">提示：只启用"全模态"即可处理所有请求，无需同时开启其他模型。</p>
                                    </div>

                                    <div className="pt-4 flex justify-end items-center">
                                        <div className="flex items-center gap-3">
                                            {configMsg && (
                                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold animate-in fade-in ${configMsg.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    {configMsg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                                    {configMsg.text}
                                                </div>
                                            )}
                                            <button
                                                onClick={handleSaveConfig}
                                                className="px-6 py-2.5 bg-stone-800 text-white rounded-xl font-bold hover:bg-stone-900 hover:shadow-lg hover:shadow-stone-300/30 transition-all active:scale-95"
                                            >
                                                保存配置
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                    )}
                </div>
            </div>
        </div>
    );
}
