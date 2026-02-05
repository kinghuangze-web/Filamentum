import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';

// 数据存储路径配置
const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'filaments.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

// 确保目录存在
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR);
if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR);

/**
 * 备份逻辑：
 * 每天第一次保存时，如果昨天的备份不一样，或者今天还没备份，就创建一个。
 * 简单策略：每天生成一个 "filaments-YYYY-MM-DD.json"
 */
async function performBackupIfNeeded(currentData: string) {
    const today = new Date().toISOString().split('T')[0];
    const backupPath = path.join(BACKUP_DIR, `filaments-${today}.json`);

    // 如果今天的备份不存在，创建它
    // 或者如果存在，我们也可以选择不覆盖，保留今天第一次修改前的版本（更安全）
    if (!existsSync(backupPath)) {
        // 读取当前文件（如果存在）作为备份源
        // 注意：这里我们备份的是"写入前"的文件，还是"写入后"的？
        // 通常备份是备份"旧状态"。
        // 如果文件不存在（第一次运行），没啥好备份的。
        if (existsSync(FILE_PATH)) {
            await fs.copyFile(FILE_PATH, backupPath);
            console.log(`[Backup] Created backup for ${today}`);
        }
    }
}

export async function GET() {
    try {
        if (!existsSync(FILE_PATH)) {
            return NextResponse.json([]);
        }
        const fileContent = await fs.readFile(FILE_PATH, 'utf-8');
        const data = JSON.parse(fileContent);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Read error:', error);
        return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const newData = await request.json();

        // 1. 尝试备份（在覆盖之前）
        await performBackupIfNeeded(JSON.stringify(newData));

        // 2. 写入新数据
        await fs.writeFile(FILE_PATH, JSON.stringify(newData, null, 2), 'utf-8');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Write error:', error);
        return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    }
}
