import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const mockCreators = {
  instagram: [
    {
      bio: 'Lifestyle and fashion influencer',
      location: 'Los Angeles, CA',
      followers: 500000,
      categories: 'Fashion,Lifestyle',
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
      categories: 'Travel,Photography',
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
      categories: 'Dance,Entertainment',
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
      categories: 'Comedy,Entertainment',
      user: {
        name: 'Funny Jake',
        email: 'jake@example.com',
        password: 'password123',
        image: 'https://randomuser.me/api/portraits/men/4.jpg'
      }
    }
  ],
  youtube: [
    {
      bio: 'Tech reviews and tutorials',
      location: 'San Francisco, CA',
      followers: 750000,
      categories: 'Tech,Reviews',
      user: {
        name: 'Tech David',
        email: 'david@example.com',
        password: 'password123',
        image: 'https://randomuser.me/api/portraits/men/5.jpg'
      }
    },
    {
      bio: 'Gaming and esports content',
      location: 'Seattle, WA',
      followers: 1200000,
      categories: 'Gaming,Entertainment',
      user: {
        name: 'Gamer Emily',
        email: 'emily@example.com',
        password: 'password123',
        image: 'https://randomuser.me/api/portraits/women/6.jpg'
      }
    }
  ],
  douyin: [
    {
      bio: '生活方式和美食博主',
      location: '上海',
      followers: 2000000,
      categories: 'Lifestyle,Food',
      user: {
        name: '小美',
        email: 'xiaomei@example.com',
        password: 'password123',
        image: 'https://randomuser.me/api/portraits/women/7.jpg'
      }
    },
    {
      bio: '舞蹈和音乐创作者',
      location: '北京',
      followers: 1500000,
      categories: 'Dance,Music',
      user: {
        name: '舞动天使',
        email: 'dancer@example.com',
        password: 'password123',
        image: 'https://randomuser.me/api/portraits/women/8.jpg'
      }
    }
  ],
  xiaohongshu: [
    {
      bio: '美妆和护肤达人',
      location: '广州',
      followers: 800000,
      categories: 'Beauty,Skincare',
      user: {
        name: '美丽说',
        email: 'beauty@example.com',
        password: 'password123',
        image: 'https://randomuser.me/api/portraits/women/9.jpg'
      }
    },
    {
      bio: '时尚穿搭博主',
      location: '深圳',
      followers: 600000,
      categories: 'Fashion,Lifestyle',
      user: {
        name: '潮流范儿',
        email: 'fashion@example.com',
        password: 'password123',
        image: 'https://randomuser.me/api/portraits/women/10.jpg'
      }
    }
  ],
  weibo: [
    {
      bio: '娱乐和时尚评论家',
      location: '北京',
      followers: 3000000,
      categories: 'Entertainment,Fashion',
      user: {
        name: '娱乐先锋',
        email: 'entertainment@example.com',
        password: 'password123',
        image: 'https://randomuser.me/api/portraits/men/11.jpg'
      }
    },
    {
      bio: '美食和旅行分享',
      location: '成都',
      followers: 1800000,
      categories: 'Food,Travel',
      user: {
        name: '吃货旅行家',
        email: 'foodie@example.com',
        password: 'password123',
        image: 'https://randomuser.me/api/portraits/men/12.jpg'
      }
    }
  ]
};

async function main() {
  // Delete all existing data
  await prisma.application.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.product.deleteMany();
  await prisma.post.deleteMany();
  await prisma.portfolioItem.deleteMany();
  await prisma.creatorProfile.deleteMany();
  await prisma.brandProfile.deleteMany();
  await prisma.user.deleteMany();

  // Helper function to create creators for a platform
  async function createCreatorsForPlatform(platform: string, creators: any[]) {
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
              followers: creator.followers,
              categories: creator.categories,
              engagementRate: Number((Math.random() * 5 + 2).toFixed(2)), // Convert string back to number
              [platform]: true
            }
          }
        }
      });
      console.log(`Created ${platform} creator: ${user.name}`);
    }
  }

  // Create creators for each platform
  for (const [platform, creators] of Object.entries(mockCreators)) {
    await createCreatorsForPlatform(platform, creators);
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
