import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const PYTHON_API_BASE = process.env.CAMPAIGNS_API_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const prompt = formData.get('prompt');
    const creatorId = (formData.get('creator_id') as string | null) || session.user.id;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const upstreamFormData = new FormData();
    upstreamFormData.append('creator_id', creatorId.trim());
    upstreamFormData.append('prompt', prompt.trim());

    const voiceSample = formData.get('voice_sample');
    if (voiceSample instanceof File) {
      upstreamFormData.append('voice_sample', voiceSample);
    }

    const referenceImage = formData.get('reference_image');
    if (referenceImage instanceof File) {
      upstreamFormData.append('reference_image', referenceImage);
    }

    const response = await fetch(`${PYTHON_API_BASE}/ai-videos/generate`, {
      method: 'POST',
      body: upstreamFormData,
    });

    const payload = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: payload.detail || payload.message || 'Failed to queue AI video request' },
        { status: response.status },
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error('AI video generate route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
