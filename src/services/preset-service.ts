
import { FilamentPreset } from '../lib/types';
import { BUILTIN_PRESETS } from '../lib/presets';

class PresetService {

    // 获取所有预设 (内置 + 用户)
    async getAll(): Promise<FilamentPreset[]> {
        const userPresets = await this.getUserPresets();
        return [...BUILTIN_PRESETS, ...userPresets];
    }

    // 获取用户预设
    async getUserPresets(): Promise<FilamentPreset[]> {
        try {
            const res = await fetch('/api/presets', { cache: 'no-store' });
            if (!res.ok) return [];
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        } catch (e) {
            console.error('Failed to fetch user presets', e);
            return [];
        }
    }

    // 保存用户预设 (新增或更新)
    // 注意：如果是内置预设，必须另存为(新建)用户预设，ID不能冲突
    async saveUserPreset(preset: FilamentPreset): Promise<void> {
        const current = await this.getUserPresets();
        const index = current.findIndex(p => p.id === preset.id);

        let updated: FilamentPreset[];
        if (index >= 0) {
            updated = current.map(p => p.id === preset.id ? preset : p);
        } else {
            updated = [...current, preset];
        }

        await this.saveResetsToFile(updated);
    }

    // 删除用户预设
    async deleteUserPreset(id: string): Promise<void> {
        const current = await this.getUserPresets();
        const updated = current.filter(p => p.id !== id);
        await this.saveResetsToFile(updated);
    }

    private async saveResetsToFile(data: FilamentPreset[]) {
        try {
            await fetch('/api/presets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (e) {
            console.error('Failed to save presets', e);
            throw e;
        }
    }
}

export const presetService = new PresetService();
