
import { NextResponse } from 'next/server';
import AdmZip from 'adm-zip';

// 复用解析逻辑 (理想情况下应提取到 lib/utils 或服务中，简单起见此处复制微调)
function parseBambuContent(json: any, filename: string): any {
    try {
        if (!json.filament_settings_id && !json.setting_id) return null;

        const temps = json.nozzle_temperature || [200, 220];
        const min = Array.isArray(temps) ? temps[0] : temps;
        const max = Array.isArray(temps) ? temps[1] : temps;

        const getBed = (key: string) => {
            const val = json[key] || 0;
            const t = Array.isArray(val) ? val[0] : val;
            return { initial: t, other: t };
        };

        return {
            id: 'import-' + crypto.randomUUID(), // 生成新ID
            brand: json.filament_vendor?.[0] || 'Imported',
            type: json.filament_type?.[0] || 'PLA',
            tempMin: min,
            tempMax: max,
            flowRatio: Number(json.filament_flow_ratio?.[0] || 1),
            maxVolumetricSpeed: Number(json.filament_max_volumetric_speed?.[0] || 12),
            pressureAdvance: Number(json.pressure_advance?.[0] || 0.02),
            defaultPlate: 'textured',
            bedSettings: {
                cool_stabilized: getBed('cool_plate_temp'),
                cool: getBed('cool_plate_temp'),
                engineering: getBed('eng_plate_temp'),
                smooth_high_temp: getBed('hot_plate_temp'),
                textured: getBed('textured_plate_temp'),
            },
            source: 'user',
            createdAt: new Date().toISOString()
        };
    } catch (e) {
        return null;
    }
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // 处理 .bbsflmt (ZIP)
        if (file.name.endsWith('.bbsflmt')) {
            const zip = new AdmZip(buffer);
            const zipEntries = zip.getEntries();
            const results = [];

            for (const entry of zipEntries) {
                if (entry.entryName.endsWith('.json') && !entry.entryName.includes('bundle')) {
                    try {
                        const text = zip.readAsText(entry);
                        const json = JSON.parse(text);
                        if (json.filament_settings_id || json.type === 'filament') {
                            const parsed = parseBambuContent(json, file.name);
                            if (parsed) results.push(parsed);
                        }
                    } catch (e) { }
                }
            }
            return NextResponse.json(results);
        }

        // 处理普通 .json (可以直接在前端做，但为了统一也在后端处理)
        if (file.name.endsWith('.json')) {
            try {
                const text = buffer.toString('utf-8');
                const json = JSON.parse(text);
                const items = Array.isArray(json) ? json : [json];
                // 简单包装，假设格式已经是符合我们要求的，或者尝试解析Bambu格式？
                // 如果是Bambu原始JSON放在.json里
                if (items[0].filament_settings_id) {
                    const parsed = parseBambuContent(items[0], file.name);
                    return NextResponse.json(parsed ? [parsed] : []);
                }
                return NextResponse.json(items);
            } catch (e) {
                return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
            }
        }

        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });

    } catch (error) {
        console.error('Import Error:', error);
        return NextResponse.json({ error: 'Import failed' }, { status: 500 });
    }
}
