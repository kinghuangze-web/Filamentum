'use client';

import { useEffect, useState } from 'react';

export function InfillBackground() {
    const [mounted, setMounted] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        setMounted(true);
        const handleMouseMove = (e: MouseEvent) => {
            // 简单的性能节流：每帧更新太频繁，实际使用中并不需要极高精度
            // 这里为了平滑直接设置，CSS transition 会处理平滑过渡
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    if (!mounted) return null;

    return (
        <div className="fixed inset-0 -z-50 overflow-hidden bg-stone-50">
            {/* 1. 基础热床光效 (Heated Bed Glow) - 模拟加热板温度 */}
            <div className="absolute inset-0 bg-gradient-to-t from-orange-100/40 via-stone-50/50 to-stone-50" />

            {/* 呼吸的热源核心 */}
            <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] bg-amber-200/20 rounded-full blur-[120px] animate-pulse-slow" />
            <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-orange-100/30 rounded-full blur-[100px] animate-pulse-slow delay-1000" />

            {/* 2. 蜂窝填充网格 (Honeycomb Grid) - 标志性的 3D 打印内部结构 */}
            <div
                className="absolute inset-0 opacity-[0.08]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='104' viewBox='0 0 60 104' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill-rule='evenodd' stroke='%23f59e0b' stroke-width='1' fill='none'/%3E%3Cpath d='M30 52l25.98 15v30L30 112 4.02 97V67z' fill-rule='evenodd' stroke='%23f59e0b' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
                    backgroundSize: '60px 104px'
                }}
            />

            {/* 3. 喷头移动模拟 (Nozzle Path Interaction) - 鼠标移动时的局部高亮 */}
            <div
                className="absolute w-[400px] h-[400px] bg-amber-400/10 rounded-full blur-[80px] transition-transform duration-500 ease-out pointer-events-none mix-blend-overlay"
                style={{
                    transform: `translate(${mousePos.x - 200}px, ${mousePos.y - 200}px)`
                }}
            />

            {/* 4. 物理质感叠加 */}
            <div
                className="absolute inset-0 opacity-[0.4] mix-blend-overlay"
                style={{
                    backgroundImage: 'radial-gradient(circle at center, transparent 0%, rgba(255,255,255,0.8) 100%)'
                }}
            />
        </div>
    );
}
