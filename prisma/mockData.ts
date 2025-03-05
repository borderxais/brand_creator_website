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

export const mockCreators = {
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

export const mockBrands = [
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
