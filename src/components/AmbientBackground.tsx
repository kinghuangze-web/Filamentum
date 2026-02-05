'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/src/lib/utils';

export function AmbientBackground() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
            {/* 基础背景色 - 极淡的暖色底 */}
            <div className="absolute inset-0 bg-stone-50/50" />

            {/* 噪点纹理 - 增加物理质感 (Matte Texture) */}
            <div
                className="absolute inset-0 opacity-[0.03] mix-blend-multiply"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacit='1'/%3E%3C/svg%3E")`
                }}
            />

            {/* 流动的光斑 - Living Material */}
            <div className="absolute top-0 left-0 w-full h-full">
                {/* 主色调：琥珀色 (Amber) - 代表熔融的耗材 */}
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-amber-200/40 rounded-full blur-[120px] animate-blob mix-blend-multiply" />

                {/* 辅色调：橙色 (Orange) - 代表热量 */}
                <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-orange-200/40 rounded-full blur-[120px] animate-blob animation-delay-2000 mix-blend-multiply" />

                {/* 点缀色：紫罗兰 (Violet) - 代表创造力与科技 */}
                <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] bg-violet-200/30 rounded-full blur-[120px] animate-blob animation-delay-4000 mix-blend-multiply" />

                {/* 游走的亮斑 - 模拟反光 */}
                <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] bg-rose-100/40 rounded-full blur-[100px] animate-blob animation-delay-6000 mix-blend-multiply" />
            </div>

            {/* 网格纹理 - 极其微弱，暗示构建板 (The Build Plate) 的存在 */}
            <div
                className="absolute inset-0 opacity-[0.4]"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }}
            />
        </div>
    );
}
