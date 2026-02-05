import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { Filament, PrintHistory } from '../lib/types';
import { Calendar, Package, Weight, X, Trash2, Edit2, ExternalLink, Save, Loader2 } from 'lucide-react';

interface WorksGalleryProps {
    filaments: Filament[];
    onUpdateFilament?: (filament: Filament) => Promise<Filament[]>;
}

interface WorkItem {
    history: PrintHistory;
    filament: Filament;
}

export function WorksGallery({ filaments, onUpdateFilament }: WorksGalleryProps) {
    const [selectedWork, setSelectedWork] = useState<WorkItem | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<PrintHistory>>({});
    const [saving, setSaving] = useState(false);

    // 聚合所有作品并按时间倒序
    const allWorks = useMemo(() => {
        const works: WorkItem[] = [];
        filaments.forEach(f => {
            if (f.history) {
                f.history.forEach(h => {
                    works.push({ history: h, filament: f });
                });
            }
        });
        return works.sort((a, b) => new Date(b.history.date).getTime() - new Date(a.history.date).getTime());
    }, [filaments]);

    const handleWorkClick = (item: WorkItem) => {
        setSelectedWork(item);
        setIsEditing(false);
        setEditForm({});
    };

    const handleDelete = async () => {
        if (!selectedWork || !onUpdateFilament) return;
        if (!confirm('确定要删除这条作品记录吗？(不会恢复库存)')) return; // Simple delete for now

        setSaving(true);
        try {
            const filament = selectedWork.filament;
            const updatedFilament = {
                ...filament,
                history: filament.history.filter(h => h.id !== selectedWork.history.id)
            };
            await onUpdateFilament(updatedFilament);
            setSelectedWork(null);
        } catch (e) {
            console.error(e);
            alert('删除失败');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!selectedWork || !onUpdateFilament) return;

        setSaving(true);
        try {
            const filament = selectedWork.filament;
            const updatedHistory = filament.history.map(h =>
                h.id === selectedWork.history.id
                    ? { ...h, ...editForm }
                    : h
            );

            const updatedFilament = {
                ...filament,
                history: updatedHistory
            };

            await onUpdateFilament(updatedFilament);

            // Update local selection to reflect changes
            setSelectedWork({
                ...selectedWork,
                history: { ...selectedWork.history, ...editForm }
            });
            setIsEditing(false);
        } catch (e) {
            console.error(e);
            alert('保存失败');
        } finally {
            setSaving(false);
        }
    };

    if (allWorks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-stone-300">
                <Package size={64} className="mb-4 opacity-50" />
                <p className="text-lg">还没有作品记录</p>
                <p className="text-sm">点击右上角“记一笔”开始记录你的创作吧！</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {allWorks.map((item) => (
                    <div
                        key={item.history.id}
                        onClick={() => handleWorkClick(item)}
                        className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all group cursor-pointer"
                    >
                        <div className="aspect-square bg-stone-50 relative overflow-hidden">
                            {item.history.image ? (
                                <Image src={item.history.image} alt={item.history.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-stone-200">
                                    <Package size={48} />
                                </div>
                            )}
                            <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Weight size={10} />
                                {item.history.weight}g
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-stone-800 truncate mb-1" title={item.history.name}>{item.history.name}</h3>
                            <div className="text-xs text-stone-500 flex items-center gap-1 mb-2">
                                <Calendar size={10} />
                                {new Date(item.history.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-stone-50">
                                <div className="w-3 h-3 rounded-full border border-stone-100 flex-shrink-0" style={{ backgroundColor: item.filament.color }}></div>
                                <span className="text-xs text-stone-400 truncate">{item.filament.brand} {item.filament.type}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 作品详情弹窗 */}
            {selectedWork && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm fade-in" onClick={() => setSelectedWork(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="relative aspect-video bg-stone-100">
                            {selectedWork.history.image ? (
                                <Image src={selectedWork.history.image} alt={selectedWork.history.name || 'Work'} fill className="object-cover" unoptimized />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-stone-300">
                                    <Package size={64} />
                                </div>
                            )}
                            <button
                                onClick={() => setSelectedWork(null)}
                                className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-md transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6 overflow-y-auto">
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-stone-400 uppercase">名称</label>
                                        <input
                                            value={editForm.name ?? selectedWork.history.name}
                                            onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                                            className="w-full text-xl font-bold border-b border-stone-200 outline-none focus:border-amber-500 py-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-stone-400 uppercase">链接</label>
                                        <input
                                            value={editForm.link ?? selectedWork.history.link ?? ''}
                                            onChange={e => setEditForm(p => ({ ...p, link: e.target.value }))}
                                            className="w-full border-b border-stone-200 outline-none focus:border-amber-500 py-1 text-sm text-stone-600"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    {/* 暂时不支持修改图片，因为需要上传组件 */}
                                </div>
                            ) : (
                                <div>
                                    <h2 className="text-2xl font-bold text-stone-800 mb-2">{selectedWork.history.name}</h2>
                                    {selectedWork.history.link && (
                                        <a href={selectedWork.history.link} target="_blank" rel="noreferrer" className="text-indigo-500 hover:text-indigo-600 flex items-center gap-1 text-sm font-medium">
                                            <ExternalLink size={14} /> 模型链接
                                        </a>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                                    <div className="text-xs text-stone-400 mb-1 flex items-center gap-1"><Weight size={12} />消耗</div>
                                    <div className="text-xl font-bold text-stone-800">{selectedWork.history.weight}g</div>
                                </div>
                                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                                    <div className="text-xs text-stone-400 mb-1 flex items-center gap-1"><Calendar size={12} />时间</div>
                                    <div className="text-lg font-bold text-stone-800">{new Date(selectedWork.history.date).toLocaleDateString()}</div>
                                </div>
                            </div>

                            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full border border-stone-100 shadow-sm" style={{ backgroundColor: selectedWork.filament.color }}></div>
                                <div>
                                    <div className="font-bold text-stone-700">{selectedWork.filament.brand}</div>
                                    <div className="text-xs text-stone-500">{selectedWork.filament.type} / {selectedWork.filament.colorName}</div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-stone-100 bg-stone-50 flex justify-between items-center">
                            {isEditing ? (
                                <>
                                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-stone-500 font-bold hover:bg-stone-200 rounded-xl transition-colors">
                                        取消
                                    </button>
                                    <button onClick={handleSaveEdit} disabled={saving} className="px-6 py-2 bg-stone-800 text-white font-bold rounded-xl hover:bg-stone-700 transition-colors flex items-center gap-2">
                                        {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 保存
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={handleDelete} className="p-3 text-stone-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors" title="删除记录">
                                        <Trash2 size={20} />
                                    </button>
                                    <button onClick={() => { setIsEditing(true); setEditForm({ name: selectedWork.history.name, link: selectedWork.history.link }); }} className="flex items-center gap-2 px-6 py-3 bg-white border border-stone-200 text-stone-700 font-bold rounded-xl hover:bg-stone-50 hover:border-stone-300 transition-all shadow-sm">
                                        <Edit2 size={16} /> 编辑信息
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
