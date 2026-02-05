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
        'PLA 基础 (Basic)',
        'PLA 哑光 (Matte)',
        'PLA 丝绸 (Silk)',
        'PLA 强韧 (Tough)',
        'PLA+ 增强',
        'PLA 大理石 (Marble)',
        'PLA 闪光 (Sparkle)',
        'PLA 夜光 (Glow)',
        'PLA 金属 (Metal)',
        'PLA 木质 (Wood)',
        'PLA 航空 (Aero)',
        'PLA-CF 碳纤',
        'PLA-GF 玻纤',
    ],
    'PETG系列': [
        'PETG 基础 (Basic)',
        'PETG 哑光 (Matte)',
        'PETG 高流 (HF)',
        'PETG-CF 碳纤',
        'PETG-GF 玻纤',
    ],
    'ABS/ASA系列': [
        'ABS 通用',
        'ABS-CF 碳纤',
        'ABS-GF 玻纤',
        'ASA 耐候',
        'ASA-CF 碳纤',
        'ASA-GF 玻纤',
        'ASA 航空 (Aero)',
    ],
    '尼龙系列': [
        'PA 尼龙',
        'PA-CF 碳纤',
        'PA-GF 玻纤',
        'PA6-CF 碳纤',
        'PAHT-CF 高温碳纤',
        'PAHT-GF 高温玻纤',
    ],
    '工程塑料': [
        'PC 聚碳酸酯',
        'PC-CF 碳纤',
        'POM 赛钢',
        'HIPS',
    ],
    '弹性材料': [
        'TPU 95A',
        'TPU 85A',
        'TPE',
    ],
    '支撑材料': [
        'PVA 水溶',
        'BVOH 水溶',
    ],
    '特殊材料': [
        'PET',
        'PET-CF 碳纤',
        'PP 聚丙烯',
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
    '黑': '#1a1a1a', '哑光黑': '#1a1a1a', '炭黑': '#2d2d2d',
    '白': '#ffffff', '乳白': '#f5f5f4', '象牙白': '#fffef0',
    '红': '#ef4444', '樱桃红': '#dc2626', '酒红': '#991b1b',
    '橙': '#f97316', '橘': '#f97316',
    '黄': '#eab308', '金黄': '#ca8a04',
    '绿': '#22c55e', '翠绿': '#16a34a', '墨绿': '#166534',
    '蓝': '#3b82f6', '天空蓝': '#06b6d4', '深蓝': '#1e40af',
    '紫': '#8b5cf6', '薰衣草': '#a78bfa',
    '粉': '#ec4899', '粉红': '#f472b6',
    '灰': '#78716c', '银灰': '#a8a29e',
    '透明': '#e5e5e5'
};

/**
 * 根据颜色名称推断 HEX 值
 */
export function inferColorHex(colorName: string): string {
    for (const [key, value] of Object.entries(COLOR_NAME_MAP)) {
        if (colorName.includes(key)) return value;
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
