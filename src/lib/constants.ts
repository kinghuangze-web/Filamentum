/**
 * 公共常量定义
 * 统一管理项目中的常量，避免重复定义
 */

import { PlateType, BedSettings } from './types';

/**
 * 热床类型配置
 */
export const PLATE_TYPES: { id: PlateType; label: string }[] = [
    { id: 'cool_stabilized', label: '增稳低温' },
    { id: 'cool', label: '低温板' },
    { id: 'engineering', label: '工程板' },
    { id: 'smooth_high_temp', label: '光面/高温' },
    { id: 'textured', label: '纹理PEI' }
];

/**
 * 默认热床温度配置
 */
export const DEFAULT_BED_SETTINGS: BedSettings = {
    cool_stabilized: { initial: 35, other: 35 },
    cool: { initial: 55, other: 50 },
    engineering: { initial: 90, other: 90 },
    smooth_high_temp: { initial: 65, other: 60 },
    textured: { initial: 65, other: 60 },
};

/**
 * 热门耗材品牌列表（参考Bambu Studio和市场主流品牌）
 */
export const POPULAR_BRANDS = [
    'Bambu Lab',
    'eSUN',
    '小北',
    '拓竹',
    'Polymaker',
    'Elegoo',
    'Creality',
    'Sunlu',
    'Overture',
    'Hatchbox',
    'Prusa',
    '其他'
];

/**
 * 完整的耗材类型列表（参考Bambu Studio，去除品牌前缀）
 * 分组管理，默认启用PLA和PETG全系列
 */
export const FILAMENT_TYPES = {
    'PLA系列': [
        'PLA Basic',
        'PLA Matte',
        'PLA Silk',
        'PLA Tough',
        'PLA+',
        'PLA Marble',
        'PLA Sparkle',
        'PLA Glow',
        'PLA Metal',
        'PLA Wood',
        'PLA Aero',
        'PLA-CF',
        'PLA-GF',
    ],
    'PETG系列': [
        'PETG Basic',
        'PETG Matte',
        'PETG Rapid',
        'PETG HF',
        'PETG-CF',
        'PETG-GF',
    ],
    'ABS/ASA系列': [
        'ABS',
        'ABS-CF',
        'ABS-GF',
        'ASA',
        'ASA-CF',
        'ASA-GF',
        'ASA Aero',
    ],
    '尼龙系列': [
        'PA',
        'PA-CF',
        'PA-GF',
        'PA6-CF',
        'PAHT-CF',
        'PAHT-GF',
    ],
    '工程塑料': [
        'PC',
        'PC-CF',
        'POM',
        'HIPS',
    ],
    '弹性材料': [
        'TPU 95A',
        'TPU 85A',
        'TPE',
    ],
    '支撑材料': [
        'PVA',
        'BVOH',
    ],
    '特殊材料': [
        'PET',
        'PET-CF',
        'PP',
        'PCTG',
    ],
};

/**
 * 默认启用的耗材类型（PLA和PETG全系列）
 */
export const DEFAULT_ENABLED_TYPES = [
    ...FILAMENT_TYPES['PLA系列'],
    ...FILAMENT_TYPES['PETG系列'],
];

/**
 * 常用颜色预设
 */
export const COMMON_COLORS = [
    '#1a1a1a', '#ffffff', '#f5f5f4', '#ef4444', '#f97316',
    '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6',
    '#ec4899', '#78716c'
];

/**
 * 颜色名称映射（用于 AI 识别）
 */
export const COLOR_NAME_MAP: Record<string, string> = {
    // 基础色
    '黑': '#1a1a1a', '哑光黑': '#1a1a1a', '炭黑': '#2d2d2d', '柔性黑': '#1a1a1a',
    '白': '#ffffff', '乳白': '#f5f5f4', '象牙白': '#fffef0', '珍珠白': '#faf8f5',
    '红': '#ef4444', '樱桃红': '#dc2626', '酒红': '#991b1b', '暗夜红': '#7f1d1d',
    '橙': '#f97316', '橘': '#f97316',
    '黄': '#eab308', '金黄': '#ca8a04', '柠檬': '#fde047',
    '绿': '#22c55e', '翠绿': '#16a34a', '墨绿': '#166534', '军绿': '#4d7c0f', '柠檬绿': '#84cc16', '荧光绿': '#bef264',
    '蓝': '#3b82f6', '天空蓝': '#06b6d4', '天蓝': '#38bdf8', '深蓝': '#1e40af', '湖蓝': '#0891b2', '靛蓝': '#4338ca',
    '紫': '#8b5cf6', '薰衣草': '#a78bfa', '龙紫': '#7c3aed', '变色龙': '#8b5cf6',
    '粉': '#ec4899', '粉红': '#f472b6', '粉色': '#f472b6',
    '灰': '#78716c', '银灰': '#a8a29e', '深灰': '#57534e',
    // 特殊色
    '透明': '#e5e5e5', '水晶': '#d1d5db',
    '金': '#fbbf24', '金色': '#f59e0b', '99金': '#f59e0b', '黄金': '#eab308',
    '银': '#d1d5db', '银色': '#9ca3af', '金属银': '#a1a1aa',
    '肤': '#fdbf6f', '肤色': '#fdbf6f',
    '棕': '#a16207', '棕色': '#92400e',
    '薄荷': '#5eead4', '清凉薄荷': '#5eead4', '薄荷绿': '#34d399',
    '荧光': '#facc15',
    '彩虹': '#ec4899', '混色': '#8b5cf6',
    // ECO/盲盒默认
    'ECO': '#3b82f6', '盲盒': '#78716c',
};

/**
 * 根据颜色名称推断 HEX 值
 * 优先使用传入的 HEX 值（如果有效）
 */
export function inferColorHex(colorInput: string): string {
    // 如果输入已经是有效的 HEX 颜色，直接返回
    if (colorInput && /^#[0-9A-Fa-f]{6}$/.test(colorInput)) {
        return colorInput;
    }
    // 否则尝试从颜色名称映射
    for (const [key, value] of Object.entries(COLOR_NAME_MAP)) {
        if (colorInput.includes(key)) return value;
    }
    return '#78716c'; // 默认灰色
}

/**
 * 根据材质类型推断温度范围
 */
export function inferTemperature(type: string): { min: number; max: number } {
    const t = type.toUpperCase();
    if (t.includes('PLA')) return { min: 190, max: 220 };
    if (t.includes('PETG')) return { min: 230, max: 260 };
    if (t.includes('ABS') || t.includes('ASA')) return { min: 240, max: 270 };
    if (t.includes('TPU')) return { min: 210, max: 240 };
    if (t.includes('PA') || t.includes('NYLON')) return { min: 260, max: 290 };
    if (t.includes('PC')) return { min: 270, max: 300 };
    return { min: 200, max: 230 };
}

/**
 * 输入校验工具
 */
export const validators = {
    /** 校验重量（0-10000g）*/
    weight: (value: number) => Math.max(0, Math.min(10000, value)),

    /** 校验价格（0-9999）*/
    price: (value: number) => Math.max(0, Math.min(9999, value)),

    /** 校验温度（0-400°C）*/
    temperature: (value: number) => Math.max(0, Math.min(400, value)),

    /** 校验流量比（0.5-1.5）*/
    flowRatio: (value: number) => Math.max(0.5, Math.min(1.5, value)),

    /** 校验压力提前（0-0.2）*/
    pressureAdvance: (value: number) => Math.max(0, Math.min(0.2, value)),
};

/**
 * 图片压缩工具
 */
export async function compressImage(base64: string, maxWidth = 800, quality = 0.7): Promise<string> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);

            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = base64;
    });
}

/**
 * LocalStorage 键名
 */
export const STORAGE_KEYS = {
    FILAMENTS: 'filaments',
    PRESETS: 'filament-presets',
    AI_CONFIG: 'ai-config',
};
