/**
 * Filament Service
 * 
 * 负责这一层的数据交互。
 * 目前实现为 LocalStorage 模拟的异步接口。
 * 未来迁移到真实后端时，只需替换此文件的实现，保持通过接口一致。
 */

import { Filament } from '../lib/types';
import { initialFilaments } from '../lib/data';
import { STORAGE_KEYS } from '../lib/constants';

// 定义标准接口
export interface IFilamentService {
    getAll(): Promise<Filament[]>;
    save(filament: Filament): Promise<Filament[]>;
    saveAll(filaments: Filament[]): Promise<Filament[]>; // 批量保存
    delete(id: string): Promise<Filament[]>;
}


class LocalFileService implements IFilamentService {

    // ---------------------------------------------------------
    // Local Vault Integration
    // ---------------------------------------------------------
    private vault: any = null; // Type: LocalVaultService

    setVault(vaultService: any) {
        this.vault = vaultService;
    }

    // 从后端 API 或 本地 Vault 获取数据
    async getAll(): Promise<Filament[]> {
        // 优先尝试从 Local Vault 读取
        if (this.vault && this.vault.isConnected()) {
            try {
                const data = await this.vault.readData();
                if (Array.isArray(data) && data.length > 0) {
                    console.log('Loaded from Local Vault');
                    return data;
                } else if (Array.isArray(data) && data.length === 0) {
                    // 如果 Vault 是空的，我们可能想把初始数据写进去？
                    // 暂时返回空数组
                    return [];
                }
            } catch (e) {
                console.error('Vault Read Error:', e);
                // Fallback? No, if vault is connected but fails, we should alert user.
                // But for safety, let's fall back to api/storage if vault fails significantly?
            }
        }

        try {
            const res = await fetch('/api/storage', { cache: 'no-store' }); // 禁用缓存确保最新
            if (!res.ok) throw new Error('Failed to fetch data');
            const data = await res.json();
            return Array.isArray(data) ? data : initialFilaments;
        } catch (e) {
            console.error('API Error:', e);
            return initialFilaments;
        }
    }

    // 保存单个 (读取 -> 修改 -> 全量保存)
    async save(filament: Filament): Promise<Filament[]> {
        // 1. 获取最新 (从 Vault 或 API)
        const current = await this.getAll();

        // 2. 修改
        const index = current.findIndex(f => f.id === filament.id);
        let updated: Filament[];
        if (index >= 0) {
            updated = current.map(f => f.id === filament.id ? filament : f);
        } else {
            updated = [...current, filament];
        }

        // 3. 全量保存 (到 Vault 或 API)
        if (this.vault && this.vault.isConnected()) {
            await this.vault.writeData(updated);
        } else {
            await this.saveToFile(updated);
        }

        return updated;
    }

    // 批量保存（用于智能入库或手动全量保存）
    async saveAll(newFilaments: Filament[]): Promise<Filament[]> {
        // 直接覆盖保存
        const updated = [...newFilaments];

        // 3. 全量保存
        if (this.vault && this.vault.isConnected()) {
            await this.vault.writeData(updated);
        } else {
            await this.saveToFile(updated);
        }
        return updated;
    }

    // 删除 (读取 -> 过滤 -> 全量保存)
    async delete(id: string): Promise<Filament[]> {
        const current = await this.getAll();
        const updated = current.filter(f => f.id !== id);

        if (this.vault && this.vault.isConnected()) {
            await this.vault.writeData(updated);
        } else {
            await this.saveToFile(updated);
        }
        return updated;
    }

    // 辅助：发送到 API
    private async saveToFile(data: Filament[]) {
        try {
            const res = await fetch('/api/storage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to save to file');
        } catch (e) {
            console.error('Save File Error:', e);
            throw e; // 抛出错误让 UI 处理
        }
    }
}

// 导出新的服务实例
export const filamentService = new LocalFileService();
