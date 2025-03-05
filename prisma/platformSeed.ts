import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const platforms = [
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

async function seedPlatforms() {
  console.log('Seeding platforms...');
  
  for (const platform of platforms) {
    await prisma.platform.upsert({
      where: { name: platform.name },
      update: platform,
      create: platform,
    });
  }
  
  console.log('Platforms seeded successfully!');
}

seedPlatforms()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
