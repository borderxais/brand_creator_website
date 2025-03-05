const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');

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

// Generate 10 creators for each platform
const mockCreators = Object.fromEntries(
  platforms.map(platform => [
    platform.name,
    Array.from({ length: 10 }, (_, i) => ({
      bio: `${platform.displayName} influencer ${i + 1}`,
      location: faker.location.city(),
      followers: Math.floor(Math.random() * 900000 + 100000),
      engagementRate: parseFloat((Math.random() * 5).toFixed(2)),
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

// Generate 10 brands
const mockBrands = Array.from({ length: 10 }, (_, i) => ({
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

async function main() {
  try {
    // Delete all existing data in the correct order
    await prisma.application.deleteMany();
    await prisma.campaign.deleteMany();
    await prisma.creatorPlatform.deleteMany();
    await prisma.platform.deleteMany();
    await prisma.post.deleteMany();
    await prisma.portfolioItem.deleteMany();
    await prisma.creatorProfile.deleteMany();
    await prisma.brandProfile.deleteMany();
    await prisma.user.deleteMany();

    // Create platforms
    console.log('Seeding platforms...');
    const createdPlatforms = await Promise.all(
      platforms.map(platform => 
        prisma.platform.create({
          data: platform
        })
      )
    );
    console.log('Platforms seeded successfully!');

    // Create brands
    console.log('Creating brands...');
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
    console.log('Brands created successfully!');

    // Helper function to create creators for a platform
    async function createCreatorsForPlatform(platformName, creators) {
      const platform = await prisma.platform.findUnique({
        where: { name: platformName }
      });

      if (!platform) {
        console.error(`Platform ${platformName} not found`);
        return;
      }

      for (const creator of creators) {
        try {
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
        } catch (error) {
          console.error(`Error creating creator for ${platformName}:`, error);
        }
      }
    }

    // Create creators for each platform
    console.log('Creating creators...');
    for (const [platform, creators] of Object.entries(mockCreators)) {
      await createCreatorsForPlatform(platform, creators);
    }
    console.log('Creators created successfully!');

    // Add portfolio items and posts for creators
    console.log('Creating portfolio items and posts...');
    const creators = await prisma.creatorProfile.findMany({ take: 10 });
    
    for (const creator of creators) {
      // Create 2-4 portfolio items for each creator
      const portfolioItemCount = Math.floor(Math.random() * 3) + 2; // 2-4 items
      
      for (let i = 0; i < portfolioItemCount; i++) {
        await prisma.portfolioItem.create({
          data: {
            creatorId: creator.id,
            title: faker.commerce.productName(),
            description: faker.commerce.productDescription(),
            imageUrl: `https://picsum.photos/seed/${creator.id}-portfolio-${i}/800/600`,
            link: faker.internet.url()
          }
        });
      }
      
      // Create 1-3 posts for each creator
      const postCount = Math.floor(Math.random() * 3) + 1; // 1-3 posts
      
      for (let i = 0; i < postCount; i++) {
        await prisma.post.create({
          data: {
            creatorId: creator.id,
            title: faker.lorem.sentence(5),
            content: faker.lorem.paragraphs(2),
            published: true,
            imageUrl: `https://picsum.photos/seed/${creator.id}-post-${i}/800/600`
          }
        });
      }
    }
    console.log('Portfolio items and posts created successfully!');

    // Create sample campaigns
    console.log('Creating sample campaigns...');
    // Get the first two brands
    const brands = await prisma.brandProfile.findMany({ take: 2 });
    
    if (brands.length >= 2) {
      const campaigns = await Promise.all([
        prisma.campaign.create({
          data: {
            title: 'Summer Fashion Collection Launch',
            description: 'Looking for fashion influencers to promote our new summer collection',
            budget: 5000,
            requirements: JSON.stringify({
              platforms: ['instagram', 'tiktok'],
              category: 'FASHION',
              list: ['Minimum 50k followers', 'fashion-focused content']
            }),
            startDate: new Date('2025-06-01'),
            endDate: new Date('2025-08-31'),
            status: 'ACTIVE',
            platformIds: ['instagram', 'tiktok'],
            brandId: brands[0].id,
            categories: JSON.stringify(['Fashion', 'Summer', 'Lifestyle']),
            deliverables: JSON.stringify([
              '2 Instagram posts',
              '3 Instagram stories',
              '1 TikTok video'
            ])
          }
        }),
        prisma.campaign.create({
          data: {
            title: 'Tech Review Series',
            description: 'Seeking tech reviewers for our latest gadget launch',
            budget: 8000,
            requirements: JSON.stringify({
              platforms: ['youtube'],
              category: 'TECHNOLOGY',
              list: ['Tech-focused content creators with proven track record']
            }),
            startDate: new Date('2025-04-01'),
            endDate: new Date('2025-05-31'),
            status: 'ACTIVE',
            platformIds: ['youtube'],
            brandId: brands[1].id,
            categories: JSON.stringify(['Technology', 'Reviews', 'Gadgets']),
            deliverables: JSON.stringify([
              '1 detailed review video (10-15 minutes)',
              '2 short-form content pieces',
              'Social media promotion'
            ])
          }
        })
      ]);
      console.log('Sample campaigns created!');
    } else {
      console.log('Not enough brands to create campaigns');
    }

    console.log('Database has been seeded!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
