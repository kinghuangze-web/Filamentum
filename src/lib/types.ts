/**
 * 热床类型定义
 */
export type PlateType =
    | 'cool_stabilized'  // 增稳低温
    | 'cool'             // 低温板
    | 'engineering'      // 工程板
    | 'smooth_high_temp' // 光面/高温
    | 'textured';        // 纹理PEI

/**
 * 热床温度设置
 */
export interface BedTemperature {
    initial: number; // 首层温度
    other: number;   // 其他层温度
}

/**
 * 打印机定义 (新设备管理)
 */
export interface Printer {
    id: string;
    name: string;          // 设备名称 (e.g. A1 Mini)
    type: 'FDM' | 'SLA';
    powerWatts: number;    // 运行功率 (瓦)
    status: 'idle' | 'printing' | 'maintenance' | 'offline';
    lastMaintenance?: string; // 上次维护日期
}

/**
 * 成本配置 (新真实成本)
 */
export interface CostConfig {
    electricityRate: number; // 电费单价 (元/kWh)
    laborRate: number;       // 人工时薪 (元/小时)
    depreciationRate: number;// 机器折旧 + 场地房租 (元/小时)
    currency: string;        // 货币符号 (¥, $)
}

/**
 * 所有热床类型的温度配置
 */
export interface BedSettings {
    cool_stabilized: BedTemperature;
    cool: BedTemperature;
    engineering: BedTemperature;
    smooth_high_temp: BedTemperature;
    textured: BedTemperature;
}

/**
 * 打印历史记录
 */
export interface PrintHistory {
    id: string;
    name: string;      // 作品名称
    weight: number;    // 消耗重量(克)
    link?: string;     // MakerWorld 或其他链接
    image?: string;    // 作品照片 (base64)
    printTime?: number; // 打印时长 (小时)
    rating?: number;    // 评分 (0-5)
    date: string;       // ISO 时间戳
}

/**
 * 耗材数据核心接口
 * 严格按照旧网页中的数据结构定义
 */
export interface Filament {
    // 基础信息
    id: string;
    brand: string;           // 品牌
    type: string;            // 材质类型 (PLA Basic, PETG Basic, ABS, TPU 95A 等)
    color: string;           // 颜色hex值
    colorName: string;       // 颜色名称

    // 重量与价格
    weight: number;          // 线轴总重量(克)
    remaining: number;       // 剩余重量(克)
    price: number;           // 价格(元)

    // 打印温度参数
    tempMin: number;         // 最低温度(通常是首层温度)
    tempMax: number;         // 最高温度(通常是其他层温度)

    // 高级打印参数
    flowRatio: number;           // 流量比
    maxVolumetricSpeed?: number; // 最大体积速度
    pressureAdvance: number;     // 压力提前值(PA)

    // 热床配置
    bedSettings: BedSettings;    // 各种热床类型的温度配置
    defaultPlate: PlateType;     // 默认打印板类型

    // 其他信息
    notes?: string;          // 备注
    history: PrintHistory[]; // 打印历史

    // 时间戳
    createdAt: string | null;
    updatedAt?: string;
}

/**
 * 耗材预设（用于快速填充参数）
 */
export interface FilamentPreset {
    id: string;
    brand: string;           // 品牌（精确匹配）
    type: string;            // 类型（精确匹配）
    tempMin: number;
    tempMax: number;
    flowRatio: number;
    pressureAdvance: number;
    maxVolumetricSpeed?: number;
    defaultPlate: PlateType;
    bedSettings: BedSettings;
    source: 'builtin' | 'user' | 'learned';  // 预设来源
    createdAt: string;
}

/**
 * AI 配置
 */
/**
 * 模型配置
 */
export interface ModelConfig {
    provider: 'custom' | 'qwen' | 'deepseek' | 'openai';
    apiKey: string;
    baseUrl: string;
    model: string;
    enabled?: boolean; // 模型独立启用开关
}

/**
 * AI 全局配置
 * 分离视觉模型(VL)、语言模型(LLM)和全模态模型(Omni)
 */
export interface AIConfig {
    llm: ModelConfig;   // 语言模型 (纯文本对话)
    vl: ModelConfig;    // 视觉模型 (旧版参数解析，保留兼容)
    omni: ModelConfig;  // 全模态模型 (图片+文字对话，智能入库)
    enabled: boolean;
    storageMode: 'plain' | 'encrypted'; // 密钥存储方式
}

/**
 * 应用设置
 */
export interface AppSettings {
    enabledFilamentTypes: string[]; // 用户启用的耗材类型列表
    customFilamentTypes: string[]; // 用户自定义的耗材类型
}
