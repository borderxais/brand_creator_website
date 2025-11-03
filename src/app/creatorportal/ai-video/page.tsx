import { Metadata } from 'next';
import AiVideoDashboard, { AiVideoRecord } from './AiVideoDashboard';

export const metadata: Metadata = {
  title: 'AI Video Library | BorderX CreatorHub',
  description: 'Review every AI-generated ad spot, track delivery status, and relaunch creative briefs in one place.',
};

const demoVideos: AiVideoRecord[] = [
  {
    id: 'vid-9472',
    title: 'Winter Capsule Drop',
    brand: 'Atlas Beauty Collective',
    createdAt: '2025-10-29T14:40:00Z',
    duration: '00:30',
    format: '9:16',
    status: 'ready',
    expiresAt: '2025-11-05T14:40:00Z',
    videoUrl: '/demo/ai-ads/atlas-beauty.mp4',
    thumbnail: '/demo/ai-ads/atlas-beauty.png',
    campaign: 'Holiday Glow Series',
  },
  {
    id: 'vid-9473',
    title: 'Creator Cohort Launch',
    brand: 'MetroSync Logistics',
    createdAt: '2025-10-31T09:10:00Z',
    duration: '00:20',
    format: '16:9',
    status: 'generating',
    expiresAt: '2025-11-07T09:10:00Z',
    thumbnail: '/demo/ai-ads/metrosync-placeholder.jpg',
    campaign: 'Q4 Speed Promise',
  },
  {
    id: 'vid-9420',
    title: 'Wellness Retargeting Variant B',
    brand: 'Lumen Labs',
    createdAt: '2025-10-20T22:15:00Z',
    duration: '00:45',
    format: '9:16',
    status: 'expired',
    expiresAt: '2025-10-27T22:15:00Z',
    campaign: 'Recharge Rituals',
  },
];

export default function AiVideoPage() {
  return <AiVideoDashboard videos={demoVideos} />;
}
