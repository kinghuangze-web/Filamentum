/**
 * 耗材预设管理
 * 支持内置预设、用户预设、历史学习
 */

import { FilamentPreset, BedSettings, PlateType } from './types';
import { DEFAULT_BED_SETTINGS, STORAGE_KEYS } from './constants';

// 内置预设列表
export const BUILTIN_PRESETS: FilamentPreset[] = [
    // Bambu Lab PLA 系列
    {
        id: 'builtin-bambu-pla-basic',
        brand: 'Bambu Lab',
        type: 'PLA Basic',
        tempMin: 190,
        tempMax: 220,
        flowRatio: 0.98,
        pressureAdvance: 0.02,
        maxVolumetricSpeed: 21,
        defaultPlate: 'textured',
        bedSettings: {
            ...DEFAULT_BED_SETTINGS,
            textured: { initial: 65, other: 60 },
            cool: { initial: 35, other: 30 }
        },
        source: 'builtin',
        createdAt: '2026-01-01'
    },
    {
        id: 'builtin-bambu-pla-matte',
        brand: 'Bambu Lab',
        type: 'PLA Matte',
        tempMin: 190,
        tempMax: 220,
        flowRatio: 0.98,
        pressureAdvance: 0.02,
        maxVolumetricSpeed: 21,
        defaultPlate: 'textured',
        bedSettings: {
            ...DEFAULT_BED_SETTINGS,
            textured: { initial: 65, other: 60 }
        },
        source: 'builtin',
        createdAt: '2026-01-01'
    },
    // Bambu Lab PETG 系列
    {
        id: 'builtin-bambu-petg-basic',
        brand: 'Bambu Lab',
        type: 'PETG Basic',
        tempMin: 230,
        tempMax: 260,
        flowRatio: 0.98,
        pressureAdvance: 0.02,
        maxVolumetricSpeed: 12,
        defaultPlate: 'textured',
        bedSettings: {
            ...DEFAULT_BED_SETTINGS,
            textured: { initial: 80, other: 75 },
            smooth_high_temp: { initial: 90, other: 85 }
        },
        source: 'builtin',
        createdAt: '2026-01-01'
    },
    // Bambu Lab ABS
    {
        id: 'builtin-bambu-abs',
        brand: 'Bambu Lab',
        type: 'ABS',
        tempMin: 240,
        tempMax: 270,
        flowRatio: 0.98,
        pressureAdvance: 0.04,
        maxVolumetricSpeed: 12,
        defaultPlate: 'engineering',
        bedSettings: {
            ...DEFAULT_BED_SETTINGS,
            engineering: { initial: 105, other: 100 }
        },
        source: 'builtin',
        createdAt: '2026-01-01'
    },
    // eSUN PLA+
    {
        id: 'builtin-esun-pla-plus',
        brand: 'eSUN',
        type: 'PLA+',
        tempMin: 205,
        tempMax: 230,
        flowRatio: 0.98,
        pressureAdvance: 0.025,
        maxVolumetricSpeed: 18,
        defaultPlate: 'textured',
        bedSettings: {
            ...DEFAULT_BED_SETTINGS,
            textured: { initial: 65, other: 60 }
        },
        source: 'builtin',
        createdAt: '2026-01-01'
    },
    // Polymaker PETG
    {
        id: 'builtin-polymaker-petg',
        brand: 'Polymaker',
        type: 'PETG Basic',
        tempMin: 230,
        tempMax: 250,
        flowRatio: 0.96,
        pressureAdvance: 0.03,
        maxVolumetricSpeed: 10,
        defaultPlate: 'textured',
        bedSettings: {
            ...DEFAULT_BED_SETTINGS,
            textured: { initial: 75, other: 70 }
        },
        source: 'builtin',
        createdAt: '2026-01-01'
    }
];



/**
 * 获取所有预设（内置 + 用户）
 */
export function getAllPresets(): FilamentPreset[] {
    const userPresets = getUserPresets();
    return [...userPresets, ...BUILTIN_PRESETS];
}

/**
 * 获取用户预设
 */
export function getUserPresets(): FilamentPreset[] {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(STORAGE_KEYS.PRESETS);
    if (!saved) return [];
    try {
        return JSON.parse(saved);
    } catch {
        return [];
    }
}

/**
 * 保存用户预设
 */
export function saveUserPreset(preset: FilamentPreset): void {
    const presets = getUserPresets();
    const existingIndex = presets.findIndex(
        p => p.brand.toLowerCase() === preset.brand.toLowerCase() &&
            p.type.toLowerCase() === preset.type.toLowerCase()
    );

    if (existingIndex >= 0) {
        presets[existingIndex] = preset;
    } else {
        presets.push(preset);
    }

    localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(presets));
}

/**
 * 删除用户预设
 */
export function deleteUserPreset(id: string): void {
    const presets = getUserPresets().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(presets));
}

/**
 * 根据品牌+类型精确匹配预设
 */
export function findPreset(brand: string, type: string): FilamentPreset | null {
    const allPresets = getAllPresets();

    // 精确匹配（忽略大小写）
    const match = allPresets.find(
        p => p.brand.toLowerCase() === brand.toLowerCase() &&
            p.type.toLowerCase() === type.toLowerCase()
    );

    return match || null;
}

/**
 * 从耗材数据创建预设
 */
export function createPresetFromFilament(brand: string, type: string, params: {
    tempMin: number;
    tempMax: number;
    flowRatio: number;
    pressureAdvance: number;
    maxVolumetricSpeed?: number;
    defaultPlate: PlateType;
    bedSettings: BedSettings;
}): FilamentPreset {
    return {
        id: `user-${Date.now()}`,
        brand,
        type,
        ...params,
        source: 'user',
        createdAt: new Date().toISOString()
    };
}
