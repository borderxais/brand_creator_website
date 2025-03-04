import { Instagram, Youtube } from 'lucide-react';
import { FaTiktok, FaWeibo } from 'react-icons/fa';
import { SiXiaohongshu } from 'react-icons/si';

interface SocialLinksProps {
  instagram?: string | null;
  tiktok?: string | null;
  youtube?: string | null;
  weibo?: string | null;
  xiaohongshu?: string | null;
  douyin?: string | null;
}

export function SocialLinks({
  instagram,
  tiktok,
  youtube,
  weibo,
  xiaohongshu,
  douyin,
}: SocialLinksProps) {
  return (
    <div className="flex space-x-4">
      {instagram && (
        <a
          href={`https://instagram.com/${instagram}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-purple-600 transition-colors"
        >
          <Instagram className="w-6 h-6" />
        </a>
      )}
      {tiktok && (
        <a
          href={`https://tiktok.com/@${tiktok}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-purple-600 transition-colors"
        >
          <FaTiktok className="w-6 h-6" />
        </a>
      )}
      {youtube && (
        <a
          href={`https://youtube.com/@${youtube}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-purple-600 transition-colors"
        >
          <Youtube className="w-6 h-6" />
        </a>
      )}
      {weibo && (
        <a
          href={`https://weibo.com/${weibo}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-purple-600 transition-colors"
        >
          <FaWeibo className="w-6 h-6" />
        </a>
      )}
      {xiaohongshu && (
        <a
          href={`https://xiaohongshu.com/user/profile/${xiaohongshu}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-purple-600 transition-colors"
        >
          <SiXiaohongshu className="w-6 h-6" />
        </a>
      )}
      {douyin && (
        <a
          href={`https://douyin.com/user/${douyin}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-purple-600 transition-colors"
        >
          <FaTiktok className="w-6 h-6" />
        </a>
      )}
    </div>
  );
}
