/**
 * Local Vault Service
 * 
 * 封装 File System Access API，允许网页直接读写本地文件夹。
 * 这使得数据可以安全地存储在用户指定的本地目录中，而不依赖浏览器缓存。
 */

export class LocalVaultService {
    private dirHandle: FileSystemDirectoryHandle | null = null;
    private readonly FILENAME = 'filaments.json';

    // 检查浏览器是否支持
    isSupported(): boolean {
        return 'showDirectoryPicker' in window;
    }

    // 连接到本地文件夹
    async connect(): Promise<boolean> {
        try {
            this.dirHandle = await window.showDirectoryPicker({
                mode: 'readwrite',
                startIn: 'documents'
            });
            return true;
        } catch (e) {
            // 用户取消或拒绝
            console.log('User cancelled directory picker', e);
            return false;
        }
    }

    // 获取当前连接状态
    isConnected(): boolean {
        return this.dirHandle !== null;
    }

    getDirectoryName(): string {
        return this.dirHandle ? this.dirHandle.name : '';
    }

    // 读取数据
    async readData(): Promise<any[]> {
        if (!this.dirHandle) throw new Error('Vault not connected');

        try {
            // 获取文件句柄，如果不存在则报错 (create: false)
            const fileHandle = await this.dirHandle.getFileHandle(this.FILENAME, { create: false });
            const file = await fileHandle.getFile();
            const text = await file.text();
            return JSON.parse(text);
        } catch (e: any) {
            // 如果文件不存在，返回空数组
            if (e.name === 'NotFoundError') {
                return [];
            }
            throw e;
        }
    }

    // 写入数据
    async writeData(data: any[]): Promise<void> {
        if (!this.dirHandle) throw new Error('Vault not connected');

        try {
            // 获取文件句柄，如果不存在则创建
            const fileHandle = await this.dirHandle.getFileHandle(this.FILENAME, { create: true });

            // 创建写入流
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(data, null, 2));
            await writable.close();
        } catch (e) {
            console.error('Failed to write to local vault:', e);
            throw new Error('Write failed');
        }
    }
}

// 单例导出
export const localVault = new LocalVaultService();
