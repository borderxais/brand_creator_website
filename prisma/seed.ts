import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { mockBrands, mockCreators, platforms } from './mockData';

const prisma = new PrismaClient();

async function main() {
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

  // Create sample campaigns
  console.log('Creating sample campaigns...');
  const fashionNova = await prisma.brandProfile.findFirstOrThrow({ where: { companyName: 'FashionNova' } });
  const techGear = await prisma.brandProfile.findFirstOrThrow({ where: { companyName: 'TechGear' } });

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
        brandId: fashionNova.id,
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
        brandId: techGear.id,
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
