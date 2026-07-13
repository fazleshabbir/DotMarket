import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://dotmarket.space',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://dotmarket.space/trade',
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
  ];
}
