import { Filament, BedSettings } from './types';

/**
 * 默认热床温度配置
 */
const DEFAULT_BED: BedSettings = {
    cool_stabilized: { initial: 35, other: 35 },
    cool: { initial: 35, other: 35 },
    engineering: { initial: 70, other: 70 },
    smooth_high_temp: { initial: 70, other: 70 },
    textured: { initial: 70, other: 70 },
};

/**
 * 初始耗材数据（空白状态，用户自行添加）
 */
export const initialFilaments: Filament[] = [];

/**
 * 导出默认热床配置供其他地方使用
 */
export { DEFAULT_BED };
