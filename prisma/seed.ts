import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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

const mockCreators = {
  instagram: [
    {
      bio: 'Lifestyle and fashion influencer',
      location: 'Los Angeles, CA',
      followers: 500000,
      engagementRate: 4.5,
      handle: '@sarahjohnson',
      categories: JSON.stringify(['Fashion', 'Lifestyle']),
      user: {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        password: 'password123',
        image: 'https://randomuser.me/api/portraits/women/1.jpg'
      }
    },
    {
      bio: 'Travel and photography enthusiast',
      location: 'New York, NY',
      followers: 350000,
      engagementRate: 3.8,
      handle: '@mikechen',
      categories: JSON.stringify(['Travel', 'Photography']),
      user: {
        name: 'Mike Chen',
        email: 'mike@example.com',
        password: 'password123',
        image: 'https://randomuser.me/api/portraits/men/2.jpg'
      }
    }
  ],
  tiktok: [
    {
      bio: 'Dance and entertainment',
      location: 'Miami, FL',
      followers: 1000000,
      engagementRate: 5.2,
      handle: '@lisadance',
      categories: JSON.stringify(['Dance', 'Entertainment']),
      user: {
        name: 'Lisa Dance',
        email: 'lisa@example.com',
        password: 'password123',
        image: 'https://randomuser.me/api/portraits/women/3.jpg'
      }
    },
    {
      bio: 'Comedy sketches and humor',
      location: 'Austin, TX',
      followers: 890000,
      engagementRate: 4.8,
      handle: '@funnyjake',
      categories: JSON.stringify(['Comedy', 'Entertainment']),
      user: {
        name: 'Funny Jake',
        email: 'jake@example.com',
        password: 'password123',
        image: 'https://randomuser.me/api/portraits/men/4.jpg'
      }
    }
  ]
};

const mockBrands = [
  {
    companyName: 'FashionNova',
    industry: 'Fashion',
    description: 'Leading fast fashion brand',
    website: 'https://fashionnova.com',
    location: 'Los Angeles, CA',
    user: {
      name: 'FashionNova',
      email: 'brand@fashionnova.com',
      password: 'password123',
      image: '/images/brands/fashionnova.png'
    }
  },
  {
    companyName: 'TechGear',
    industry: 'Technology',
    description: 'Innovative tech accessories',
    website: 'https://techgear.com',
    location: 'San Francisco, CA',
    user: {
      name: 'TechGear',
      email: 'brand@techgear.com',
      password: 'password123',
      image: '/images/brands/techgear.png'
    }
  }
];

async function main() {
  // Delete all existing data
  await prisma.creatorPlatform.deleteMany();
  await prisma.platform.deleteMany();
  await prisma.post.deleteMany();
  await prisma.portfolioItem.deleteMany();
  await prisma.creatorProfile.deleteMany();
  await prisma.brandProfile.deleteMany();
  await prisma.user.deleteMany();

  // Create platforms
  console.log('Seeding platforms...');
  for (const platform of platforms) {
    await prisma.platform.create({
      data: platform
    });
  }
  console.log('Platforms seeded successfully!');

  // Create brands
  for (const brand of mockBrands) {
    const hashedPassword = await bcrypt.hash(brand.user.password, 10);
    
    const user = await prisma.user.create({
      data: {
        name: brand.user.name,
        email: brand.user.email,
        password: hashedPassword,
        image: brand.user.image,
        role: 'BRAND',
        brand: {
          create: {
            companyName: brand.companyName,
            industry: brand.industry,
            description: brand.description,
            website: brand.website,
            location: brand.location
          }
        }
      },
      include: {
        brand: true
      }
    });

    console.log(`Created brand: ${user.name}`);
  }

  // Helper function to create creators for a platform
  async function createCreatorsForPlatform(platformName: string, creators: any[]) {
    const platform = await prisma.platform.findUnique({
      where: { name: platformName }
    });

    if (!platform) {
      console.error(`Platform ${platformName} not found`);
      return;
    }

    for (const creator of creators) {
      const hashedPassword = await bcrypt.hash(creator.user.password, 10);
      
      const user = await prisma.user.create({
        data: {
          name: creator.user.name,
          email: creator.user.email,
          password: hashedPassword,
          image: creator.user.image,
          role: 'CREATOR',
          creator: {
            create: {
              bio: creator.bio,
              location: creator.location,
              categories: creator.categories,
              followers: creator.followers,
              engagementRate: creator.engagementRate,
              platforms: {
                create: {
                  platformId: platform.id,
                  handle: creator.handle,
                  followers: creator.followers,
                  engagementRate: creator.engagementRate
                }
              }
            }
          }
        }
      });
      console.log(`Created ${platformName} creator: ${user.name}`);
    }
  }

  // Create creators for each platform
  for (const [platform, creators] of Object.entries(mockCreators)) {
    await createCreatorsForPlatform(platform, creators);
  }

  console.log('Database has been seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
