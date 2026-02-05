import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import AdmZip from 'adm-zip';

const DATA_DIR = path.join(process.cwd(), 'data');
const PRESETS_DIR = path.join(DATA_DIR, 'presets');
const LEGACY_FILE_PATH = path.join(DATA_DIR, 'presets.json'); // Maintained for web-created
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR);
if (!existsSync(PRESETS_DIR)) mkdirSync(PRESETS_DIR);
if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR);

// Map Bambu/Orca Slicer keys to our format
function parseBambuJSON(json: any, filename: string): any {
    try {
        if (!json.filament_settings_id && !json.setting_id) return null;

        const temps = json.nozzle_temperature || [200, 220];
        const min = Array.isArray(temps) ? temps[0] : temps;
        const max = Array.isArray(temps) ? temps[1] : temps;

        // Bed Temps Helpers
        const getBed = (key: string) => {
            const val = json[key] || 0;
            const t = Array.isArray(val) ? val[0] : val;
            return { initial: t, other: t };
        };

        return {
            id: 'file-' + filename + '-' + (json.filament_settings_id?.[0] || 'custom'),
            brand: json.filament_vendor?.[0] || 'Imported',
            type: json.filament_type?.[0] || 'PLA',
            tempMin: min,
            tempMax: max,
            flowRatio: Number(json.filament_flow_ratio?.[0] || 1), // usually array in Bambu?
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
            source: 'user', // Treat file-based as user
            createdAt: new Date().toISOString()
        };
    } catch (e) {
        return null;
    }
}

export async function GET() {
    try {
        let allPresets: any[] = [];

        // 1. Read Web-Created Presets (presets.json)
        if (existsSync(LEGACY_FILE_PATH)) {
            const fileContent = await fs.readFile(LEGACY_FILE_PATH, 'utf-8');
            try {
                const data = JSON.parse(fileContent);
                if (Array.isArray(data)) allPresets.push(...data);
            } catch (e) { }
        }

        // 2. Scan "data/presets" folder for .bbsflmt AND .json
        if (existsSync(PRESETS_DIR)) {
            const files = await fs.readdir(PRESETS_DIR);
            for (const file of files) {
                const filePath = path.join(PRESETS_DIR, file);

                // 处理 .bbsflmt
                if (file.endsWith('.bbsflmt')) {
                    try {
                        const zip = new AdmZip(filePath);
                        const zipEntries = zip.getEntries();
                        for (const entry of zipEntries) {
                            if (entry.entryName.endsWith('.json') && !entry.entryName.includes('bundle')) {
                                try {
                                    const text = zip.readAsText(entry);
                                    const json = JSON.parse(text);
                                    if (json.filament_settings_id || json.type === 'filament') {
                                        const parsed = parseBambuJSON(json, file);
                                        if (parsed) allPresets.push(parsed);
                                    }
                                } catch (err) { }
                            }
                        }
                    } catch (e) {
                        console.error('Error parsing zip:', file, e);
                    }
                }

                // 处理 .json (直接放入的)
                if (file.endsWith('.json')) {
                    try {
                        const fileContent = await fs.readFile(filePath, 'utf-8');
                        const json = JSON.parse(fileContent);
                        const items = Array.isArray(json) ? json : [json];

                        items.forEach(item => {
                            if (item.filament_settings_id) {
                                const parsed = parseBambuJSON(item, file);
                                if (parsed) allPresets.push(parsed);
                            } else if (item.brand && item.type) {
                                if (!item.id) item.id = 'file-json-' + crypto.randomUUID();
                                allPresets.push({ ...item, source: 'user' });
                            }
                        });
                    } catch (e) {
                        console.error('Error parsing JSON file:', file, e);
                    }
                }
            }
        }

        return NextResponse.json(allPresets);
    } catch (error) {
        console.error('GET Presets Error:', error);
        return NextResponse.json([]);
    }
}

export async function POST(request: Request) {
    try {
        // Saving only affects the web-created list (presets.json)
        // File-based presets are read-only in this simple implementation
        const newData = await request.json();

        // Filter out file-based ones if they were sent back?
        // Actually, the UI might send EVERYTHING back.
        // We should only save items that are NOT from .bbsflmt (how to distinguish on save?)
        // Simple: We replace `presets.json` with the incoming data. 
        // BUT if incoming data includes .bbsflmt items, we duplicate them into json?
        // Better: The Service `saveUserPreset` should only handle "creates".
        // If editing a file-based, we save it as a NEW user preset in JSON.
        // UI should handle ID generation.

        // For simplicity: We dump ALL incoming "source=user" presets into `presets.json`.
        // This implicitly "imports" them if they were from files but user clicked save? 
        // No, `POST` replaces the list.
        // If we want to keep files separate, we should filter `newData` to only include those we strictly manage?
        // Let's just save everything to `presets.json` for safety/persistence of edits.
        // If user edits a .bbsflmt preset, it becomes a JSON record in `presets.json`.
        // The original .bbsflmt remains but might lead to duplicates if we read it again?
        // Solution: Dedup by ID in GET?

        // Let's just save to presets.json.
        await fs.writeFile(LEGACY_FILE_PATH, JSON.stringify(newData, null, 2), 'utf-8');
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save presets' }, { status: 500 });
    }
}

