'use client';

import { useSession } from 'next-auth/react';
import { User, Mail, Instagram, Twitter, ShoppingCart, Heart, MessageCircle, Share2, ExternalLink } from 'lucide-react';

interface Post {
  id: string;
  content: {
    type: 'image' | 'video';
    url: string;
    caption: string;
  };
  products: {
    id: string;
    name: string;
    price: string;
    image: string;
    url: string;
  }[];
  likes: number;
  comments: number;
  timestamp: string;
}

export default function CreatorProfile() {
  const { data: session } = useSession();

  // Sample posts data - in real app, this would come from an API
  const posts: Post[] = [
    {
      id: '1',
      content: {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
        caption: "My favorite summer outfit essentials! Check out these amazing pieces I've handpicked for you 🌞 #SummerStyle #Fashion"
      },
      products: [
        {
          id: 'p1',
          name: 'Summer Breeze Dress',
          price: '$89.99',
          image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200',
          url: '/product/summer-dress'
        },
        {
          id: 'p2',
          name: 'Straw Beach Hat',
          price: '$34.99',
          image: 'https://images.unsplash.com/photo-1572307480813-ceb0e59d8325?w=200',
          url: '/product/beach-hat'
        }
      ],
      likes: 1234,
      comments: 56,
      timestamp: '2h ago'
    },
    {
      id: '2',
      content: {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800',
        caption: 'Obsessed with these new jewelry pieces! Perfect for any occasion ✨ #Accessories #Style'
      },
      products: [
        {
          id: 'p3',
          name: 'Pearl Necklace Set',
          price: '$79.99',
          image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=200',
          url: '/product/pearl-necklace'
        }
      ],
      likes: 892,
      comments: 34,
      timestamp: '5h ago'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="flex items-center space-x-4">
        {session?.user?.image && (
          <img
            src={session.user.image}
            alt={session.user.name || ''}
            className="h-24 w-24 rounded-full ring-4 ring-purple-100"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{session?.user?.name}</h1>
          <p className="text-purple-600">Creator</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile Info */}
        <div className="space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white shadow rounded-xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-purple-400" />
                  <span className="text-gray-600">{session?.user?.name}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-purple-400" />
                  <span className="text-gray-600">{session?.user?.email}</span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Media</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Instagram className="h-5 w-5 text-purple-400" />
                  <span className="text-gray-600">@{session?.user?.name?.toLowerCase().replace(/\s+/g, '')}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Twitter className="h-5 w-5 text-purple-400" />
                  <span className="text-gray-600">@{session?.user?.name?.toLowerCase().replace(/\s+/g, '')}</span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Statistics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">12</div>
                  <div className="text-sm text-gray-500">Active Campaigns</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">45</div>
                  <div className="text-sm text-gray-500">Total Posts</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">89%</div>
                  <div className="text-sm text-gray-500">Success Rate</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">15K</div>
                  <div className="text-sm text-gray-500">Total Followers</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Posts and Products */}
        <div className="lg:col-span-2 space-y-6">
          {/* Posts Feed */}
          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="bg-white shadow rounded-xl overflow-hidden">
                {/* Post Content */}
                <div className="relative">
                  <img
                    src={post.content.url}
                    alt=""
                    className="w-full aspect-video object-cover"
                  />
                </div>
                
                {/* Post Interactions */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <button className="flex items-center text-gray-700 hover:text-purple-500 transition-colors">
                        <Heart className="h-6 w-6" />
                        <span className="ml-1 text-sm">{post.likes}</span>
                      </button>
                      <button className="flex items-center text-gray-700 hover:text-purple-500 transition-colors">
                        <MessageCircle className="h-6 w-6" />
                        <span className="ml-1 text-sm">{post.comments}</span>
                      </button>
                      <button className="text-gray-700 hover:text-purple-500 transition-colors">
                        <Share2 className="h-6 w-6" />
                      </button>
                    </div>
                    <span className="text-sm text-gray-500">{post.timestamp}</span>
                  </div>
                  
                  <p className="text-gray-800 mb-4">{post.content.caption}</p>

                  {/* Tagged Products */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700">Featured Products</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {post.products.map((product) => (
                        <div
                          key={product.id}
                          className="group relative rounded-xl bg-gray-50 p-3 hover:bg-gray-100 transition-all duration-300"
                        >
                          <div className="aspect-square rounded-lg overflow-hidden mb-2">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {product.name}
                          </h4>
                          <p className="text-sm text-gray-600">{product.price}</p>
                          <button
                            className="absolute bottom-3 right-3 p-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
