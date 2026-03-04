/**
 * AI 服务层 (重构版)
 * 支持通用 OpenAI 格式接口 (DeepSeek, Qwen, GLM 等)
 * 支持前端 AES 加密存储
 */

import { AIConfig, ModelConfig } from './types';
import { STORAGE_KEYS } from './constants';
import { encryptData, decryptData } from './crypto';

// 默认预设配置 - 支持主流 AI 提供商
export const PROVIDER_PRESETS = {
    deepseek: {
        baseUrl: 'https://api.deepseek.com/v1',
        model: 'deepseek-chat',
        label: 'DeepSeek (深度求索)'
    },
    qwen: {
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        model: 'qwen-max',
        label: 'Qwen (通义千问)'
    },
    openai: {
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o',
        label: 'OpenAI (GPT-4o)'
    },
    glm: {
        baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
        model: 'glm-4-flash',
        label: 'GLM (智谱清言)'
    },
    kimi: {
        baseUrl: 'https://api.moonshot.cn/v1',
        model: 'moonshot-v1-8k',
        label: 'Kimi (月之暗面)'
    },
    doubao: {
        baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
        model: 'doubao-pro-32k',
        label: '豆包 (字节跳动)'
    },
    hunyuan: {
        baseUrl: 'https://api.hunyuan.cloud.tencent.com/v1',
        model: 'hunyuan-turbo',
        label: '混元 (腾讯)'
    },
    spark: {
        baseUrl: 'https://spark-api-open.xf-yun.com/v1',
        model: 'generalv3.5',
        label: '星火 (讯飞)'
    },
    gemini: {
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
        model: 'gemini-2.0-flash',
        label: 'Gemini (Google)'
    },
    claude: {
        baseUrl: 'https://api.anthropic.com/v1',
        model: 'claude-3-5-sonnet-20241022',
        label: 'Claude (Anthropic)'
    },
    custom: {
        baseUrl: '',
        model: '',
        label: '自定义'
    }
};

/**
 * 获取存储的 AI 配置 (可能是加密的)
 */
export function getStoredAIConfig(): AIConfig | null {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem(STORAGE_KEYS.AI_CONFIG);
    if (!saved) return null;

    try {
        // 尝试迁移旧配置
        const parsed = JSON.parse(saved);
        if ('provider' in parsed) {
            // 旧版配置迁移
            return {
                llm: {
                    provider: 'custom',
                    baseUrl: 'https://api.deepseek.com/v1',
                    apiKey: parsed.apiKey ? atob(decodeURIComponent(parsed.apiKey)) : '',
                    model: 'deepseek-chat'
                },
                vl: {
                    provider: 'qwen',
                    baseUrl: PROVIDER_PRESETS.qwen.baseUrl,
                    apiKey: '',
                    model: PROVIDER_PRESETS.qwen.model
                },
                omni: {
                    provider: 'qwen',
                    baseUrl: PROVIDER_PRESETS.qwen.baseUrl,
                    apiKey: '',
                    model: 'qwen-omni-turbo' // 全模态模型默认值
                },
                enabled: parsed.enabled,
                storageMode: 'plain'
            };
        }
        return parsed as AIConfig;
    } catch {
        return null;
    }
}

/**
 * 保存 AI 配置 (支持加密)
 */
export async function saveAIConfig(config: AIConfig, password?: string): Promise<void> {
    const configToSave = { ...config };

    if (password) {
        // 加密模式
        configToSave.storageMode = 'encrypted';
        // 分别加密 API Key
        if (config.llm.apiKey) {
            configToSave.llm.apiKey = await encryptData(config.llm.apiKey, password);
        }
        if (config.vl.apiKey) {
            configToSave.vl.apiKey = await encryptData(config.vl.apiKey, password);
        }
        if (config.omni?.apiKey) {
            configToSave.omni = { ...config.omni, apiKey: await encryptData(config.omni.apiKey, password) };
        }
    } else {
        // 明文模式
        configToSave.storageMode = 'plain';
    }

    localStorage.setItem(STORAGE_KEYS.AI_CONFIG, JSON.stringify(configToSave));
}

/**
 * 解锁配置 (解密 API Key)
 */
export async function unlockAIConfig(config: AIConfig, password: string): Promise<AIConfig> {
    if (config.storageMode !== 'encrypted') return config;

    try {
        const decryptedConfig = { ...config };

        // 解密 LLM Key
        if (config.llm.apiKey && config.llm.apiKey.includes(':')) {
            decryptedConfig.llm.apiKey = await decryptData(config.llm.apiKey, password);
        }

        // 解密 VL Key
        if (config.vl.apiKey && config.vl.apiKey.includes(':')) {
            decryptedConfig.vl.apiKey = await decryptData(config.vl.apiKey, password);
        }

        // 解密 Omni Key
        if (config.omni?.apiKey && config.omni.apiKey.includes(':')) {
            decryptedConfig.omni = { ...config.omni, apiKey: await decryptData(config.omni.apiKey, password) };
        }

        return decryptedConfig;
    } catch (e) {
        throw new Error('密码错误或数据损坏');
    }
}

/**
 * 通用 OpenAI 格式调用
 * @param config 模型配置
 * @param messages 消息列表
 * @param useStream 是否使用流式模式 (Qwen-Omni 等模型必须为 true)
 */
async function callOpenAIFormat(
    config: ModelConfig,
    messages: any[],
    useStream: boolean = false
): Promise<string> {
    const url = `${config.baseUrl.replace(/\/+$/, '')}/chat/completions`;

    // 判断是否需要强制 stream（基于模型名称）
    const forceStream = config.model.toLowerCase().includes('omni') || useStream;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: config.model,
                messages: messages,
                stream: forceStream
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error ${response.status}: ${errText}`);
        }

        // 处理流式响应
        if (forceStream) {
            const reader = response.body?.getReader();
            if (!reader) throw new Error('Stream not available');

            const decoder = new TextDecoder('utf-8');
            let result = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content || '';
                            result += content;
                        } catch {
                            // 忽略解析错误
                        }
                    }
                }
            }

            return result;
        }

        // 处理普通响应
        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
    } catch (e) {
        console.error("AI Call Failed", e);
        throw e;
    }
}

// ------------------------------------------------------------------
// 业务逻辑 - 耗材解析
// ------------------------------------------------------------------

export interface ParsedFilament {
    brand: string;
    type: string;
    color: string;
    colorName: string;
    weight: number;
    price: number;
    quantity: number;
}

export interface ParseResult {
    items: ParsedFilament[];
    confidence: number;
    error?: string;
}

const PARSE_PROMPT = `你是一个专业的3D打印耗材识别 AI。请从用户提供的图片或文本中提取**所有**耗材信息。

**📋 文本格式解析规则**

当文本包含分类结构时，需要正确理解层级：
\`\`\`
【PLA系列】        ← 大类（忽略）
PLA basic          ← 材料类型（重要！）
  - 红（拓竹）: 1KG = 1卷
PETG matte         ← 新的材料类型
  - 黑色（小北）: 1KG = 1卷
\`\`\`

**🔍 解析规则：**

1. **材料类型继承**：
   - "PLA basic"、"PLA silk"、"PETG matte"、"PETG GF"、"PETG CF"、"PETG 金属"、"PETG ECO"、"PETG 水晶" 等都是材料类型
   - 下方带 - 的每一行继承这个类型

2. **颜色和品牌提取**：
   - 标准格式：\`颜色（品牌）\` 或 \`颜色（品牌）:\`
   - 特殊格式（品牌在名称里）：如 \`天瑞盲盒ECO蓝\` → 品牌=天瑞, 颜色=ECO蓝
   - 特殊格式（冒号缺失）：如 \`肤色（JAYO）1KG\` → 颜色=肤色, 品牌=JAYO
   - 复合颜色名：如 \`蓝色-夏日之歌\`、\`混色水晶盲盒\` → 保留完整颜色名

3. **重量解析（关键！）**：
   - \`1KG\` = 1000g, \`200G\` = 200g, \`0.7KG\` = 700g
   - **处理拼写错误**：\`04KG\` 应理解为 \`0.4KG\` = 400g
   - \`少量\` 或无数值 → 默认 100g
   - 只有卷数：\`0.7卷\` → 700g（1卷=1000g）

4. **数量**：每行 = 1条记录

5. **颜色HEX映射**：
   - 黑色 → #2D2D2D, 白色 → #FFFFFF
   - 红色 → #DC143C, 蓝色/天蓝/湖蓝 → #38BDF8
   - 绿色/军绿/柠檬绿 → #22C55E, 荧光绿 → #BEF264
   - 黄色/金色/黄金/99金 → #FFD700
   - 橙色 → #FF6B00, 紫色/变色龙紫 → #8B5CF6
   - 灰色/深灰 → #78716C, 银色/金属银 → #9CA3AF
   - 粉色 → #EC4899, 透明 → #E5E5E5
   - 肤色 → #FDBF6F, 棕色 → #92400E
   - 薄荷/清凉薄荷 → #5EEAD4, 靛蓝 → #4338CA

**⚠️ 关键要求：**
1. **识别所有条目**，包括格式不规范的（缺少冒号、缩进不一致等）
2. **每一行带颜色信息的都是一条耗材**
3. 输出纯 JSON，无 Markdown 包裹

**输出格式：**
{
  "items": [
    {
      "brand": "品牌名",
      "type": "完整材料类型（如 PLA Silk）",
      "color": "#HEX",
      "colorName": "颜色名",
      "weight": 1000,
      "price": 0,
      "quantity": 1
    }
  ],
  "confidence": 0.95
}

开始识别。`;

/**
 * 解析耗材 (智能选择模型)
 * - 有图片 → 优先 Omni，其次 VL
 * - 纯文本 → 优先 Omni，其次 LLM
 * @param config 已解锁的完整配置对象
 */
export async function parseFilamentInfo(config: AIConfig, input: string, imageBase64?: string): Promise<ParseResult> {
    if (!config.enabled) return { items: [], confidence: 0, error: 'AI 功能未启用' };

    // 智能选择模型
    let targetConfig: ModelConfig;

    if (imageBase64) {
        // 有图片：优先 Omni，其次 VL
        if (config.omni?.enabled && config.omni?.apiKey) {
            targetConfig = config.omni;
        } else if (config.vl?.enabled && config.vl?.apiKey) {
            targetConfig = config.vl;
        } else {
            return { items: [], confidence: 0, error: '图片识别需要配置全模态模型或视觉模型 API Key' };
        }
    } else {
        // 纯文本：优先 Omni，其次 LLM
        if (config.omni?.enabled && config.omni?.apiKey) {
            targetConfig = config.omni;
        } else if (config.llm?.enabled && config.llm?.apiKey) {
            targetConfig = config.llm;
        } else {
            return { items: [], confidence: 0, error: '文本识别需要配置全模态模型或语言模型 API Key' };
        }
    }

    const messages: any[] = [
        { role: 'system', content: PARSE_PROMPT }
    ];

    if (imageBase64) {
        messages.push({
            role: 'user',
            content: [
                { type: 'text', text: input || '识别此耗材' },
                { type: 'image_url', image_url: { url: imageBase64 } }
            ]
        });
    } else {
        messages.push({ role: 'user', content: input });
    }

    try {
        const resultText = await callOpenAIFormat(targetConfig, messages);

        // 提取 JSON，增强容错
        let jsonStr = resultText.match(/\{[\s\S]*\}/)?.[0];
        if (!jsonStr) throw new Error("无法解析返回的 JSON");

        // 尝试修复不完整的 JSON
        try {
            JSON.parse(jsonStr);
        } catch {
            // 尝试修复常见的截断问题
            // 1. 缺少结尾的 ] 或 }
            let fixedJson = jsonStr;
            const openBrackets = (fixedJson.match(/\[/g) || []).length;
            const closeBrackets = (fixedJson.match(/\]/g) || []).length;
            const openBraces = (fixedJson.match(/\{/g) || []).length;
            const closeBraces = (fixedJson.match(/\}/g) || []).length;

            // 补全缺失的括号
            for (let i = 0; i < openBrackets - closeBrackets; i++) fixedJson += ']';
            for (let i = 0; i < openBraces - closeBraces; i++) fixedJson += '}';

            // 2. 移除最后一个不完整的对象
            fixedJson = fixedJson.replace(/,\s*\{[^}]*$/, '');

            jsonStr = fixedJson;
        }

        const parsed = JSON.parse(jsonStr);
        return {
            items: parsed.items || [],
            confidence: parsed.confidence || 0
        };
    } catch (e) {
        return { items: [], confidence: 0, error: e instanceof Error ? e.message : '解析失败' };
    }
}

/**
 * AI 助手对话 (使用 LLM 模型)
 */
export async function chatWithAssistant(
    config: AIConfig,
    history: { role: 'user' | 'assistant'; content: string }[],
    newMessage: string,
    contextData?: any,
    imageBase64?: string
): Promise<string> {
    const messages: any[] = [...history];

    // 如果有图片，检测是否为购物截图并使用解析模式
    if (imageBase64) {
        const isPurchaseImage = newMessage.includes('购') || newMessage.includes('买') || newMessage.includes('订单') || newMessage.toLowerCase().includes('taobao') || newMessage.toLowerCase().includes('淘宝') || !newMessage.trim();

        if (isPurchaseImage) {
            // 使用智能入库的解析模式
            messages.unshift({ role: 'system', content: PARSE_PROMPT });
        } else {
            // 普通图片分析
            const visionPrompt = contextData
                ? `你是一个 3D 打印AI助手。当前库存：${JSON.stringify(contextData, null, 2)}\n请基于库存数据和图片回答问题。`
                : '你是一个 3D 打印AI助手，可以分析图片并回答相关问题。';
            messages.unshift({ role: 'system', content: visionPrompt });
        }
    } else if (contextData) {
        // 纯文本 + 上下文数据
        const systemPrompt = `你是一个 3D 打印耗材管理助手。当前用户的库存数据如下：
${JSON.stringify(contextData, null, 2)}
请基于这些数据回答用户的问题。如果用户问"我有多少红色的"，请检索数据回答。`;

        // 检查是否已有 System Prompt，有则追加，无则新建
        const sysIndex = messages.findIndex(m => m.role === 'system');
        if (sysIndex >= 0) {
            messages[sysIndex].content += '\n\n' + systemPrompt;
        } else {
            messages.unshift({ role: 'system', content: systemPrompt });
        }
    }

    // 构造用户消息 (支持多模态)
    if (imageBase64) {
        messages.push({
            role: 'user',
            content: [
                { type: 'text', text: newMessage },
                { type: 'image_url', image_url: { url: imageBase64 } }
            ]
        });
    } else {
        messages.push({ role: 'user', content: newMessage });
    }

    // 模型选择优先级：omni (启用且有 Key) > vl (有图片时) > llm
    // 检查 enabled 状态和 API Key
    let targetConfig = config.llm;

    if (config.omni?.enabled && config.omni?.apiKey) {
        // omni 启用且有 Key，作为首选
        targetConfig = config.omni;
    } else if (imageBase64 && config.vl?.enabled && config.vl?.apiKey) {
        // 有图片且 vl 启用
        targetConfig = config.vl;
    } else if (config.llm?.enabled && config.llm?.apiKey) {
        // llm 启用
        targetConfig = config.llm;
    }
    // 如果都没启用，仍然尝试用 llm 作为兜底

    return await callOpenAIFormat(targetConfig, messages);
} const PRINT_PARSE_PROMPT = `
你是一个3D打印专家。请从用户提供的"打印完成"截图或照片中提取关键数据。
通常包含：打印用时 (Time/Duration) 和 耗材用量 (Weight/Filament Used)。

请提取并转换为以下JSON格式 (纯JSON，无Markdown):
{
  "printTime": 2.5,  // 转换为小时 (例如 2h30m -> 2.5)
  "weight": 36,      // 克 (g)
  "confidence": 0.9
}
如果未找到某项数据，请填 null。
`;

export async function parsePrintScreenshot(config: AIConfig, imageBase64: string): Promise<{ printTime?: number, weight?: number, error?: string }> {
    if (!config.enabled || !config.vl.apiKey) return { error: '请先在 AI 中心配置视觉模型' };

    const messages: any[] = [
        { role: 'system', content: PRINT_PARSE_PROMPT },
        {
            role: 'user',
            content: [
                { type: 'text', text: '分析这张打印结果截图' },
                { type: 'image_url', image_url: { url: imageBase64 } }
            ]
        }
    ];

    try {
        const resultText = await callOpenAIFormat(config.vl, messages);
        const jsonMatch = resultText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("无法解析 JSON");

        const parsed = JSON.parse(jsonMatch[0]);
        return {
            printTime: parsed.printTime || undefined,
            weight: parsed.weight || undefined
        };
    } catch (e) {
        return { error: '识别失败，请手动输入' };
    }
}
