'use client';

import { useEffect, useState } from 'react';

export function FilamentBackground() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none bg-stone-50/50">
            <svg className="absolute w-full h-full opacity-60" preserveAspectRatio="none">
                <defs>
                    {/* 丝绸质感渐变 - Amber (PLA Silk Gold) */}
                    <linearGradient id="silk-amber" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#fef3c7" stopOpacity="0" />
                        <stop offset="20%" stopColor="#f59e0b" stopOpacity="0.2" />
                        <stop offset="50%" stopColor="#d97706" stopOpacity="0.5" />
                        <stop offset="80%" stopColor="#f59e0b" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#fef3c7" stopOpacity="0" />
                    </linearGradient>

                    {/* 丝绸质感渐变 - Violet (PETG Purple) */}
                    <linearGradient id="silk-violet" x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ede9fe" stopOpacity="0" />
                        <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#ede9fe" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* 耗材丝 1 - 金色悬浮流线 */}
                <path
                    d="M-100,600 C200,400 500,800 1200,200 S1800,0 2000,300"
                    fill="none"
                    stroke="url(#silk-amber)"
                    strokeWidth="3"
                    className="animate-float-slow"
                    style={{ filter: 'blur(1px)' }}
                />

                {/* 耗材丝 2 - 紫色交织流线 */}
                <path
                    d="M-200,200 C300,300 600,0 1200,500 S1600,900 2200,600"
                    fill="none"
                    stroke="url(#silk-violet)"
                    strokeWidth="2" // 略细一点
                    className="animate-float-reverse"
                    style={{ filter: 'blur(2px)' }}
                />
            </svg>

            {/* 噪点纹理保留，增加实体感 */}
            <div
                className="absolute inset-0 opacity-[0.03] mix-blend-multiply"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacit='1'/%3E%3C/svg%3E")`
                }}
            />

            {/* 极淡的层纹背景 - 模拟 FDM 打印表面 */}
            <div
                className="absolute inset-0 opacity-[0.1]"
                style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 19px, #000 20px)',
                    backgroundSize: '100% 20px'
                }}
            />
        </div>
    );
}
