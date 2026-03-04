'use client';

import React, { useState, useMemo } from 'react';
import { Search, Book, LayoutGrid, Image as ImageIcon, Plus, List, Grid2X2, Trash2, CheckSquare, Square, X } from 'lucide-react';
import { FilamentCard } from './FilamentCard';
import { FilamentList } from './FilamentList';
import { FilamentTile } from './FilamentTile';
import { WorksGallery } from './WorksGallery';
import { Filament } from '../lib/types';

interface FilamentTableProps {
    filaments: Filament[];
    onCardClick?: (filament: Filament) => void;
    onEdit?: (filament: Filament) => void;
    onDelete?: (id: string) => void;
    onBatchDelete?: (ids: string[]) => void;
    onOpenPresetManager?: () => void;
    onOpenPrintJob?: () => void;
    onUpdateFilament?: (filament: Filament) => Promise<Filament[]>;
}

type ViewType = 'grid' | 'list' | 'tile';

export function FilamentTable({ filaments, onCardClick, onEdit, onDelete, onBatchDelete, onOpenPresetManager, onOpenPrintJob, onUpdateFilament }: FilamentTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeBrand, setActiveBrand] = useState<string | null>(null);
    const [activeType, setActiveType] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'materials' | 'works'>('materials');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [selectMode, setSelectMode] = useState(false);

    // View Mode State with persistence
    const [viewMode, setViewMode] = useState<ViewType>('grid');

    // Load persisted view mode on mount
    React.useEffect(() => {
        const savedMode = localStorage.getItem('filamentViewMode') as ViewType;
        if (savedMode && ['grid', 'list', 'tile'].includes(savedMode)) {
            setViewMode(savedMode);
        }
    }, []);

    const handleSetViewMode = (mode: ViewType) => {
        setViewMode(mode);
        localStorage.setItem('filamentViewMode', mode);
    };

    // 处理从卡片跳转到作品集
    const handleViewWorks = (filament: Filament) => {
        setActiveTab('works');
        // 自动筛选该品牌的作品，提供类似"查看该系列作品"的体验
        setActiveBrand(filament.brand);
        setSearchTerm('');
    };

    // 提取所有品牌
    const allBrands = useMemo(() =>
        Array.from(new Set(filaments.map(f => f.brand))).filter(Boolean).sort(),
        [filaments]);

    // 提取所有材质类型
    const allTypes = useMemo(() =>
        Array.from(new Set(filaments.map(f => f.type))).filter(Boolean).sort(),
        [filaments]);

    // 过滤逻辑
    const filteredData = useMemo(() => {
        return filaments.filter(item => {
            const matchSearch =
                item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.colorName.toLowerCase().includes(searchTerm.toLowerCase());

            const matchBrand = activeBrand ? item.brand === activeBrand : true;
            const matchType = activeType ? item.type === activeType : true;

            return matchSearch && matchBrand && matchType;
        });
    }, [filaments, searchTerm, activeBrand, activeType]);


    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg shadow-stone-200/50 border border-stone-100 min-h-[600px] flex flex-col fade-in overflow-hidden">
            {/* 头部：搜索与筛选 */}
            <div className="p-8 border-b border-stone-100/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-white to-orange-50/30 z-10">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => {
                            setActiveTab('materials');
                            setActiveBrand(null); // 切换回桌面时重置筛选，避免用户困惑
                            setActiveType(null);
                        }}
                        className={`text-xl font-bold flex items-center gap-2 transition-colors ${activeTab === 'materials' ? 'text-stone-800' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                        {activeTab === 'materials' && <div className="w-2 h-6 bg-amber-500 rounded-full animate-in fade-in zoom-in duration-300"></div>}
                        <LayoutGrid size={24} className={activeTab === 'materials' ? 'text-stone-800' : 'text-stone-300'} />
                        材料桌面
                    </button>
                    <div className="h-6 w-px bg-stone-200"></div>
                    <button
                        onClick={() => setActiveTab('works')}
                        className={`text-xl font-bold flex items-center gap-2 transition-colors ${activeTab === 'works' ? 'text-stone-800' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                        {activeTab === 'works' && <div className="w-2 h-6 bg-amber-500 rounded-full animate-in fade-in zoom-in duration-300"></div>}
                        <ImageIcon size={24} className={activeTab === 'works' ? 'text-stone-800' : 'text-stone-300'} />
                        我的作品
                    </button>
                </div>

                <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                    <div className="flex gap-2 w-full md:w-auto items-center">
                        {/* 视图切换器 (仅在材料桌面显示) */}
                        {activeTab === 'materials' && (
                            <div className="bg-stone-100 p-1 rounded-xl flex gap-1 mr-2">
                                <button
                                    onClick={() => handleSetViewMode('grid')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                                    title="大图标视图"
                                >
                                    <LayoutGrid size={18} />
                                </button>
                                <button
                                    onClick={() => handleSetViewMode('tile')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'tile' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                                    title="平铺视图"
                                >
                                    <Grid2X2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleSetViewMode('list')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                                    title="列表视图"
                                >
                                    <List size={18} />
                                </button>
                            </div>
                        )}

                        {/* 搜索框 */}
                        <div className="relative w-full md:w-64 group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within:text-amber-500 transition-colors">
                                <Search size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="搜索材料..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-stone-400"
                            />
                        </div>

                        {/* 新建作品按钮 (仅作品模式) */}
                        {activeTab === 'works' && (
                            <button
                                onClick={onOpenPrintJob}
                                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-indigo-500/30 transition-all shadow-md whitespace-nowrap"
                            >
                                <Plus size={18} />
                                <span>记一笔</span>
                            </button>
                        )}

                        {/* 预设库按钮 (仅材料模式或常驻，这里设为常驻但样式区分) */}
                        <button
                            onClick={onOpenPresetManager}
                            className="flex items-center gap-2 px-4 py-3 bg-white border border-stone-200 rounded-2xl text-stone-600 font-bold hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 transition-all shadow-sm hover:shadow-md whitespace-nowrap"
                        >
                            <Book size={18} />
                            <span className="hidden lg:inline">预设库</span>
                        </button>
                    </div>

                    {/* 筛选区域容器 */}
                    <div className="flex flex-col gap-3 items-end w-full md:w-auto">
                        {/* 品牌筛选 */}
                        <div className="flex flex-wrap gap-2 justify-end">
                            <span className="text-xs font-bold text-stone-400 py-1.5">品牌:</span>
                            <button
                                onClick={() => setActiveBrand(null)}
                                className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all ${activeBrand === null
                                    ? 'bg-stone-800 text-white shadow-md'
                                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                                    }`}
                            >
                                全部
                            </button>
                            {allBrands.map(b => (
                                <button
                                    key={b}
                                    onClick={() => setActiveBrand(activeBrand === b ? null : b)}
                                    className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all ${activeBrand === b
                                        ? 'bg-stone-800 text-white shadow-md'
                                        : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                                        }`}
                                >
                                    {b}
                                </button>
                            ))}
                        </div>

                        {/* 材质类型筛选 */}
                        <div className="flex flex-wrap gap-2 justify-end">
                            <span className="text-xs font-bold text-stone-400 py-1.5">材质:</span>
                            <button
                                onClick={() => setActiveType(null)}
                                className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all ${activeType === null
                                    ? 'bg-amber-600 text-white shadow-md'
                                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                                    }`}
                            >
                                全部
                            </button>
                            {allTypes.map(t => (
                                <button
                                    key={t}
                                    onClick={() => setActiveType(activeType === t ? null : t)}
                                    className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all ${activeType === t
                                        ? 'bg-amber-600 text-white shadow-md'
                                        : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 批量选择工具栏 */}
            {activeTab === 'materials' && (
                <div className="px-8 py-3 bg-stone-50 border-b border-stone-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                setSelectMode(!selectMode);
                                if (selectMode) setSelectedIds(new Set());
                            }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${selectMode
                                ? 'bg-rose-100 text-rose-600 border border-rose-200'
                                : 'bg-white border border-stone-200 text-stone-600 hover:border-amber-300'
                                }`}
                        >
                            {selectMode ? <X size={16} /> : <CheckSquare size={16} />}
                            {selectMode ? '退出选择' : '批量选择'}
                        </button>

                        {selectMode && (
                            <>
                                <button
                                    onClick={() => setSelectedIds(new Set(filteredData.map(f => f.id)))}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-50"
                                >
                                    <Square size={14} />
                                    全选 ({filteredData.length})
                                </button>
                                <button
                                    onClick={() => setSelectedIds(new Set())}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-50"
                                >
                                    取消全选
                                </button>
                            </>
                        )}
                    </div>

                    {selectMode && selectedIds.size > 0 && (
                        <button
                            onClick={() => {
                                if (confirm(`确定删除选中的 ${selectedIds.size} 个耗材吗？此操作不可撤销！`)) {
                                    onBatchDelete?.(Array.from(selectedIds));
                                    setSelectedIds(new Set());
                                    setSelectMode(false);
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl text-sm font-bold hover:bg-rose-600 shadow-md hover:shadow-lg transition-all"
                        >
                            <Trash2 size={16} />
                            删除选中 ({selectedIds.size})
                        </button>
                    )}
                </div>
            )}

            {/* 列表内容区域 */}
            <div className={`p-8 bg-stone-50/30 flex-1 ${activeTab === 'works' ? 'bg-stone-50' : ''}`}>
                {activeTab === 'materials' ? (
                    <>
                        {/* Grid View (Original) */}
                        {viewMode === 'grid' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
                                {filteredData.map(item => (
                                    <div key={item.id} className="relative">
                                        {selectMode && (
                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedIds(prev => {
                                                        const next = new Set(prev);
                                                        if (next.has(item.id)) next.delete(item.id);
                                                        else next.add(item.id);
                                                        return next;
                                                    });
                                                }}
                                                className={`absolute inset-0 z-10 rounded-2xl border-3 cursor-pointer transition-all ${selectedIds.has(item.id)
                                                    ? 'border-rose-500 bg-rose-500/10'
                                                    : 'border-transparent hover:border-stone-300 hover:bg-stone-100/50'
                                                    }`}
                                            >
                                                <div className={`absolute top-3 left-3 w-6 h-6 rounded-lg flex items-center justify-center transition-all ${selectedIds.has(item.id)
                                                    ? 'bg-rose-500 text-white'
                                                    : 'bg-white border-2 border-stone-300'
                                                    }`}>
                                                    {selectedIds.has(item.id) && <CheckSquare size={14} />}
                                                </div>
                                            </div>
                                        )}
                                        <FilamentCard
                                            data={item}
                                            onClick={selectMode ? undefined : onCardClick}
                                            onEdit={selectMode ? undefined : onEdit}
                                            onDelete={selectMode ? undefined : onDelete}
                                            onViewWorks={selectMode ? undefined : handleViewWorks}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* List View (Excel-like) */}
                        {viewMode === 'list' && (
                            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="grid gap-0">
                                    {filteredData.map(item => (
                                        <FilamentList
                                            key={item.id}
                                            data={item}
                                            onClick={onCardClick}
                                            onEdit={onEdit}
                                            onDelete={onDelete}
                                            onViewWorks={handleViewWorks}
                                        />
                                    ))}
                                    {filteredData.length === 0 && (
                                        <div className="p-10 text-center text-stone-400">
                                            没有找到匹配的耗材
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Tile View (Windows Tile) */}
                        {viewMode === 'tile' && (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 animate-in fade-in zoom-in-95 duration-300">
                                {filteredData.map(item => (
                                    <FilamentTile
                                        key={item.id}
                                        data={item}
                                        onClick={onCardClick}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <WorksGallery
                        filaments={filteredData}
                        onUpdateFilament={onUpdateFilament}
                    />
                )}
            </div>
        </div>
    );
}
