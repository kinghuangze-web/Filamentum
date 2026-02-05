'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { StatsCards } from '@/src/components/StatsCards';
import { FilamentTable } from '@/src/components/FilamentTable';
import { AddEditFilamentModal } from '@/src/components/AddEditFilamentModal';
import { PrintJobModal } from '@/src/components/PrintJobModal';
import { FilamentDetailModal } from '@/src/components/FilamentDetailModal';
import { SettingsModal } from '@/src/components/SettingsModal';
import { PresetManagerModal } from '@/src/components/PresetManagerModal';
import { AIHubModal } from '@/src/components/AIHubModal';
import { AppHeader } from '@/src/components/AppHeader';
import { Loader2 } from 'lucide-react';
import { Filament, AIConfig, CostConfig, Printer, AppSettings } from '@/src/lib/types';
import { FarmDashboard } from '@/src/components/FarmDashboard';
import { filamentService } from '@/src/services/filament-service';
import { localVault } from '@/src/services/local-vault';
import { getStoredAIConfig } from '@/src/lib/ai-service';
import { FilamentTypeSettingsModal } from '@/src/components/FilamentTypeSettingsModal';
import { DEFAULT_ENABLED_TYPES } from '@/src/lib/constants';


export default function Home() {
  // 状态管理
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilament, setSelectedFilament] = useState<Filament | null>(null);
  const [editingFilament, setEditingFilament] = useState<Filament | null>(null);
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null);
  const [costConfig, setCostConfig] = useState<CostConfig>({
    electricityRate: 0.6,
    laborRate: 20,
    depreciationRate: 0.5,
    currency: '¥'
  });
  const [printers, setPrinters] = useState<Printer[]>([
    { id: '1', name: 'Bambu Lab A1', type: 'FDM', powerWatts: 150, status: 'idle' },
    { id: '2', name: 'Bambu Lab P1S', type: 'FDM', powerWatts: 350, status: 'printing' }
  ]);
  const [farmMode, setFarmMode] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>({
    enabledFilamentTypes: DEFAULT_ENABLED_TYPES,
    customFilamentTypes: []
  });

  // 弹窗状态
  const [modals, setModals] = useState({
    addEdit: false,
    printJob: false,
    detail: false,
    settings: false,
    aiHub: false,
    presetManager: false,
    filamentTypeSettings: false
  });

  // 初始化加载数据
  // State for Local Vault
  const [vaultConnected, setVaultConnected] = useState(false);
  const [vaultName, setVaultName] = useState('');

  // 连接本地保险箱
  const handleConnectVault = async () => {
    if (!localVault.isSupported()) {
      alert('您的浏览器不支持本地文件访问 API，请使用 Chrome/Edge 桌面版。');
      return;
    }

    const success = await localVault.connect();
    if (success) {
      setVaultConnected(true);
      setVaultName(localVault.getDirectoryName());

      // 注入到 service
      filamentService.setVault(localVault);

      // 询问是否同步当前数据到新保险箱
      if (filaments.length > 0 && confirm('连接成功！是否将当前展示的数据同步写入到此文件夹？(这将覆盖文件夹内的 filaments.json)')) {
        await filamentService.saveAll(filaments);
        toast.success('数据已同步到本地保险箱');
      } else {
        // 否则重新加载保险箱内的数据
        await loadData();
        toast.success('已加载本地保险箱数据');
      }
    }
  };

  useEffect(() => {
    loadData();
    const savedConfig = getStoredAIConfig();
    if (savedConfig) setAiConfig(savedConfig);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await filamentService.getAll();
      setFilaments(data);

      // 加载设置
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        setAppSettings(JSON.parse(savedSettings));
      }
    } catch (e) {
      console.error('Failed to load filaments:', e);
    } finally {
      setLoading(false);
    }
  };

  // 打开入库弹窗
  const openAddModal = () => {
    setEditingFilament(null);
    setModals(m => ({ ...m, addEdit: true }));
  };

  // 打开编辑弹窗
  const openEditModal = (filament: Filament) => {
    setEditingFilament(filament);
    setModals(m => ({ ...m, addEdit: true }));
  };

  // 打开详情弹窗
  const openDetailModal = (filament: Filament) => {
    setSelectedFilament(filament);
    setModals(m => ({ ...m, detail: true }));
  };

  // 保存耗材
  const handleSaveFilament = async (filament: Filament) => {
    try {
      setLoading(true);
      const updatedList = await filamentService.save(filament);
      setFilaments(updatedList);
      setModals(m => ({ ...m, addEdit: false }));
      return updatedList;
    } catch (e) {
      console.error('Failed to save filament:', e);
      return filaments;
    } finally {
      setLoading(false);
    }
  };

  // 删除耗材
  const handleDeleteFilament = async (id: string) => {
    if (!confirm('确定要删除这卷耗材吗？')) return;

    try {
      setLoading(true);
      const updatedList = await filamentService.delete(id);
      setFilaments(updatedList);
    } catch (e) {
      console.error('Failed to delete filament:', e);
    } finally {
      setLoading(false);
    }
  };


  // 提交打印任务
  const handleSubmitJob = async (job: { name: string; link?: string; image?: string; items: { filamentId: string; used: number }[] }) => {
    const now = new Date().toLocaleDateString('zh-CN');
    setLoading(true);

    try {
      // 串行更新每一个涉及的耗材
      for (const item of job.items) {
        const target = filaments.find(f => f.id === item.filamentId);
        if (!target) continue;

        const updatedFilament: Filament = {
          ...target,
          remaining: Math.max(0, target.remaining - item.used),
          history: [
            ...target.history,
            {
              id: crypto.randomUUID(),
              name: job.name,
              weight: item.used,
              link: job.link,
              image: job.image,
              date: now
            }
          ],
          updatedAt: new Date().toISOString()
        };

        // 调用服务保存
        await filamentService.save(updatedFilament);
      }
      // 全部完成后刷新数据
      await loadData();
      setModals(m => ({ ...m, printJob: false }));
      toast.success('打印任务已记录', {
        description: `${job.name} - ${job.items.length} 种耗材`
      });
    } catch (e) {
      console.error('Failed to submit job:', e);
      toast.error('保存失败', {
        description: '请检查网络连接后重试'
      });
    } finally {
      setLoading(false);
    }
  };


  // 删除历史记录
  const handleDeleteHistory = async (historyId: string) => {
    if (!selectedFilament) return;

    const history = selectedFilament.history.find(h => h.id === historyId);
    if (!history) return;

    if (confirm(`删除"${history.name}"的记录？库存将恢复 ${history.weight}g`)) {
      // 1. 构建更新后的对象
      const updatedFilament: Filament = {
        ...selectedFilament,
        remaining: selectedFilament.remaining + history.weight,
        history: selectedFilament.history.filter(h => h.id !== historyId),
        updatedAt: new Date().toISOString()
      };

      // 2. 调用保存 (这会自动更新 filaments 列表并持久化)
      await handleSaveFilament(updatedFilament);

      // 3. 更新当前选中的详情页数据
      setSelectedFilament(updatedFilament);
    }
  };


  // 添加单色作品（详情弹窗内的操作）
  const handleAddWork = async (work: { name: string; weight: number; link?: string; image?: string }) => {
    if (!selectedFilament) return;

    const now = new Date().toLocaleDateString('zh-CN');

    const updatedFilament: Filament = {
      ...selectedFilament,
      remaining: Math.max(0, selectedFilament.remaining - work.weight),
      history: [
        ...selectedFilament.history,
        {
          id: crypto.randomUUID(),
          name: work.name,
          weight: work.weight,
          link: work.link,
          image: work.image,
          date: now
        }
      ],
      updatedAt: new Date().toISOString()
    };

    // 保存到后端
    await handleSaveFilament(updatedFilament);
    setSelectedFilament(updatedFilament); // 更新详情页视图
  };

  // 导出 JSON
  const handleExport = () => {
    const dataStr = JSON.stringify(filaments, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filaments_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 保存应用设置
  const handleSaveAppSettings = (settings: AppSettings) => {
    setAppSettings(settings);
    localStorage.setItem('appSettings', JSON.stringify(settings));
    toast.success('设置已保存', {
      description: `已启用 ${settings.enabledFilamentTypes.length} 种耗材类型`
    });
  };



  // 手动保存数据
  const handleManualSave = async () => {
    try {
      setLoading(true);
      await filamentService.saveAll(filaments);
      toast.success('数据保存成功', {
        description: `已同步 ${filaments.length} 个耗材数据到本地存储`
      });
    } catch (e) {
      console.error('Manual save failed:', e);
      toast.error('保存失败', { description: '请检查浏览器存储权限' });
    } finally {
      setLoading(false);
    }
  };

  // 导入 JSON
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          setLoading(true);
          // 串行导入
          for (const item of data) {
            await filamentService.save(item);
          }
          await loadData();
          alert(`成功导入 ${data.length} 条记录！`);
        }
      } catch (err) {
        console.error(err);
        alert('导入失败，请检查文件格式');
      } finally {
        setLoading(false);
      }
    };
    input.click();
  };

  // 计算统计数据
  const stats = {
    weight: filaments.reduce((sum, f) => sum + f.remaining, 0),
    value: filaments.reduce((sum, f) => sum + (f.remaining / f.weight) * f.price, 0),
    count: filaments.reduce((sum, f) => sum + f.history.length, 0),
    spoolCount: filaments.length
  };

  // 批量更新耗材 (来自预设管理)
  const handleBatchUpdate = async (updates: Filament[]) => {
    try {
      setLoading(true);
      const newFilaments = filaments.map(f => {
        const update = updates.find(u => u.id === f.id);
        return update || f;
      });
      const savedList = await filamentService.saveAll(newFilaments);
      setFilaments(savedList);
      toast.success(`成功同步 ${updates.length} 个耗材的预设参数`);
    } catch (e) {
      console.error('Batch update failed:', e);
      toast.error('批量更新失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-stone-50 via-orange-50/30 to-amber-50/40 relative">
      {/* 仅在初始加载时显示加载提示 */}
      {loading && filaments.length === 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white/95 backdrop-blur-sm px-5 py-3 rounded-2xl shadow-lg border border-stone-100 fade-in">
          <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
          <p className="text-stone-600 text-sm font-medium">正在加载数据...</p>
        </div>
      )}



      {/* Header */}
      <AppHeader
        farmMode={farmMode}
        onToggleFarmMode={() => setFarmMode(!farmMode)}
        onOpenSettings={() => setModals(m => ({ ...m, settings: true }))}
        onOpenAIHub={() => setModals(m => ({ ...m, aiHub: true }))}
        onOpenAddModal={openAddModal}
        onImport={handleImport}
        onExport={handleExport}
        onManualSave={handleManualSave}
        onConnectVault={handleConnectVault}
        isVaultConnected={vaultConnected}
        vaultName={vaultName}
      />

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {farmMode ? (
          <FarmDashboard printers={printers} onOpenSettings={() => setModals(m => ({ ...m, settings: true }))} />
        ) : (
          <>
            <StatsCards data={stats} />
            <FilamentTable
              filaments={filaments}
              onCardClick={openDetailModal}
              onEdit={openEditModal}
              onDelete={handleDeleteFilament}
              onOpenPresetManager={() => setModals(m => ({ ...m, presetManager: true }))}
              onOpenPrintJob={() => setModals(m => ({ ...m, printJob: true }))}
              onUpdateFilament={handleSaveFilament}
            />
          </>
        )}
      </div>

      {/* 弹窗 */}
      <AddEditFilamentModal
        isOpen={modals.addEdit}
        onClose={() => setModals(m => ({ ...m, addEdit: false }))}
        onSave={handleSaveFilament}
        editingFilament={editingFilament}
        customTypes={appSettings.customFilamentTypes}
      />

      <PrintJobModal
        isOpen={modals.printJob}
        onClose={() => setModals(m => ({ ...m, printJob: false }))}
        onSubmit={handleSubmitJob}
        filaments={filaments}
      />

      <FilamentDetailModal
        isOpen={modals.detail}
        onClose={() => setModals(m => ({ ...m, detail: false }))}
        filament={selectedFilament}
        onEdit={() => {
          if (selectedFilament) {
            setModals(m => ({ ...m, detail: false }));
            openEditModal(selectedFilament);
          }
        }}
        onDeleteHistory={handleDeleteHistory}
        onAddWork={handleAddWork}
        costConfig={costConfig}
      />

      <SettingsModal
        isOpen={modals.settings}
        onClose={() => setModals(m => ({ ...m, settings: false }))}
        config={costConfig}
        onConfigChange={setCostConfig}
        printers={printers}
        onPrintersChange={setPrinters}
      />

      <PresetManagerModal
        isOpen={modals.presetManager}
        onClose={() => setModals(m => ({ ...m, presetManager: false }))}
        onOpenFilamentTypeSettings={() => {
          setModals(m => ({ ...m, presetManager: false, filamentTypeSettings: true }));
        }}
        filaments={filaments}
        onBatchUpdate={handleBatchUpdate}
      />

      <AIHubModal
        isOpen={modals.aiHub}
        onClose={() => setModals(m => ({ ...m, aiHub: false }))}
        onImportFilaments={async (newFilaments) => {
          try {
            setLoading(true);
            // 手动合并现有数据和新数据
            const merged = [...filaments, ...newFilaments];
            const updatedList = await filamentService.saveAll(merged);
            setFilaments(updatedList);
          } catch (e) {
            console.error('Failed to import filaments:', e);
            alert('入库失败，请重试');
          } finally {
            setLoading(false);
          }
        }}
        config={aiConfig}
        onConfigUpdate={setAiConfig}
      />

      <FilamentTypeSettingsModal
        isOpen={modals.filamentTypeSettings}
        onClose={() => setModals(m => ({ ...m, filamentTypeSettings: false }))}
        onSave={handleSaveAppSettings}
        currentSettings={appSettings}
      />
    </main>
  );
}
