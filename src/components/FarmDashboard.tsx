'use client';

import React from 'react';
import { Printer } from '../lib/types';
import { Printer as PrinterIcon, Thermometer, Clock, CheckCircle, AlertTriangle, Play } from 'lucide-react';

interface FarmDashboardProps {
    printers: Printer[];
    onOpenSettings: () => void;
}

export function FarmDashboard({ printers, onOpenSettings }: FarmDashboardProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* 顶栏状态概览 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                        <PrinterIcon size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-stone-500 font-bold">在线设备</div>
                        <div className="text-2xl font-black text-stone-800">{printers.length}</div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                        <Play size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-stone-500 font-bold">正在打印</div>
                        <div className="text-2xl font-black text-stone-800">
                            {printers.filter(p => p.status === 'printing').length}
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                        <Clock size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-stone-500 font-bold">剩余时间</div>
                        <div className="text-2xl font-black text-stone-800">1h 24m</div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-stone-500 font-bold">维护警告</div>
                        <div className="text-2xl font-black text-stone-800">0</div>
                    </div>
                </div>
            </div>

            {/* 设备卡片网格 */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {printers.map(printer => (
                    <div key={printer.id} className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-1 h-2 bg-gradient-to-r from-amber-400 to-orange-500" />
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center">
                                        <PrinterIcon className="text-stone-400" size={24} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-lg text-stone-800">{printer.name}</div>
                                        <div className="text-xs font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full inline-block">
                                            {printer.type}
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${printer.status === 'printing'
                                    ? 'bg-amber-50 text-amber-600'
                                    : 'bg-emerald-50 text-emerald-600'
                                    }`}>
                                    <div className={`w-2 h-2 rounded-full ${printer.status === 'printing' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                                        }`} />
                                    {printer.status === 'printing' ? '工作中' : '空闲'}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* 进度条模拟 */}
                                {printer.status === 'printing' ? (
                                    <div>
                                        <div className="flex justify-between text-xs font-bold text-stone-500 mb-2">
                                            <span>Printing: Iron Man Helmet</span>
                                            <span>45%</span>
                                        </div>
                                        <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-amber-500 w-[45%]" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-[46px] flex items-center justify-center bg-stone-50 rounded-xl border border-dashed border-stone-200 text-stone-400 text-sm font-bold">
                                        等待任务...
                                    </div>
                                )}

                                {/* 底部参数 */}
                                <div className="flex justify-between items-center pt-4 border-t border-stone-100">
                                    <div className="flex items-center gap-4 text-xs font-bold text-stone-500">
                                        <div className="flex items-center gap-1.5">
                                            <Thermometer size={14} className="text-rose-500" />
                                            <span>210°C</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Thermometer size={14} className="text-amber-500" />
                                            <span>60°C</span>
                                        </div>
                                    </div>
                                    {printer.status === 'printing' && (
                                        <div className="text-xs font-bold text-blue-500 flex items-center gap-1">
                                            <Clock size={12} />
                                            <span>-45m</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* 添加新设备 Placeholder */}
                <button
                    onClick={onOpenSettings}
                    className="h-[240px] rounded-2xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center gap-3 text-stone-400 hover:text-stone-600 hover:border-stone-300 hover:bg-stone-50 transition-all group"
                >
                    <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <PrinterIcon size={24} />
                    </div>
                    <div className="font-bold">添加新设备</div>
                </button>
            </div>
        </div>
    );
}
