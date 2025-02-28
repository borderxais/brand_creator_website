export type Platform = 'instagram' | 'tiktok' | 'youtube' | 'weibo' | 'xiaohongshu' | 'douyin';

export const PLATFORMS: Platform[] = ['instagram', 'tiktok', 'youtube', 'weibo', 'xiaohongshu', 'douyin'];

export const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  weibo: 'Weibo',
  xiaohongshu: 'Xiaohongshu',
  douyin: 'Douyin'
};

// Helper function to check if a string is a valid platform
export function isPlatform(value: string): value is Platform {
  return PLATFORMS.includes(value as Platform);
}
