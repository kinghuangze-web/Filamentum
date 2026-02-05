'use client';

import React, { memo } from 'react';

interface SpoolRingProps {
    percentage: number;
    color: string;
    size?: number;
    materialType?: string;
}

export const SpoolRing = memo(function SpoolRing({ percentage, color, size = 56, materialType = 'PLA Basic' }: SpoolRingProps) {
    // 基础参数
    const strokeWidth = 8;
    const viewSize = 100;
    const center = viewSize / 2;
    const radius = (viewSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const normalizedPercentage = Math.min(100, Math.max(0, percentage || 0));
    const offset = circumference - (normalizedPercentage / 100) * circumference;

    // 材质识别逻辑
    const typeLower = materialType.toLowerCase();
    const isSilk = typeLower.includes('silk') || typeLower.includes('metal') || typeLower.includes('gold') || typeLower.includes('silver');
    const isMatte = typeLower.includes('matte') || typeLower.includes('cf') || typeLower.includes('carbon') || typeLower.includes('wood');
    const isCF = typeLower.includes('cf') || typeLower.includes('carbon');

    // 唯一 ID 防止多个组件冲突
    const idSuffix = React.useId().replace(/:/g, '');

    return (
        <div
            className="relative flex items-center justify-center font-mono font-bold text-stone-600 select-none"
            style={{ width: size, height: size, fontSize: size * 0.22 }}
        >
            <svg
                viewBox={`0 0 ${viewSize} ${viewSize}`}
                className="w-full h-full transform -rotate-90"
            >
                <defs>
                    {/* Silk: 金属光泽渐变 */}
                    <linearGradient id={`silk-gradient-${idSuffix}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={color} />
                        <stop offset="40%" stopColor={color} />
                        <stop offset="50%" stopColor="white" stopOpacity="0.8" />
                        <stop offset="60%" stopColor={color} />
                        <stop offset="100%" stopColor={color} />
                    </linearGradient>

                    {/* Matte/CF: 噪点滤镜 */}
                    <filter id={`matte-noise-${idSuffix}`}>
                        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
                        <feColorMatrix type="saturate" values="0" />
                        <feComponentTransfer>
                            <feFuncA type="linear" slope="0.3" /> {/* 降低噪点强度 */}
                        </feComponentTransfer>
                        <feComposite operator="in" in2="SourceGraphic" />
                    </filter>

                    {/* CF: 碳纤维纹理 (斜纹) */}
                    <pattern id={`cf-pattern-${idSuffix}`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                        <rect width="4" height="4" fill={color} />
                        <rect width="2" height="4" fill="black" fillOpacity="0.2" />
                    </pattern>
                </defs>

                {/* 底部背景圈 */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke="#e7e5e4"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />

                {/* 进度圈 */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    // 动态应用材质样式
                    stroke={isSilk ? `url(#silk-gradient-${idSuffix})` : (isCF ? `url(#cf-pattern-${idSuffix})` : color)}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    // 对 Matte 应用滤镜，对 Silk 应用动画
                    filter={isMatte && !isCF ? `url(#matte-noise-${idSuffix})` : undefined}
                    className={`transition-all duration-1000 ease-out ${isSilk ? 'animate-pulse-slow' : ''}`}
                />

                {/* 额外的 Matte 覆盖层 (因为 filter 可能改变颜色，我们用这种方式叠加质感) */}
                {isMatte && (
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke="black"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        filter={`url(#matte-noise-${idSuffix})`}
                        className="pointer-events-none opacity-30 mix-blend-overlay"
                    />
                )}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                {Math.round(normalizedPercentage)}%
            </div>
        </div>
    );
});
