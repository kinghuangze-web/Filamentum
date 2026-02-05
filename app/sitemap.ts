import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: 'https://my-3d-app.com',
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        // 将来如果有动态页面（如作品详情），可以在这里动态生成
    ]
}
