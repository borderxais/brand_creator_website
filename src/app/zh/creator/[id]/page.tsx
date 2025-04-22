import { notFound } from 'next/navigation';
import { SocialLinks } from '@/components/ui/SocialLinks';
import { Stats } from '@/components/ui/Stats';
import { PortfolioGallery } from '@/components/ui/PortfolioGallery';
import ErrorHandlingImage from '@/components/ui/ErrorHandlingImage';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import ClientAudienceChartWrapper from '@/components/charts/ClientAudienceChartWrapper';
import ClientPerformanceChartWrapper from '@/components/charts/ClientPerformanceChartWrapper';

// Function to get creator profile from database
async function getCreatorProfile(id: string) {
  try {
    const creator = await prisma.findCreator.findUnique({
      where: { id }
    });
    
    if (!creator) return null;
    
    // Format the creator data to match the structure expected by the component
    return {
      id: creator.id,
      bio: creator.bio || '',
      location: "抖音创作者", // Translated placeholder
      categories: creator.content_label_name ? JSON.stringify([creator.content_label_name]) : '[]',
      user: {
        id: creator.id,
        name: creator.display_name || '',
        image: creator.profile_image || ''
      },
      platforms: [
        {
          id: '1',
          platform: {
            id: '1',
            name: 'tiktok',
            displayName: 'TikTok',
            iconUrl: '/icons/tiktok.svg'
          },
          followers: creator.follower_count || 0,
          engagementRate: creator.engagement_rate || 0,
          handle: `@${creator.creator_handle_name}`
        }
      ],
      portfolioItems: [],
      posts: [],
      creator_handle_name: creator.creator_handle_name,
      creator_id: creator.creator_id,
      industry_label_name: creator.industry_label_name,
      follower_count: creator.follower_count,
      following_count: creator.following_count,
      like_count: creator.like_count,
      videos_count: creator.videos_count,
      engagement_rate: creator.engagement_rate,
      median_views: creator.median_views,
      content_label_name: creator.content_label_name,
      creator_price: creator.creator_price,
      currency: creator.currency
    };
  } catch (error) {
    console.error('获取创作者资料时出错:', error);
    return null;
  }
}

// Parse categories helper function
function parseCategories(categoriesStr: string | null): string[] {
  if (!categoriesStr) return [];
  
  try {
    // Try parsing as JSON first
    const parsed = JSON.parse(categoriesStr);
    
    // Handle both array and string cases
    if (Array.isArray(parsed)) {
      return parsed;
    } else if (typeof parsed === 'string') {
      return [parsed]; // Convert single string to array with one element
    } else {
      return [];
    }
  } catch (e) {
    // If JSON parsing fails, split by comma and trim
    return categoriesStr.split(',').map(cat => cat.trim()).filter(Boolean);
  }
}

// Generate metadata for the page
export async function generateMetadata(props: any): Promise<Metadata> {
  const params = await props.params;
  const { id } = params;
  const creator = await getCreatorProfile(id);

  if (!creator) {
    return {
      title: '未找到创作者',
    };
  }

  return {
    title: `${creator.user.name} - 创作者资料`,
    description: creator.bio || `查看 ${creator.user.name} 的创作者资料`,
  };
}

export default async function CreatorProfileChinese(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { id } = params;
    const creator = await getCreatorProfile(id);

    if (!creator) {
      notFound();
    }

    const categories = parseCategories(creator.categories);
    
    // Calculate metrics from real data only
    const totalFollowers = creator.platforms.reduce((sum: number, cp) => sum + (cp.followers || 0), 0);
    const averageEngagementRate = creator.platforms[0]?.engagementRate || 0;

    // Create social links from real data
    const socialLinks = creator.platforms.reduce((acc, cp) => {
      if (cp.platform && cp.platform.name && cp.handle) {
        return {
          ...acc,
          [cp.platform.name]: cp.handle
        };
      }
      return acc;
    }, {});

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-purple-900 text-white">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-extrabold">创作者资料</h1>
            <p className="mt-2 text-lg">查看详细指标和表现数据</p>
            <div className="mt-4 flex flex-wrap gap-4">
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                预约合作
              </button>
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                比较创作者
              </button>
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                发送通知
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <input
              type="text"
              placeholder="搜索创作者..."
              className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            <select className="w-full md:w-1/4 px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
              <option value="">按类别筛选</option>
              <option value="beauty">美妆</option>
              <option value="fashion">时尚</option>
              <option value="travel">旅行</option>
              <option value="food">美食</option>
              <option value="fitness">健身</option>
            </select>
            <select className="w-full md:w-1/4 px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
              <option value="">按平台筛选</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">抖音国际版</option>
              <option value="youtube">YouTube</option>
              <option value="twitter">Twitter</option>
            </select>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header and Image */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="relative h-48 bg-gradient-to-r from-purple-600 to-indigo-600">
              {creator.user.image && (
                <div className="absolute -bottom-12 left-8">
                  <div className="relative w-32 h-32">
                    <ErrorHandlingImage
                      src={creator.user.image}
                      alt={creator.user.name || ''}
                      fill
                      sizes="128px"
                      className="rounded-full border-4 border-white object-cover"
                      priority
                      fallback={
                        <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center text-gray-400">
                          暂无图片
                        </div>
                      }
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="pt-16 pb-8 px-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{creator.user.name}</h1>
                  <p className="text-gray-500">{creator.location || '抖音创作者'}</p>
                </div>
                <Stats
                  followers={totalFollowers}
                  engagementRate={averageEngagementRate}
                />
              </div>
              
              <div className="mt-6">
                <p className="text-gray-700">{creator.bio || '暂无简介'}</p>
              </div>

              {/* Creator Metrics Card - Only show real data */}
              <div className="mt-8 bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">创作者指标</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Stats */}
                  <div className="bg-white p-4 rounded-md shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">粉丝数</h3>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {totalFollowers.toLocaleString()}
                    </p>
                  </div>

                  {/* Engagement Rate */}
                  <div className="bg-white p-4 rounded-md shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">互动率</h3>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {averageEngagementRate.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>

              {categories.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-gray-900">类别</h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {categories.map((category: string) => (
                      <span
                        key={category}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Platform Stats */}
              {creator.platforms.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-gray-900">平台</h2>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {creator.platforms.map((cp) => (
                      <div
                        key={cp.platform.id}
                        className="bg-gray-50 rounded-lg p-4 flex items-center space-x-4"
                      >
                        <div className="flex-shrink-0">
                          {cp.platform.iconUrl ? (
                            <ErrorHandlingImage
                              src={cp.platform.iconUrl}
                              alt={cp.platform.displayName}
                              width={24}
                              height={24}
                              fallback={<div className="w-6 h-6 bg-gray-200 rounded"></div>}
                            />
                          ) : (
                            <div className="w-6 h-6 bg-gray-200 rounded" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {cp.platform.displayName}
                          </h3>
                          <div className="text-sm text-gray-500">
                            <p>{new Intl.NumberFormat().format(cp.followers)} 粉丝</p>
                            <p>{cp.engagementRate.toFixed(1)}% 互动率</p>
                            {cp.handle && <p className="text-gray-400">{cp.handle}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Creator Detailed Stats */}
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">创作者详情</h2>
                
                {/* Account Information */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 mb-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-purple-800 mb-3 border-b border-purple-200 pb-2">
                    账号信息
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white rounded-md p-3 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-sm font-medium text-gray-500">创作者账号</p>
                      <p className="text-lg font-bold text-gray-900">@{creator?.creator_handle_name || '暂无'}</p>
                    </div>
                    <div className="bg-white rounded-md p-3 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-sm font-medium text-gray-500">创作者 ID</p>
                      <p className="text-lg font-bold text-gray-900">{creator?.creator_id || '暂无'}</p>
                    </div>
                    <div className="bg-white rounded-md p-3 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-sm font-medium text-gray-500">行业</p>
                      <p className="text-lg font-bold text-gray-900">{creator?.industry_label_name || '未指定'}</p>
                    </div>
                  </div>
                </div>
                
                {/* Audience Metrics */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3 border-b border-blue-200 pb-2">
                    受众指标
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-md p-3 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-sm font-medium text-gray-500">粉丝数</p>
                      <p className="text-xl font-bold text-gray-900">{new Intl.NumberFormat().format(creator?.follower_count || 0)}</p>
                    </div>
                    <div className="bg-white rounded-md p-3 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-sm font-medium text-gray-500">关注数</p>
                      <p className="text-xl font-bold text-gray-900">{new Intl.NumberFormat().format(creator?.following_count || 0)}</p>
                    </div>
                    <div className="bg-white rounded-md p-3 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-sm font-medium text-gray-500">总点赞数</p>
                      <p className="text-xl font-bold text-gray-900">{new Intl.NumberFormat().format(creator?.like_count || 0)}</p>
                    </div>
                    <div className="bg-white rounded-md p-3 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-sm font-medium text-gray-500">视频数</p>
                      <p className="text-xl font-bold text-gray-900">{new Intl.NumberFormat().format(creator?.videos_count || 0)}</p>
                    </div>
                  </div>
                  
                  {/* Audience Chart */}
                  <ClientAudienceChartWrapper 
                    followerCount={creator?.follower_count || 0}
                    followingCount={creator?.following_count || 0}
                    likeCount={creator?.like_count || 0}
                    videosCount={creator?.videos_count || 0}
                  />
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">受众洞察:</span> 拥有 {new Intl.NumberFormat().format(creator?.follower_count || 0)} 粉丝和 {new Intl.NumberFormat().format(creator?.like_count || 0)} 点赞数，该创作者在其领域内建立了可观的受众基础。
                    </p>
                  </div>
                </div>
                
                {/* Performance Metrics */}
                <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-6 mb-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-green-800 mb-3 border-b border-green-200 pb-2">
                    表现指标
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-md p-3 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-sm font-medium text-gray-500">互动率</p>
                      <p className="text-xl font-bold text-gray-900">{(creator?.engagement_rate || 0).toFixed(2)}%</p>
                    </div>
                    <div className="bg-white rounded-md p-3 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-sm font-medium text-gray-500">中位数观看量</p>
                      <p className="text-xl font-bold text-gray-900">{new Intl.NumberFormat().format(creator?.median_views || 0)}</p>
                    </div>
                    <div className="bg-white rounded-md p-3 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-sm font-medium text-gray-500">内容类别</p>
                      <p className="text-xl font-bold text-gray-900">{creator?.content_label_name || '未指定'}</p>
                    </div>
                  </div>
                  
                  {/* Performance Chart */}
                  <ClientPerformanceChartWrapper 
                    engagementRate={creator?.engagement_rate || 0}
                    medianViews={creator?.median_views || 0}
                    contentCategory={creator?.content_label_name || ''}
                  />
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-green-50 rounded-md">
                      <p className="text-sm text-green-800">
                        <span className="font-semibold">互动分析:</span> 该创作者的 {(creator?.engagement_rate || 0).toFixed(2)}% 互动率 {creator?.engagement_rate && creator.engagement_rate > 2.7 ? '高于' : '低于'} 平台平均值 2.7%。
                      </p>
                    </div>
                    <div className="p-3 bg-teal-50 rounded-md">
                      <p className="text-sm text-teal-800">
                        <span className="font-semibold">观看表现:</span> 拥有 {new Intl.NumberFormat().format(creator?.median_views || 0)} 中位数观看量，该创作者每个帖子都能稳定地触达大量受众。
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Business Information */}
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-amber-800 mb-3 border-b border-amber-200 pb-2">
                    合作详情
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-md p-4 shadow-sm hover:shadow-md transition-shadow flex items-center">
                      <div className="bg-amber-100 rounded-full p-3 mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">创作者报价</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {creator?.creator_price 
                            ? `${creator.currency || '￥'}${new Intl.NumberFormat().format(creator.creator_price)}`
                            : '联系获取报价'}
                        </p>
                      </div>
                    </div>
                    <div className="bg-white rounded-md p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium text-gray-500">可用性</p>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          可用
                        </span>
                      </div>
                      <button className="mt-3 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        安排合作
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <SocialLinks {...socialLinks} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('渲染创作者档案时出错:', error);
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">错误</h1>
          <p className="text-gray-700">渲染创作者档案时发生错误。</p>
        </div>
      </div>
    );
  }
}