import { faker } from '@faker-js/faker';

export const platforms = [
  {
    name: 'instagram',
    displayName: 'Instagram',
    description: 'Photo and video sharing social network',
    iconUrl: '/icons/instagram.svg'
  },
  {
    name: 'tiktok',
    displayName: 'TikTok',
    description: 'Short-form video platform',
    iconUrl: '/icons/tiktok.svg'
  },
  {
    name: 'youtube',
    displayName: 'YouTube',
    description: 'Video sharing and streaming platform',
    iconUrl: '/icons/youtube.svg'
  },
  {
    name: 'douyin',
    displayName: 'Douyin',
    description: 'Chinese short-form video platform',
    iconUrl: '/icons/douyin.svg'
  },
  {
    name: 'xiaohongshu',
    displayName: 'Xiaohongshu',
    description: 'Chinese lifestyle and e-commerce platform',
    iconUrl: '/icons/xiaohongshu.svg'
  },
  {
    name: 'weibo',
    displayName: 'Weibo',
    description: 'Chinese microblogging platform',
    iconUrl: '/icons/weibo.svg'
  }
];

export const mockCreators = Object.fromEntries(
  platforms.map(platform => [
    platform.name,
    Array.from({ length: 10 }, (_, i) => ({
      bio: `${platform.displayName} influencer ${i + 1}`,
      location: faker.location.city(),
      followers: Math.floor(Math.random() * 900000 + 100000),
      engagementRate: (Math.random() * 5).toFixed(2),
      handle: `@${platform.name}_creator${i + 1}`,
      categories: JSON.stringify(['Fashion', 'Lifestyle', 'Photography'][i % 3]),
      user: {
        name: `${platform.displayName} Creator ${i + 1}`,
        email: `${platform.name}_creator${i + 1}@example.com`,
        password: 'password123',
        image: `https://randomuser.me/api/portraits/${i % 2 === 0 ? 'women' : 'men'}/${i + 5}.jpg`
      }
    }))
  ])
);

export const mockBrands = Array.from({ length: 10 }, (_, i) => ({
  companyName: faker.company.name(),
  industry: ['Fashion', 'Technology', 'Beauty', 'Food', 'Entertainment'][i % 5],
  description: faker.company.catchPhrase(),
  website: faker.internet.url(),
  location: faker.location.city(),
  user: {
    name: faker.company.name(),
    email: faker.internet.email(),
    password: 'password123',
    image: '/images/placeholder.svg'
  }
}));