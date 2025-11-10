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
    promptPreview: '"Launch teaser focusing on winter skincare rituals and hero serum."',
    fullPrompt:
      'Create a 30-second vertical ad introducing the Atlas Beauty winter capsule. Highlight the vitamin C night serum and emphasize the limited-run release. Close with a confident call to action inviting viewers to tap through for early access bundles.',
    targetVoice: 'atlas_winter_voice.wav',
    targetVoiceNotes: 'Uploaded brand founder voiceover sample captured for this campaign.',
    targetImage: '/images/placeholder-400.svg',
    targetImageAlt: 'Atlas Beauty moodboard for winter capsule drop',
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
    promptPreview: '"Dynamic motion edit showcasing MetroSync drivers and real-time tracking."',
    fullPrompt:
      'Draft a punchy 20-second widescreen video for MetroSync Logistics. Focus on same-day delivery and live tracking with bold kinetic typography. Tone should be high-energy, urban, and trust-building for enterprise partners.',
    targetVoice: 'metrosync_driver_voice.mp3',
    targetVoiceNotes: 'Uploaded field recording from driver Q&A session for cloning.',
    targetImage: '/images/placeholder-400.svg',
    targetImageAlt: 'MetroSync storyboard reference still',
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
    promptPreview: '"Mindfulness-driven routine highlighting the Lumen Labs daybreak tonic."',
    fullPrompt:
      'Generate a 45-second vertical retargeting video for Lumen Labs. Anchor on the daybreak tonic helping users reset their mornings. Blend ASMR-style pour shots with short customer affirmations. Encourage viewers to reclaim their focus in the final callout.',
    targetVoice: 'lumen_retreat_voice.wav',
    targetVoiceNotes: 'Uploaded customer testimonial clone with gentle bedside delivery.',
    targetImage: '/images/placeholder-400.svg',
    targetImageAlt: 'Lumen Labs calm living room reference photo',
  },
];

export default function AiVideoPage() {
  return <AiVideoDashboard videos={demoVideos} />;
}
