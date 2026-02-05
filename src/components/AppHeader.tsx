'use client';

import React from 'react';
import { Plus, FileDown, FileUp, Zap, Settings, Sparkles, Save, FolderLock } from 'lucide-react';

// 拓竹 A1 风格 3D 打印机图标
function PrinterIcon({ className = "" }: { className?: string }) {
    return (
        <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* 机身主体 */}
            <rect x="8" y="20" width="32" height="22" rx="3" fill="currentColor" opacity="0.15" />
            <rect x="8" y="20" width="32" height="22" rx="3" stroke="currentColor" strokeWidth="2.5" />
            {/* 打印平台 */}
            <rect x="14" y="28" width="20" height="3" rx="1" fill="currentColor" opacity="0.4" />
            {/* 龙门架 */}
            <path d="M12 20V10a2 2 0 012-2h20a2 2 0 012 2v10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            {/* 横梁 */}
            <rect x="12" y="8" width="24" height="3" rx="1" fill="currentColor" opacity="0.3" />
            {/* 打印头 */}
            <rect x="20" y="12" width="8" height="6" rx="1" fill="currentColor" />
            {/* 喷嘴 */}
            <path d="M24 18v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            {/* 料盘支架 */}
            <circle cx="40" cy="12" r="5" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.1" />
            <circle cx="40" cy="12" r="2" fill="currentColor" />
        </svg>
    );
}

export interface AppHeaderProps {
    farmMode: boolean;
    onToggleFarmMode: () => void;
    onOpenSettings: () => void;
    onOpenAIHub: () => void;
    onOpenAddModal: () => void;
    onImport: () => void;
    onExport: () => void;
    onManualSave: () => void;
    onConnectVault?: () => void;
    isVaultConnected?: boolean;
    vaultName?: string;
}

export const AppHeader = React.memo(function AppHeader(props: AppHeaderProps) {
    const {
        farmMode,
        onToggleFarmMode,
        onOpenSettings,
        onOpenAIHub,
        onOpenAddModal,
        onImport,
        onExport,
        onManualSave,
        onConnectVault,
        isVaultConnected,
        vaultName
    } = props;
    return (
        <header className="relative overflow-hidden bg-white/50 backdrop-blur-md shadow-[0_4px_20px_-12px_rgba(251,191,36,0.3)]">
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-200/50 to-transparent" />
            {/* 装饰性背景 */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-50/80 via-orange-50/60 to-amber-50/80" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-orange-100/40 to-transparent rounded-full -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-amber-100/30 to-transparent rounded-full -ml-32 -mb-32" />

            <div className="relative max-w-7xl mx-auto px-6 py-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
                    {/* 左侧：品牌区域 */}
                    <div className="flex items-center gap-4">
                        {/* 3D 打印机图标 (点击切换农场模式) */}
                        <div
                            className="relative group cursor-pointer"
                            onClick={onToggleFarmMode}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity ${farmMode ? 'from-indigo-400 to-purple-500' : ''}`} />
                            <div className={`relative p-3 bg-gradient-to-br rounded-2xl shadow-lg shadow-orange-200/50 transition-colors ${farmMode ? 'from-indigo-500 to-purple-600' : 'from-amber-400 to-orange-500'}`}>
                                <PrinterIcon className="w-10 h-10 text-white" />
                            </div>
                        </div>

                        {/* 标题区域 */}
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl md:text-3xl font-black text-stone-800 tracking-tight">
                                    3D 创作工坊
                                </h1>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                                    <Zap size={12} /> 在线
                                </span>
                            </div>
                            <p className="text-stone-500 text-sm mt-0.5">
                                管理你的耗材库存，记录每一次创作灵感
                            </p>
                        </div>
                    </div>

                    {/* 右侧：操作按钮 */}
                    <div className="flex flex-wrap gap-2 md:gap-3">
                        <button
                            onClick={onOpenSettings}
                            className="flex items-center gap-2 px-3 py-2.5 bg-white/80 border border-stone-200 text-stone-500 font-medium rounded-xl hover:bg-white hover:border-stone-300 transition-all shadow-sm"
                            title="设置"
                        >
                            <Settings size={16} />
                        </button>

                        {/* Local Vault Button (New) */}
                        <button
                            onClick={props.onConnectVault}
                            className={`flex items-center gap-2 px-4 py-2.5 border font-medium rounded-xl transition-all shadow-sm ${props.isVaultConnected
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-white/80 border-stone-200 text-stone-600 hover:bg-white hover:border-stone-300'
                                }`}
                            title={props.isVaultConnected ? "已连接本地保险箱" : "连接本地文件夹以安全存储"}
                        >
                            <FolderLock size={16} />
                            <span className="hidden sm:inline">
                                {props.isVaultConnected ? '已连接: ' + props.vaultName : '连接保险箱'}
                            </span>
                        </button>

                        <button
                            onClick={props.onManualSave}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white/80 border border-stone-200 text-stone-600 font-medium rounded-xl hover:bg-white hover:border-stone-300 transition-all shadow-sm"
                            title="保存数据"
                        >
                            <Save size={16} />
                            <span className="hidden sm:inline">保存</span>
                        </button>

                        <button
                            onClick={onImport}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white/80 border border-stone-200 text-stone-600 font-medium rounded-xl hover:bg-white hover:border-stone-300 transition-all shadow-sm"
                        >
                            <FileUp size={16} />
                            <span className="hidden sm:inline">导入</span>
                        </button>
                        <button
                            onClick={onExport}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white/80 border border-stone-200 text-stone-600 font-medium rounded-xl hover:bg-white hover:border-stone-300 transition-all shadow-sm"
                        >
                            <FileDown size={16} />
                            <span className="hidden sm:inline">导出</span>
                        </button>
                        <button
                            onClick={onOpenAIHub}
                            className="group flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-violet-300/40 hover:shadow-xl hover:shadow-violet-300/60 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                        >
                            <Sparkles size={16} />
                            <span className="hidden sm:inline">AI 中心</span>
                        </button>
                        <button
                            onClick={onOpenAddModal}
                            className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-300/40 hover:shadow-xl hover:shadow-orange-300/60 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                        >
                            <Plus size={18} strokeWidth={2.5} />
                            <span>入库新材料</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
});
